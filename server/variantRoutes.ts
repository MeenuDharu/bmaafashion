// Product Variants API Routes
// Add these routes to your server/routes.ts file

import type { Express } from "express";
import { authenticateToken, requireAdmin } from "./jwtAuth";
import { variantStorage } from "./variantStorage";
import { insertProductVariantSchema } from "@shared/schema";

export function registerVariantRoutes(app: Express) {
  // Get all variants for a product (Public)
  app.get('/api/products/:productId/variants', async (req, res) => {
    try {
      const { productId } = req.params;
      const variants = await variantStorage.getProductVariants(productId);
      res.json(variants);
    } catch (error) {
      console.error('Error fetching variants:', error);
      res.status(500).json({ error: 'Failed to fetch variants' });
    }
  });

  // Get a single variant by ID (Public)
  app.get('/api/products/variants/:variantId', async (req, res) => {
    try {
      const { variantId } = req.params;
      const variant = await variantStorage.getVariantById(variantId);
      
      if (!variant) {
        return res.status(404).json({ error: 'Variant not found' });
      }
      
      res.json(variant);
    } catch (error) {
      console.error('Error fetching variant:', error);
      res.status(500).json({ error: 'Failed to fetch variant' });
    }
  });

  // Create a new variant (Admin only)
  app.post(
    '/api/admin/products/:productId/variants',
    authenticateToken,
    requireAdmin,
    async (req, res) => {
      try {
        const { productId } = req.params;
        
        // Validate request body
        const validatedData = insertProductVariantSchema.parse(req.body);
        
        // Create the variant
        const variant = await variantStorage.createProductVariant(productId, validatedData);
        
        res.status(201).json(variant);
      } catch (error: any) {
        console.error('Error creating variant:', error);
        
        if (error.name === 'ZodError') {
          return res.status(400).json({ 
            error: 'Validation error', 
            details: error.errors 
          });
        }
        
        // Check for unique constraint violation
        if (error.code === '23505') {
          return res.status(409).json({ 
            error: 'A variant with this color and size combination already exists' 
          });
        }
        
        res.status(500).json({ error: 'Failed to create variant' });
      }
    }
  );

  // Update a variant (Admin only)
  app.put(
    '/api/admin/products/variants/:variantId',
    authenticateToken,
    requireAdmin,
    async (req, res) => {
      try {
        const { variantId } = req.params;
        
        // Check if variant exists
        const existingVariant = await variantStorage.getVariantById(variantId);
        if (!existingVariant) {
          return res.status(404).json({ error: 'Variant not found' });
        }
        
        // Update the variant
        const updatedVariant = await variantStorage.updateProductVariant(
          variantId,
          req.body
        );
        
        res.json(updatedVariant);
      } catch (error) {
        console.error('Error updating variant:', error);
        res.status(500).json({ error: 'Failed to update variant' });
      }
    }
  );

  // Delete a variant (Admin only)
  app.delete(
    '/api/admin/products/variants/:variantId',
    authenticateToken,
    requireAdmin,
    async (req, res) => {
      try {
        const { variantId } = req.params;
        
        // Check if variant exists
        const existingVariant = await variantStorage.getVariantById(variantId);
        if (!existingVariant) {
          return res.status(404).json({ error: 'Variant not found' });
        }
        
        // Delete the variant
        await variantStorage.deleteProductVariant(variantId);
        
        res.json({ success: true, message: 'Variant deleted successfully' });
      } catch (error) {
        console.error('Error deleting variant:', error);
        res.status(500).json({ error: 'Failed to delete variant' });
      }
    }
  );

  // Update variant stock (Admin only)
  app.patch(
    '/api/admin/products/variants/:variantId/stock',
    authenticateToken,
    requireAdmin,
    async (req, res) => {
      try {
        const { variantId } = req.params;
        const { quantity } = req.body;
        
        if (typeof quantity !== 'number' || quantity < 0) {
          return res.status(400).json({ error: 'Invalid quantity' });
        }
        
        const updatedVariant = await variantStorage.updateVariantStock(
          variantId,
          quantity
        );
        
        res.json(updatedVariant);
      } catch (error) {
        console.error('Error updating variant stock:', error);
        res.status(500).json({ error: 'Failed to update stock' });
      }
    }
  );

  // Get low stock variants for a product (Admin only)
  app.get(
    '/api/admin/products/:productId/variants/low-stock',
    authenticateToken,
    requireAdmin,
    async (req, res) => {
      try {
        const { productId } = req.params;
        const lowStockVariants = await variantStorage.getLowStockVariants(productId);
        res.json(lowStockVariants);
      } catch (error) {
        console.error('Error fetching low stock variants:', error);
        res.status(500).json({ error: 'Failed to fetch low stock variants' });
      }
    }
  );

  // Get total stock for a product across all variants (Admin only)
  app.get(
    '/api/admin/products/:productId/variants/total-stock',
    authenticateToken,
    requireAdmin,
    async (req, res) => {
      try {
        const { productId } = req.params;
        const totalStock = await variantStorage.getTotalVariantStock(productId);
        res.json({ totalStock });
      } catch (error) {
        console.error('Error calculating total stock:', error);
        res.status(500).json({ error: 'Failed to calculate total stock' });
      }
    }
  );

  // Bulk create variants (Admin only)
  app.post(
    '/api/admin/products/:productId/variants/bulk',
    authenticateToken,
    requireAdmin,
    async (req, res) => {
      try {
        const { productId } = req.params;
        const { variants } = req.body;
        
        if (!Array.isArray(variants) || variants.length === 0) {
          return res.status(400).json({ error: 'Variants array is required' });
        }
        
        const createdVariants = await variantStorage.bulkCreateVariants(
          productId,
          variants
        );
        
        res.status(201).json(createdVariants);
      } catch (error) {
        console.error('Error bulk creating variants:', error);
        res.status(500).json({ error: 'Failed to create variants' });
      }
    }
  );
}
