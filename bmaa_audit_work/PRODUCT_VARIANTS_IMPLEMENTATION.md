# Product Variants Implementation Summary

## ✅ Completed Steps

### 1. Database Schema Created

Added `product_variants` table to [`schema.ts`](bmaafashion/shared/schema.ts:113) with the following structure:

```typescript
export const productVariants = pgTable("product_variants", {
  id: varchar("id").primaryKey(),
  productId: varchar("product_id").references(() => products.id),
  sku: text("sku").unique(),
  color: text("color"),
  size: text("size"),
  price: decimal("price"),
  compareAtPrice: decimal("compare_at_price"),
  stockQuantity: integer("stock_quantity"),
  lowStockThreshold: integer("low_stock_threshold"),
  weight: decimal("weight"),
  images: text("images").array(),
  isActive: boolean("is_active"),
  sortOrder: integer("sort_order"),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});
```

**Key Features:**

- Individual stock tracking per variant
- Variant-specific pricing (e.g., XL costs more)
- Unique SKU per variant
- Variant-specific images
- Active/inactive status
- Sort ordering for display

**Indexes Created:**

- `idx_product_variants_product_id` - Fast product lookup
- `idx_product_variants_sku` - SKU searches
- `idx_product_variants_color` - Filter by color
- `idx_product_variants_size` - Filter by size
- `idx_product_variants_is_active` - Active variants only
- `unique_product_color_size` - Prevent duplicate combinations

### 2. TypeScript Types Added

- `ProductVariant` - Select type
- `InsertProductVariant` - Insert schema type
- `insertProductVariantSchema` - Zod validation schema

## 📋 Next Steps Required

### Step 1: Run Database Migration

You need to apply the schema changes to your database:

```bash
cd bmaafashion
npm run db:push
```

Or if using migrations:

```bash
npm run db:generate
npm run db:migrate
```

### Step 2: Add API Endpoints

Create the following endpoints in [`server/routes.ts`](bmaafashion/server/routes.ts):

#### Get Product Variants

```typescript
app.get("/api/products/:productId/variants", async (req, res) => {
  const { productId } = req.params;
  const variants = await storage.getProductVariants(productId);
  res.json(variants);
});
```

#### Create Variant (Admin)

```typescript
app.post(
  "/api/admin/products/:productId/variants",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    const { productId } = req.params;
    const variantData = insertProductVariantSchema.parse(req.body);
    const variant = await storage.createProductVariant(productId, variantData);
    res.json(variant);
  },
);
```

#### Update Variant (Admin)

```typescript
app.put(
  "/api/admin/products/variants/:variantId",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    const { variantId } = req.params;
    const updates = req.body;
    const variant = await storage.updateProductVariant(variantId, updates);
    res.json(variant);
  },
);
```

#### Delete Variant (Admin)

```typescript
app.delete(
  "/api/admin/products/variants/:variantId",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    const { variantId } = req.params;
    await storage.deleteProductVariant(variantId);
    res.json({ success: true });
  },
);
```

### Step 3: Add Storage Methods

Add these methods to [`server/storage.ts`](bmaafashion/server/storage.ts) or [`server/db.ts`](bmaafashion/server/db.ts):

```typescript
async getProductVariants(productId: string) {
  return await db
    .select()
    .from(productVariants)
    .where(eq(productVariants.productId, productId))
    .orderBy(productVariants.sortOrder);
}

async createProductVariant(productId: string, data: InsertProductVariant) {
  const [variant] = await db
    .insert(productVariants)
    .values({ ...data, productId })
    .returning();
  return variant;
}

async updateProductVariant(variantId: string, data: Partial<InsertProductVariant>) {
  const [variant] = await db
    .update(productVariants)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(productVariants.id, variantId))
    .returning();
  return variant;
}

async deleteProductVariant(variantId: string) {
  await db
    .delete(productVariants)
    .where(eq(productVariants.id, variantId));
}

async getVariantByColorSize(productId: string, color: string, size: string) {
  const [variant] = await db
    .select()
    .from(productVariants)
    .where(
      and(
        eq(productVariants.productId, productId),
        eq(productVariants.color, color),
        eq(productVariants.size, size),
        eq(productVariants.isActive, true)
      )
    );
  return variant;
}
```

### Step 4: Update AdminProducts Page

Modify [`client/src/pages/admin/AdminProducts.tsx`](bmaafashion/client/src/pages/admin/AdminProducts.tsx:1):

1. Add a "Manage Variants" button in the product actions menu
2. Create a variants management dialog
3. Add variant creation form with:
   - Color selector/input
   - Size selector/input
   - Price input (defaults to product price)
   - Stock quantity input
   - SKU input (auto-generate option)
4. Display existing variants in a table
5. Allow editing/deleting variants

### Step 5: Update ProductDetail Page

Modify [`client/src/pages/ProductDetail.tsx`](bmaafashion/client/src/pages/ProductDetail.tsx:1):

1. Fetch variants when product loads
2. Display color options (if variants exist)
3. Display size options (if variants exist)
4. Update price display when variant selected
5. Show variant-specific stock status
6. Pass variant ID to cart when adding
7. Handle variant selection validation

### Step 6: Update Cart System

Modify cart to handle variants:

1. Store `variantId` with cart items
2. Display variant info (color/size) in cart
3. Validate stock at variant level
4. Update cart item schema if needed

## 🎯 Usage Example

### Admin Creates Product with Variants

1. Create base product: "Summer Dress"
2. Add variants:
   - Red, S: ₹1,999, Stock: 10
   - Red, M: ₹1,999, Stock: 15
   - Red, L: ₹1,999, Stock: 12
   - Blue, S: ₹1,999, Stock: 8
   - Blue, M: ₹1,999, Stock: 20
   - Blue, L: ₹1,999, Stock: 10

### Customer Shops

1. Views "Summer Dress" product page
2. Sees available colors: Red, Blue
3. Selects "Blue"
4. Sees available sizes: S, M, L
5. Selects "M"
6. Price updates (if variant has custom price)
7. Stock shows: "20 units available"
8. Adds to cart: Blue-M variant

## 🔄 Migration Strategy

### For Existing Products

Products without variants will continue to work with the existing `size` and `colors` fields. When you want to add proper variant management:

1. Create variants from existing size/color data
2. Migrate stock to variants
3. Update product to use variants

### Backward Compatibility

The system supports both:

- **Legacy mode**: Products with `size` and `colors` text fields
- **Variants mode**: Products with proper variant records

## 📊 Benefits

1. **Accurate Stock Management**: Track stock per color-size combination
2. **Flexible Pricing**: Different prices for different sizes
3. **Better UX**: Clear availability per variant
4. **Inventory Tracking**: Unique SKUs for each variant
5. **Analytics**: Track which variants sell best
6. **Scalability**: Easy to add new attributes later

## 🚀 Quick Start Commands

```bash
# 1. Apply database changes
cd bmaafashion
npm run db:push

# 2. Restart development server
npm run dev

# 3. Test in admin panel
# - Create a product
# - Add variants
# - Test on product detail page
```

## 📝 Notes

- Variants are optional - products can still work without them
- When variants exist, they take precedence over legacy fields
- Stock is managed at variant level when variants exist
- Cart system needs to reference variant IDs
- Consider adding variant images in future enhancement

## 🔗 Related Files

- Schema: [`shared/schema.ts`](bmaafashion/shared/schema.ts:113)
- Admin Products: [`client/src/pages/admin/AdminProducts.tsx`](bmaafashion/client/src/pages/admin/AdminProducts.tsx:1)
- Product Detail: [`client/src/pages/ProductDetail.tsx`](bmaafashion/client/src/pages/ProductDetail.tsx:1)
- Routes: [`server/routes.ts`](bmaafashion/server/routes.ts:1)
- Guide: [`PRODUCT_VARIANTS_GUIDE.md`](bmaafashion/PRODUCT_VARIANTS_GUIDE.md:1)
