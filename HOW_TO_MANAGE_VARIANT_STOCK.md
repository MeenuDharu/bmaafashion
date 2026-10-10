# How to Manage Product Variants Stock (Color & Size Quantities)

## 📦 What is Product Variants?

Product variants allow you to track **individual stock quantities** for each combination of color and size. For example:

**Product: Summer Dress**

- Red, Size M: 10 units
- Red, Size L: 15 units
- Blue, Size M: 8 units
- Blue, Size L: 12 units

Each combination has its own stock count!

## 🎯 Step-by-Step Guide

### Step 1: First, Run the Database Migration

Before you can use variants, apply the database changes:

```bash
cd bmaafashion
npm run db:push
```

This creates the `product_variants` table in your database.

### Step 2: Add the Variants Manager to Admin Products Page

I've created a component [`ProductVariantsManager.tsx`](bmaafashion/client/src/components/ProductVariantsManager.tsx:1) that you need to integrate into your admin panel.

**Open [`AdminProducts.tsx`](bmaafashion/client/src/pages/admin/AdminProducts.tsx:1)** and add this import at the top:

```typescript
import ProductVariantsManager from "@/components/ProductVariantsManager";
```

Then add the variants manager inside your product edit dialog (after the images field):

```typescript
{/* Add this after the images field in the edit dialog */}
<ProductVariantsManager
  productId={editingProduct.id}
  productName={editingProduct.name}
  basePrice={editingProduct.price.toString()}
/>
```

### Step 3: Create API Endpoints

Add these endpoints to [`server/routes.ts`](bmaafashion/server/routes.ts:1):

```typescript
// Get product variants
app.get("/api/products/:productId/variants", async (req, res) => {
  try {
    const { productId } = req.params;
    const variants = await storage.getProductVariants(productId);
    res.json(variants);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch variants" });
  }
});

// Create variant (Admin only)
app.post(
  "/api/admin/products/:productId/variants",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { productId } = req.params;
      const variantData = req.body;
      const variant = await storage.createProductVariant(
        productId,
        variantData,
      );
      res.json(variant);
    } catch (error) {
      res.status(500).json({ error: "Failed to create variant" });
    }
  },
);

// Update variant (Admin only)
app.put(
  "/api/admin/products/variants/:variantId",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { variantId } = req.params;
      const updates = req.body;
      const variant = await storage.updateProductVariant(variantId, updates);
      res.json(variant);
    } catch (error) {
      res.status(500).json({ error: "Failed to update variant" });
    }
  },
);

// Delete variant (Admin only)
app.delete(
  "/api/admin/products/variants/:variantId",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const { variantId } = req.params;
      await storage.deleteProductVariant(variantId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete variant" });
    }
  },
);
```

### Step 4: Add Storage Methods

Add these methods to your storage file (likely `server/storage.ts` or `server/db.ts`):

```typescript
import { productVariants } from "@shared/schema";
import { eq, and } from "drizzle-orm";

// Get all variants for a product
async getProductVariants(productId: string) {
  return await this.db
    .select()
    .from(productVariants)
    .where(eq(productVariants.productId, productId))
    .orderBy(productVariants.sortOrder);
}

// Create a new variant
async createProductVariant(productId: string, data: any) {
  const [variant] = await this.db
    .insert(productVariants)
    .values({
      productId,
      color: data.color,
      size: data.size,
      price: data.price,
      stockQuantity: data.stockQuantity,
      sku: data.sku,
      isActive: data.isActive ?? true,
      lowStockThreshold: data.lowStockThreshold ?? 5,
    })
    .returning();
  return variant;
}

// Update a variant
async updateProductVariant(variantId: string, data: any) {
  const [variant] = await this.db
    .update(productVariants)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(productVariants.id, variantId))
    .returning();
  return variant;
}

// Delete a variant
async deleteProductVariant(variantId: string) {
  await this.db
    .delete(productVariants)
    .where(eq(productVariants.id, variantId));
}

// Get a specific variant by color and size
async getVariantByColorSize(productId: string, color: string, size: string) {
  const [variant] = await this.db
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

## 💡 How to Use in Admin Panel

### Adding Variants to a Product

1. **Go to Admin → Products**
2. **Click Edit** on any product
3. **Scroll to "Product Variants" section**
4. **Click "Add Variant"** button
5. **Fill in the form:**
   - **Color**: Red, Blue, Black, etc.
   - **Size**: S, M, L, XL, XXL, etc.
   - **Price**: ₹1,999 (can be different per variant)
   - **Stock Quantity**: How many units of this specific variant
   - **SKU**: Auto-generate or enter manually (e.g., RED-M-001)
6. **Click "Create Variant"**

### Example: Creating Variants for a Dress

**Product: "Floral Summer Dress" - Base Price: ₹1,999**

Add these variants:

| Color | Size | Price  | Stock | SKU        |
| ----- | ---- | ------ | ----- | ---------- |
| Red   | S    | ₹1,999 | 10    | RED-S-001  |
| Red   | M    | ₹1,999 | 15    | RED-M-001  |
| Red   | L    | ₹1,999 | 12    | RED-L-001  |
| Red   | XL   | ₹2,199 | 8     | RED-XL-001 |
| Blue  | S    | ₹1,999 | 8     | BLU-S-001  |
| Blue  | M    | ₹1,999 | 20    | BLU-M-001  |
| Blue  | L    | ₹1,999 | 10    | BLU-L-001  |
| Blue  | XL   | ₹2,199 | 5     | BLU-XL-001 |

**Total Stock: 88 units** (automatically calculated)

### Updating Stock Quantities

1. **Find the variant** in the table
2. **Click the edit icon** (pencil) next to the stock number
3. **Enter new quantity**
4. **Press Enter** or click the save icon
5. **Done!** Stock updated instantly

### Quick Stock Update Example

**Scenario**: You sold 3 Blue-M dresses

1. Find "Blue, M" row
2. Click edit on stock (currently shows 20)
3. Change to 17
4. Press Enter
5. Stock updated to 17 units

## 🛒 How Customers Will See It

### On Product Detail Page

When a customer views the product:

1. **Select Color**: Red or Blue (buttons)
2. **Select Size**: S, M, L, XL (buttons)
3. **See Stock**: "20 units available" (for that specific variant)
4. **See Price**: ₹1,999 or ₹2,199 (if XL costs more)
5. **Add to Cart**: Adds the specific Red-M or Blue-L variant

### Stock Validation

- If Blue-M has 0 stock → "Out of Stock" badge
- If Blue-M has 3 units → "Low Stock" warning
- Customer can't add more than available stock

## 📊 Benefits of This System

### 1. **Accurate Inventory**

- Know exactly how many Red-M vs Blue-L you have
- No more guessing or manual tracking

### 2. **Prevent Overselling**

- System checks stock at variant level
- Can't sell Blue-M if only Red-M is available

### 3. **Better Pricing**

- Charge more for XL/XXL sizes
- Run sales on specific colors

### 4. **Easy Restocking**

- See which variants are low
- Reorder specific color-size combinations

### 5. **Analytics**

- Track which variants sell best
- Know customer preferences (e.g., "M size in Blue sells fastest")

## 🎨 Visual Example

```
Product: Summer Dress (₹1,999)
├── Red
│   ├── S: 10 units ✅ In Stock
│   ├── M: 15 units ✅ In Stock
│   ├── L: 2 units ⚠️ Low Stock
│   └── XL: 0 units ❌ Out of Stock
└── Blue
    ├── S: 8 units ✅ In Stock
    ├── M: 20 units ✅ In Stock
    ├── L: 10 units ✅ In Stock
    └── XL: 5 units ✅ In Stock

Total Stock: 70 units
```

## 🔄 Common Workflows

### Workflow 1: New Product Arrival

1. Create base product
2. Add variants for all color-size combinations
3. Enter stock quantities from your inventory
4. Publish product

### Workflow 2: Restocking

1. Go to product edit
2. Find low stock variants
3. Click edit on stock
4. Add new quantity (e.g., 5 → 25)
5. Save

### Workflow 3: Sale/Discount

1. Find variants you want to discount
2. Edit price (e.g., ₹1,999 → ₹1,499)
3. Save
4. Customers see discounted price for those variants

### Workflow 4: Discontinuing a Variant

1. Find the variant
2. Click delete button
3. Confirm deletion
4. Variant removed (customers can't select it)

## 📝 Best Practices

### 1. **Consistent Naming**

- Use standard color names: Red, Blue, Black (not Crimson, Navy, Charcoal)
- Use standard sizes: S, M, L, XL, XXL (not Small, Medium)

### 2. **SKU Format**

- Use format: `COLOR-SIZE-NUMBER`
- Example: `RED-M-001`, `BLU-L-002`
- Makes inventory tracking easier

### 3. **Stock Thresholds**

- Set low stock threshold (default: 5 units)
- Get alerts when variants run low
- Reorder before running out

### 4. **Pricing Strategy**

- Keep S, M, L at same price
- Charge 10-15% more for XL, XXL
- Example: S/M/L = ₹1,999, XL/XXL = ₹2,199

### 5. **Regular Updates**

- Update stock after receiving inventory
- Check low stock variants weekly
- Remove discontinued variants

## 🚀 Quick Start Checklist

- [ ] Run database migration (`npm run db:push`)
- [ ] Add API endpoints to `routes.ts`
- [ ] Add storage methods to `storage.ts`
- [ ] Import `ProductVariantsManager` in `AdminProducts.tsx`
- [ ] Add component to product edit dialog
- [ ] Test creating a variant
- [ ] Test updating stock
- [ ] Test deleting a variant
- [ ] Verify total stock calculation

## 🆘 Troubleshooting

### "Failed to fetch variants"

- Check API endpoint is added
- Verify database migration ran
- Check product ID is correct

### "Failed to create variant"

- Ensure color or size is filled
- Check for duplicate color-size combination
- Verify stock quantity is a number

### "Can't update stock"

- Check you're logged in as admin
- Verify variant ID exists
- Ensure new quantity is valid (≥ 0)

## 📞 Need Help?

Refer to:

- [`PRODUCT_VARIANTS_GUIDE.md`](bmaafashion/PRODUCT_VARIANTS_GUIDE.md:1) - Complete system overview
- [`PRODUCT_VARIANTS_IMPLEMENTATION.md`](bmaafashion/PRODUCT_VARIANTS_IMPLEMENTATION.md:1) - Technical implementation
- [`ProductVariantsManager.tsx`](bmaafashion/client/src/components/ProductVariantsManager.tsx:1) - UI component code

---

**You now have a complete system to manage stock quantities for different colors and sizes!** 🎉
