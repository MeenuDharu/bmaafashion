# Database Seed Guide - Fashion Products

## Overview

This guide explains how to populate your database with sample fashion products including proper size configurations.

## 📦 What's Included

The seed script ([`scripts/seedFashionProducts.ts`](scripts/seedFashionProducts.ts)) includes:

### Categories (2 Main Categories)

1. **Women's Fashion** - 17 subcategories
   - Kurti Set, Short Kurti, Traditional Kurti, Cotton Kurti
   - Coord Set, Maxi, Skirt, Party Wear
   - Plus Size Collection, Dress, Gown, Lehenga
   - Saree Blouse, Top, Bottom, Jumpsuit, Romper

2. **Accessories** - 6 subcategories
   - Handbags, Jewelry, Scarves, Belts, Sunglasses, Watches

### Products (17 Sample Products)

#### Products WITH Sizes (14 products):

1. **Floral Print Cotton Kurti Set** - S, M, L, XL, XXL
2. **Embroidered Kurti Set - Navy Blue** - S, M, L, XL, XXL, XXXL
3. **Printed Anarkali Kurti Set** - M, L, XL, XXL
4. **Casual Short Kurti - White** - S, M, L, XL
5. **Printed Short Kurti - Multicolor** - S, M, L, XL, XXL
6. **Chanderi Silk Traditional Kurti** - M, L, XL, XXL
7. **Pure Cotton Kurti - Yellow** - S, M, L, XL, XXL
8. **Co-ord Set - Crop Top & Palazzo** - S, M, L, XL
9. **Floral Maxi Dress** - S, M, L, XL, XXL
10. **A-Line Midi Skirt - Black** - 28, 30, 32, 34, 36, 38 (waist sizes)
11. **Sequin Party Dress** - S, M, L, XL
12. **Plus Size Kurti - Floral** - XXL, XXXL, 4XL, 5XL
13. **Casual Summer Dress** - S, M, L, XL

#### Products WITHOUT Sizes (3 accessories):

1. **Designer Handbag - Brown** - No size (accessory)
2. **Oxidized Jewelry Set** - No size (accessory)
3. **Silk Scarf - Multicolor** - No size (accessory)

## 🚀 How to Run the Seed Script

### Method 1: Using npm script (Recommended)

```bash
npm run db:seed-fashion
```

### Method 2: Direct execution

```bash
tsx scripts/seedFashionProducts.ts
```

### Method 3: From project root

```bash
cd bmaafashion
npm run db:seed-fashion
```

## 📊 Expected Output

When you run the seed script, you'll see:

```
🌱 Starting fashion products seed...
📁 Seeding categories...
✅ Added category: Women's Fashion
✅ Added category: Accessories

📦 Seeding products...
✅ Added product: Floral Print Cotton Kurti Set (S, M, L, XL, XXL)
✅ Added product: Embroidered Kurti Set - Navy Blue (S, M, L, XL, XXL, XXXL)
✅ Added product: Printed Anarkali Kurti Set (M, L, XL, XXL)
... (more products)
✅ Added product: Designer Handbag - Brown (No size)
✅ Added product: Oxidized Jewelry Set (No size)
✅ Added product: Silk Scarf - Multicolor (No size)

✨ Seed completed successfully!
📊 Summary:
   - Categories: 2
   - Products added: 17
   - Products skipped: 0
   - Total products: 17

📋 Products with sizes:
   - 14 products have size options

📋 Products without sizes (accessories):
   - 3 products (accessories)

🎉 Fashion seed script completed!
```

## 🔄 Re-running the Script

The script is **idempotent** - it checks for existing products by SKU:

- **First run**: Adds all products
- **Subsequent runs**: Skips existing products, only adds new ones
- **Updates**: Categories are updated if they exist

## 📝 Product Data Structure

Each product includes:

```typescript
{
  name: "Product Name",
  description: "Detailed description...",
  price: "1299.00",
  unit: "per piece",
  size: "S, M, L, XL, XXL",  // or null for accessories
  mainCategory: "Women's Fashion",
  category: "Kurti Set",
  images: ["/attached_assets/products/image.jpg"],
  specifications: [
    "Material: 100% Cotton",
    "Pattern: Floral Print",
    // ... more specs
  ],
  inStock: 50,
  lowStockThreshold: 10,
  sku: "KS-FLR-001"
}
```

## 🎯 Size Formats Included

The seed data demonstrates various size formats:

### Letter Sizes:

- `"S, M, L, XL, XXL"`
- `"S, M, L, XL, XXL, XXXL"`
- `"M, L, XL, XXL"`

### Number Sizes:

- `"28, 30, 32, 34, 36, 38"` (waist measurements)

### Plus Sizes:

- `"XXL, XXXL, 4XL, 5XL"`

### No Size (Accessories):

- `null` or empty

## 🔍 Verifying the Seed

### Check in Admin Panel:

1. Login as admin
2. Go to **Products** page
3. You should see 17 products listed
4. Click **Edit** on any clothing product
5. Verify the **Size** field shows the sizes

### Check Size Selection (Frontend):

1. Go to any product detail page (e.g., Kurti Set)
2. You should see size buttons: S, M, L, XL, XXL
3. Try adding to cart without selecting size
4. Should show error: "Please select a size"
5. Select a size and add to cart
6. Should succeed with size in confirmation

### Check Accessories:

1. Go to handbag or jewelry product
2. No size selector should appear
3. Can add to cart directly

## 🛠️ Customizing the Seed Data

### Adding More Products:

Edit [`scripts/seedFashionProducts.ts`](scripts/seedFashionProducts.ts):

```typescript
const fashionProducts = [
  // ... existing products
  {
    name: "Your New Product",
    description: "Description here",
    price: "999.00",
    unit: "per piece",
    size: "S, M, L, XL", // Add sizes
    mainCategory: "Women's Fashion",
    category: "Kurti Set",
    images: ["/attached_assets/products/your-image.jpg"],
    specifications: ["Spec 1", "Spec 2"],
    inStock: 30,
    lowStockThreshold: 5,
    sku: "YOUR-SKU-001", // Unique SKU
  },
];
```

### Adding New Categories:

```typescript
const fashionCategories = [
  // ... existing categories
  {
    mainCategory: "Men's Fashion",
    subcategories: ["Shirts", "Pants", "Suits"],
    imageUrl: "/attached_assets/category/mens.jpeg",
  },
];
```

## 📋 Product SKU Format

SKUs follow this pattern:

- **KS-FLR-001** = Kurti Set - Floral - 001
- **SK-WHT-001** = Short Kurti - White - 001
- **TK-CND-001** = Traditional Kurti - Chanderi - 001
- **HB-BRN-001** = Handbag - Brown - 001

Format: `[Category]-[Variant]-[Number]`

## 🗄️ Database Tables Affected

### Tables Updated:

1. **categories** - Main and subcategories
2. **products** - All product data

### Fields Populated:

- `name`, `description`, `price`, `unit`
- `size` (with proper formats)
- `mainCategory`, `category`
- `images` (array)
- `specifications` (array)
- `inStock`, `lowStockThreshold`
- `sku` (unique identifier)

## ⚠️ Important Notes

### Before Running:

1. **Backup your database** if you have existing data
2. **Check database connection** in `.env` file
3. **Ensure database is migrated** (`npm run db:push`)

### After Running:

1. **Verify products** in admin panel
2. **Test size selection** on frontend
3. **Check images** (you may need to add actual image files)

### Image Files:

The seed uses placeholder image paths like:

- `/attached_assets/products/kurti-set-1.jpg`

You'll need to either:

- Add actual images to these paths
- Update the image URLs in the seed script
- Use the admin panel to upload real images

## 🔧 Troubleshooting

### Error: "Cannot find module"

```bash
# Make sure you're in the project directory
cd bmaafashion
npm run db:seed-fashion
```

### Error: "Database connection failed"

- Check `.env` file has correct `DATABASE_URL`
- Verify database is running
- Run `npm run db:push` first

### Products not appearing:

- Check console output for errors
- Verify SKUs are unique
- Check database connection

### Sizes not working:

- Verify product category matches SIZE_REQUIRED_CATEGORIES
- Check size format (comma-separated)
- Clear browser cache

## 📚 Related Documentation

- [`SIZE_VALIDATION_GUIDE.md`](SIZE_VALIDATION_GUIDE.md) - Size validation in admin
- [`CART_SIZE_SELECTION_GUIDE.md`](CART_SIZE_SELECTION_GUIDE.md) - Size selection in cart
- [`MULTIPLE_IMAGES_GUIDE.md`](MULTIPLE_IMAGES_GUIDE.md) - Multiple image upload

## 🎉 Success Criteria

After running the seed, you should have:

- ✅ 2 main categories with subcategories
- ✅ 17 products (14 with sizes, 3 without)
- ✅ Size selection working on product pages
- ✅ Add to cart validation for sized products
- ✅ Accessories can be added without size selection

## 💡 Tips

1. **Start Fresh**: If testing, you can delete all products and re-run
2. **Incremental**: Add a few products first, test, then add more
3. **Real Images**: Replace placeholder images with actual product photos
4. **Pricing**: Adjust prices based on your market
5. **Stock Levels**: Update stock quantities as needed

## Summary

The seed script provides a complete, production-ready dataset with:

- ✅ Proper size configurations
- ✅ Multiple size formats (S/M/L and numbers)
- ✅ Products with and without sizes
- ✅ Realistic product descriptions
- ✅ Proper categorization
- ✅ Stock management data

Run `npm run db:seed-fashion` to populate your database with sample fashion products!
