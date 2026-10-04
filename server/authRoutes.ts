import type { Express, Request, Response } from 'express';
import { z } from 'zod';
import { storage } from './storage';
import { 
  generateToken, 
  hashPassword, 
  comparePassword, 
  authLimiter, 
  loginLimiter,
  passwordResetLimiter,
  emailVerificationLimiter,
  securityHeaders,
  validateEmail,
  validatePassword,
  generateSecureToken,
  type AuthenticatedRequest
} from './jwtAuth';
import { 
  sendVerificationEmail,
  sendPasswordResetEmail, 
  generateVerificationToken, 
  getTokenExpiration 
} from './emailService';
import { registerSchema, loginSchema } from '@shared/schema';

export function setupAuthRoutes(app: Express) {
  // Apply security headers to all routes
  app.use(securityHeaders);

  // Registration endpoint
  app.post('/api/register', authLimiter, async (req: Request, res: Response) => {
    try {
      // Validate request data
      const validatedData = registerSchema.parse(req.body);
      const { email, password, firstName, lastName, phoneNumber } = validatedData;

      // Additional password validation
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        return res.status(400).json({ 
          error: 'WEAK_PASSWORD',
          message: passwordValidation.message 
        });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ 
          error: 'USER_EXISTS',
          message: 'A user with this email already exists' 
        });
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Create user with emailVerified: false
      const newUser = await storage.createUser({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phoneNumber: phoneNumber || null,
        profileImageUrl: null,
        role: 'user',
        emailVerified: false,
        emailVerificationToken: null,
        emailVerificationTokenExpiry: null,
      });

      // Link any existing guest orders placed with this email to the new user account
      try {
        const guestOrders = await storage.getOrdersByEmail(email);
        const linkedOrdersCount = guestOrders.length;
        
        for (const guestOrder of guestOrders) {
          // Only link if it's actually a guest order (userId is null)
          if (guestOrder.userId === null) {
            await storage.linkOrderToUser(guestOrder.id, newUser.id);
          }
        }

        if (linkedOrdersCount > 0) {
          console.log(`✅ Linked ${linkedOrdersCount} guest orders to new user: ${email}`);
        }
      } catch (error) {
        // Don't fail registration if order linking fails, just log the error
        console.error('❌ Failed to link guest orders during registration:', error);
      }

      // Generate verification token and send email
      const verificationToken = generateVerificationToken();
      const tokenExpiry = getTokenExpiration();
      
      // Store verification token in user record
      await storage.createEmailVerificationToken(
        newUser.id, 
        email, 
        verificationToken, 
        tokenExpiry
      );

      // Send verification email using NotificationService
      const { NotificationService } = await import('./notificationService');
      const emailSent = await NotificationService.triggerEmailVerification(
        email,
        firstName, 
        verificationToken,
        newUser.id
      );

      // Return success message (no JWT token until email is verified)
      res.status(201).json({
        message: 'Registration successful! Please check your email to verify your account before logging in.',
        requiresVerification: true,
        email: email,
        emailSent: emailSent
      });

      console.log(`New user registered: ${email} - Verification email sent: ${emailSent}`);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: 'VALIDATION_ERROR',
          message: 'Invalid registration data', 
          details: error.errors 
        });
      }
      
      console.error('Registration error:', error);
      res.status(500).json({ 
        error: 'REGISTRATION_FAILED',
        message: 'Failed to register user' 
      });
    }
  });

  // Login endpoint
  app.post('/api/login', loginLimiter, async (req: Request, res: Response) => {
    try {
      // Validate request data
      const validatedData = loginSchema.parse(req.body);
      const { email, password } = validatedData;

      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ 
          error: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password' 
        });
      }

      // Verify password
      const isPasswordValid = await comparePassword(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ 
          error: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password' 
        });
      }

      // Check if email is verified
      if (!user.emailVerified) {
        return res.status(403).json({
          error: 'EMAIL_NOT_VERIFIED',
          message: 'Please verify your email address before logging in. Check your inbox for a verification email.',
          email: user.email,
          requiresVerification: true
        });
      }

      // Generate JWT token
      const token = generateToken(user);

      // Return user data and token (exclude password)
      const { password: _, ...userWithoutPassword } = user;
      
      res.json({
        message: 'Login successful',
        user: userWithoutPassword,
        token,
      });

      console.log(`User logged in: ${email}`);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: 'VALIDATION_ERROR',
          message: 'Invalid login data', 
          details: error.errors 
        });
      }
      
      console.error('Login error:', error);
      res.status(500).json({ 
        error: 'LOGIN_FAILED',
        message: 'Failed to authenticate user' 
      });
    }
  });

  // Note: /api/auth/user route is implemented in routes.ts with proper JWT middleware

  // Logout endpoint (optional - mainly for clearing client-side tokens)
  app.post('/api/logout', (req: Request, res: Response) => {
    // With JWT, logout is handled client-side by removing the token
    // We can implement token blacklisting here if needed in the future
    res.json({ 
      message: 'Logout successful' 
    });
  });

  // Password reset request - creates token and sends email
  app.post('/api/forgot-password', passwordResetLimiter, async (req: Request, res: Response) => {
    const startTime = Date.now();
    const FIXED_RESPONSE_TIME = 1500; // Fixed response time in ms to prevent timing attacks (covers DB + email)
    
    try {
      const { email } = req.body;
      
      if (!validateEmail(email)) {
        // Wait for fixed time even on validation errors
        const elapsedTime = Date.now() - startTime;
        if (elapsedTime < FIXED_RESPONSE_TIME) {
          await new Promise(resolve => setTimeout(resolve, FIXED_RESPONSE_TIME - elapsedTime));
        }
        return res.status(400).json({ 
          error: 'INVALID_EMAIL',
          message: 'Please provide a valid email address' 
        });
      }

      // Check if user exists
      const user = await storage.getUserByEmail(email);

      // Perform work regardless of user existence to prevent timing attacks
      if (user) {
        try {
          // Generate secure token and set expiration (1 hour)
          const resetToken = generateSecureToken();
          const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
          
          // Store the hashed token in database
          await storage.createPasswordResetToken(email, resetToken, expiresAt);
          
          // Send password reset email asynchronously (fire-and-forget) to prevent timing leaks
          const recipientName = user.firstName || user.email.split('@')[0];
          sendPasswordResetEmail(email, recipientName, resetToken)
            .then(() => console.log(`Password reset email sent to: ${email}`))
            .catch(emailError => console.error('Failed to send password reset email:', emailError));
        } catch (error) {
          // Log but don't expose token creation failures
          console.error('Failed to create password reset token:', error);
        }
      } else {
        // Perform dummy work to equalize timing and prevent account enumeration
        const dummyToken = generateSecureToken();
        // Perform a dummy database write to match the real path timing
        // Use a clearly fake email that won't collide with real users
        // These dummy tokens will expire naturally after 1 hour
        try {
          await storage.createPasswordResetToken(
            `__dummy__${Date.now()}@invalid.local`, 
            dummyToken, 
            new Date(Date.now() + 60 * 60 * 1000)
          );
        } catch (error) {
          // Ignore errors from dummy operations
        }
      }

      // Always wait until exactly FIXED_RESPONSE_TIME has elapsed to prevent timing attacks
      const elapsedTime = Date.now() - startTime;
      if (elapsedTime < FIXED_RESPONSE_TIME) {
        await new Promise(resolve => setTimeout(resolve, FIXED_RESPONSE_TIME - elapsedTime));
      }
      
      // Always return success to prevent email enumeration
      res.json({ 
        message: 'If an account with this email exists, you will receive password reset instructions' 
      });
    } catch (error) {
      console.error('Password reset error:', error);
      
      // Ensure fixed response time even on errors
      const elapsedTime = Date.now() - startTime;
      if (elapsedTime < FIXED_RESPONSE_TIME) {
        await new Promise(resolve => setTimeout(resolve, FIXED_RESPONSE_TIME - elapsedTime));
      }
      
      // Still return success to prevent account enumeration
      res.json({ 
        message: 'If an account with this email exists, you will receive password reset instructions' 
      });
    }
  });

  // Password reset submit endpoint - validates token and resets password
  app.post('/api/reset-password', passwordResetLimiter, async (req: Request, res: Response) => {
    try {
      const { token, newPassword } = req.body;
      
      if (!token || !newPassword) {
        return res.status(400).json({ 
          error: 'MISSING_FIELDS',
          message: 'Token and new password are required' 
        });
      }

      // Validate password strength
      const passwordValidation = validatePassword(newPassword);
      if (!passwordValidation.valid) {
        return res.status(400).json({ 
          error: 'WEAK_PASSWORD',
          message: passwordValidation.message 
        });
      }

      // Validate the token
      const resetToken = await storage.validatePasswordResetToken(token);
      if (!resetToken) {
        return res.status(400).json({ 
          error: 'INVALID_TOKEN',
          message: 'This password reset link is invalid or has expired. Please request a new one.' 
        });
      }

      // Get the user by email from the token
      const user = await storage.getUserByEmail(resetToken.email);
      if (!user) {
        return res.status(400).json({ 
          error: 'INVALID_TOKEN',
          message: 'This password reset link is invalid or has expired. Please request a new one.' 
        });
      }

      // Hash the new password
      const hashedPassword = await hashPassword(newPassword);

      // Update user's password
      await storage.upsertUser({
        id: user.id,
        password: hashedPassword,
      });

      // Consume the token (mark as used)
      const tokenConsumed = await storage.consumePasswordResetToken(token);
      if (!tokenConsumed) {
        console.warn('Failed to consume reset token after password update');
      }

      res.json({
        message: 'Password reset successful',
      });

      console.log(`Password reset completed for user: ${resetToken.email}`);
    } catch (error) {
      console.error('Password reset submit error:', error);
      res.status(500).json({ 
        error: 'RESET_FAILED',
        message: 'Failed to reset password' 
      });
    }
  });

  // Email verification endpoint - Verify email with token
  app.get('/api/auth/verify-email/:token', async (req: Request, res: Response) => {
    try {
      const { token } = req.params;
      
      if (!token) {
        return res.status(400).json({
          error: 'MISSING_TOKEN',
          message: 'Verification token is required'
        });
      }

      // Validate the token
      const verificationToken = await storage.validateEmailVerificationToken(token);
      if (!verificationToken) {
        return res.status(400).json({
          error: 'INVALID_TOKEN',
          message: 'Invalid or expired verification token'
        });
      }

      // Consume the token (marks email as verified and clears token)
      const success = await storage.consumeEmailVerificationToken(token);
      if (!success) {
        return res.status(400).json({
          error: 'VERIFICATION_FAILED',
          message: 'Failed to verify email address'
        });
      }

      res.json({
        message: 'Email verified successfully! You can now log in to your account.',
        success: true,
        verified: true
      });

      console.log(`Email verified for user: ${verificationToken.email}`);
    } catch (error) {
      console.error('Email verification error:', error);
      res.status(500).json({
        error: 'VERIFICATION_FAILED',
        message: 'Failed to verify email address'
      });
    }
  });

  // Resend verification email endpoint
  app.post('/api/auth/resend-verification', emailVerificationLimiter, async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      
      if (!validateEmail(email)) {
        return res.status(400).json({
          error: 'INVALID_EMAIL',
          message: 'Please provide a valid email address'
        });
      }

      // Check if user exists
      const user = await storage.getUserByEmail(email);
      
      // Always return success to prevent email enumeration
      res.json({
        message: 'If an account with this email exists and is not yet verified, we will send a new verification email.',
        success: true
      });

      if (user) {
        // Only send if user exists and email is not verified
        if (!user.emailVerified) {
          // Generate new verification token
          const verificationToken = generateVerificationToken();
          const tokenExpiry = getTokenExpiration();
          
          // Store new verification token
          await storage.createEmailVerificationToken(
            user.id, 
            email, 
            verificationToken, 
            tokenExpiry
          );

          // Send verification email
          const emailSent = await sendVerificationEmail(
            email, 
            user.firstName || 'User', 
            verificationToken
          );

          console.log(`Verification email resent to: ${email} - Email sent: ${emailSent}`);
        } else {
          console.log(`Verification email requested for already verified user: ${email}`);
        }
      } else {
        console.log(`Verification email requested for non-existent user: ${email}`);
      }
    } catch (error) {
      console.error('Resend verification error:', error);
      res.status(500).json({
        error: 'RESEND_FAILED',
        message: 'Failed to resend verification email'
      });
    }
  });

  // Health check for auth system
  app.get('/api/auth/health', (req: Request, res: Response) => {
    res.json({ 
      status: 'ok',
      auth: 'jwt',
      emailVerification: 'enabled',
      timestamp: new Date().toISOString()
    });
  });
}