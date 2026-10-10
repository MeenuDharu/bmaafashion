# Seed Products with Variants - Instructions

## Overview

This script will:

1. **Delete all existing products** and their variants
2. **Add 10 new fashion products** with proper variant configurations
3. Each product has **multiple size/color variants** with individual stock quantities

## Products Included

1. **Black Embroidered Short Kurti** - 4 sizes (S, M, L, XL) in Black
2. **A-Line Midi Skirt** - 4 sizes (S, M, L, XL) in Black
3. **Floral Print Maxi Dress** - 4 sizes (S, M, L, XL) in Pink
4. **Cotton Kurti Set** - 4 sizes (S, M, L, XL) in Blue
5. **Party Wear Saree** - 3 colors (Red, Maroon, Pink) in Free Size
6. **Coord Set** - 4 sizes (S, M, L, XL) in White
7. **Traditional Kurti** - 4 sizes (S, M, L, XL) in Yellow
8. **Short Kurti** - 6 variants (S, M, L in Red and Blue)
9. **Plus Size Collection** - 3 sizes (XXL, XXXL, 4XL) in Black
10. **Cotton Saree** - 3 shades of Green in Free Size

**Total: 10 products with 41 variants**

## How to Run

### Option 1: Using npm script (Recommended)

```bash
npm run seed:variants
```

### Option 2: Using tsx directly

```bash
npx tsx scripts/seedProductsWithVariants.ts
```

### Option 3: Using ts-node

```bash
npx ts-node scripts/seedProductsWithVariants.ts
```

## What Happens

### Before Running:

- All existing products will be deleted
- All existing product variants will be deleted
- **⚠️ WARNING: This is irreversible!**

### After Running:

- 10 new products added
- 41 product variants created
- Each variant has:
  - Unique SKU
  - Size specification
  - Color specification
  - Individual stock quantity
  - Low stock threshold

## Example Variant Structure

**Product: Black Embroidered Short Kurti**

- Total Stock: 40 units
- Variants:
  - Size S, Black: 10 units (SKU: BEK-S-BLK)
  - Size M, Black: 10 units (SKU: BEK-M-BLK)
  - Size L, Black: 10 units (SKU: BEK-L-BLK)
  - Size XL, Black: 10 units (SKU: BEK-XL-BLK)

## Testing the System

After seeding:

1. **Visit the shop page** - You'll see "Select Options" button on products
2. **Click "Select Options"** - Dialog opens showing available sizes/colors
3. **Select a variant** - See stock quantity for that specific variant
4. **Add to cart** - Item added with selected size/color
5. **View cart** - Size and color displayed as badges
6. **Try to exceed stock** - System prevents adding more than available

## Stock Validation

The system now validates stock at the **variant level**:

- If you select Size M, it checks stock for Size M specifically
- Each size/color combination has its own stock count
- Main product `inStock` field shows total across all variants

## API Endpoints Available

After seeding, you can use these endpoints:

```bash
# Get all variants for a product
GET /api/products/{productId}/variants

# Get specific variant stock
GET /api/variants/{variantId}/stock

# Create new variant (admin only)
POST /api/products/{productId}/variants

# Update variant (admin only)
PUT /api/variants/{variantId}

# Delete variant (admin only)
DELETE /api/variants/{variantId}
```

## Troubleshooting

### Error: "Cannot find module"

Make sure you're in the project root directory and run:

```bash
npm install
```

### Error: "Database connection failed"

Check your `.env` file has correct database credentials:

```
DATABASE_URL=your_database_url
```

### Error: "Permission denied"

Make sure the script has execute permissions:

```bash
chmod +x scripts/seedProductsWithVariants.ts
```

## Next Steps

1. Run the seed script
2. Start your development server: `npm run dev`
3. Visit the shop page
4. Click "Select Options" on any product
5. Test the variant selection and cart functionality

## Notes

- The seed script uses existing product images where available
- Some products use placeholder images
- All variants are set to `isActive: true`
- Low stock threshold is set to 5 units for most variants
- SKUs follow pattern: `{PRODUCT}-{SIZE}-{COLOR}`
