// Product Variants Storage Methods
// Add these methods to your DatabaseStorage class in storage.ts

import { db } from "./db";
import { productVariants, products } from "@shared/schema";
import type { ProductVariant, InsertProductVariant } from "@shared/schema";
import { eq, and, asc } from "drizzle-orm";

export class VariantStorage {
  /**
   * Get all variants for a product
   */
  async getProductVariants(productId: string): Promise<ProductVariant[]> {
    return await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.productId, productId))
      .orderBy(asc(productVariants.sortOrder), asc(productVariants.color), asc(productVariants.size));
  }

  /**
   * Get a single variant by ID
   */
  async getVariantById(variantId: string): Promise<ProductVariant | undefined> {
    const [variant] = await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.id, variantId));
    return variant;
  }

  /**
   * Get a variant by color and size combination
   */
  async getVariantByColorSize(
    productId: string,
    color: string | null,
    size: string | null
  ): Promise<ProductVariant | undefined> {
    const conditions = [eq(productVariants.productId, productId)];
    
    if (color) {
      conditions.push(eq(productVariants.color, color));
    }
    if (size) {
      conditions.push(eq(productVariants.size, size));
    }
    
    const [variant] = await db
      .select()
      .from(productVariants)
      .where(and(...conditions));
    
    return variant;
  }

  /**
   * Create a new product variant
   */
  async createProductVariant(
    productId: string,
    data: Omit<InsertProductVariant, 'productId'>
  ): Promise<ProductVariant> {
    const [variant] = await db
      .insert(productVariants)
      .values({
        productId,
        color: data.color || null,
        size: data.size || null,
        price: data.price || null,
        compareAtPrice: data.compareAtPrice || null,
        stockQuantity: data.stockQuantity || 0,
        lowStockThreshold: data.lowStockThreshold || 5,
        weight: data.weight || null,
        images: data.images || [],
        isActive: data.isActive ?? true,
        sortOrder: data.sortOrder || 0,
        sku: data.sku || null,
      })
      .returning();
    
    await this.syncProductStock(productId);
    return variant;
  }

  /**
   * Update a product variant
   */
  async updateProductVariant(
    variantId: string,
    data: Partial<InsertProductVariant>
  ): Promise<ProductVariant> {
    const [variant] = await db
      .update(productVariants)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(productVariants.id, variantId))
      .returning();
    
    if (variant) await this.syncProductStock(variant.productId);
    return variant;
  }

  /**
   * Delete a product variant
   */
  async deleteProductVariant(variantId: string): Promise<void> {
    const existing = await this.getVariantById(variantId);
    await db.delete(productVariants).where(eq(productVariants.id, variantId));
    if (existing) await this.syncProductStock(existing.productId);
  }

  /**
   * Update variant stock quantity
   */
  async updateVariantStock(variantId: string, quantity: number): Promise<ProductVariant> {
    const [variant] = await db
      .update(productVariants)
      .set({
        stockQuantity: quantity,
        updatedAt: new Date(),
      })
      .where(eq(productVariants.id, variantId))
      .returning();
    
    if (variant) await this.syncProductStock(variant.productId);
    return variant;
  }

  /**
   * Keep the parent product's stock equal to the sum of its variant quantities.
   * Variant stock is the source of truth whenever variants exist.
   */
  async syncProductStock(productId: string): Promise<number> {
    const variants = await this.getProductVariants(productId);
    const total = variants.reduce((sum, variant) => sum + Math.max(0, Number(variant.stockQuantity) || 0), 0);
    await db.update(products).set({ inStock: total, updatedAt: new Date() }).where(eq(products.id, productId));
    return total;
  }

  /**
   * Get total stock across all variants for a product
   */
  async getTotalVariantStock(productId: string): Promise<number> {
    const variants = await this.getProductVariants(productId);
    return variants.reduce((total, variant) => total + (variant.stockQuantity || 0), 0);
  }

  /**
   * Check if a variant has sufficient stock
   */
  async checkVariantStock(variantId: string, requestedQuantity: number): Promise<boolean> {
    const variant = await this.getVariantById(variantId);
    if (!variant || !variant.isActive) return false;
    return (variant.stockQuantity || 0) >= requestedQuantity;
  }

  /**
   * Get low stock variants for a product
   */
  async getLowStockVariants(productId: string): Promise<ProductVariant[]> {
    const variants = await this.getProductVariants(productId);
    return variants.filter(
      v => v.isActive && v.stockQuantity <= (v.lowStockThreshold || 5)
    );
  }

  /**
   * Get out of stock variants for a product
   */
  async getOutOfStockVariants(productId: string): Promise<ProductVariant[]> {
    const variants = await this.getProductVariants(productId);
    return variants.filter(v => v.isActive && v.stockQuantity === 0);
  }

  /**
   * Bulk create variants
   */
  async bulkCreateVariants(
    productId: string,
    variantsData: Array<Omit<InsertProductVariant, 'productId'>>
  ): Promise<ProductVariant[]> {
    const variants = await db
      .insert(productVariants)
      .values(
        variantsData.map(data => ({
          productId,
          color: data.color || null,
          size: data.size || null,
          price: data.price || null,
          compareAtPrice: data.compareAtPrice || null,
          stockQuantity: data.stockQuantity || 0,
          lowStockThreshold: data.lowStockThreshold || 5,
          weight: data.weight || null,
          images: data.images || [],
          isActive: data.isActive ?? true,
          sortOrder: data.sortOrder || 0,
          sku: data.sku || null,
        }))
      )
      .returning();
    
    return variants;
  }
}

// Export a singleton instance
export const variantStorage = new VariantStorage();
