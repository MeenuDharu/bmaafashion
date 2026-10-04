import type { Express } from "express";
import { createServer, type Server } from "http";
import jwt from "jsonwebtoken";
import { storage } from "./storage";
import { setupAuthRoutes } from "./authRoutes";
import { authenticateToken, requireAdmin, type AuthenticatedRequest, hashPassword, verifyOrderAccessToken, generateToken } from "./jwtAuth";
import { NotificationService } from "./notificationService";
import { sendContactFormEmail } from "./emailService";
import type { Request, Response } from 'express';
import Razorpay from "razorpay";
import crypto from "crypto";
import path from "path";
import express from "express";
import multer from "multer";
import fs from 'fs';
import sharp from 'sharp';
import {
  insertProductSchema,
  insertCategorySchema,
  insertCartItemSchema,
  insertOrderSchema,
  insertOrderItemSchema,
  insertWishlistSchema,
  insertProductReviewSchema,
  insertSupportTicketSchema,
  updateProfileSchema,
  insertUserAddressSchema,
  adjustStockSchema,
  bulkUpdateStockSchema,
  updateProductInventorySchema,
  guestEmailValidationSchema,
  guestCheckoutSchema,
  createAccountFromGuestSchema,
  changePasswordSchema,
  updateUserPreferencesSchema,
  deleteAccountSchema,
  metricsDateRangeSchema,
  revenueQuerySchema,
  orderAnalyticsQuerySchema,
  customerAnalyticsQuerySchema,
  topProductsQuerySchema,
  lowStockQuerySchema,
  topProductsByRevenueQuerySchema,
  topProductsByUnitsQuerySchema,
  topCategoriesQuerySchema,
  adminOrdersQuerySchema,
  orderStatusUpdateSchema,
  adminBulkAdjustmentSchema,
  inventoryOverviewQuerySchema,
  lowStockAlertsQuerySchema,
  inventoryAuditQuerySchema,
  csvUploadSchema,
  inventoryExportSchema,
  customersListQuerySchema,
  customerCommunicationSchema,
  customerProfileUpdateSchema,
  customerExportSchema,
  ordersExportSchema,
  revenueExportSchema,
  analyticsExportSchema,
  exportRequestSchema,
  exportStatusUpdateSchema,
  csvConfigSchema
} from "@shared/schema";
import { z } from "zod";
import dotenv from "dotenv";
dotenv.config();


// Helper function to safely get authenticated user from request
function getAuthenticatedUser(req: any): { user: AuthenticatedRequest['user'] } {
  const authReq = req as AuthenticatedRequest;
  if (!authReq.user) {
    throw new Error('User authentication data is missing');
  }
  return { user: authReq.user };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup JWT authentication routes
  setupAuthRoutes(app);

  // Order access verification endpoint for email links
  app.post('/api/order-access/verify', async (req, res) => {
    try {
      const { token, orderId } = req.body;

      if (!token || !orderId) {
        return res.status(400).json({ message: 'Missing token or orderId' });
      }

      const decoded = verifyOrderAccessToken(token);

      if (decoded.orderId !== orderId) {
        return res.status(401).json({ message: 'Invalid token for this order' });
      }

      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      res.json({ success: true, orderId: order.id });
    } catch (error) {
      console.error('Error verifying order access token:', error);
      res.status(401).json({ message: 'Invalid or expired token' });
    }
  });

  // Get order details with order access token (no full auth required)
  app.get('/api/orders/:orderId/with-token', async (req, res) => {
    try {
      const { orderId } = req.params;
      const token = req.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        return res.status(401).json({ message: 'Order access token required' });
      }

      const decoded = verifyOrderAccessToken(token);

      if (decoded.orderId !== orderId) {
        return res.status(401).json({ message: 'Invalid token for this order' });
      }

      const order = await storage.getOrderWithItems(orderId);
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      res.json(order);
    } catch (error) {
      console.error('Error fetching order with token:', error);
      res.status(401).json({ message: 'Invalid or expired token' });
    }
  });

  // Static image serving from attached_assets
  const assetsPath = path.resolve(process.cwd(), 'attached_assets');
  app.use('/api/images', express.static(assetsPath, {
    maxAge: '1d', // Cache images for 1 day
    etag: true,
    lastModified: true
  }));

  // Configure multer for file uploads
  const storage_multer = multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(process.cwd(), 'attached_assets', 'profile-images');
      // Create directory if it doesn't exist
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      // Generate unique filename with timestamp and random suffix
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, `profile-${uniqueSuffix}${ext}`);
    }
  });

  // File filter for security
  const fileFilter = (req: any, file: any, cb: any) => {
    // Check MIME type
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and WebP images are allowed'), false);
    }
  };

  const upload = multer({
    storage: storage_multer,
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
      files: 1 // Only one file at a time
    },
    fileFilter
  });


  // Get current user route
  app.get('/api/auth/user', (req, res, next) => {
    // Debug: Log all headers received
    console.log('🔍 /api/auth/user route - Headers received:', {
      authorization: req.headers.authorization || '[MISSING]',
      'content-type': req.headers['content-type'],
      'user-agent': req.headers['user-agent'] ? '[PRESENT]' : '[MISSING]'
    });
    next();
  }, authenticateToken, async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      console.log('✅ Reached user route handler, user:', authReq.user.email);
      const userId = authReq.user.id;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Update profile route
  app.put('/api/auth/profile', authenticateToken, async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user.id;
      const validatedData = updateProfileSchema.parse(req.body);

      // Get current user data to preserve password
      const currentUser = await storage.getUser(userId);
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const updatedUser = await storage.upsertUser({
        id: userId,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        email: validatedData.email,
        phoneNumber: validatedData.phoneNumber || null,
        password: currentUser.password, // Preserve existing password
        profileImageUrl: currentUser.profileImageUrl, // Preserve existing profile image
      });

      // Remove password from response
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid profile data", details: error.errors });
      }
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // CRITICAL MISSING ENDPOINTS - Enhanced User Profile Management

  // Password Change Endpoint (HIGH PRIORITY) - POST /api/auth/change-password
  app.post('/api/auth/change-password', authenticateToken, async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user.id;
      const validatedData = changePasswordSchema.parse(req.body);

      console.log(`🔐 Password change attempt for user: ${authReq.user.email}`);

      // Use storage method to change password (includes security checks)
      const success = await storage.changePassword(
        userId,
        validatedData.currentPassword,
        validatedData.newPassword
      );

      if (!success) {
        console.log(`❌ Password change failed for user: ${authReq.user.email} - Invalid current password`);
        return res.status(400).json({
          error: 'INVALID_CURRENT_PASSWORD',
          message: 'Current password is incorrect'
        });
      }

      console.log(`✅ Password changed successfully for user: ${authReq.user.email}`);

      // Security: Note that we don't revoke existing JWT tokens since they're stateless
      // In a production environment, consider implementing a token blacklist or 
      // adding a 'passwordChangedAt' field to track when passwords were last changed

      res.json({
        message: 'Password changed successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'Invalid password change data',
          details: error.errors
        });
      }
      console.error('❌ Error changing password:', error);
      res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'Failed to change password'
      });
    }
  });

  // Account Deletion Endpoint (HIGH PRIORITY) - DELETE /api/auth/account
  app.delete('/api/auth/account', authenticateToken, async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user.id;
      const validatedData = deleteAccountSchema.parse(req.body);

      console.log(`🗑️ Account deletion attempt for user: ${authReq.user.email}`);

      // Additional security: Verify the confirmation text
      if (validatedData.confirmDeletion !== 'DELETE') {
        return res.status(400).json({
          error: 'INVALID_CONFIRMATION',
          message: 'Please type DELETE to confirm account deletion'
        });
      }

      // Use storage method to delete account (includes password verification)
      const success = await storage.deleteUserAccount(userId, validatedData.password);

      if (!success) {
        console.log(`❌ Account deletion failed for user: ${authReq.user.email} - Invalid password`);
        return res.status(400).json({
          error: 'INVALID_PASSWORD',
          message: 'Password is incorrect'
        });
      }

      console.log(`✅ Account deleted successfully for user: ${authReq.user.email}`);

      // Security: Account deletion cascades all related data automatically
      // JWT tokens will naturally expire since the user no longer exists

      res.json({
        message: 'Account deleted successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'Invalid account deletion data',
          details: error.errors
        });
      }
      console.error('❌ Error deleting account:', error);
      res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'Failed to delete account'
      });
    }
  });

  // Profile Image Upload Endpoint (HIGH PRIORITY) - POST /api/user/profile-image  
  app.post('/api/user/profile-image', authenticateToken, upload.single('profileImage'), async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user.id;

      console.log(`🖼️ Profile image upload attempt for user: ${authReq.user.email}`);

      // Check if file was uploaded
      if (!req.file) {
        return res.status(400).json({
          error: 'NO_FILE',
          message: 'Profile image file is required'
        });
      }

      // Additional MIME type validation (server-side security)
      const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedMimeTypes.includes(req.file.mimetype)) {
        // Clean up the uploaded file
        fs.unlinkSync(req.file.path);
        return res.status(400).json({
          error: 'INVALID_FILE_TYPE',
          message: 'Only JPEG, PNG, and WebP images are allowed'
        });
      }

      // Additional file size validation (server-side security)
      if (req.file.size > 5 * 1024 * 1024) { // 5MB
        // Clean up the uploaded file
        fs.unlinkSync(req.file.path);
        return res.status(400).json({
          error: 'FILE_TOO_LARGE',
          message: 'File size must be less than 5MB'
        });
      }

      // Optimize the uploaded profile image
      try {
        const originalPath = req.file.path;
        const originalSize = fs.statSync(originalPath).size;

        await sharp(originalPath)
          .resize(800, 800, { // Max 800x800 for profile images
            withoutEnlargement: true,
            fit: 'inside'
          })
          .jpeg({ quality: 90, progressive: true })
          .toFile(originalPath + '.tmp');

        fs.unlinkSync(originalPath);
        fs.renameSync(originalPath + '.tmp', originalPath);

        const optimizedSize = fs.statSync(originalPath).size;
        const savedPercent = ((originalSize - optimizedSize) / originalSize * 100).toFixed(1);
        console.log(`  ✨ Optimized profile image: ${(originalSize / 1024).toFixed(0)}KB → ${(optimizedSize / 1024).toFixed(0)}KB (${savedPercent}% reduction)`);
      } catch (optimizeError) {
        console.error('  ⚠️ Failed to optimize profile image, using original:', optimizeError);
      }

      // Generate the URL for the uploaded image
      const imageUrl = `/api/images/profile-images/${req.file.filename}`;

      // Update user's profile image in database
      const updatedUser = await storage.updateProfileImage(userId, imageUrl);
      if (!updatedUser) {
        // Clean up the uploaded file if user update failed
        fs.unlinkSync(req.file.path);
        return res.status(404).json({
          error: 'USER_NOT_FOUND',
          message: 'User not found'
        });
      }

      console.log(`✅ Profile image updated successfully for user: ${authReq.user.email}`);

      // Remove password from response
      const { password, ...userWithoutPassword } = updatedUser;
      res.json({
        message: 'Profile image updated successfully',
        profileImageUrl: imageUrl,
        user: userWithoutPassword,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      // Clean up uploaded file in case of error
      if (req.file) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (cleanupError) {
          console.error('Error cleaning up uploaded file:', cleanupError);
        }
      }

      console.error('❌ Error updating profile image:', error);
      res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'Failed to update profile image'
      });
    }
  });

  // Profile Image Remove Endpoint - POST /api/user/profile-image/remove
  app.post('/api/user/profile-image/remove', authenticateToken, async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user.id;

      console.log(`🗑️ Profile image removal attempt for user: ${authReq.user.email}`);

      // Get current user to find the old image path
      const currentUser = await storage.getUser(userId);
      if (!currentUser) {
        return res.status(404).json({
          error: 'USER_NOT_FOUND',
          message: 'User not found'
        });
      }

      // Remove the old profile image file if it exists
      if (currentUser.profileImageUrl) {
        const oldImagePath = path.join(process.cwd(), 'attached_assets', 'profile-images', path.basename(currentUser.profileImageUrl));
        if (fs.existsSync(oldImagePath)) {
          try {
            fs.unlinkSync(oldImagePath);
            console.log(`✅ Removed old profile image file: ${oldImagePath}`);
          } catch (error) {
            console.error('Error removing old profile image file:', error);
          }
        }
      }

      // Update user's profile image to null in database
      const updatedUser = await storage.updateProfileImage(userId, '');
      if (!updatedUser) {
        return res.status(404).json({
          error: 'USER_NOT_FOUND',
          message: 'User not found'
        });
      }

      console.log(`✅ Profile image removed successfully for user: ${authReq.user.email}`);

      // Remove password from response
      const { password, ...userWithoutPassword } = updatedUser;
      res.json({
        message: 'Profile image removed successfully',
        user: userWithoutPassword,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Error removing profile image:', error);
      res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'Failed to remove profile image'
      });
    }
  });

  // Product Image Upload Endpoint (Admin Only) - POST /api/admin/products/upload-image
  const productImageStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(process.cwd(), 'attached_assets', 'product-images');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, `product-${uniqueSuffix}${ext}`);
    }
  });

  const productImageUpload = multer({
    storage: productImageStorage,
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit for product images
      files: 5 // Allow up to 5 images at once
    },
    fileFilter: (req: any, file: any, cb: any) => {
      const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Only JPEG, PNG, and WebP images are allowed'), false);
      }
    }
  });

  app.post('/api/admin/products/upload-image', 
    authenticateToken, 
    requireAdmin, 
    productImageUpload.array('images', 5), 
    async (req, res) => {
      try {
        if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
          return res.status(400).json({
            error: 'NO_FILES',
            message: 'No image files provided'
          });
        }

        console.log(`📦 Processing ${req.files.length} product image(s) for optimization...`);

        // Optimize each uploaded image
        const optimizedFiles = await Promise.all(
          req.files.map(async (file) => {
            try {
              const originalPath = file.path;
              const originalSize = fs.statSync(originalPath).size;

              // Compress and optimize the image
              await sharp(originalPath)
                .resize(1920, null, { // Max width 1920px, maintain aspect ratio
                  withoutEnlargement: true,
                  fit: 'inside'
                })
                .jpeg({ quality: 85, progressive: true }) // Convert to optimized JPEG
                .toFile(originalPath + '.tmp');

              // Replace original with optimized version
              fs.unlinkSync(originalPath);
              fs.renameSync(originalPath + '.tmp', originalPath);

              const optimizedSize = fs.statSync(originalPath).size;
              const savedPercent = ((originalSize - optimizedSize) / originalSize * 100).toFixed(1);

              console.log(`  ✨ Optimized ${file.filename}: ${(originalSize / 1024 / 1024).toFixed(2)}MB → ${(optimizedSize / 1024 / 1024).toFixed(2)}MB (${savedPercent}% reduction)`);

              return file;
            } catch (error) {
              console.error(`  ⚠️ Failed to optimize ${file.filename}, using original:`, error);
              return file; // Return original file if optimization fails
            }
          })
        );

        // Generate URLs for uploaded images
        const imageUrls = optimizedFiles.map(file => 
          `/api/images/product-images/${file.filename}`
        );

        console.log(`✅ Successfully processed ${req.files.length} product image(s)`);

        res.json({
          message: 'Product images uploaded and optimized successfully',
          imageUrls,
          count: imageUrls.length,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        // Clean up uploaded files in case of error
        if (req.files && Array.isArray(req.files)) {
          req.files.forEach(file => {
            try {
              fs.unlinkSync(file.path);
            } catch (cleanupError) {
              console.error('Error cleaning up uploaded file:', cleanupError);
            }
          });
        }

        console.error('❌ Error uploading product images:', error);
        res.status(500).json({
          error: 'INTERNAL_ERROR',
          message: 'Failed to upload product images'
        });
      }
    }
  );

  // Delete Product Image Endpoint (Admin Only) - DELETE /api/admin/products/delete-image
  app.delete('/api/admin/products/delete-image', 
    authenticateToken, 
    requireAdmin, 
    async (req, res) => {
      try {
        const { imageUrl } = req.body;

        if (!imageUrl) {
          return res.status(400).json({
            error: 'MISSING_IMAGE_URL',
            message: 'Image URL is required'
          });
        }

        // Security: Only allow deletion of product images
        if (!imageUrl.includes('/api/images/product-images/')) {
          return res.status(400).json({
            error: 'INVALID_IMAGE_URL',
            message: 'Can only delete product images'
          });
        }

        // Extract filename from URL and sanitize
        const filename = path.basename(imageUrl);
        
        // Security: Validate filename doesn't contain path traversal
        if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
          return res.status(400).json({
            error: 'INVALID_FILENAME',
            message: 'Invalid filename'
          });
        }

        // Build the safe path
        const uploadDir = path.join(process.cwd(), 'attached_assets', 'product-images');
        const imagePath = path.join(uploadDir, filename);
        
        // Security: Verify the resolved path is actually inside product-images directory
        const normalizedImagePath = path.normalize(imagePath);
        const normalizedUploadDir = path.normalize(uploadDir);
        
        if (!normalizedImagePath.startsWith(normalizedUploadDir)) {
          console.error('🚨 Path traversal attempt detected:', imageUrl);
          return res.status(400).json({
            error: 'INVALID_PATH',
            message: 'Invalid image path'
          });
        }

        // Check if file exists and delete it
        if (fs.existsSync(normalizedImagePath)) {
          fs.unlinkSync(normalizedImagePath);
          console.log(`✅ Deleted product image: ${filename}`);
          res.json({
            message: 'Product image deleted successfully',
            deletedUrl: imageUrl
          });
        } else {
          res.status(404).json({
            error: 'IMAGE_NOT_FOUND',
            message: 'Image file not found'
          });
        }
      } catch (error) {
        console.error('❌ Error deleting product image:', error);
        res.status(500).json({
          error: 'INTERNAL_ERROR',
          message: 'Failed to delete product image'
        });
      }
    }
  );

  // User address routes
  app.get('/api/user/addresses', authenticateToken, async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user.id;
      const addresses = await storage.getUserAddresses(userId);
      res.json(addresses);
    } catch (error) {
      console.error('Error fetching user addresses:', error);
      res.status(500).json({ error: 'Failed to fetch addresses' });
    }
  });

  app.post('/api/user/addresses', authenticateToken, async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user.id;
      const validatedData = insertUserAddressSchema.parse({
        ...req.body,
        userId,
      });

      const address = await storage.createUserAddress(validatedData);
      res.status(201).json(address);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid address data', details: error.errors });
      }
      console.error('Error creating address:', error);
      res.status(500).json({ error: 'Failed to create address' });
    }
  });

  app.put('/api/user/addresses/:id', authenticateToken, async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const addressId = req.params.id;
      const userId = authReq.user.id;

      // Validate the update data (excluding userId and isDefault to prevent tampering)
      const { userId: _, isDefault: __, ...updateData } = req.body;
      const validatedData = insertUserAddressSchema.partial().parse(updateData);

      const updatedAddress = await storage.updateUserAddress(userId, addressId, validatedData);
      if (!updatedAddress) {
        return res.status(404).json({ error: 'Address not found or access denied' });
      }

      res.json(updatedAddress);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid address data', details: error.errors });
      }
      console.error('Error updating address:', error);
      res.status(500).json({ error: 'Failed to update address' });
    }
  });

  app.delete('/api/user/addresses/:id', authenticateToken, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    try {
      const addressId = req.params.id;
      const userId = authReq.user.id;

      // First check if address exists and belongs to user
      const userAddresses = await storage.getUserAddresses(userId);
      const addressExists = userAddresses.find(addr => addr.id === addressId);

      if (!addressExists) {
        return res.status(404).json({ error: 'Address not found or access denied' });
      }

      await storage.deleteUserAddress(userId, addressId);
      res.json({ message: 'Address deleted' });
    } catch (error) {
      console.error('Error deleting address:', error);
      res.status(500).json({ error: 'Failed to delete address' });
    }
  });

  app.put('/api/user/addresses/:id/default', authenticateToken, async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const addressId = req.params.id;
      const userId = authReq.user.id;

      await storage.setDefaultAddress(userId, addressId);
      res.json({ message: 'Default address updated' });
    } catch (error) {
      console.error('Error setting default address:', error);
      res.status(500).json({ error: 'Failed to set default address' });
    }
  });

  // Enhanced profile management routes

  // User preferences routes
  app.get('/api/user/preferences', authenticateToken, async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user.id;
      let preferences = await storage.getUserPreferences(userId);

      // Create default preferences if none exist
      if (!preferences) {
        preferences = await storage.createUserPreferences({
          userId,
          emailNotifications: {
            orderUpdates: true,
            promotions: true,
            stockAlerts: false,
            newsletter: false,
          },
          privacySettings: {
            profileVisibility: "private",
            showOrderHistory: false,
            shareActivityData: false,
          },
          displayPreferences: {
            theme: "system",
            language: "en",
            currency: "INR",
          },
        });
      }

      res.json(preferences);
    } catch (error) {
      console.error('Error fetching user preferences:', error);
      res.status(500).json({ error: 'Failed to fetch user preferences' });
    }
  });

  app.put('/api/user/preferences', authenticateToken, async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user.id;
      const validatedData = updateUserPreferencesSchema.parse(req.body);

      const updatedPreferences = await storage.updateUserPreferences(userId, validatedData);
      if (!updatedPreferences) {
        return res.status(404).json({ error: 'User preferences not found' });
      }

      res.json(updatedPreferences);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid preferences data', details: error.errors });
      }
      console.error('Error updating user preferences:', error);
      res.status(500).json({ error: 'Failed to update user preferences' });
    }
  });


  // Recent orders route
  app.get('/api/user/recent-orders', authenticateToken, async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user.id;
      const limit = parseInt(req.query.limit as string) || 5;

      const recentOrders = await storage.getRecentOrders(userId, limit);
      res.json(recentOrders);
    } catch (error) {
      console.error('Error fetching recent orders:', error);
      res.status(500).json({ error: 'Failed to fetch recent orders' });
    }
  });

  // GET /api/inventory/alerts - Stock alerts (simplified endpoint for dashboard) - MOVED HERE TO AVOID ROUTE CONFLICTS
  app.get('/api/inventory/alerts', [authenticateToken, requireAdmin], async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      console.log('🚨 Simple inventory alerts route called by:', authReq.user.email);
      const alerts = await storage.getStockAlerts(); // Get all alerts without status filter
      console.log('✅ Stock alerts retrieved successfully:', alerts.length, 'alerts found');
      res.json(alerts);
    } catch (error) {
      console.error('❌ Error fetching stock alerts:', error);
      res.status(500).json({ error: 'Failed to fetch stock alerts' });
    }
  });

  // Public inventory endpoint for customers to check stock status
  app.get('/api/inventory/:productId', async (req, res) => {
    try {
      const { productId } = req.params;
      const product = await storage.getProduct(productId);

      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      // Calculate stock status
      let stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock';
      if (product.inStock === 0) {
        stockStatus = 'out_of_stock';
      } else if (product.inStock <= product.lowStockThreshold) {
        stockStatus = 'low_stock';
      } else {
        stockStatus = 'in_stock';
      }

      res.json({
        productId: product.id,
        quantityInStock: product.inStock, // Use quantityInStock for CartContext compatibility
        inStock: product.inStock,
        lowStockThreshold: product.lowStockThreshold,
        stockStatus,
        available: product.inStock > 0
      });
    } catch (error) {
      console.error('Error fetching product inventory:', error);
      res.status(500).json({ error: 'Failed to fetch inventory' });
    }
  });

  // Admin Inventory Management Routes (Protected)

  // PATCH /api/inventory/:productId - Update stock thresholds/quantities
  app.patch('/api/inventory/:productId', [authenticateToken, requireAdmin], async (req: Request, res: Response) => {
    try {
      const { productId } = req.params;
      const validatedData = updateProductInventorySchema.parse(req.body);

      const updatedProduct = await storage.updateProductInventory(productId, validatedData);

      if (!updatedProduct) {
        return res.status(404).json({ error: 'Product not found' });
      }

      res.json(updatedProduct);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid inventory data', details: error.errors });
      }
      console.error('Error updating product inventory:', error);
      res.status(500).json({ error: 'Failed to update inventory' });
    }
  });

  // POST /api/inventory/:productId/adjust - Adjust stock with reason (±quantity)
  app.post('/api/inventory/:productId/adjust', [authenticateToken, requireAdmin], async (req: Request, res: Response) => {
    try {
      const { productId } = req.params;
      const authReq = req as AuthenticatedRequest;
      const { user } = getAuthenticatedUser(authReq);

      const validatedData = adjustStockSchema.parse({
        ...req.body,
        productId
      });

      await storage.adjustStock(
        validatedData.productId,
        validatedData.adjustment,
        validatedData.reason,
        user.id,
        validatedData.reference
      );

      res.json({ message: 'Stock adjusted successfully' });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid adjustment data', details: error.errors });
      }
      console.error('Error adjusting stock:', error);
      res.status(500).json({ error: 'Failed to adjust stock' });
    }
  });

  // POST /api/inventory/bulk - Bulk inventory updates
  app.post('/api/inventory/bulk', [authenticateToken, requireAdmin], async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { user } = getAuthenticatedUser(authReq);

      const validatedData = bulkUpdateStockSchema.parse(req.body);

      // Add userId to each update
      const updatesWithUserId = validatedData.updates.map(update => ({
        ...update,
        userId: user.id
      }));

      await storage.bulkUpdateStock(updatesWithUserId);

      res.json({ message: 'Bulk update completed successfully' });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid bulk update data', details: error.errors });
      }
      console.error('Error performing bulk update:', error);
      res.status(500).json({ error: 'Failed to perform bulk update' });
    }
  });

  // POST /api/inventory/adjust-stock - Alternative endpoint for stock adjustments
  app.post('/api/inventory/adjust-stock', [authenticateToken, requireAdmin], async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { user } = getAuthenticatedUser(authReq);

      const validatedData = adjustStockSchema.parse(req.body);

      await storage.adjustStock(
        validatedData.productId,
        validatedData.adjustment,
        validatedData.reason,
        user.id,
        validatedData.reference
      );

      res.json({ message: 'Stock adjusted successfully' });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid adjustment data', details: error.errors });
      }
      console.error('Error adjusting stock:', error);
      res.status(500).json({ error: 'Failed to adjust stock' });
    }
  });

  // GET /api/inventory/report - Inventory overview report
  app.get('/api/inventory/report', [authenticateToken, requireAdmin], async (req: Request, res: Response) => {
    try {
      const report = await storage.getInventoryReport();
      res.json(report);
    } catch (error) {
      console.error('Error fetching inventory report:', error);
      res.status(500).json({ error: 'Failed to fetch inventory report' });
    }
  });

  // This route has been moved above the parameterized inventory route to avoid conflicts

  // POST /api/inventory/alerts/:id/resolve - Resolve stock alert
  app.post('/api/inventory/alerts/:id/resolve', [authenticateToken, requireAdmin], async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const resolvedAlert = await storage.resolveStockAlert(id);

      if (!resolvedAlert) {
        return res.status(404).json({ error: 'Alert not found' });
      }

      res.json(resolvedAlert);
    } catch (error) {
      console.error('Error resolving stock alert:', error);
      res.status(500).json({ error: 'Failed to resolve alert' });
    }
  });

  // GET /api/inventory/low-stock - Low stock products
  app.get('/api/inventory/low-stock', [authenticateToken, requireAdmin], async (req: Request, res: Response) => {
    try {
      const lowStockProducts = await storage.getLowStockProducts();
      res.json(lowStockProducts);
    } catch (error) {
      console.error('Error fetching low stock products:', error);
      res.status(500).json({ error: 'Failed to fetch low stock products' });
    }
  });

  // GET /api/inventory/out-of-stock - Out of stock products
  app.get('/api/inventory/out-of-stock', [authenticateToken, requireAdmin], async (req: Request, res: Response) => {
    try {
      const outOfStockProducts = await storage.getOutOfStockProducts();
      res.json(outOfStockProducts);
    } catch (error) {
      console.error('Error fetching out of stock products:', error);
      res.status(500).json({ error: 'Failed to fetch out of stock products' });
    }
  });

  // GET /api/inventory/history - Inventory history
  app.get('/api/inventory/history', [authenticateToken, requireAdmin], async (req: Request, res: Response) => {
    try {
      const { productId } = req.query;
      const history = await storage.getInventoryHistory(productId as string);
      res.json(history);
    } catch (error) {
      console.error('Error fetching inventory history:', error);
      res.status(500).json({ error: 'Failed to fetch inventory history' });
    }
  });

  // ==============================================================================
  // ADMIN INVENTORY OVERSIGHT ENDPOINTS (Task 15g)
  // ==============================================================================

  // GET /api/admin/inventory/overview - Comprehensive inventory overview
  app.get('/api/admin/inventory/overview', [authenticateToken, requireAdmin], async (req: Request, res: Response) => {
    try {
      const queryParams = inventoryOverviewQuerySchema.parse(req.query);
      const overview = await storage.getAdminInventoryOverview(queryParams);
      res.json(overview);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid query parameters', details: error.errors });
      }
      console.error('Error fetching admin inventory overview:', error);
      res.status(500).json({ error: 'Failed to fetch inventory overview' });
    }
  });

  // GET /api/admin/inventory/low-stock - Enhanced low stock alerts
  app.get('/api/admin/inventory/low-stock', [authenticateToken, requireAdmin], async (req: Request, res: Response) => {
    try {
      const queryParams = lowStockAlertsQuerySchema.parse(req.query);
      const alerts = await storage.getAdminLowStockAlerts(queryParams);
      res.json(alerts);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid query parameters', details: error.errors });
      }
      console.error('Error fetching admin low stock alerts:', error);
      res.status(500).json({ error: 'Failed to fetch low stock alerts' });
    }
  });

  // POST /api/admin/inventory/bulk-adjust - Enhanced bulk adjustments with audit trail
  app.post('/api/admin/inventory/bulk-adjust', [authenticateToken, requireAdmin], async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { user } = getAuthenticatedUser(authReq);

      const validatedData = adminBulkAdjustmentSchema.parse(req.body);

      const bulkOperation = await storage.performAdminBulkAdjustment(validatedData, user.id);

      res.status(202).json({
        message: 'Bulk adjustment initiated successfully',
        bulkOperationId: bulkOperation.id,
        status: bulkOperation.status,
        totalItems: bulkOperation.totalItems
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid bulk adjustment data', details: error.errors });
      }
      console.error('Error performing admin bulk adjustment:', error);
      res.status(500).json({ error: 'Failed to perform bulk adjustment' });
    }
  });

  // GET /api/admin/inventory/audit - Comprehensive audit trail
  app.get('/api/admin/inventory/audit', [authenticateToken, requireAdmin], async (req: Request, res: Response) => {
    try {
      const queryParams = inventoryAuditQuerySchema.parse(req.query);
      const auditTrail = await storage.getAdminInventoryAudit(queryParams);
      res.json(auditTrail);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid query parameters', details: error.errors });
      }
      console.error('Error fetching admin inventory audit:', error);
      res.status(500).json({ error: 'Failed to fetch inventory audit trail' });
    }
  });

  // POST /api/admin/inventory/export - Export inventory data
  app.post('/api/admin/inventory/export', [authenticateToken, requireAdmin], async (req: Request, res: Response) => {
    try {
      const validatedData = inventoryExportSchema.parse(req.body);
      const exportData = await storage.exportInventoryData(validatedData);

      res.setHeader('Content-Type', validatedData.format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=inventory_${validatedData.type}_${new Date().toISOString().split('T')[0]}.${validatedData.format}`);

      res.send(exportData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid export parameters', details: error.errors });
      }
      console.error('Error exporting inventory data:', error);
      res.status(500).json({ error: 'Failed to export inventory data' });
    }
  });

  // GET /api/admin/inventory/bulk-operations/:id - Get bulk operation status
  app.get('/api/admin/inventory/bulk-operations/:id', [authenticateToken, requireAdmin], async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const operation = await storage.getBulkOperationStatus(id);

      if (!operation) {
        return res.status(404).json({ error: 'Bulk operation not found' });
      }

      res.json(operation);
    } catch (error) {
      console.error('Error fetching bulk operation status:', error);
      res.status(500).json({ error: 'Failed to fetch bulk operation status' });
    }
  });

  // POST /api/admin/inventory/csv-upload - Handle CSV upload for bulk adjustments
  app.post('/api/admin/inventory/csv-upload', [authenticateToken, requireAdmin], async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { user } = getAuthenticatedUser(authReq);

      // CSV upload validation and processing would be handled here
      // This is a placeholder for the CSV upload functionality
      const validatedData = csvUploadSchema.parse(req.body);

      const bulkOperation = await storage.processCsvInventoryUpload(validatedData, user.id);

      res.status(202).json({
        message: 'CSV upload processing initiated',
        bulkOperationId: bulkOperation.id,
        status: bulkOperation.status
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid CSV upload data', details: error.errors });
      }
      console.error('Error processing CSV upload:', error);
      res.status(500).json({ error: 'Failed to process CSV upload' });
    }
  });

  // Product routes
  app.get('/api/products', async (req, res) => {
    try {
      const { category, search } = req.query;

      let products;
      if (search) {
        products = await storage.searchProducts(search as string);
      } else if (category) {
        products = await storage.getProductsByCategory(category as string);
      } else {
        products = await storage.getProducts();
      }

      res.json(products);
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({ error: 'Failed to fetch products' });
    }
  });

  app.get('/api/products/:id', async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
      res.json(product);
    } catch (error) {
      console.error('Error fetching product:', error);
      res.status(500).json({ error: 'Failed to fetch product' });
    }
  });

  // Category routes
  app.get('/api/categories', async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({ error: 'Failed to fetch categories' });
    }
  });

  // Admin Category Management Routes (Protected)
  app.post('/api/admin/categories', [authenticateToken, requireAdmin], async (req: Request, res: Response) => {
    try {
      console.log('Creating category with data:', req.body);
      const validatedData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(validatedData);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('Validation error creating category:', error.errors);
        return res.status(400).json({ error: 'Invalid category data', details: error.errors });
      }
      console.error('Error creating category:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create category';
      res.status(500).json({ error: errorMessage });
    }
  });

  app.put('/api/admin/categories/:id', [authenticateToken, requireAdmin], async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      console.log('Updating category:', id, 'with data:', req.body);
      // Use partial schema for updates - only validate provided fields
      const validatedData = insertCategorySchema.partial().parse(req.body);
      const category = await storage.updateCategory(id, validatedData);
      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }
      res.json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('Validation error updating category:', error.errors);
        return res.status(400).json({ error: 'Invalid category data', details: error.errors });
      }
      console.error('Error updating category:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update category';
      res.status(500).json({ error: errorMessage });
    }
  });

  app.delete('/api/admin/categories/:id', [authenticateToken, requireAdmin], async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      console.log('Deleting category:', id);
      await storage.deleteCategory(id);
      res.json({ message: 'Category deleted successfully' });
    } catch (error) {
      console.error('Error deleting category:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete category';
      res.status(500).json({ error: errorMessage });
    }
  });

  // Category image upload
  const categoryImageUpload = multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        const uploadDir = path.join(process.cwd(), 'attached_assets', 'category-images');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'category-' + uniqueSuffix + path.extname(file.originalname));
      }
    }),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed'));
      }
    }
  });

  app.post('/api/admin/categories/upload-image', [authenticateToken, requireAdmin], categoryImageUpload.single('image'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No image file provided' });
      }

      const imageUrl = `/api/images/category-images/${req.file.filename}`;
      res.json({ imageUrl });
    } catch (error) {
      console.error('Error uploading category image:', error);
      res.status(500).json({ error: 'Failed to upload image' });
    }
  });

  // Seed categories with default data
  app.post('/api/admin/categories/seed', [authenticateToken, requireAdmin], async (req: Request, res: Response) => {
    try {
      // Check if categories already exist
      const existingCategories = await storage.getCategories();
      if (existingCategories.length > 0) {
        return res.status(400).json({ 
          error: 'Categories already exist', 
          message: 'Database already contains categories. Delete them first if you want to re-seed.' 
        });
      }

      // Default categories from the hardcoded MAIN_CATEGORIES
      const defaultCategories = [
        {
          mainCategory: "Fresh Produce",
          subcategories: ["Leafy Greens", "Herbs", "Exotic Vegetables"]
        },
        {
          mainCategory: "Kits",
          subcategories: ["NFT Systems", "Dutch Bucket Systems", "Vertical Gardens", "Growing Media", "Accessories", "Home Grower Kit", "Commercial Kit", "Coir Products"]
        }
      ];

      const createdCategories = [];
      for (const category of defaultCategories) {
        const created = await storage.createCategory(category);
        createdCategories.push(created);
      }

      res.status(201).json({ 
        message: 'Categories seeded successfully', 
        categories: createdCategories 
      });
    } catch (error) {
      console.error('Error seeding categories:', error);
      res.status(500).json({ error: 'Failed to seed categories' });
    }
  });

  // Admin Product Management Routes (Protected)
  app.post('/api/admin/products', [authenticateToken, requireAdmin], async (req: Request, res: Response) => {
    try {
      const validatedData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(validatedData);
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid product data', details: error.errors });
      }
      console.error('Error creating product:', error);
      res.status(500).json({ error: 'Failed to create product' });
    }
  });

  app.put('/api/admin/products/:id', [authenticateToken, requireAdmin], async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      console.log('📝 UPDATE PRODUCT REQUEST:', {
        id,
        body: JSON.stringify(req.body, null, 2)
      });
      const validatedData = insertProductSchema.parse(req.body);
      console.log('✅ Validation passed, updating product...');
      const product = await storage.updateProduct(id, validatedData);
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
      res.json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('❌ VALIDATION ERROR:', JSON.stringify(error.errors, null, 2));
        return res.status(400).json({ error: 'Invalid product data', details: error.errors });
      }
      console.error('Error updating product:', error);
      res.status(500).json({ error: 'Failed to update product' });
    }
  });

  app.delete('/api/admin/products/:id', [authenticateToken, requireAdmin], async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await storage.deleteProduct(id);
      res.json({ message: 'Product deleted successfully' });
    } catch (error) {
      console.error('Error deleting product:', error);
      res.status(500).json({ error: 'Failed to delete product' });
    }
  });

  // Admin User Management Routes (Protected)
  app.get('/api/admin/users', [authenticateToken, requireAdmin], async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      // Remove passwords from response
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  app.get('/api/admin/users/:id', [authenticateToken, requireAdmin], async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  });

  // ==============================================================================
  // COMPREHENSIVE ADMIN CUSTOMER MANAGEMENT API (Task 15h)
  // ==============================================================================

  // GET /api/admin/customers - Enhanced customer listing with LTV, filtering, and segmentation
  app.get('/api/admin/customers', [authenticateToken, requireAdmin], async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      console.log(`👥 Admin customers listing requested by: ${authReq.user.email}`);

      // Validate query parameters
      const queryValidation = customersListQuerySchema.safeParse(req.query);
      if (!queryValidation.success) {
        return res.status(400).json({
          error: 'INVALID_QUERY_PARAMETERS',
          message: 'Invalid customers query parameters',
          details: queryValidation.error.errors
        });
      }

      const query = queryValidation.data;
      const customersData = await storage.getAdminCustomers(query);

      console.log(`✅ Admin customers listing generated successfully - ${customersData.customers.length} customers, page ${query.page}/${customersData.pagination.totalPages}`);
      res.json(customersData);
    } catch (error) {
      console.error('❌ Error fetching admin customers:', error);
      res.status(500).json({
        error: 'ADMIN_CUSTOMERS_FETCH_ERROR',
        message: 'Failed to fetch admin customers'
      });
    }
  });

  // GET /api/admin/customers/export - CSV export for filtered customers
  app.get('/api/admin/customers/export', [authenticateToken, requireAdmin], async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      console.log(`📊 Customers export requested by: ${authReq.user.email}`);

      // Validate export query parameters
      const queryValidation = customerExportSchema.safeParse(req.query);
      if (!queryValidation.success) {
        return res.status(400).json({
          error: 'INVALID_QUERY_PARAMETERS',
          message: 'Invalid customers export query parameters',
          details: queryValidation.error.errors
        });
      }

      const query = queryValidation.data;
      const exportData = await storage.exportCustomerData(query);

      // Set CSV headers
      res.setHeader('Content-Type', 'application/csv');
      res.setHeader('Content-Disposition', `attachment; filename="customers-export-${new Date().toISOString().split('T')[0]}.csv"`);

      // Convert to CSV format
      if (exportData.length === 0) {
        res.send('No customers found for the specified criteria');
        return;
      }

      const headers = Object.keys(exportData[0]).join(',');
      const csvRows = exportData.map(row =>
        Object.values(row).map(value =>
          typeof value === 'string' && value.includes(',') ? `"${value}"` : value
        ).join(',')
      );

      const csvContent = [headers, ...csvRows].join('\n');

      console.log(`✅ Customers export generated successfully - ${exportData.length} customers`);
      res.send(csvContent);
    } catch (error) {
      console.error('❌ Error exporting customers:', error);
      res.status(500).json({
        error: 'CUSTOMERS_EXPORT_ERROR',
        message: 'Failed to export customers'
      });
    }
  });

  // GET /api/admin/customers/segments - Customer segmentation overview
  app.get('/api/admin/customers/segments', [authenticateToken, requireAdmin], async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      console.log(`🎯 Customer segmentation requested by: ${authReq.user.email}`);

      const segmentation = await storage.getCustomerSegmentation();

      console.log(`✅ Customer segmentation retrieved successfully`);
      res.json(segmentation);
    } catch (error) {
      console.error('❌ Error fetching customer segmentation:', error);
      res.status(500).json({
        error: 'CUSTOMER_SEGMENTATION_ERROR',
        message: 'Failed to fetch customer segmentation'
      });
    }
  });

  // GET /api/admin/customers/segmentation - Customer segmentation overview (legacy endpoint)
  app.get('/api/admin/customers/segmentation', [authenticateToken, requireAdmin], async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      console.log(`🎯 Customer segmentation requested by: ${authReq.user.email}`);

      const segmentation = await storage.getCustomerSegmentation();

      console.log(`✅ Customer segmentation retrieved successfully`);
      res.json(segmentation);
    } catch (error) {
      console.error('❌ Error fetching customer segmentation:', error);
      res.status(500).json({
        error: 'CUSTOMER_SEGMENTATION_ERROR',
        message: 'Failed to fetch customer segmentation'
      });
    }
  });

  // GET /api/admin/customers/attention - Customers needing attention (at-risk, inactive, etc.)
  app.get('/api/admin/customers/attention', [authenticateToken, requireAdmin], async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      console.log(`⚠️ Customers needing attention requested by: ${authReq.user.email}`);

      const customersNeedingAttention = await storage.getCustomersNeedingAttention();

      console.log(`✅ Customers needing attention retrieved successfully`);
      res.json(customersNeedingAttention);
    } catch (error) {
      console.error('❌ Error fetching customers needing attention:', error);
      res.status(500).json({
        error: 'CUSTOMERS_ATTENTION_ERROR',
        message: 'Failed to fetch customers needing attention'
      });
    }
  });

  // GET /api/admin/customers/:customerId - Comprehensive customer details with LTV and analytics
  app.get('/api/admin/customers/:customerId', [authenticateToken, requireAdmin], async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { customerId } = req.params;

      console.log(`📋 Customer details requested by: ${authReq.user.email} for customer: ${customerId}`);

      const customerDetail = await storage.getAdminCustomerDetail(customerId);
      if (!customerDetail) {
        return res.status(404).json({
          error: 'CUSTOMER_NOT_FOUND',
          message: 'Customer not found'
        });
      }

      console.log(`✅ Customer details retrieved successfully for customer: ${customerId}`);
      res.json(customerDetail);
    } catch (error) {
      console.error('❌ Error fetching customer details:', error);
      res.status(500).json({
        error: 'CUSTOMER_DETAILS_ERROR',
        message: 'Failed to fetch customer details'
      });
    }
  });

  // PUT /api/admin/customers/:customerId - Update customer profile with audit trail
  app.put('/api/admin/customers/:customerId', [authenticateToken, requireAdmin], async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { customerId } = req.params;

      console.log(`✏️ Customer profile update requested by: ${authReq.user.email} for customer: ${customerId}`);

      // Validate update data
      const updateValidation = customerProfileUpdateSchema.safeParse(req.body);
      if (!updateValidation.success) {
        return res.status(400).json({
          error: 'INVALID_UPDATE_DATA',
          message: 'Invalid customer profile update data',
          details: updateValidation.error.errors
        });
      }

      const updates = updateValidation.data;
      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
      const userAgent = req.get('User-Agent') || 'unknown';

      const updatedCustomer = await storage.updateCustomerProfile(
        customerId,
        updates,
        authReq.user.id,
        ipAddress,
        userAgent
      );

      console.log(`✅ Customer profile updated successfully for customer: ${customerId}`);
      res.json(updatedCustomer);
    } catch (error) {
      console.error('❌ Error updating customer profile:', error);
      if (error instanceof Error && error.message.includes('not found')) {
        return res.status(404).json({
          error: 'CUSTOMER_NOT_FOUND',
          message: 'Customer not found'
        });
      }
      res.status(500).json({
        error: 'CUSTOMER_UPDATE_ERROR',
        message: 'Failed to update customer profile'
      });
    }
  });

  // GET /api/admin/customers/:customerId/orders - Customer order history with pagination
  app.get('/api/admin/customers/:customerId/orders', [authenticateToken, requireAdmin], async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { customerId } = req.params;
      const { page = 1, limit = 20, status } = req.query;

      console.log(`📦 Customer orders requested by: ${authReq.user.email} for customer: ${customerId}`);

      const orderHistory = await storage.getCustomerOrderHistory(customerId, {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        status: status as string
      });

      console.log(`✅ Customer order history retrieved - ${orderHistory.orders.length} orders`);
      res.json(orderHistory);
    } catch (error) {
      console.error('❌ Error fetching customer order history:', error);
      res.status(500).json({
        error: 'CUSTOMER_ORDERS_ERROR',
        message: 'Failed to fetch customer order history'
      });
    }
  });

  // GET /api/admin/customers/:customerId/analytics - Customer behavior analytics and insights
  app.get('/api/admin/customers/:customerId/analytics', [authenticateToken, requireAdmin], async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { customerId } = req.params;
      const { from = '2023-01-01', to = new Date().toISOString().split('T')[0] } = req.query;

      console.log(`📈 Customer analytics requested by: ${authReq.user.email} for customer: ${customerId}`);

      const analytics = await storage.getCustomerAnalytics(customerId, {
        from: from as string,
        to: to as string
      });

      console.log(`✅ Customer analytics retrieved successfully for customer: ${customerId}`);
      res.json(analytics);
    } catch (error) {
      console.error('❌ Error fetching customer analytics:', error);
      res.status(500).json({
        error: 'CUSTOMER_ANALYTICS_ERROR',
        message: 'Failed to fetch customer analytics'
      });
    }
  });

  // POST /api/admin/customers/:customerId/communicate - Send communication to customer
  app.post('/api/admin/customers/:customerId/communicate', [authenticateToken, requireAdmin], async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { customerId } = req.params;

      console.log(`💬 Customer communication requested by: ${authReq.user.email} for customer: ${customerId}`);

      // Validate communication data
      const communicationValidation = customerCommunicationSchema.safeParse(req.body);
      if (!communicationValidation.success) {
        return res.status(400).json({
          error: 'INVALID_COMMUNICATION_DATA',
          message: 'Invalid customer communication data',
          details: communicationValidation.error.errors
        });
      }

      const communication = communicationValidation.data;
      const result = await storage.sendCustomerCommunication(communication, authReq.user.id);

      console.log(`✅ Customer communication sent successfully - ${communication.communicationType}`);
      res.json(result);
    } catch (error) {
      console.error('❌ Error sending customer communication:', error);
      res.status(500).json({
        error: 'CUSTOMER_COMMUNICATION_ERROR',
        message: 'Failed to send customer communication'
      });
    }
  });

  // ==============================================================================
  // COMPREHENSIVE ADMIN ORDERS MANAGEMENT API (Task 15f)
  // ==============================================================================

  // GET /api/admin/orders - Enhanced orders listing with pagination, filtering, and sorting
  app.get('/api/admin/orders', [authenticateToken, requireAdmin], async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      console.log(`📦 Admin orders listing requested by: ${authReq.user.email}`);

      // Validate query parameters
      const queryValidation = adminOrdersQuerySchema.safeParse(req.query);
      if (!queryValidation.success) {
        console.error('❌ Invalid query parameters:', queryValidation.error.errors);
        return res.status(400).json({
          error: 'INVALID_QUERY_PARAMETERS',
          message: 'Invalid admin orders query parameters',
          details: queryValidation.error.errors
        });
      }

      const query = queryValidation.data;
      console.log('📋 Fetching admin orders with query:', JSON.stringify(query, null, 2));
      
      const ordersData = await storage.getAdminOrders(query);

      console.log(`✅ Admin orders listing generated successfully - ${ordersData.orders.length} orders, page ${query.page}/${ordersData.pagination.totalPages}`);
      res.json(ordersData);
    } catch (error) {
      console.error('❌ Error fetching admin orders:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      res.status(500).json({
        error: 'ADMIN_ORDERS_FETCH_ERROR',
        message: 'Failed to fetch admin orders',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // GET /api/admin/orders/export - CSV export for filtered orders
  app.get('/api/admin/orders/export', [authenticateToken, requireAdmin], async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      console.log(`📊 Orders export requested by: ${authReq.user.email}`);

      // Validate query parameters (same as orders listing)
      const queryValidation = adminOrdersQuerySchema.safeParse(req.query);
      if (!queryValidation.success) {
        return res.status(400).json({
          error: 'INVALID_QUERY_PARAMETERS',
          message: 'Invalid orders export query parameters',
          details: queryValidation.error.errors
        });
      }

      const query = queryValidation.data;
      const exportData = await storage.exportOrdersData(query);

      // Set CSV headers
      res.setHeader('Content-Type', 'application/csv');
      res.setHeader('Content-Disposition', `attachment; filename="orders-export-${new Date().toISOString().split('T')[0]}.csv"`);

      // Convert to CSV format
      if (exportData.length === 0) {
        res.send('No orders found for the specified criteria');
        return;
      }

      const headers = Object.keys(exportData[0]).join(',');
      const csvRows = exportData.map(row =>
        Object.values(row).map(value =>
          typeof value === 'string' && value.includes(',') ? `"${value}"` : value
        ).join(',')
      );

      const csvContent = [headers, ...csvRows].join('\n');

      console.log(`✅ Orders export generated successfully - ${exportData.length} orders`);
      res.send(csvContent);
    } catch (error) {
      console.error('❌ Error exporting orders:', error);
      res.status(500).json({
        error: 'ORDERS_EXPORT_ERROR',
        message: 'Failed to export orders'
      });
    }
  });

  // PATCH /api/admin/orders/bulk/status - Bulk status updates (must be before parameterized routes)
  app.patch('/api/admin/orders/bulk/status', [authenticateToken, requireAdmin], async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { orderIds, status, reason } = req.body;

      console.log(`🔄 Bulk status update requested by: ${authReq.user.email} for ${orderIds?.length || 0} orders`);

      // Validate request
      if (!Array.isArray(orderIds) || orderIds.length === 0) {
        return res.status(400).json({
          error: 'INVALID_ORDER_IDS',
          message: 'orderIds must be a non-empty array'
        });
      }

      if (!status || typeof status !== 'string') {
        return res.status(400).json({
          error: 'INVALID_STATUS',
          message: 'status is required and must be a string'
        });
      }

      const updatedOrders = await storage.bulkUpdateOrderStatus(
        orderIds,
        status,
        authReq.user.id,
        reason
      );

      console.log(`✅ Bulk status update completed: ${updatedOrders.length}/${orderIds.length} orders updated`);
      res.json({
        updatedCount: updatedOrders.length,
        totalRequested: orderIds.length,
        updatedOrders: updatedOrders.map(order => ({
          id: order.id,
          status: order.status,
          updatedAt: order.updatedAt
        }))
      });
    } catch (error) {
      console.error('❌ Error performing bulk status update:', error);
      res.status(500).json({
        error: 'BULK_STATUS_UPDATE_ERROR',
        message: 'Failed to perform bulk status update'
      });
    }
  });

  // GET /api/admin/orders/:orderId - Enhanced order details with items and status history
  app.get('/api/admin/orders/:orderId', [authenticateToken, requireAdmin], async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { orderId } = req.params;

      console.log(`📋 Order details requested by: ${authReq.user.email} for order: ${orderId}`);

      const orderDetail = await storage.getAdminOrderDetail(orderId);
      if (!orderDetail) {
        return res.status(404).json({
          error: 'ORDER_NOT_FOUND',
          message: 'Order not found'
        });
      }

      console.log(`✅ Order details retrieved successfully for order: ${orderId}`);
      res.json(orderDetail);
    } catch (error) {
      console.error('❌ Error fetching order details:', error);
      res.status(500).json({
        error: 'ORDER_DETAILS_ERROR',
        message: 'Failed to fetch order details'
      });
    }
  });

  // PATCH /api/admin/orders/:orderId/status - Enhanced status update with history tracking
  app.patch('/api/admin/orders/:orderId/status', [authenticateToken, requireAdmin], async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { orderId } = req.params;

      console.log(`🔄 Order status update requested by: ${authReq.user.email} for order: ${orderId}`);

      // Validate request body
      const validationResult = orderStatusUpdateSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          error: 'INVALID_STATUS_UPDATE',
          message: 'Invalid status update data',
          details: validationResult.error.errors
        });
      }

      const statusUpdate = validationResult.data;
      const updatedOrder = await storage.updateOrderStatusWithHistory(
        orderId,
        statusUpdate,
        authReq.user.id
      );

      if (!updatedOrder) {
        return res.status(404).json({
          error: 'ORDER_NOT_FOUND',
          message: 'Order not found'
        });
      }

      // Trigger notification email if status changed
      try {
        await NotificationService.triggerOrderStatusUpdateEmail(
          updatedOrder,
          statusUpdate.status,
          updatedOrder.customerName,
          statusUpdate.trackingNumber,
          updatedOrder.userId || undefined
        );
      } catch (emailError) {
        console.error('Failed to send status update email:', emailError);
        // Don't fail the status update if email fails
      }

      console.log(`✅ Order status updated successfully: ${orderId} -> ${statusUpdate.status}`);
      res.json(updatedOrder);
    } catch (error) {
      if (error instanceof Error && error.message.includes('Invalid status transition')) {
        return res.status(400).json({
          error: 'INVALID_STATUS_TRANSITION',
          message: error.message
        });
      }

      console.error('❌ Error updating order status:', error);
      res.status(500).json({
        error: 'ORDER_STATUS_UPDATE_ERROR',
        message: 'Failed to update order status'
      });
    }
  });

  // GET /api/admin/orders/:orderId/history - Get order status history
  app.get('/api/admin/orders/:orderId/history', [authenticateToken, requireAdmin], async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { orderId } = req.params;

      console.log(`📜 Order history requested by: ${authReq.user.email} for order: ${orderId}`);

      const history = await storage.getOrderStatusHistory(orderId);

      console.log(`✅ Order history retrieved successfully: ${orderId} - ${history.length} entries`);
      res.json(history);
    } catch (error) {
      console.error('❌ Error fetching order history:', error);
      res.status(500).json({
        error: 'ORDER_HISTORY_ERROR',
        message: 'Failed to fetch order history'
      });
    }
  });

  // Cart routes
  app.get('/api/cart', async (req: any, res) => {
    try {
      // Support both authenticated and guest users - detect auth manually
      let userId = null;
      let userEmail = null;

      // Check for authentication token
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const token = authHeader.substring(7);
          const decoded = jwt.verify(token, process.env.JWT_SECRET!, {
            issuer: 'bmaafashion',
            audience: 'bmaafashion-users'
          }) as any;
          
          // Only accept auth tokens, not order access tokens
          if (decoded.type === 'auth') {
            userId = decoded.id;
            userEmail = decoded.email;
          }
        } catch (error) {
          // Invalid token, continue as guest
        }
      }

      const sessionId = req.headers['x-session-id'] || req.sessionID || 'anonymous';

      console.log(`🛒 Getting cart for ${userId ? `user: ${userEmail}` : `session: ${sessionId}`}`);

      const itemsWithProducts = await storage.getCartWithProducts(userId, sessionId);

      res.json(itemsWithProducts);
    } catch (error) {
      console.error('❌ Error fetching cart:', error);
      res.status(500).json({ error: 'Failed to fetch cart' });
    }
  });

  app.post('/api/cart', async (req: any, res) => {
    try {
      // Support both authenticated and guest users - detect auth manually
      let userId = null;
      let userEmail = null;

      // Check for authentication token
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const token = authHeader.substring(7);
          const decoded = jwt.verify(token, process.env.JWT_SECRET!, {
            issuer: 'bmaafashion',
            audience: 'bmaafashion-users'
          }) as any;
          
          // Only accept auth tokens, not order access tokens
          if (decoded.type === 'auth') {
            userId = decoded.id;
            userEmail = decoded.email;
          }
        } catch (error) {
          // Invalid token, continue as guest
        }
      }

      const sessionId = req.headers['x-session-id'] || req.sessionID || 'anonymous';

      console.log(`📥 Cart POST request body:`, req.body);
      
      const validatedData = insertCartItemSchema.parse({
        ...req.body,
        userId,
        sessionId: userId ? null : sessionId
      });

      console.log(`🛒 Adding to cart for ${userId ? `user: ${userEmail}` : `session: ${sessionId}`} - productId: ${validatedData.productId}, quantity: ${validatedData.quantity}`);

      // Check if product exists and is in stock
      const product = await storage.getProduct(validatedData.productId);
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
      if (product.inStock <= 0) {
        return res.status(400).json({ error: 'Product out of stock' });
      }

      // Use upsertCartItem for better persistence handling
      const cartItem = await storage.upsertCartItem(validatedData);
      res.status(201).json(cartItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid cart item data', details: error.errors });
      }
      console.error('❌ Error adding to cart:', error);
      res.status(500).json({ error: 'Failed to add to cart' });
    }
  });

  app.put('/api/cart/:id', async (req, res) => {
    try {
      // Support both authenticated and guest users - detect auth manually
      let userId = null;
      let userEmail = null;

      // Check for authentication token
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const token = authHeader.substring(7);
          const decoded = jwt.verify(token, process.env.JWT_SECRET!, {
            issuer: 'bmaafashion',
            audience: 'bmaafashion-users'
          }) as any;
          
          // Only accept auth tokens, not order access tokens
          if (decoded.type === 'auth') {
            userId = decoded.id;
            userEmail = decoded.email;
          }
        } catch (error) {
          // Invalid token, continue as guest
        }
      }

      const { quantity } = req.body;
      if (typeof quantity !== 'number' || quantity < 0) {
        return res.status(400).json({ error: 'Invalid quantity' });
      }

      console.log(`🛒 Updating cart item ${req.params.id} for ${userId ? `user: ${userEmail}` : 'guest'} - quantity: ${quantity}`);

      if (quantity === 0) {
        await storage.removeFromCart(req.params.id);
        return res.json({ message: 'Item removed from cart' });
      }

      const updatedItem = await storage.updateCartItem(req.params.id, quantity);
      if (!updatedItem) {
        return res.status(404).json({ error: 'Cart item not found' });
      }

      res.json(updatedItem);
    } catch (error) {
      console.error('❌ Error updating cart item:', error);
      res.status(500).json({ error: 'Failed to update cart item' });
    }
  });

  app.delete('/api/cart/:id', async (req, res) => {
    try {
      await storage.removeFromCart(req.params.id);
      res.json({ message: 'Item removed from cart' });
    } catch (error) {
      console.error('Error removing from cart:', error);
      res.status(500).json({ error: 'Failed to remove from cart' });
    }
  });

  app.delete('/api/cart', async (req: any, res) => {
    try {
      const authReq = req as Partial<AuthenticatedRequest>;
      const userId = authReq.user?.id;
      const sessionId = req.headers['x-session-id'] || req.sessionID || 'anonymous';

      console.log(`🛒 Clearing cart for ${userId ? `user: ${authReq.user?.email}` : `session: ${sessionId}`}`);

      await storage.clearCart(sessionId, userId);
      res.json({ message: 'Cart cleared' });
    } catch (error) {
      console.error('❌ Error clearing cart:', error);
      res.status(500).json({ error: 'Failed to clear cart' });
    }
  });

  // Cart synchronization and persistence endpoints

  // Sync local cart with database cart (for authenticated users)
  app.post('/api/cart/sync', authenticateToken, async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user.id;
      const { localCartItems } = req.body;

      if (!Array.isArray(localCartItems)) {
        return res.status(400).json({ error: 'localCartItems must be an array' });
      }

      console.log(`🔄 Syncing cart for user: ${authReq.user.email} with ${localCartItems.length} local items`);

      // Validate local cart items structure
      const validLocalItems = localCartItems.filter(item =>
        item && typeof item.productId === 'string' && typeof item.quantity === 'number' && item.quantity > 0
      );

      if (validLocalItems.length !== localCartItems.length) {
        console.warn('⚠️ Some local cart items were invalid and filtered out');
      }

      // Sync with database
      const syncedItems = await storage.syncCartItems(userId, validLocalItems);

      // Get enriched cart data with product details
      const enrichedItems = await storage.getCartWithProducts(userId);

      console.log(`✅ Cart synced successfully for user: ${authReq.user.email}, ${enrichedItems.length} total items`);

      res.json({
        message: 'Cart synced successfully',
        items: enrichedItems,
        syncedCount: syncedItems.length
      });
    } catch (error) {
      console.error('❌ Error syncing cart:', error);
      res.status(500).json({ error: 'Failed to sync cart' });
    }
  });

  // Merge guest cart with user cart (called during login/registration)
  app.post('/api/cart/merge', authenticateToken, async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user.id;
      const { sessionId } = req.body;

      if (!sessionId || typeof sessionId !== 'string') {
        return res.status(400).json({ error: 'sessionId is required' });
      }

      console.log(`🔄 Merging guest cart (session: ${sessionId}) with user cart for: ${authReq.user.email}`);

      // Get guest cart items before merging
      const guestItems = await storage.getCartItems(sessionId);
      console.log(`📦 Found ${guestItems.length} guest cart items to merge`);

      if (guestItems.length === 0) {
        // No guest cart to merge, just return current user cart
        const userItems = await storage.getCartWithProducts(userId);
        return res.json({
          message: 'No guest cart items to merge',
          items: userItems,
          mergedCount: 0
        });
      }

      // Perform the merge
      const mergedItems = await storage.mergeGuestCartToUser(sessionId, userId);

      // Get enriched cart data with product details
      const enrichedItems = await storage.getCartWithProducts(userId);

      console.log(`✅ Cart merged successfully for user: ${authReq.user.email}, ${enrichedItems.length} total items`);

      res.json({
        message: 'Guest cart merged successfully',
        items: enrichedItems,
        mergedCount: guestItems.length
      });
    } catch (error) {
      console.error('❌ Error merging cart:', error);
      res.status(500).json({ error: 'Failed to merge cart' });
    }
  });

  // Cleanup expired cart items (admin endpoint)
  app.delete('/api/cart/cleanup', [authenticateToken, requireAdmin], async (req: Request, res: Response) => {
    try {
      console.log('🧹 Starting cart cleanup operation');

      const cleanedCount = await storage.cleanupExpiredCarts();

      console.log(`✅ Cart cleanup completed, removed ${cleanedCount} expired items`);

      res.json({
        message: 'Cart cleanup completed',
        removedCount: cleanedCount
      });
    } catch (error) {
      console.error('❌ Error during cart cleanup:', error);
      res.status(500).json({ error: 'Failed to cleanup expired carts' });
    }
  });

  // Order routes (JWT protected)
  app.post('/api/orders', authenticateToken, async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { items, customerName, customerEmail, customerPhone, shippingAddress, orderNotes } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'No items in order' });
      }

      // Validate order data (excluding price fields which we'll compute server-side)
      const orderDataToValidate = {
        customerName: customerName || `${authReq.user.firstName} ${authReq.user.lastName}`,
        customerEmail: customerEmail || authReq.user.email,
        customerPhone,
        shippingAddress,
        notes: orderNotes || null,
        userId: authReq.user.id,
        // These will be computed server-side
        subtotal: '0',
        shippingCost: '0',
        taxAmount: '0',
        total: '0',
        status: 'pending',
        paymentStatus: 'pending'
      };

      const order = await storage.createSecureOrder(orderDataToValidate, items, authReq.user.id);

      // Trigger order confirmation email
      try {
        if (order) {
          // Fetch order items with full product details for notification
          const orderItems = await storage.getOrderItems(order.id);
          const itemsWithProducts = [];

          for (const item of orderItems) {
            const product = await storage.getProduct(item.productId);
            if (product) {
              itemsWithProducts.push({ ...item, product });
            }
          }

          const orderWithItems = { ...order, items: itemsWithProducts };

          await NotificationService.triggerOrderConfirmationEmail(
            orderWithItems,
            orderDataToValidate.customerName,
            authReq.user.id
          );
        }
      } catch (emailError) {
        console.error('Failed to send order confirmation email:', emailError);
        // Don't fail the order creation if email fails
      }

      res.status(201).json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid order data', details: error.errors });
      }
      console.error('Error creating order:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create order';
      res.status(500).json({ error: errorMessage });
    }
  });

  // Get user's orders (order history)
  app.get('/api/orders', authenticateToken, async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user.id;
      const orders = await storage.getOrders(userId);
      res.json(orders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      res.status(500).json({ error: 'Failed to fetch orders' });
    }
  });

  app.get('/api/orders/:id', authenticateToken, async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      // Ensure user can only access their own orders
      if (order.userId !== authReq.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Get order items
      const orderItems = await storage.getOrderItems(order.id);
      const orderWithItems = {
        ...order,
        items: orderItems
      };

      res.json(orderWithItems);
    } catch (error) {
      console.error('Error fetching order:', error);
      res.status(500).json({ error: 'Failed to fetch order' });
    }
  });

  // Generate and download receipt for an order
  app.get('/api/orders/:id/receipt', authenticateToken, async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const order = await storage.getOrder(req.params.id);
      
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      // Ensure user can only access their own orders
      if (order.userId !== authReq.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Get order items with product details
      const orderItems = await storage.getOrderItems(order.id);
      
      // Generate receipt HTML
      const receiptHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Receipt - Order #${order.id.slice(-8).toUpperCase()}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; padding: 40px; color: #333; background: #f5f5f5; }
    .receipt { max-width: 800px; margin: 0 auto; background: white; padding: 40px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
    .header { text-align: center; border-bottom: 2px solid #2d5a2d; padding-bottom: 20px; margin-bottom: 30px; }
    .logo { font-size: 32px; color: #2d5a2d; font-weight: bold; }
    .receipt-title { font-size: 24px; color: #666; margin-top: 10px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
    .info-section h3 { font-size: 14px; color: #666; margin-bottom: 8px; }
    .info-section p { font-size: 16px; color: #333; }
    .items-table { width: 100%; border-collapse: collapse; margin: 30px 0; }
    .items-table th { background: #f8f9fa; padding: 12px; text-align: left; font-size: 14px; color: #666; border-bottom: 2px solid #dee2e6; }
    .items-table td { padding: 12px; border-bottom: 1px solid #dee2e6; }
    .items-table .product-name { font-weight: 600; }
    .items-table .text-right { text-align: right; }
    .totals { margin-top: 30px; border-top: 2px solid #dee2e6; padding-top: 20px; }
    .total-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 16px; }
    .total-row.final { font-size: 20px; font-weight: bold; color: #2d5a2d; border-top: 2px solid #2d5a2d; margin-top: 12px; padding-top: 12px; }
    .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #dee2e6; color: #666; font-size: 14px; }
    .status-badge { display: inline-block; padding: 6px 12px; border-radius: 4px; font-size: 14px; font-weight: 600; }
    .status-confirmed { background: #d4edda; color: #155724; }
    .status-pending { background: #fff3cd; color: #856404; }
    @media print {
      body { padding: 0; background: white; }
      .receipt { box-shadow: none; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <div class="logo">👒 Bmaafashion</div>
      <div class="receipt-title">PAYMENT RECEIPT</div>
      <p style="margin-top: 10px; color: #666;">Order #${order.id.slice(-8).toUpperCase()}</p>
    </div>

    <div class="info-grid">
      <div class="info-section">
        <h3>CUSTOMER INFORMATION</h3>
        <p><strong>${order.customerName}</strong></p>
        <p>${order.customerEmail}</p>
        <p>${order.shippingAddress}</p>
      </div>
      <div class="info-section">
        <h3>ORDER DETAILS</h3>
        <p><strong>Date:</strong> ${order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</p>
        <p><strong>Payment Status:</strong> <span class="status-badge status-confirmed">PAID</span></p>
        <p><strong>Order Status:</strong> ${order.status.toUpperCase()}</p>
      </div>
    </div>

    <table class="items-table">
      <thead>
        <tr>
          <th>ITEM</th>
          <th class="text-right">QTY</th>
          <th class="text-right">PRICE</th>
          <th class="text-right">TOTAL</th>
        </tr>
      </thead>
      <tbody>
        ${orderItems.map(item => `
          <tr>
            <td class="product-name">${item.productName}</td>
            <td class="text-right">${item.quantity}</td>
            <td class="text-right">₹${Number(item.productPrice).toFixed(2)}</td>
            <td class="text-right">₹${(Number(item.productPrice) * item.quantity).toFixed(2)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="totals">
      <div class="total-row">
        <span>Subtotal:</span>
        <span>₹${Number(order.total).toFixed(2)}</span>
      </div>
      <div class="total-row">
        <span>Shipping:</span>
        <span>FREE</span>
      </div>
      <div class="total-row final">
        <span>Total Paid:</span>
        <span>₹${Number(order.total).toFixed(2)}</span>
      </div>
    </div>

    <div class="footer">
      <p><strong>Thank you for your purchase!</strong></p>
      <p style="margin-top: 10px;">Bmaafashion - Fashion that transforms, one style at a time</p>
      <p style="margin-top: 10px; font-size: 12px;">For support, contact us at support@bmaafashion.com</p>
      <button class="no-print" onclick="window.print()" style="margin-top: 20px; padding: 12px 24px; background: #2d5a2d; color: white; border: none; border-radius: 6px; font-size: 16px; cursor: pointer;">Print Receipt</button>
    </div>
  </div>
</body>
</html>
      `;

      res.setHeader('Content-Type', 'text/html');
      res.send(receiptHTML);
    } catch (error) {
      console.error('Error generating receipt:', error);
      res.status(500).json({ error: 'Failed to generate receipt' });
    }
  });

  // Update order status (for admin or order tracking)
  app.patch('/api/orders/:id/status', authenticateToken, async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({ error: 'Status is required' });
      }

      // Verify order exists and user owns it
      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      if (order.userId !== authReq.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }

      const updatedOrder = await storage.updateOrderStatus(req.params.id, status);
      res.json(updatedOrder);
    } catch (error) {
      console.error('Error updating order status:', error);
      res.status(500).json({ error: 'Failed to update order status' });
    }
  });

  // Guest checkout routes (no authentication required)

  // Validate guest email - check if account exists
  app.post('/api/guest/validate-email', async (req, res) => {
    try {
      const { email } = guestEmailValidationSchema.parse(req.body);

      const existingUser = await storage.getUserByEmail(email);

      res.json({
        email,
        hasAccount: !!existingUser,
        message: existingUser
          ? "An account already exists with this email. Would you like to sign in instead?"
          : "Email is available for guest checkout"
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid email format', details: error.errors });
      }
      console.error('Error validating guest email:', error);
      res.status(500).json({ error: 'Failed to validate email' });
    }
  });

  // Process guest order - SECURE: Server-side price calculation prevents tampering
  app.post('/api/guest/checkout', async (req, res) => {
    try {
      const guestData = guestCheckoutSchema.parse(req.body);

      // Check if user already exists with this email
      const existingUser = await storage.getUserByEmail(guestData.customerEmail);

      // Block guest checkout if account already exists - require login instead
      if (existingUser) {
        return res.status(409).json({
          error: 'Account already exists',
          message: 'An account already exists with this email address. Please sign in to complete your order.',
          requireLogin: true
        });
      }

      // User doesn't exist, create an account automatically
      let userId: string | null = null;
      let createdAccount = false;
      let temporaryPassword: string | null = null;

      if (!existingUser) {
        try {
          // Generate a cryptographically secure random password (12 characters with uppercase, lowercase, numbers)
          const generateRandomPassword = () => {
            const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            const lowercase = 'abcdefghijklmnopqrstuvwxyz';
            const numbers = '0123456789';
            const allChars = uppercase + lowercase + numbers;

            // Use crypto.randomBytes for secure random generation
            const getSecureRandomInt = (max: number): number => {
              const randomBytes = crypto.randomBytes(4);
              const randomInt = randomBytes.readUInt32BE(0);
              return randomInt % max;
            };

            let password = '';
            // Ensure at least one of each type using secure random
            password += uppercase[getSecureRandomInt(uppercase.length)];
            password += lowercase[getSecureRandomInt(lowercase.length)];
            password += numbers[getSecureRandomInt(numbers.length)];

            // Fill the rest with secure random characters
            for (let i = 3; i < 12; i++) {
              password += allChars[getSecureRandomInt(allChars.length)];
            }

            // Shuffle the password using Fisher-Yates with secure random
            const chars = password.split('');
            for (let i = chars.length - 1; i > 0; i--) {
              const j = getSecureRandomInt(i + 1);
              [chars[i], chars[j]] = [chars[j], chars[i]];
            }

            return chars.join('');
          };

          temporaryPassword = generateRandomPassword();
          const hashedPassword = await hashPassword(temporaryPassword);

          // Extract first and last name from customer name
          const nameParts = guestData.customerName.trim().split(' ');
          const firstName = nameParts[0] || '';
          const lastName = nameParts.slice(1).join(' ') || '';

          // Create the user account
          const newUser = await storage.upsertUser({
            email: guestData.customerEmail,
            password: hashedPassword,
            firstName,
            lastName,
            phoneNumber: guestData.customerPhone || null,
            role: 'user',
            emailVerified: true, // Auto-verify since we're sending password to their email
          });

          userId = newUser.id;
          createdAccount = true;

          console.log(`✅ Auto-created account for guest: ${guestData.customerEmail}`);
        } catch (accountError) {
          console.error('Failed to create account for guest:', accountError);
          // Continue with guest order if account creation fails
          userId = null;
        }
      }

      // Create shipping address string
      const shippingAddr = guestData.shippingAddress;
      const shippingAddressString = `${shippingAddr.recipientName}\n${shippingAddr.street}\n${shippingAddr.city}, ${shippingAddr.state} ${shippingAddr.postalCode}\n${shippingAddr.country}${shippingAddr.phoneNumber ? '\nPhone: ' + shippingAddr.phoneNumber : ''}`;

      // Create order data
      const orderData = {
        customerName: guestData.customerName,
        customerEmail: guestData.customerEmail,
        customerPhone: guestData.customerPhone,
        shippingAddress: shippingAddressString,
        status: "pending",
        paymentStatus: "pending",
        notes: guestData.orderNotes || null,
      };

      // Use SECURE order creation that validates prices from database
      // Pass userId as third parameter (will be null for true guest orders, or user ID if account exists/created)
      const order = await storage.createSecureOrder(orderData, guestData.items, userId);

      // Note: Order confirmation email will be sent after payment verification succeeds
      // This prevents duplicate emails and ensures order is only confirmed after payment

      // Send account creation email if account was created
      if (createdAccount && userId && temporaryPassword) {
        try {
          const { sendAccountCreatedFromGuestEmail } = await import('./emailService');
          await sendAccountCreatedFromGuestEmail(
            guestData.customerName,
            guestData.customerEmail,
            temporaryPassword,
            userId
          );
          console.log(`📧 Sent account creation email to: ${guestData.customerEmail}`);
        } catch (emailError) {
          console.error('Failed to send account creation email:', emailError);
          // Don't fail the order if email fails
        }
      }

      res.status(201).json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid checkout data', details: error.errors });
      }
      console.error('Error processing guest checkout:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to process guest checkout';
      res.status(500).json({ error: errorMessage });
    }
  });

  // SECURE Guest order lookup - requires both order ID and email for privacy protection
  app.post('/api/guest/order-lookup', async (req, res) => {
    try {
      const { orderId, email } = req.body;

      // Validate input
      if (!orderId || !email) {
        return res.status(400).json({ error: 'Both order ID and email are required' });
      }

      if (!/\S+@\S+\.\S+/.test(email)) {
        return res.status(400).json({ error: 'Valid email address is required' });
      }

      // Validate order ID format (should be UUID)
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId)) {
        return res.status(400).json({ error: 'Invalid order ID format' });
      }

      // Find the specific guest order with matching ID and email
      const order = await storage.getOrder(orderId);

      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      // Verify this is a guest order and email matches
      if (order.userId !== null) {
        return res.status(404).json({ error: 'Order not found' }); // Don't reveal it's not a guest order
      }

      if (order.customerEmail?.toLowerCase() !== email.toLowerCase()) {
        return res.status(404).json({ error: 'Order not found' }); // Don't reveal email mismatch
      }

      // Get order items
      const items = await storage.getOrderItems(order.id);
      const orderWithItems = { ...order, items };

      // Return limited information to prevent unnecessary data exposure
      const secureOrderData = {
        id: orderWithItems.id,
        customerName: orderWithItems.customerName,
        customerEmail: orderWithItems.customerEmail,
        shippingAddress: orderWithItems.shippingAddress,
        subtotal: orderWithItems.subtotal,
        shippingCost: orderWithItems.shippingCost,
        taxAmount: orderWithItems.taxAmount,
        total: orderWithItems.total,
        status: orderWithItems.status,
        paymentStatus: orderWithItems.paymentStatus,
        createdAt: orderWithItems.createdAt,
        items: orderWithItems.items?.map(item => ({
          productName: item.productName,
          productPrice: item.productPrice,
          quantity: item.quantity,
          totalPrice: item.totalPrice
        }))
      };

      res.json(secureOrderData);
    } catch (error) {
      console.error('Error looking up guest order:', error);
      res.status(500).json({ error: 'Failed to lookup order' });
    }
  });

  // Create account from guest order
  app.post('/api/guest/create-account', async (req, res) => {
    try {
      const accountData = createAccountFromGuestSchema.parse(req.body);

      // Get the guest order
      const order = await storage.getOrder(accountData.orderId);
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      // Verify this is a guest order
      if (order.userId !== null) {
        return res.status(400).json({ error: 'This order is already associated with an account' });
      }

      // Check if email already has an account
      const existingUser = await storage.getUserByEmail(order.customerEmail);
      if (existingUser) {
        return res.status(409).json({ error: 'An account already exists with this email address' });
      }

      // Hash password BEFORE storing (CRITICAL SECURITY FIX)
      const hashedPassword = await hashPassword(accountData.password);

      // Create new user account
      const userData = {
        email: order.customerEmail,
        password: hashedPassword, // Password is now properly hashed
        firstName: accountData.firstName,
        lastName: accountData.lastName,
        phoneNumber: order.customerPhone || null,
        role: 'user',
        emailVerified: false,
        profileImageUrl: null,
        emailVerificationToken: null,
        emailVerificationTokenExpiry: null
      };

      const newUser = await storage.createUser(userData);

      // Update the order to link it to the new user
      const updatedOrder = await storage.linkOrderToUser(order.id, newUser.id);

      // Remove password from response
      const { password, ...userWithoutPassword } = newUser;

      res.status(201).json({
        user: userWithoutPassword,
        order: updatedOrder,
        message: 'Account created successfully and linked to your order'
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid account data', details: error.errors });
      }
      console.error('Error creating account from guest order:', error);
      res.status(500).json({ error: 'Failed to create account' });
    }
  });

  // Wishlist routes (JWT protected)
  app.get('/api/wishlist', authenticateToken, async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user.id;
      const wishlistItems = await storage.getWishlist(userId);

      // Get product details for each wishlist item
      const productIds = wishlistItems.map(item => item.productId);
      const products = await Promise.all(
        productIds.map(id => storage.getProduct(id))
      );

      const wishlistWithProducts = wishlistItems.map((item, index) => ({
        ...item,
        product: products[index]
      }));

      res.json(wishlistWithProducts);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      res.status(500).json({ error: 'Failed to fetch wishlist' });
    }
  });

  app.post('/api/wishlist', authenticateToken, async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user.id;

      // Validate request body with schema
      const validatedData = insertWishlistSchema.parse({
        ...req.body,
        userId,
      });

      const { productId } = validatedData;

      // Check if product exists
      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      // Check if already in wishlist
      const isAlreadyWishlisted = await storage.isInWishlist(userId, productId);
      if (isAlreadyWishlisted) {
        return res.status(409).json({ error: 'Product already in wishlist' });
      }

      const wishlistItem = await storage.addToWishlist({ userId, productId });
      res.status(201).json(wishlistItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid wishlist data', details: error.errors });
      }
      console.error('Error adding to wishlist:', error);
      res.status(500).json({ error: 'Failed to add to wishlist' });
    }
  });

  app.delete('/api/wishlist/:productId', authenticateToken, async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { productId } = req.params;
      const userId = authReq.user.id;

      // Check if item is in wishlist
      const isWishlisted = await storage.isInWishlist(userId, productId);
      if (!isWishlisted) {
        return res.status(404).json({ error: 'Product not in wishlist' });
      }

      await storage.removeFromWishlist(userId, productId);
      res.json({ message: 'Product removed from wishlist' });
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      res.status(500).json({ error: 'Failed to remove from wishlist' });
    }
  });

  // Check if product is in user's wishlist
  app.get('/api/wishlist/check/:productId', authenticateToken, async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { productId } = req.params;
      const userId = authReq.user.id;

      const isInWishlist = await storage.isInWishlist(userId, productId);
      res.json({ isInWishlist });
    } catch (error) {
      console.error('Error checking wishlist status:', error);
      res.status(500).json({ error: 'Failed to check wishlist status' });
    }
  });

  // Review Routes
  // Get all reviews for a product
  app.get('/api/products/:id/reviews', async (req, res) => {
    try {
      const { id: productId } = req.params;
      const { page = 1, limit = 10, sort = 'newest' } = req.query;

      // Check if product exists
      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      const reviews = await storage.getProductReviews(productId);

      // Sort reviews based on query parameter
      let sortedReviews = [...reviews];
      switch (sort) {
        case 'oldest':
          sortedReviews.sort((a, b) => {
            const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return aDate - bDate;
          });
          break;
        case 'highest':
          sortedReviews.sort((a, b) => b.rating - a.rating);
          break;
        case 'lowest':
          sortedReviews.sort((a, b) => a.rating - b.rating);
          break;
        case 'helpful':
          sortedReviews.sort((a, b) => {
            const aVotes = a.helpfulVotes ?? 0;
            const bVotes = b.helpfulVotes ?? 0;
            return bVotes - aVotes;
          });
          break;
        case 'newest':
        default:
          sortedReviews.sort((a, b) => {
            const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return bDate - aDate;
          });
          break;
      }

      // Pagination
      const pageNum = parseInt(page as string) || 1;
      const limitNum = parseInt(limit as string) || 10;
      const startIndex = (pageNum - 1) * limitNum;
      const endIndex = startIndex + limitNum;
      const paginatedReviews = sortedReviews.slice(startIndex, endIndex);

      // Get user details for each review
      const reviewsWithUsers = await Promise.all(
        paginatedReviews.map(async (review) => {
          const user = await storage.getUser(review.userId);
          return {
            ...review,
            user: user ? {
              id: user.id,
              firstName: user.firstName,
              lastName: user.lastName,
              profileImageUrl: user.profileImageUrl
            } : null
          };
        })
      );

      res.json({
        reviews: reviewsWithUsers,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: reviews.length,
          pages: Math.ceil(reviews.length / limitNum)
        }
      });
    } catch (error) {
      console.error('Error fetching product reviews:', error);
      res.status(500).json({ error: 'Failed to fetch reviews' });
    }
  });

  // Get product rating summary
  app.get('/api/products/:id/rating', async (req, res) => {
    try {
      const { id: productId } = req.params;

      // Check if product exists
      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      const rating = await storage.getProductRating(productId);
      const reviews = await storage.getProductReviews(productId);

      // Calculate star distribution
      const starDistribution = {
        1: reviews.filter(r => r.rating === 1).length,
        2: reviews.filter(r => r.rating === 2).length,
        3: reviews.filter(r => r.rating === 3).length,
        4: reviews.filter(r => r.rating === 4).length,
        5: reviews.filter(r => r.rating === 5).length,
      };

      res.json({
        ...rating,
        starDistribution
      });
    } catch (error) {
      console.error('Error fetching product rating:', error);
      res.status(500).json({ error: 'Failed to fetch rating' });
    }
  });

  // Create a new review (authenticated users only)
  app.post('/api/products/:id/reviews', authenticateToken, async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { id: productId } = req.params;
      const userId = authReq.user.id;

      // Check if product exists
      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      // Check if user has already reviewed this product
      const existingReviews = await storage.getProductReviews(productId);
      const userHasReviewed = existingReviews.some(review => review.userId === userId);

      if (userHasReviewed) {
        return res.status(409).json({ error: 'You have already reviewed this product' });
      }

      // Check if user has purchased the product (for verified purchase indicator)
      const userOrders = await storage.getOrders(userId);
      const hasOrderedProduct = userOrders.some(order => {
        // Only consider completed orders
        if (order.paymentStatus !== 'completed') return false;

        // This is a simplified check - in a real system, you'd check order items
        // For now, we'll mark as verified if user has any completed order
        return true;
      });

      // Validate review data
      const validatedData = insertProductReviewSchema.parse({
        ...req.body,
        productId,
        userId,
        isVerifiedPurchase: hasOrderedProduct
      });

      const review = await storage.createReview(validatedData);

      // Get user details for response
      const user = await storage.getUser(userId);
      const reviewWithUser = {
        ...review,
        user: user ? {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImageUrl: user.profileImageUrl
        } : null
      };

      res.status(201).json(reviewWithUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid review data', details: error.errors });
      }
      console.error('Error creating review:', error);
      res.status(500).json({ error: 'Failed to create review' });
    }
  });

  // Update a review (author only)
  app.put('/api/reviews/:id', authenticateToken, async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { id: reviewId } = req.params;
      const userId = authReq.user.id;

      // Get existing review efficiently using new method
      const existingReview = await storage.getReviewById(reviewId);
      if (!existingReview) {
        return res.status(404).json({ error: 'Review not found' });
      }

      // Check if user is the author of the review
      if (existingReview.userId !== userId) {
        return res.status(403).json({ error: 'You can only update your own reviews' });
      }

      // Validate update data with server-side validation
      const updateData = insertProductReviewSchema.partial().parse(req.body);

      // Prevent updating fields that shouldn't be modified
      const allowedUpdateFields = {
        rating: updateData.rating,
        title: updateData.title,
        review: updateData.review,
        images: updateData.images,
      };

      // Remove undefined fields
      const cleanedUpdateData = Object.fromEntries(
        Object.entries(allowedUpdateFields).filter(([_, v]) => v !== undefined)
      );

      if (Object.keys(cleanedUpdateData).length === 0) {
        return res.status(400).json({ error: 'No valid fields provided for update' });
      }

      const updatedReview = await storage.updateReview(reviewId, cleanedUpdateData);
      if (!updatedReview) {
        return res.status(404).json({ error: 'Review not found' });
      }

      // Get user details for response
      const user = await storage.getUser(userId);
      const reviewWithUser = {
        ...updatedReview,
        user: user ? {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImageUrl: user.profileImageUrl
        } : null
      };

      res.json(reviewWithUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid review data', details: error.errors });
      }
      console.error('Error updating review:', error);
      res.status(500).json({ error: 'Failed to update review' });
    }
  });

  // Delete a review (author or admin only)
  app.delete('/api/reviews/:id', authenticateToken, async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { id: reviewId } = req.params;
      const userId = authReq.user.id;
      const userRole = authReq.user.role;

      // Get existing review to check ownership
      const existingReview = await storage.getReviewById(reviewId);
      if (!existingReview) {
        return res.status(404).json({ error: 'Review not found' });
      }

      // Check authorization: admin or review author
      const isAuthorized = userRole === 'admin' || existingReview.userId === userId;
      if (!isAuthorized) {
        return res.status(403).json({ error: 'You can only delete your own reviews' });
      }

      // Delete the review
      await storage.deleteReview(reviewId);
      res.json({ message: 'Review deleted successfully' });
    } catch (error) {
      console.error('Error deleting review:', error);
      res.status(500).json({ error: 'Failed to delete review' });
    }
  });

  // Mark review as helpful (idempotent)
  app.post('/api/reviews/:id/helpful', authenticateToken, async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { id: reviewId } = req.params;
      const userId = authReq.user.id;

      // Check if review exists
      const existingReview = await storage.getReviewById(reviewId);
      if (!existingReview) {
        return res.status(404).json({ error: 'Review not found' });
      }

      // Prevent users from voting on their own reviews
      if (existingReview.userId === userId) {
        return res.status(400).json({ error: 'You cannot vote on your own review' });
      }

      // Add the helpful vote (idempotent - no error if already exists)
      await storage.addHelpfulVote(reviewId, userId);

      // Get updated vote count
      const voteCount = await storage.getHelpfulVoteCount(reviewId);

      res.json({
        message: 'Review marked as helpful',
        helpfulVotes: voteCount
      });
    } catch (error) {
      console.error('Error marking review as helpful:', error);
      res.status(500).json({ error: 'Failed to mark review as helpful' });
    }
  });

  // Inventory Management Routes (JWT protected)
  // Get inventory history for a product or all products
  app.get('/api/inventory/history/:productId?', [authenticateToken, requireAdmin], async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { productId } = req.params;
      const history = await storage.getInventoryHistory(productId);
      res.json(history);
    } catch (error) {
      console.error('Error fetching inventory history:', error);
      res.status(500).json({ error: 'Failed to fetch inventory history' });
    }
  });

  // Get stock alerts by specific status
  app.get('/api/inventory/alerts/status/:status', [authenticateToken, requireAdmin], async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { status } = req.params;
      const alerts = await storage.getStockAlerts(status);
      res.json(alerts);
    } catch (error) {
      console.error('Error fetching stock alerts:', error);
      res.status(500).json({ error: 'Failed to fetch stock alerts' });
    }
  });

  // Resolve a stock alert
  app.post('/api/inventory/alerts/:id/resolve', [authenticateToken, requireAdmin], async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { id } = req.params;
      const resolvedAlert = await storage.resolveStockAlert(id);
      if (!resolvedAlert) {
        return res.status(404).json({ error: 'Stock alert not found' });
      }
      res.json(resolvedAlert);
    } catch (error) {
      console.error('Error resolving stock alert:', error);
      res.status(500).json({ error: 'Failed to resolve stock alert' });
    }
  });

  // Dismiss/delete a stock alert
  app.delete('/api/inventory/alerts/:id', [authenticateToken, requireAdmin], async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { id } = req.params;
      await storage.dismissStockAlert(id);
      res.json({ message: 'Stock alert dismissed' });
    } catch (error) {
      console.error('Error dismissing stock alert:', error);
      res.status(500).json({ error: 'Failed to dismiss stock alert' });
    }
  });

  // Get low stock products
  app.get('/api/inventory/low-stock', [authenticateToken, requireAdmin], async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const lowStockProducts = await storage.getLowStockProducts();
      res.json(lowStockProducts);
    } catch (error) {
      console.error('Error fetching low stock products:', error);
      res.status(500).json({ error: 'Failed to fetch low stock products' });
    }
  });

  // Get out of stock products
  app.get('/api/inventory/out-of-stock', [authenticateToken, requireAdmin], async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const outOfStockProducts = await storage.getOutOfStockProducts();
      res.json(outOfStockProducts);
    } catch (error) {
      console.error('Error fetching out of stock products:', error);
      res.status(500).json({ error: 'Failed to fetch out of stock products' });
    }
  });

  // Get reorder point products
  app.get('/api/inventory/reorder-point', [authenticateToken, requireAdmin], async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const reorderProducts = await storage.getReorderPointProducts();
      res.json(reorderProducts);
    } catch (error) {
      console.error('Error fetching reorder point products:', error);
      res.status(500).json({ error: 'Failed to fetch reorder point products' });
    }
  });

  // Update product inventory settings
  app.put('/api/inventory/products/:id', [authenticateToken, requireAdmin], async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { id } = req.params;
      const validatedData = updateProductInventorySchema.parse(req.body);

      const updatedProduct = await storage.updateProductInventory(id, validatedData);
      if (!updatedProduct) {
        return res.status(404).json({ error: 'Product not found' });
      }

      res.json(updatedProduct);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid inventory data', details: error.errors });
      }
      console.error('Error updating product inventory:', error);
      res.status(500).json({ error: 'Failed to update product inventory' });
    }
  });

  // Adjust stock with audit trail
  app.post('/api/inventory/adjust-stock', [authenticateToken, requireAdmin], async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const validatedData = adjustStockSchema.parse(req.body);
      const { productId, adjustment, reason, reference } = validatedData;

      await storage.adjustStock(productId, adjustment, reason, authReq.user.id, reference);

      // Get updated product to return current stock
      const updatedProduct = await storage.getProduct(productId);
      res.json({
        message: 'Stock adjusted successfully',
        product: updatedProduct,
        adjustment: adjustment
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid stock adjustment data', details: error.errors });
      }
      console.error('Error adjusting stock:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to adjust stock';
      res.status(500).json({ error: errorMessage });
    }
  });

  // Bulk update stock
  app.post('/api/inventory/bulk-update', [authenticateToken, requireAdmin], async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const validatedData = bulkUpdateStockSchema.parse(req.body);
      const { updates } = validatedData;

      // Add userId to all updates
      const updatesWithUserId = updates.map(update => ({
        ...update,
        userId: authReq.user.id
      }));

      await storage.bulkUpdateStock(updatesWithUserId);

      res.json({
        message: `Successfully updated stock for ${updates.length} products`,
        updatesCount: updates.length
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid bulk update data', details: error.errors });
      }
      console.error('Error bulk updating stock:', error);
      res.status(500).json({ error: 'Failed to bulk update stock' });
    }
  });

  // Get inventory report
  app.get('/api/inventory/report', [authenticateToken, requireAdmin], async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const report = await storage.getInventoryReport();
      res.json(report);
    } catch (error) {
      console.error('Error generating inventory report:', error);
      res.status(500).json({ error: 'Failed to generate inventory report' });
    }
  });

  // =============================================================================
  // ADMIN METRICS API ENDPOINTS - Business Analytics & Reporting
  // =============================================================================

  // GET /api/admin/metrics/overview - Overall business KPIs and summary metrics
  app.get('/api/admin/metrics/overview', [authenticateToken, requireAdmin], async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      console.log(`📊 Admin metrics overview requested by: ${authReq.user.email}`);

      // Validate query parameters
      const queryValidation = metricsDateRangeSchema.safeParse(req.query);
      if (!queryValidation.success) {
        return res.status(400).json({
          error: 'INVALID_QUERY_PARAMETERS',
          message: 'Invalid query parameters',
          details: queryValidation.error.errors
        });
      }

      const query = queryValidation.data;
      const metrics = await storage.getAdminOverviewMetrics(query);

      console.log(`✅ Admin overview metrics generated successfully for period: ${query.period}`);
      res.json(metrics);
    } catch (error) {
      console.error('❌ Error generating admin overview metrics:', error);
      res.status(500).json({
        error: 'METRICS_GENERATION_ERROR',
        message: 'Failed to generate admin overview metrics'
      });
    }
  });

  // GET /api/admin/metrics/revenue - Revenue analytics with time series data
  app.get('/api/admin/metrics/revenue', [authenticateToken, requireAdmin], async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      console.log(`💰 Revenue analytics requested by: ${authReq.user.email}`);

      // Validate query parameters
      const queryValidation = revenueQuerySchema.safeParse(req.query);
      if (!queryValidation.success) {
        return res.status(400).json({
          error: 'INVALID_QUERY_PARAMETERS',
          message: 'Invalid revenue query parameters',
          details: queryValidation.error.errors
        });
      }

      const query = queryValidation.data;
      const analytics = await storage.getRevenueAnalytics(query);

      console.log(`✅ Revenue analytics generated successfully - ${query.granularity} granularity for ${query.period}`);
      res.json(analytics);
    } catch (error) {
      console.error('❌ Error generating revenue analytics:', error);
      res.status(500).json({
        error: 'REVENUE_ANALYTICS_ERROR',
        message: 'Failed to generate revenue analytics'
      });
    }
  });

  // GET /api/admin/metrics/orders - Order analytics and trends
  app.get('/api/admin/metrics/orders', [authenticateToken, requireAdmin], async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      console.log(`📦 Order analytics requested by: ${authReq.user.email}`);

      // Validate query parameters
      const queryValidation = orderAnalyticsQuerySchema.safeParse(req.query);
      if (!queryValidation.success) {
        return res.status(400).json({
          error: 'INVALID_QUERY_PARAMETERS',
          message: 'Invalid order analytics query parameters',
          details: queryValidation.error.errors
        });
      }

      const query = queryValidation.data;
      const analytics = await storage.getOrderAnalytics(query);

      console.log(`✅ Order analytics generated successfully for period: ${query.period}`);
      res.json(analytics);
    } catch (error) {
      console.error('❌ Error generating order analytics:', error);
      res.status(500).json({
        error: 'ORDER_ANALYTICS_ERROR',
        message: 'Failed to generate order analytics'
      });
    }
  });

  // GET /api/admin/metrics/customers - Customer metrics and insights
  app.get('/api/admin/metrics/customers', [authenticateToken, requireAdmin], async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      console.log(`👥 Customer analytics requested by: ${authReq.user.email}`);

      // Validate query parameters
      const queryValidation = customerAnalyticsQuerySchema.safeParse(req.query);
      if (!queryValidation.success) {
        return res.status(400).json({
          error: 'INVALID_QUERY_PARAMETERS',
          message: 'Invalid customer analytics query parameters',
          details: queryValidation.error.errors
        });
      }

      const query = queryValidation.data;
      const analytics = await storage.getCustomerAnalytics(query);

      console.log(`✅ Customer analytics generated successfully - segment: ${query.segment}, geographic: ${query.includeGeographic}`);
      res.json(analytics);
    } catch (error) {
      console.error('❌ Error generating customer analytics:', error);
      res.status(500).json({
        error: 'CUSTOMER_ANALYTICS_ERROR',
        message: 'Failed to generate customer analytics'
      });
    }
  });

  // GET /api/admin/metrics/products/top - Top performing products by various metrics
  app.get('/api/admin/metrics/products/top', [authenticateToken, requireAdmin], async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      console.log(`🏆 Top products analytics requested by: ${authReq.user.email}`);

      // Validate query parameters
      const queryValidation = topProductsQuerySchema.safeParse(req.query);
      if (!queryValidation.success) {
        return res.status(400).json({
          error: 'INVALID_QUERY_PARAMETERS',
          message: 'Invalid top products query parameters',
          details: queryValidation.error.errors
        });
      }

      const query = queryValidation.data;
      const analytics = await storage.getTopProducts(query);

      console.log(`✅ Top products analytics generated successfully - metric: ${query.metric}, limit: ${query.limit}`);
      res.json(analytics);
    } catch (error) {
      console.error('❌ Error generating top products analytics:', error);
      res.status(500).json({
        error: 'TOP_PRODUCTS_ERROR',
        message: 'Failed to generate top products analytics'
      });
    }
  });

  // GET /api/admin/metrics/inventory/low - Low stock alerts and inventory warnings
  app.get('/api/admin/metrics/inventory/low', [authenticateToken, requireAdmin], async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      console.log(`⚠️ Low stock inventory metrics requested by: ${authReq.user.email}`);

      // Validate query parameters
      const queryValidation = lowStockQuerySchema.safeParse(req.query);
      if (!queryValidation.success) {
        return res.status(400).json({
          error: 'INVALID_QUERY_PARAMETERS',
          message: 'Invalid low stock query parameters',
          details: queryValidation.error.errors
        });
      }

      const query = queryValidation.data;
      const inventory = await storage.getLowStockInventory(query);

      console.log(`✅ Low stock inventory metrics generated successfully - urgency: ${query.urgency}, includeOutOfStock: ${query.includeOutOfStock}`);
      res.json(inventory);
    } catch (error) {
      console.error('❌ Error generating low stock inventory metrics:', error);
      res.status(500).json({
        error: 'LOW_STOCK_INVENTORY_ERROR',
        message: 'Failed to generate low stock inventory metrics'
      });
    }
  });

  // Task 15e - Specific Top Products & Categories Analytics Endpoints

  // GET /api/admin/metrics/top-products-revenue - Top products by revenue with detailed sorting
  app.get('/api/admin/metrics/top-products-revenue', [authenticateToken, requireAdmin], async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      console.log(`🏆💰 Top products by revenue requested by: ${authReq.user.email}`);

      // Validate query parameters
      const queryValidation = topProductsByRevenueQuerySchema.safeParse(req.query);
      if (!queryValidation.success) {
        return res.status(400).json({
          error: 'INVALID_QUERY_PARAMETERS',
          message: 'Invalid top products by revenue query parameters',
          details: queryValidation.error.errors
        });
      }

      const query = queryValidation.data;
      const analytics = await storage.getTopProductsByRevenue(query);

      console.log(`✅ Top products by revenue generated successfully - ${analytics.products.length} products, sortBy: ${query.sortBy}, period: ${query.period}`);
      res.json(analytics);
    } catch (error) {
      console.error('❌ Error generating top products by revenue:', error);
      res.status(500).json({
        error: 'TOP_PRODUCTS_REVENUE_ERROR',
        message: 'Failed to generate top products by revenue analytics'
      });
    }
  });

  // GET /api/admin/metrics/top-products-units - Top products by units sold with detailed sorting
  app.get('/api/admin/metrics/top-products-units', [authenticateToken, requireAdmin], async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      console.log(`🏆📦 Top products by units sold requested by: ${authReq.user.email}`);

      // Validate query parameters
      const queryValidation = topProductsByUnitsQuerySchema.safeParse(req.query);
      if (!queryValidation.success) {
        return res.status(400).json({
          error: 'INVALID_QUERY_PARAMETERS',
          message: 'Invalid top products by units query parameters',
          details: queryValidation.error.errors
        });
      }

      const query = queryValidation.data;
      const analytics = await storage.getTopProductsByUnits(query);

      console.log(`✅ Top products by units sold generated successfully - ${analytics.products.length} products, sortBy: ${query.sortBy}, period: ${query.period}`);
      res.json(analytics);
    } catch (error) {
      console.error('❌ Error generating top products by units:', error);
      res.status(500).json({
        error: 'TOP_PRODUCTS_UNITS_ERROR',
        message: 'Failed to generate top products by units analytics'
      });
    }
  });

  // GET /api/admin/metrics/top-categories - Top performing categories with market share analysis
  app.get('/api/admin/metrics/top-categories', [authenticateToken, requireAdmin], async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      console.log(`🏆📊 Top categories performance requested by: ${authReq.user.email}`);

      // Validate query parameters
      const queryValidation = topCategoriesQuerySchema.safeParse(req.query);
      if (!queryValidation.success) {
        return res.status(400).json({
          error: 'INVALID_QUERY_PARAMETERS',
          message: 'Invalid top categories query parameters',
          details: queryValidation.error.errors
        });
      }

      const query = queryValidation.data;
      const analytics = await storage.getTopCategories(query);

      console.log(`✅ Top categories analytics generated successfully - ${analytics.categories.length} categories, sortBy: ${query.sortBy}, period: ${query.period}`);
      res.json(analytics);
    } catch (error) {
      console.error('❌ Error generating top categories analytics:', error);
      res.status(500).json({
        error: 'TOP_CATEGORIES_ERROR',
        message: 'Failed to generate top categories analytics'
      });
    }
  });

  // ================================
  // COMPREHENSIVE ADMIN EXPORT FUNCTIONALITY
  // ================================

  // POST /api/admin/exports/orders - Comprehensive orders export with streaming CSV
  app.post('/api/admin/exports/orders', [authenticateToken, requireAdmin], async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      console.log(`📊 Orders export requested by: ${authReq.user.email}`);

      // Validate export parameters
      const validatedData = ordersExportSchema.parse(req.body);

      // Generate export data with comprehensive details
      const exportData = await storage.exportOrdersComprehensive(validatedData);

      if (exportData.length === 0) {
        return res.status(404).json({
          error: 'NO_DATA_FOUND',
          message: 'No orders found for the specified criteria'
        });
      }

      // Generate filename with timestamp and filters
      const timestamp = new Date().toISOString().split('T')[0];
      const statusFilter = validatedData.status?.join('-') || 'all';
      const filename = validatedData.fileName || `orders-export-${statusFilter}-${timestamp}.csv`;

      // Set CSV headers
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Cache-Control', 'no-cache');

      // Generate CSV with proper escaping and UTF-8 BOM for Excel compatibility
      const csvContent = await storage.generateOrdersCSV(exportData, validatedData);

      console.log(`✅ Orders export generated successfully - ${exportData.length} orders`);
      res.send('\ufeff' + csvContent); // UTF-8 BOM
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'INVALID_EXPORT_PARAMETERS',
          message: 'Invalid orders export parameters',
          details: error.errors
        });
      }
      console.error('❌ Error exporting orders:', error);
      res.status(500).json({
        error: 'ORDERS_EXPORT_ERROR',
        message: 'Failed to export orders data'
      });
    }
  });

  // POST /api/admin/exports/revenue - Revenue analytics export with customizable breakdowns
  app.post('/api/admin/exports/revenue', [authenticateToken, requireAdmin], async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      console.log(`📊 Revenue export requested by: ${authReq.user.email}`);

      // Validate export parameters
      const validatedData = revenueExportSchema.parse(req.body);

      // Generate revenue analytics data
      const exportData = await storage.exportRevenueAnalytics(validatedData);

      if (exportData.length === 0) {
        return res.status(404).json({
          error: 'NO_DATA_FOUND',
          message: 'No revenue data found for the specified period'
        });
      }

      // Generate filename with timestamp and period
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = validatedData.fileName || `revenue-export-${validatedData.period}-${timestamp}.csv`;

      // Set CSV headers
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Cache-Control', 'no-cache');

      // Generate CSV with revenue analytics data
      const csvContent = await storage.generateRevenueCSV(exportData, validatedData);

      console.log(`✅ Revenue export generated successfully - ${exportData.length} records`);
      res.send('\ufeff' + csvContent); // UTF-8 BOM
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'INVALID_EXPORT_PARAMETERS',
          message: 'Invalid revenue export parameters',
          details: error.errors
        });
      }
      console.error('❌ Error exporting revenue:', error);
      res.status(500).json({
        error: 'REVENUE_EXPORT_ERROR',
        message: 'Failed to export revenue data'
      });
    }
  });

  // POST /api/admin/exports/customers - Enhanced customer data export with LTV and analytics
  app.post('/api/admin/exports/customers', [authenticateToken, requireAdmin], async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      console.log(`📊 Customers export requested by: ${authReq.user.email}`);

      // Validate export parameters
      const validatedData = customerExportSchema.parse(req.body);

      // Generate comprehensive customer data
      const exportData = await storage.exportCustomersComprehensive(validatedData);

      if (exportData.length === 0) {
        return res.status(404).json({
          error: 'NO_DATA_FOUND',
          message: 'No customers found for the specified criteria'
        });
      }

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = validatedData.fileName || `customers-export-${timestamp}.csv`;

      // Set CSV headers
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Cache-Control', 'no-cache');

      // Generate CSV with customer analytics data
      const csvContent = await storage.generateCustomersCSV(exportData, validatedData);

      console.log(`✅ Customers export generated successfully - ${exportData.length} customers`);
      res.send('\ufeff' + csvContent); // UTF-8 BOM
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'INVALID_EXPORT_PARAMETERS',
          message: 'Invalid customers export parameters',
          details: error.errors
        });
      }
      console.error('❌ Error exporting customers:', error);
      res.status(500).json({
        error: 'CUSTOMERS_EXPORT_ERROR',
        message: 'Failed to export customers data'
      });
    }
  });

  // POST /api/admin/exports/inventory - Enhanced inventory export with performance metrics
  app.post('/api/admin/exports/inventory', [authenticateToken, requireAdmin], async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      console.log(`📊 Inventory export requested by: ${authReq.user.email}`);

      // Validate export parameters
      const validatedData = inventoryExportSchema.parse(req.body);

      // Generate comprehensive inventory data
      const exportData = await storage.exportInventoryComprehensive(validatedData);

      if (exportData.length === 0) {
        return res.status(404).json({
          error: 'NO_DATA_FOUND',
          message: 'No inventory data found for the specified criteria'
        });
      }

      // Generate filename with timestamp and stock level filter
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = validatedData.fileName || `inventory-export-${validatedData.stockLevel}-${timestamp}.csv`;

      // Set CSV headers
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Cache-Control', 'no-cache');

      // Generate CSV with inventory and performance data
      const csvContent = await storage.generateInventoryCSV(exportData, validatedData);

      console.log(`✅ Inventory export generated successfully - ${exportData.length} products`);
      res.send('\ufeff' + csvContent); // UTF-8 BOM
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'INVALID_EXPORT_PARAMETERS',
          message: 'Invalid inventory export parameters',
          details: error.errors
        });
      }
      console.error('❌ Error exporting inventory:', error);
      res.status(500).json({
        error: 'INVENTORY_EXPORT_ERROR',
        message: 'Failed to export inventory data'
      });
    }
  });

  // POST /api/admin/exports/analytics - Comprehensive business analytics export
  app.post('/api/admin/exports/analytics', [authenticateToken, requireAdmin], async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      console.log(`📊 Analytics export requested by: ${authReq.user.email}`);

      // Validate export parameters
      const validatedData = analyticsExportSchema.parse(req.body);

      // Generate comprehensive analytics data
      const exportData = await storage.exportBusinessAnalytics(validatedData);

      if (exportData.length === 0) {
        return res.status(404).json({
          error: 'NO_DATA_FOUND',
          message: 'No analytics data found for the specified period and metrics'
        });
      }

      // Generate filename with timestamp and analytics type
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = validatedData.fileName || `analytics-export-${validatedData.analyticsType}-${timestamp}.csv`;

      // Set CSV headers
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Cache-Control', 'no-cache');

      // Generate CSV with business analytics data
      const csvContent = await storage.generateAnalyticsCSV(exportData, validatedData);

      console.log(`✅ Analytics export generated successfully - ${exportData.length} records`);
      res.send('\ufeff' + csvContent); // UTF-8 BOM
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'INVALID_EXPORT_PARAMETERS',
          message: 'Invalid analytics export parameters',
          details: error.errors
        });
      }
      console.error('❌ Error exporting analytics:', error);
      res.status(500).json({
        error: 'ANALYTICS_EXPORT_ERROR',
        message: 'Failed to export analytics data'
      });
    }
  });

  // GET /api/admin/exports/history - Export job history and status tracking
  app.get('/api/admin/exports/history', [authenticateToken, requireAdmin], async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      console.log(`📋 Export history requested by: ${authReq.user.email}`);

      // Parse pagination parameters
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const type = req.query.type as string;

      // Get export history for this admin user
      const exportHistory = await storage.getExportHistory({
        adminUserId: authReq.user.id,
        type,
        page,
        limit
      });

      console.log(`✅ Export history retrieved - ${exportHistory.exports.length} exports`);
      res.json(exportHistory);
    } catch (error) {
      console.error('❌ Error fetching export history:', error);
      res.status(500).json({
        error: 'EXPORT_HISTORY_ERROR',
        message: 'Failed to fetch export history'
      });
    }
  });

  // GET /api/admin/exports/status/:exportId - Get specific export job status
  app.get('/api/admin/exports/status/:exportId', [authenticateToken, requireAdmin], async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { exportId } = req.params;

      console.log(`📋 Export status requested by: ${authReq.user.email} for export: ${exportId}`);

      // Get export job status
      const exportStatus = await storage.getExportJobStatus(exportId, authReq.user.id);

      if (!exportStatus) {
        return res.status(404).json({
          error: 'EXPORT_NOT_FOUND',
          message: 'Export job not found or access denied'
        });
      }

      console.log(`✅ Export status retrieved - Status: ${exportStatus.status}`);
      res.json(exportStatus);
    } catch (error) {
      console.error('❌ Error fetching export status:', error);
      res.status(500).json({
        error: 'EXPORT_STATUS_ERROR',
        message: 'Failed to fetch export status'
      });
    }
  });

  // DELETE /api/admin/exports/:exportId - Cancel or delete export job
  app.delete('/api/admin/exports/:exportId', [authenticateToken, requireAdmin], async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { exportId } = req.params;

      console.log(`🗑️ Export deletion requested by: ${authReq.user.email} for export: ${exportId}`);

      // Cancel or delete export job
      const success = await storage.cancelExportJob(exportId, authReq.user.id);

      if (!success) {
        return res.status(404).json({
          error: 'EXPORT_NOT_FOUND',
          message: 'Export job not found or cannot be cancelled'
        });
      }

      console.log(`✅ Export job cancelled/deleted successfully: ${exportId}`);
      res.json({
        message: 'Export job cancelled successfully',
        exportId
      });
    } catch (error) {
      console.error('❌ Error cancelling export:', error);
      res.status(500).json({
        error: 'EXPORT_CANCEL_ERROR',
        message: 'Failed to cancel export job'
      });
    }
  });

  // POST /api/admin/exports/test - Test export functionality with small dataset
  app.post('/api/admin/exports/test', [authenticateToken, requireAdmin], async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { type, sampleSize = 10 } = req.body;

      console.log(`🧪 Test export requested by: ${authReq.user.email} for type: ${type}`);

      if (!['orders', 'revenue', 'customers', 'inventory', 'analytics'].includes(type)) {
        return res.status(400).json({
          error: 'INVALID_EXPORT_TYPE',
          message: 'Invalid export type for testing'
        });
      }

      // Generate test export data
      const testData = await storage.generateTestExportData(type, sampleSize);

      // Generate test CSV
      const csvContent = await storage.generateTestCSV(testData, type);

      // Set CSV headers for test
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="test-${type}-export.csv"`);

      console.log(`✅ Test export generated successfully - ${testData.length} sample records`);
      res.send('\ufeff' + csvContent); // UTF-8 BOM
    } catch (error) {
      console.error('❌ Error generating test export:', error);
      res.status(500).json({
        error: 'TEST_EXPORT_ERROR',
        message: 'Failed to generate test export'
      });
    }
  });

  // ==================================
  // ADMIN COMMUNICATIONS ROUTES - Task 17
  // ==================================

  // GET /api/admin/whatsapp/analytics - WhatsApp analytics dashboard data
  app.get('/api/admin/whatsapp/analytics', [authenticateToken, requireAdmin], async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { from, to } = req.query;

      console.log(`📊 WhatsApp analytics requested by admin: ${authReq.user.email}`);

      const dateRange = from && to ? {
        from: new Date(from as string),
        to: new Date(to as string)
      } : undefined;

      const analytics = await storage.getWhatsappAnalytics(dateRange);

      console.log(`✅ WhatsApp analytics retrieved - ${analytics.totalMessages.current} total messages`);
      res.json(analytics);
    } catch (error) {
      console.error('❌ Error fetching WhatsApp analytics:', error);
      res.status(500).json({
        error: 'WHATSAPP_ANALYTICS_ERROR',
        message: 'Failed to fetch WhatsApp analytics'
      });
    }
  });

  // GET /api/admin/whatsapp/analytics/export - Export WhatsApp analytics as CSV
  app.get('/api/admin/whatsapp/analytics/export', [authenticateToken, requireAdmin], async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { from, to } = req.query;

      console.log(`📊 WhatsApp analytics export requested by admin: ${authReq.user.email}`);

      const dateRange = from && to ? {
        from: new Date(from as string),
        to: new Date(to as string)
      } : undefined;

      const exportData = await storage.exportWhatsappAnalytics({ dateRange });
      const csvContent = await storage.generateCSV(exportData);

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="whatsapp-analytics-export.csv"');

      console.log(`✅ WhatsApp analytics export generated - ${exportData.length} records`);
      res.send('\ufeff' + csvContent);
    } catch (error) {
      console.error('❌ Error exporting WhatsApp analytics:', error);
      res.status(500).json({
        error: 'WHATSAPP_EXPORT_ERROR',
        message: 'Failed to export WhatsApp analytics'
      });
    }
  });

  // GET /api/admin/whatsapp/engagement - WhatsApp engagement statistics
  app.get('/api/admin/whatsapp/engagement', [authenticateToken, requireAdmin], async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { from, to } = req.query;

      console.log(`📊 WhatsApp engagement stats requested by admin: ${authReq.user.email}`);

      const dateRange = from && to ? {
        from: new Date(from as string),
        to: new Date(to as string)
      } : undefined;

      const engagementStats = await storage.getWhatsappEngagementStats(dateRange);

      console.log(`✅ WhatsApp engagement stats retrieved`);
      res.json(engagementStats);
    } catch (error) {
      console.error('❌ Error fetching WhatsApp engagement stats:', error);
      res.status(500).json({
        error: 'WHATSAPP_ENGAGEMENT_ERROR',
        message: 'Failed to fetch WhatsApp engagement statistics'
      });
    }
  });

  // GET /api/admin/whatsapp/messages - WhatsApp message breakdown by type
  app.get('/api/admin/whatsapp/messages', [authenticateToken, requireAdmin], async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { from, to } = req.query;

      console.log(`📊 WhatsApp message breakdown requested by admin: ${authReq.user.email}`);

      const dateRange = from && to ? {
        from: new Date(from as string),
        to: new Date(to as string)
      } : undefined;

      const messageBreakdown = await storage.getWhatsappMessageBreakdown(dateRange);

      console.log(`✅ WhatsApp message breakdown retrieved`);
      res.json(messageBreakdown);
    } catch (error) {
      console.error('❌ Error fetching WhatsApp message breakdown:', error);
      res.status(500).json({
        error: 'WHATSAPP_MESSAGES_ERROR',
        message: 'Failed to fetch WhatsApp message breakdown'
      });
    }
  });

  // GET /api/admin/whatsapp/costs - WhatsApp cost analysis
  app.get('/api/admin/whatsapp/costs', [authenticateToken, requireAdmin], async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { from, to } = req.query;

      console.log(`📊 WhatsApp cost analysis requested by admin: ${authReq.user.email}`);

      const dateRange = from && to ? {
        from: new Date(from as string),
        to: new Date(to as string)
      } : undefined;

      const costAnalysis = await storage.getWhatsappCostAnalysis(dateRange);

      console.log(`✅ WhatsApp cost analysis retrieved`);
      res.json(costAnalysis);
    } catch (error) {
      console.error('❌ Error fetching WhatsApp cost analysis:', error);
      res.status(500).json({
        error: 'WHATSAPP_COSTS_ERROR',
        message: 'Failed to fetch WhatsApp cost analysis'
      });
    }
  });

  // GET /api/admin/notifications/templates - List message templates
  app.get('/api/admin/notifications/templates', [authenticateToken, requireAdmin], async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;

      console.log(`📋 Message templates list requested by admin: ${authReq.user.email}`);

      const templates = await storage.getMessageTemplates();

      console.log(`✅ Message templates retrieved - ${templates.length} templates`);
      res.json(templates);
    } catch (error) {
      console.error('❌ Error fetching message templates:', error);
      res.status(500).json({
        error: 'TEMPLATES_FETCH_ERROR',
        message: 'Failed to fetch message templates'
      });
    }
  });

  // POST /api/admin/notifications/templates - Create new message template
  app.post('/api/admin/notifications/templates', [authenticateToken, requireAdmin], async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const templateData = insertMessageTemplateSchema.parse(req.body);

      console.log(`📋 Creating message template: ${templateData.name} by admin: ${authReq.user.email}`);

      const newTemplate = await storage.createMessageTemplate({
        ...templateData,
        createdBy: authReq.user.id,
      });

      console.log(`✅ Message template created with ID: ${newTemplate.id}`);
      res.status(201).json(newTemplate);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'Invalid template data',
          details: error.errors
        });
      }
      console.error('❌ Error creating message template:', error);
      res.status(500).json({
        error: 'TEMPLATE_CREATE_ERROR',
        message: 'Failed to create message template'
      });
    }
  });

  // PUT /api/admin/notifications/templates/:id - Update message template
  app.put('/api/admin/notifications/templates/:id', [authenticateToken, requireAdmin], async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { id } = req.params;
      const updates = req.body;

      console.log(`📋 Updating message template: ${id} by admin: ${authReq.user.email}`);

      const updatedTemplate = await storage.updateMessageTemplate(id, updates);

      if (!updatedTemplate) {
        return res.status(404).json({
          error: 'TEMPLATE_NOT_FOUND',
          message: 'Message template not found'
        });
      }

      console.log(`✅ Message template updated: ${updatedTemplate.id}`);
      res.json(updatedTemplate);
    } catch (error) {
      console.error('❌ Error updating message template:', error);
      res.status(500).json({
        error: 'TEMPLATE_UPDATE_ERROR',
        message: 'Failed to update message template'
      });
    }
  });

  // DELETE /api/admin/notifications/templates/:id - Delete message template
  app.delete('/api/admin/notifications/templates/:id', [authenticateToken, requireAdmin], async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { id } = req.params;

      console.log(`🗑️ Deleting message template: ${id} by admin: ${authReq.user.email}`);

      await storage.deleteMessageTemplate(id);

      console.log(`✅ Message template deleted: ${id}`);
      res.status(204).send();
    } catch (error) {
      console.error('❌ Error deleting message template:', error);
      res.status(500).json({
        error: 'TEMPLATE_DELETE_ERROR',
        message: 'Failed to delete message template'
      });
    }
  });

  // POST /api/admin/notifications/templates/:id/approve - Approve message template
  app.post('/api/admin/notifications/templates/:id/approve', [authenticateToken, requireAdmin], async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { id } = req.params;

      console.log(`✅ Approving message template: ${id} by admin: ${authReq.user.email}`);

      const approvedTemplate = await storage.approveMessageTemplate(id, authReq.user.id);

      if (!approvedTemplate) {
        return res.status(404).json({
          error: 'TEMPLATE_NOT_FOUND',
          message: 'Message template not found'
        });
      }

      console.log(`✅ Message template approved: ${approvedTemplate.id}`);
      res.json(approvedTemplate);
    } catch (error) {
      console.error('❌ Error approving message template:', error);
      res.status(500).json({
        error: 'TEMPLATE_APPROVE_ERROR',
        message: 'Failed to approve message template'
      });
    }
  });

  // POST /api/admin/notifications/templates/:id/reject - Reject message template
  app.post('/api/admin/notifications/templates/:id/reject', [authenticateToken, requireAdmin], async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { id } = req.params;
      const { reason } = req.body;

      if (!reason) {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'Rejection reason is required'
        });
      }

      console.log(`❌ Rejecting message template: ${id} by admin: ${authReq.user.email}`);

      const rejectedTemplate = await storage.rejectMessageTemplate(id, authReq.user.id, reason);

      if (!rejectedTemplate) {
        return res.status(404).json({
          error: 'TEMPLATE_NOT_FOUND',
          message: 'Message template not found'
        });
      }

      console.log(`❌ Message template rejected: ${rejectedTemplate.id}`);
      res.json(rejectedTemplate);
    } catch (error) {
      console.error('❌ Error rejecting message template:', error);
      res.status(500).json({
        error: 'TEMPLATE_REJECT_ERROR',
        message: 'Failed to reject message template'
      });
    }
  });

  // GET /api/admin/notifications/metrics - Notification metrics across all channels
  app.get('/api/admin/notifications/metrics', [authenticateToken, requireAdmin], async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { from, to } = req.query;

      console.log(`📊 Notification metrics requested by admin: ${authReq.user.email}`);

      const dateRange = from && to ? {
        from: new Date(from as string),
        to: new Date(to as string)
      } : undefined;

      const metrics = await storage.getNotificationMetrics(dateRange);

      console.log(`✅ Notification metrics retrieved`);
      res.json(metrics);
    } catch (error) {
      console.error('❌ Error fetching notification metrics:', error);
      res.status(500).json({
        error: 'NOTIFICATION_METRICS_ERROR',
        message: 'Failed to fetch notification metrics'
      });
    }
  });

  // GET /api/admin/notifications/history - Notification history with filtering
  app.get('/api/admin/notifications/history', [authenticateToken, requireAdmin], async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const params = req.query;

      console.log(`📋 Notification history requested by admin: ${authReq.user.email}`);

      const history = await storage.getNotificationHistory(params);

      console.log(`✅ Notification history retrieved - ${history.length} records`);
      res.json(history);
    } catch (error) {
      console.error('❌ Error fetching notification history:', error);
      res.status(500).json({
        error: 'NOTIFICATION_HISTORY_ERROR',
        message: 'Failed to fetch notification history'
      });
    }
  });

  // POST /api/admin/notifications/bulk - Send bulk notifications
  app.post('/api/admin/notifications/bulk', [authenticateToken, requireAdmin], async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const bulkRequest = bulkNotificationRequestSchema.parse(req.body);

      console.log(`📢 Bulk notification requested by admin: ${authReq.user.email} to ${bulkRequest.channels.join(', ')}`);

      const result = await storage.sendBulkNotifications(bulkRequest);

      console.log(`✅ Bulk notification queued - ID: ${result.id}, Recipients: ${result.recipientCount}`);
      res.status(202).json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'Invalid bulk notification request',
          details: error.errors
        });
      }
      console.error('❌ Error sending bulk notifications:', error);
      res.status(500).json({
        error: 'BULK_NOTIFICATION_ERROR',
        message: 'Failed to send bulk notifications'
      });
    }
  });

  // GET /api/admin/notifications/export - Export notifications data as CSV
  app.get('/api/admin/notifications/export', [authenticateToken, requireAdmin], async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const filters = req.query;

      console.log(`📊 Notifications export requested by admin: ${authReq.user.email}`);

      const exportData = await storage.exportNotificationsData(filters);
      const csvContent = await storage.generateCSV(exportData);

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="notifications-export.csv"');

      console.log(`✅ Notifications export generated - ${exportData.length} records`);
      res.send('\ufeff' + csvContent);
    } catch (error) {
      console.error('❌ Error exporting notifications:', error);
      res.status(500).json({
        error: 'NOTIFICATIONS_EXPORT_ERROR',
        message: 'Failed to export notifications data'
      });
    }
  });

  // Razorpay Payment Integration Routes

  // Initialize Razorpay instance
  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || '',
    key_secret: process.env.RAZORPAY_KEY_SECRET || ''
  });

  // Get Razorpay public key for frontend
  app.get('/api/payments/razorpay-key', (req, res) => {
    const key = process.env.RAZORPAY_KEY_ID;
    if (!key) {
      return res.status(503).json({ error: 'Payment service unavailable' });
    }
    res.json({ key });
  });

  // Create Razorpay order
  app.post('/api/payments/create-razorpay-order', authenticateToken, async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { orderId } = req.body;

      // Validate required environment variables
      if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        return res.status(503).json({ error: 'Payment service unavailable' });
      }

      if (!orderId) {
        return res.status(400).json({ error: 'Order ID is required' });
      }

      // Verify the order belongs to the user and get canonical amount
      const order = await storage.getOrder(orderId);
      if (!order || order.userId !== authReq.user.id) {
        return res.status(404).json({ error: 'Order not found' });
      }

      // Check if payment is already completed
      if (order.paymentStatus === 'completed') {
        return res.status(409).json({ error: 'Order payment already completed' });
      }

      // Check if Razorpay order already exists for this order
      if (order.razorpayOrderId) {
        // Return existing Razorpay order details
        return res.json({
          id: order.razorpayOrderId,
          amount: Math.round(parseFloat(order.total) * 100),
          currency: 'INR',
          orderId: orderId
        });
      }

      // Convert decimal total to paise (smallest currency unit) safely
      const amountInPaise = Math.round(parseFloat(order.total) * 100);

      // Create Razorpay order with server-computed amount
      // Receipt must be max 40 chars, so use last 8 chars of orderId
      const shortOrderId = orderId.slice(-8);
      const razorpayOrder = await razorpay.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: `ord_${shortOrderId}`,
        notes: {
          order_id: orderId,
          customer_email: order.customerEmail,
          customer_name: order.customerName
        }
      });

      // Update order with Razorpay order ID
      await storage.updateOrderRazorpayDetails(orderId, {
        razorpayOrderId: razorpayOrder.id,
        paymentMethod: 'razorpay'
      });

      res.json({
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        orderId: orderId
      });
    } catch (error) {
      console.error('Error creating Razorpay order:', error);
      res.status(500).json({ error: 'Failed to create payment order' });
    }
  });

  // Create Razorpay order for GUEST checkout (no authentication required)
  app.post('/api/guest/payments/create-razorpay-order', async (req, res) => {
    try {
      const { orderId } = req.body;

      // Validate required environment variables
      if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        return res.status(503).json({ error: 'Payment service unavailable' });
      }

      if (!orderId) {
        return res.status(400).json({ error: 'Order ID is required' });
      }

      // Get the order (guest checkout, so no authentication needed)
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      // Note: order.userId may be set if account was auto-created during guest checkout
      // This is fine - we still allow payment for these orders

      // Check if payment is already completed
      if (order.paymentStatus === 'completed') {
        return res.status(409).json({ error: 'Order payment already completed' });
      }

      // Check if Razorpay order already exists for this order
      if (order.razorpayOrderId) {
        // Return existing Razorpay order details
        return res.json({
          id: order.razorpayOrderId,
          amount: Math.round(parseFloat(order.total) * 100),
          currency: 'INR',
          orderId: orderId
        });
      }

      // Convert decimal total to paise (smallest currency unit) safely
      const amountInPaise = Math.round(parseFloat(order.total) * 100);

      // Create Razorpay order with server-computed amount
      // Receipt must be max 40 chars, so use last 8 chars of orderId
      const shortOrderId = orderId.slice(-8);
      const razorpayOrder = await razorpay.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: `guest_${shortOrderId}`,
        notes: {
          order_id: orderId,
          customer_email: order.customerEmail,
          customer_name: order.customerName,
          order_type: 'guest'
        }
      });

      // Update order with Razorpay order ID
      await storage.updateOrderRazorpayDetails(orderId, {
        razorpayOrderId: razorpayOrder.id,
        paymentMethod: 'razorpay'
      });

      res.json({
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        orderId: orderId
      });
    } catch (error) {
      console.error('Error creating guest Razorpay order:', error);
      res.status(500).json({ error: 'Failed to create payment order' });
    }
  });

  // Verify Razorpay payment for GUEST orders (no authentication required)
  app.post('/api/guest/payments/verify-razorpay-payment', async (req, res) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

      if (!process.env.RAZORPAY_KEY_SECRET) {
        return res.status(503).json({ error: 'Payment service unavailable' });
      }

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {
        return res.status(400).json({ error: 'Missing payment verification data' });
      }

      // Get the order (guest checkout, so no authentication needed)
      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      // Note: order.userId may be set if account was auto-created during guest checkout
      // This is fine - we still allow payment verification for these orders

      // Check if payment is already completed (idempotency)
      if (order.paymentStatus === 'completed') {
        return res.json({
          status: 'success',
          message: 'Payment already verified',
          orderId: orderId
        });
      }

      // Verify the Razorpay order ID matches
      if (order.razorpayOrderId !== razorpay_order_id) {
        await storage.updateOrderPaymentStatus(orderId, 'failed');

        // Trigger payment failure email for order mismatch
        try {
          await NotificationService.triggerPaymentFailureEmail(
            order,
            'Razorpay',
            order.customerName,
            'Payment order mismatch - please try again',
            undefined // Guest orders don't have userId
          );
        } catch (emailError) {
          console.error('Failed to send payment failure email:', emailError);
        }

        return res.status(400).json({
          error: 'Payment order mismatch',
          status: 'failure'
        });
      }

      // Generate signature for verification using HMAC SHA256
      const generatedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(razorpay_order_id + '|' + razorpay_payment_id)
        .digest('hex');

      // Use constant-time comparison to prevent timing attacks
      const signatureMatch = crypto.timingSafeEqual(
        Buffer.from(generatedSignature, 'hex'),
        Buffer.from(razorpay_signature, 'hex')
      );

      if (!signatureMatch) {
        // Update order payment status to failed
        await storage.updateOrderPaymentStatus(orderId, 'failed');

        return res.status(400).json({
          error: 'Payment verification failed',
          status: 'failure'
        });
      }

      // Payment verified successfully - update order
      await storage.updateOrderRazorpayDetails(orderId, {
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature
      });

      await storage.updateOrderStatus(orderId, 'processing');
      await storage.updateOrderPaymentStatus(orderId, 'completed');

      // Trigger payment confirmation email for guest order
      try {
        const updatedOrder = await storage.getOrder(orderId);
        if (updatedOrder) {
          await NotificationService.triggerPaymentConfirmationEmail(
            updatedOrder,
            'Razorpay',
            updatedOrder.customerName,
            updatedOrder.userId || undefined
          );
        }
      } catch (emailError) {
        console.error('Failed to send payment confirmation email:', emailError);
        // Don't fail the payment verification if email fails
      }

      res.json({
        status: 'success',
        message: 'Payment verified successfully',
        orderId: orderId
      });
    } catch (error) {
      console.error('Error verifying guest Razorpay payment:', error);

      // Update payment status to failed on any error
      try {
        if (req.body.orderId) {
          await storage.updateOrderPaymentStatus(req.body.orderId, 'failed');
        }
      } catch (updateError) {
        console.error('Error updating payment status to failed:', updateError);
      }

      res.status(500).json({
        error: 'Payment verification failed',
        status: 'failure'
      });
    }
  });

  // Verify Razorpay payment
  app.post('/api/payments/verify-razorpay-payment', authenticateToken, async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

      // Validate required environment variables
      if (!process.env.RAZORPAY_KEY_SECRET) {
        return res.status(503).json({ error: 'Payment service unavailable' });
      }

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {
        return res.status(400).json({ error: 'Missing payment verification data' });
      }

      // Verify the order belongs to the user and get stored Razorpay order ID
      const order = await storage.getOrder(orderId);
      if (!order || order.userId !== authReq.user.id) {
        return res.status(404).json({ error: 'Order not found' });
      }

      // Check if payment is already processed (idempotency)
      if (order.paymentStatus === 'completed') {
        return res.json({
          status: 'success',
          message: 'Payment already verified',
          orderId: orderId
        });
      }

      // Verify that the razorpay_order_id matches what we stored
      if (order.razorpayOrderId !== razorpay_order_id) {
        await storage.updateOrderPaymentStatus(orderId, 'failed');

        // Trigger payment failure email for authenticated user
        try {
          await NotificationService.triggerPaymentFailureEmail(
            order,
            'Razorpay',
            order.customerName,
            'Payment order mismatch - please try again',
            authReq.user.id
          );
        } catch (emailError) {
          console.error('Failed to send payment failure email:', emailError);
        }

        return res.status(400).json({
          error: 'Payment order mismatch',
          status: 'failure'
        });
      }

      // Generate signature for verification using HMAC SHA256
      const generatedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(razorpay_order_id + '|' + razorpay_payment_id)
        .digest('hex');

      // Use constant-time comparison to prevent timing attacks
      const signatureMatch = crypto.timingSafeEqual(
        Buffer.from(generatedSignature, 'hex'),
        Buffer.from(razorpay_signature, 'hex')
      );

      if (!signatureMatch) {
        // Update order payment status to failed
        await storage.updateOrderPaymentStatus(orderId, 'failed');

        // Trigger payment failure email for authenticated user
        try {
          await NotificationService.triggerPaymentFailureEmail(
            order,
            'Razorpay',
            order.customerName,
            'Payment verification failed - please try again',
            authReq.user.id
          );
        } catch (emailError) {
          console.error('Failed to send payment failure email:', emailError);
          // Don't fail the response if email fails
        }

        return res.status(400).json({
          error: 'Payment verification failed',
          status: 'failure'
        });
      }

      // Payment verified successfully - update order
      await storage.updateOrderRazorpayDetails(orderId, {
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature
      });

      await storage.updateOrderStatus(orderId, 'processing');
      await storage.updateOrderPaymentStatus(orderId, 'completed');

      // Trigger payment confirmation email for authenticated user
      try {
        const updatedOrder = await storage.getOrder(orderId);
        if (updatedOrder) {
          await NotificationService.triggerPaymentConfirmationEmail(
            updatedOrder,
            'Razorpay',
            updatedOrder.customerName,
            authReq.user.id
          );
        }
      } catch (emailError) {
        console.error('Failed to send payment confirmation email:', emailError);
        // Don't fail the payment verification if email fails
      }

      res.json({
        status: 'success',
        message: 'Payment verified successfully',
        orderId: orderId
      });
    } catch (error) {
      console.error('Error verifying Razorpay payment:', error);

      // Update payment status to failed on any error
      try {
        if (req.body.orderId) {
          await storage.updateOrderPaymentStatus(req.body.orderId, 'failed');
        }
      } catch (updateError) {
        console.error('Error updating payment status to failed:', updateError);
      }

      res.status(500).json({ error: 'Failed to verify payment' });
    }
  });

  // =============================================================================
  // CONTACT FORM ENDPOINT
  // =============================================================================

  // Submit contact form
  app.post('/api/contact', async (req, res) => {
    try {
      const { name, email, phone, subject, message } = req.body;

      // Validate required fields
      if (!name || !email || !subject || !message) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Send contact form email
      const emailSent = await sendContactFormEmail(
        name,
        email,
        phone || '',
        subject,
        message
      );

      if (emailSent) {
        res.json({ 
          success: true, 
          message: 'Contact form submitted successfully' 
        });
      } else {
        res.status(500).json({ error: 'Failed to send contact form email' });
      }
    } catch (error) {
      console.error('Error submitting contact form:', error);
      res.status(500).json({ error: 'Failed to submit contact form' });
    }
  });

  // =============================================================================
  // WHATSAPP WEBHOOK ENDPOINTS
  // =============================================================================

  // WhatsApp Status Webhook - Handle delivery status updates
  app.post('/api/webhooks/whatsapp/status', async (req, res) => {
    try {
      console.log('📱 WhatsApp status webhook received:', req.body);

      const {
        MessageSid,
        MessageStatus,
        To,
        From,
        ErrorCode,
        ErrorMessage,
        ChannelMessageSid,
        SmsSid
      } = req.body;

      if (!MessageSid || !MessageStatus) {
        console.warn('⚠️ WhatsApp webhook missing required fields:', req.body);
        return res.status(400).json({ error: 'Missing required webhook fields' });
      }

      // Update WhatsApp message status in database
      try {
        await storage.updateWhatsappDeliveryStatus(MessageSid, {
          status: MessageStatus.toLowerCase(),
          phoneNumber: To,
          from: From,
          errorCode: ErrorCode,
          errorMessage: ErrorMessage,
          channelMessageSid: ChannelMessageSid,
          smsSid: SmsSid,
          statusUpdatedAt: new Date()
        });

        console.log(`✅ WhatsApp status updated: ${MessageSid} -> ${MessageStatus}`);
      } catch (dbError) {
        console.error('❌ Failed to update WhatsApp status in database:', dbError);
        // Don't fail the webhook response - Twilio needs 200 OK
      }

      // Log delivery event for analytics
      try {
        await storage.createWhatsappDeliveryLog({
          twilioSid: MessageSid,
          phoneNumber: To,
          status: MessageStatus.toLowerCase(),
          direction: 'outbound',
          errorCode: ErrorCode,
          errorMessage: ErrorMessage,
          channelMessageSid: ChannelMessageSid,
          smsSid: SmsSid
        });
      } catch (logError) {
        console.error('❌ Failed to create WhatsApp delivery log:', logError);
        // Don't fail the webhook response
      }

      // Return 200 OK to Twilio
      res.status(200).json({ message: 'WhatsApp status webhook processed successfully' });
    } catch (error) {
      console.error('❌ Error processing WhatsApp status webhook:', error);
      // Still return 200 to prevent Twilio retries for malformed requests
      res.status(200).json({ error: 'Webhook processing failed' });
    }
  });

  // WhatsApp Incoming Message Webhook - Handle incoming WhatsApp messages (optional)
  app.post('/api/webhooks/whatsapp/incoming', async (req, res) => {
    try {
      console.log('📱 WhatsApp incoming message webhook received:', req.body);

      const {
        MessageSid,
        From,
        To,
        Body,
        NumMedia,
        MediaUrl0,
        MediaContentType0,
        ProfileName,
        WaId
      } = req.body;

      if (!MessageSid || !From || !Body) {
        console.warn('⚠️ WhatsApp incoming webhook missing required fields:', req.body);
        return res.status(400).json({ error: 'Missing required webhook fields' });
      }

      // Log incoming message for analytics and support
      try {
        await storage.createWhatsappDeliveryLog({
          twilioSid: MessageSid,
          phoneNumber: From,
          status: 'received',
          direction: 'inbound',
          messageBody: Body,
          numMedia: NumMedia ? parseInt(NumMedia) : 0,
          mediaUrl: MediaUrl0,
          mediaType: MediaContentType0,
          profileName: ProfileName,
          waId: WaId
        });

        console.log(`📥 WhatsApp message received from ${From}: ${Body.substring(0, 50)}...`);
      } catch (dbError) {
        console.error('❌ Failed to log incoming WhatsApp message:', dbError);
        // Don't fail the webhook response
      }

      // Auto-reply with support information (optional)
      const autoReplyMessage = `Thank you for contacting Bmaafashion! 👒\n\nOur support team will respond to your message soon. For immediate assistance, please visit our website or call our support line.\n\nHappy Shopping!\nBmaafashion Team`;

      // Respond with TwiML to send auto-reply
      res.set('Content-Type', 'text/xml');
      res.status(200).send(`
        <?xml version="1.0" encoding="UTF-8"?>
        <Response>
          <Message>
            ${autoReplyMessage}
          </Message>
        </Response>
      `);
    } catch (error) {
      console.error('❌ Error processing WhatsApp incoming webhook:', error);
      // Return empty TwiML response on error
      res.set('Content-Type', 'text/xml');
      res.status(200).send(`
        <?xml version="1.0" encoding="UTF-8"?>
        <Response></Response>
      `);
    }
  });

  // ===== Site Settings Routes =====

  // Multer instance for site-settings image uploads
  const siteSettingsUpload = multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        const uploadDir = path.join(process.cwd(), 'attached_assets', 'site-settings');
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
        cb(null, uploadDir);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, `site-${uniqueSuffix}${ext}`);
      },
    }),
    limits: { fileSize: 5 * 1024 * 1024, files: 1 },
    fileFilter: (req, file, cb) => {
      const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (allowed.includes(file.mimetype)) cb(null, true);
      else cb(new Error('Only JPEG, PNG, and WebP images are allowed'));
    },
  });

  // Admin: POST /api/site-settings/upload-image
  app.post('/api/site-settings/upload-image', authenticateToken, requireAdmin, siteSettingsUpload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'Image file is required' });
      }
      // Optimize with sharp
      try {
        const orig = req.file.path;
        await sharp(orig)
          .resize(1920, 1080, { withoutEnlargement: true, fit: 'inside' })
          .jpeg({ quality: 85, progressive: true })
          .toFile(orig + '.tmp');
        fs.unlinkSync(orig);
        fs.renameSync(orig + '.tmp', orig);
      } catch {
        // Non-fatal — keep the original
      }
      const imageUrl = `/api/images/site-settings/${req.file.filename}`;
      res.json({ url: imageUrl });
    } catch (error) {
      if (req.file) {
        try { fs.unlinkSync(req.file.path); } catch {}
      }
      console.error('Error uploading site settings image:', error);
      res.status(500).json({ message: 'Failed to upload image' });
    }
  });

  // Public: GET /api/site-settings
  app.get('/api/site-settings', async (req, res) => {
    try {
      const settings = await storage.getSiteSettings();
      res.json(settings);
    } catch (error) {
      console.error('Error fetching site settings:', error);
      res.status(500).json({ message: 'Failed to fetch site settings' });
    }
  });

  // Zod schema for PUT /api/site-settings with explicit server-side constraints
  const ALLOWED_FONTS = ['Poppins', 'Open Sans', 'Lato', 'Roboto', 'Playfair Display'] as const;
  const hexColor = z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid 6-digit hex color');
  // Allow both absolute URLs and relative paths (for uploaded images)
  const optionalUrl = z.string().refine(
    (val) => val === '' || val.startsWith('/') || val.startsWith('http://') || val.startsWith('https://'),
    { message: 'Must be a valid URL or path' }
  ).or(z.literal('')).nullable().optional();
  const siteSettingsPutSchema = z.object({
    // Branding
    storeName: z.string().max(100).optional(),
    storeTagline: z.string().max(200).optional(),
    logoUrl: optionalUrl,
    fontFamily: z.enum(ALLOWED_FONTS).optional(),
    fontColor: hexColor.optional(),
    backgroundColor: hexColor.optional(),
    // Homepage
    heroImage1Url: optionalUrl,
    heroImage2Url: optionalUrl,
    heroImage3Url: optionalUrl,
    heroImage1Duration: z.number().int().min(1).max(60).nullable().optional(),
    heroImage2Duration: z.number().int().min(1).max(60).nullable().optional(),
    heroImage3Duration: z.number().int().min(1).max(60).nullable().optional(),
    announcementBar: z.object({
      text: z.string().optional(),
      active: z.boolean().optional(),
      bgColor: z.string().optional(),
      textColor: z.string().optional(),
    }).optional(),
    featuredCategories: z.array(z.string()).optional(),
    customBanners: z.array(z.object({
      id: z.string(),
      imageUrl: z.string().optional(),
      title: z.string().optional(),
      subtitle: z.string().optional(),
      buttonText: z.string().optional(),
      buttonLink: z.string().optional(),
    })).optional(),
    heroSlideDuration: z.number().int().min(1).max(60).optional().default(5),
    // Policies
    policies: z.object({
      shipping: z.object({
        freeThreshold: z.number().optional(),
        deliveryDays: z.string().optional(),
        text: z.string().optional(),
      }).optional(),
      returns: z.object({
        windowDays: z.number().optional(),
        text: z.string().optional(),
      }).optional(),
      gst: z.object({
        rate: z.number().optional(),
        text: z.string().optional(),
      }).optional(),
    }).optional(),
    // Contact & Social
    contactInfo: z.object({
      phone: z.string().optional(),
      email: z.string().optional(),
      address: z.string().optional(),
      whatsapp: z.string().optional(),
      businessHours: z.string().optional(),
    }).optional(),
    socialLinks: z.object({
      facebook: z.string().optional(),
      instagram: z.string().optional(),
      twitter: z.string().optional(),
      youtube: z.string().optional(),
      linkedin: z.string().optional(),
    }).optional(),
    // SEO
    seoSettings: z.record(z.object({
      title: z.string().optional(),
      description: z.string().optional(),
    })).optional(),
    // Promotions
    promotions: z.array(z.object({
      id: z.string(),
      message: z.string(),
      code: z.string().optional(),
      expiry: z.string().optional(),
      active: z.boolean(),
      bgColor: z.string().optional(),
      textColor: z.string().optional(),
    })).optional(),
    // Footer
    footerSettings: z.object({
      copyright: z.string().optional(),
      links: z.array(z.object({
        label: z.string(),
        url: z.string(),
      })).optional(),
      newsletterEnabled: z.boolean().optional(),
      showSocialLinks: z.boolean().optional(),
    }).optional(),
    // Maintenance Mode
    maintenanceMode: z.object({
      enabled: z.boolean().optional(),
      title: z.string().optional(),
      message: z.string().optional(),
    }).optional(),
    // WhatsApp Widget
    whatsappWidget: z.object({
      enabled: z.boolean().optional(),
      phone: z.string().optional(),
    }).optional(),
    // Homepage Sections
    homepageSections: z.object({
      showStats: z.boolean().optional(),
      showWhyChoose: z.boolean().optional(),
      showTestimonials: z.boolean().optional(),
      showFeaturedProducts: z.boolean().optional(),
      showBenefits: z.boolean().optional(),
    }).optional(),
    // Popup Settings
    popupSettings: z.object({
      enabled: z.boolean().optional(),
      title: z.string().optional(),
      message: z.string().optional(),
      buttonText: z.string().optional(),
      delay: z.number().optional(),
      couponCode: z.string().optional(),
    }).optional(),
    // Countdown Timer
    countdownTimer: z.object({
      enabled: z.boolean().optional(),
      endsAt: z.string().optional(),
      message: z.string().optional(),
      bgColor: z.string().optional(),
      textColor: z.string().optional(),
    }).optional(),
    // Trust Badges
    trustBadges: z.array(z.object({
      id: z.string(),
      label: z.string(),
      icon: z.string(),
      active: z.boolean(),
    })).optional(),
    // Product Settings
    productSettings: z.object({
      perPage: z.number().int().min(4).max(100).optional(),
      defaultSort: z.string().optional(),
      newBadgeDays: z.number().int().min(0).max(365).optional(),
      lowStockThreshold: z.number().int().min(0).max(1000).optional(),
    }).optional(),
    // Order Settings
    orderSettings: z.object({
      codEnabled: z.boolean().optional(),
      autoCancelHours: z.number().int().min(1).max(168).optional(),
      deliveryMessage: z.string().optional(),
    }).optional(),
    // Tracking
    trackingSettings: z.object({
      googleAnalyticsId: z.string().optional(),
      facebookPixelId: z.string().optional(),
    }).optional(),
    // Cookie Consent
    cookieConsent: z.object({
      enabled: z.boolean().optional(),
      message: z.string().optional(),
      acceptText: z.string().optional(),
      declineText: z.string().optional(),
    }).optional(),
    // Page Banners
    pageBanners: z.object({
      about: z.object({ imageUrl: z.string().optional(), title: z.string().optional(), subtitle: z.string().optional() }).optional(),
      contact: z.object({ imageUrl: z.string().optional(), title: z.string().optional(), subtitle: z.string().optional() }).optional(),
      services: z.object({ imageUrl: z.string().optional(), title: z.string().optional(), subtitle: z.string().optional() }).optional(),
      products: z.object({ imageUrl: z.string().optional(), title: z.string().optional(), subtitle: z.string().optional() }).optional(),
      freshProduce: z.object({ imageUrl: z.string().optional(), title: z.string().optional(), subtitle: z.string().optional() }).optional(),
    }).optional(),
  });

  // Admin: PUT /api/site-settings
  app.put('/api/site-settings', authenticateToken, requireAdmin, async (req, res) => {
    try {
      const data = siteSettingsPutSchema.parse(req.body);
      const settings = await storage.upsertSiteSettings(data);
      res.json(settings);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid settings data', details: error.errors });
      }
      console.error('Error updating site settings:', error);
      res.status(500).json({ message: 'Failed to update site settings' });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
