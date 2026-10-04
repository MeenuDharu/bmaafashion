import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import type { Request, Response, NextFunction } from 'express';
import type { User } from '@shared/schema';
import dotenv from "dotenv";
dotenv.config();


// Rate limiting for auth endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts, please try again later.',
      retryAfter: 900 // 15 minutes in seconds
    });
  },
});

export const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes (more reasonable)
  max: 10, // limit each IP to 10 login attempts per windowMs (more generous)
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many login attempts, please try again later.',
      retryAfter: 300 // 5 minutes in seconds
    });
  },
});

export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 password reset attempts per hour
  standardHeaders: true,
  legacyHeaders: false,
  // Remove skipSuccessfulRequests to ensure ALL attempts are counted for security
  // Using default IP-based limiting for security
  handler: (req, res) => {
    res.status(429).json({
      error: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many password reset attempts, please try again in an hour.',
      retryAfter: 3600 // 1 hour in seconds
    });
  },
});

export const emailVerificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // limit each IP to 3 email verification attempts per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many email verification requests, please try again in 15 minutes.',
      retryAfter: 900 // 15 minutes in seconds
    });
  },
});

// JWT utilities
export const generateToken = (user: Pick<User, 'id' | 'email' | 'firstName' | 'lastName' | 'role'>): string => {
  const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-change-in-production';

  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      type: 'auth'
    },
    JWT_SECRET,
    {
      expiresIn: '7d', // 7 days
      issuer: 'bmaafashion',
      audience: 'bmaafashion-users'
    }
  );
};

export const verifyToken = (token: string): any => {
  const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-change-in-production';

  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'bmaafashion',
      audience: 'bmaafashion-users'
    }) as any;
    
    if (decoded.type !== 'auth') {
      throw new Error('Invalid token type - auth token required');
    }
    
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

export const generateOrderAccessToken = (orderId: string, userId?: string): string => {
  const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-change-in-production';

  return jwt.sign(
    {
      orderId,
      userId,
      type: 'order_access'
    },
    JWT_SECRET,
    {
      expiresIn: '30d',
      issuer: 'bmaafashion',
      audience: 'bmaafashion-order-access'
    }
  );
};

export const verifyOrderAccessToken = (token: string): { orderId: string; userId?: string } => {
  const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-change-in-production';

  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'bmaafashion',
      audience: 'bmaafashion-order-access'
    }) as any;

    if (decoded.type !== 'order_access') {
      throw new Error('Invalid token type');
    }

    return {
      orderId: decoded.orderId,
      userId: decoded.userId
    };
  } catch (error) {
    throw new Error('Invalid or expired order access token');
  }
};

// Password utilities
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 10; // Optimal balance between security and performance
  return bcrypt.hash(password, saltRounds);
};

export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

// Token hashing utilities for security (SHA-256)
export const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

// Generate a secure random token
export const generateSecureToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: string;
      };
    }
  }
}

// Extend Express Request interface for authenticated requests
export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

// JWT Authentication middleware
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  console.log('=== AUTH MIDDLEWARE CALLED ===');
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  // Debug logging to understand what's happening
  console.log('🔍 Auth middleware - Headers:', {
    authorization: req.headers.authorization ? '[PRESENT]' : '[MISSING]',
    token: token ? `[${token.substring(0, 20)}...]` : '[MISSING]'
  });

  if (!token) {
    console.log('❌ Auth failed: No token provided');
    return res.status(401).json({
      message: 'Access token required',
      error: 'UNAUTHORIZED'
    });
  }

  try {
    const decoded = verifyToken(token);
    console.log('🔍 Token decoded successfully:', {
      id: decoded.id,
      email: decoded.email,
      exp: decoded.exp,
      iat: decoded.iat
    });

    req.user = {
      id: decoded.id,
      email: decoded.email,
      firstName: decoded.firstName,
      lastName: decoded.lastName,
      role: decoded.role || 'user',
    };
    console.log('✅ Auth success for user:', decoded.email);
    next();
  } catch (error) {
    console.log('❌ Auth failed: Invalid token', error);
    return res.status(401).json({
      message: 'Invalid or expired token',
      error: 'UNAUTHORIZED'
    });
  }
};

// Optional authentication middleware (doesn't fail if no token)
export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = verifyToken(token);
      req.user = {
        id: decoded.id,
        email: decoded.email,
        firstName: decoded.firstName,
        lastName: decoded.lastName,
        role: decoded.role || 'user',
      };
    } catch (error) {
      // Token is invalid but we don't fail the request
      req.user = undefined;
    }
  }

  next();
};

// Middleware to extract user ID from token
export const getUserId = (req: Request): string | null => {
  return req.user?.id || null;
};

// Role-based authorization middleware
export const requireRole = (requiredRole: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // First ensure the user is authenticated
    if (!req.user) {
      return res.status(401).json({
        message: 'Authentication required',
        error: 'MISSING_AUTH'
      });
    }

    // Check if user has the required role
    if (req.user.role !== requiredRole) {
      return res.status(403).json({
        message: `Access denied. ${requiredRole} role required.`,
        error: 'INSUFFICIENT_PERMISSIONS',
        userRole: req.user.role,
        requiredRole: requiredRole
      });
    }

    next();
  };
};

// Convenience middleware for admin-only routes
export const requireAdmin = requireRole('admin');

// Validation helpers
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): { valid: boolean; message?: string } => {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' };
  }

  if (!/(?=.*[a-z])/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }

  if (!/(?=.*[A-Z])/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }

  if (!/(?=.*\d)/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }

  return { valid: true };
};

// Security headers middleware
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // XSS Protection
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  next();
};