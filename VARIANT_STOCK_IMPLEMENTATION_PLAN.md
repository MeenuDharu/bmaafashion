# Product Variant Stock Management Implementation

## Current Issue

- Products show total stock (e.g., 50 units)
- Size/color selection only happens on product detail page
- Shop page "Add to Cart" doesn't ask for size/color
- Stock is tracked at product level, not variant level

## Required Solution

Products should have:

- Total stock: 50 units
- Variant-specific stock:
  - Size S: 10 units
  - Size M: 10 units
  - Size L: 10 units
  - Size XL: 20 units

When purchasing:

- 2 M, 3 S, 5 L → Total: 40 units remaining
- M: 8, S: 7, L: 5, XL: 20

## Implementation Steps

### 1. Use Product Variants Table (Already Exists)

The `productVariants` table in schema.ts already has:

- `productId` - links to main product
- `size` - variant size
- `color` - variant color
- `stockQuantity` - stock for this specific variant
- `price` - optional variant-specific pricing

### 2. Create Variant Selection Dialog Component

A reusable dialog that:

- Shows available sizes/colors
- Displays stock per variant
- Allows quantity selection
- Adds to cart with selected variant

### 3. Update Product Cards

- Add "Select Options" button instead of direct "Add to Cart"
- Open variant selection dialog
- Only allow direct add if product has no variants

### 4. Update Stock Validation

- Check variant stock instead of product stock
- Validate against specific variant quantity
- Update variant stock on purchase

### 5. Admin Variant Management

- Create/edit variants for products
- Set stock per variant
- Bulk import variants

## Files to Modify

1. **client/src/components/VariantSelectorDialog.tsx** (NEW)
   - Variant selection UI
   - Stock display per variant
   - Add to cart with variant

2. **client/src/components/ProductCard.tsx**
   - Check if product has variants
   - Show "Select Options" vs "Add to Cart"
   - Open variant dialog

3. **client/src/components/EnhancedProductCard.tsx**
   - Same changes as ProductCard

4. **server/routes.ts**
   - Add variant endpoints
   - Update stock validation
   - Check variant stock on add to cart

5. **client/src/pages/admin/AdminProducts.tsx**
   - Add variant management UI
   - Create/edit variants

## API Endpoints Needed

```
GET /api/products/:id/variants - Get all variants for a product
POST /api/products/:id/variants - Create variant
PUT /api/variants/:id - Update variant
DELETE /api/variants/:id - Delete variant
GET /api/variants/:id/stock - Check variant stock
```

## Database Changes

No schema changes needed - `productVariants` table already exists!

## Next Steps

1. Create VariantSelectorDialog component
2. Update ProductCard to use dialog
3. Add variant API endpoints
4. Update cart to validate variant stock
5. Add admin variant management
