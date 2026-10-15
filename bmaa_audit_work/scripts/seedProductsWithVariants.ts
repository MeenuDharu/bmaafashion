import { db } from "../server/db";
import { products, productVariants, categories, orderItems, orders, cartItems } from "../shared/schema";
import { eq } from "drizzle-orm";

const fashionProducts = [
  {
    name: "Black Embroidered Short Kurti",
    description: "Elegant black kurti with beautiful embroidery. Perfect for casual and semi-formal occasions. Made from premium cotton fabric for all-day comfort.",
    price: "399.00",
    category: "KURTIS",
    mainCategory: "Kits",
    unit: "per piece",
    images: ["/attached_assets/product-images/product-1791214267753-973016103.jpeg"],
    inStock: 40, // Total across all variants
    lowStockThreshold: 5,
    variants: [
      { size: "S", color: "Black", stockQuantity: 10, sku: "BEK-S-BLK" },
      { size: "M", color: "Black", stockQuantity: 10, sku: "BEK-M-BLK" },
      { size: "L", color: "Black", stockQuantity: 10, sku: "BEK-L-BLK" },
      { size: "XL", color: "Black", stockQuantity: 10, sku: "BEK-XL-BLK" },
    ]
  },
  {
    name: "A-Line Midi Skirt - Black",
    description: "Classic black A-line midi skirt. Versatile and stylish, perfect for office wear or evening outings. Comfortable fit with premium fabric.",
    price: "899.00",
    category: "SKIRT",
    mainCategory: "Kits",
    unit: "per piece",
    images: ["/attached_assets/product-images/product-1791214275089-437805264.jpeg"],
    inStock: 50,
    lowStockThreshold: 5,
    variants: [
      { size: "S", color: "Black", stockQuantity: 12, sku: "AMS-S-BLK" },
      { size: "M", color: "Black", stockQuantity: 15, sku: "AMS-M-BLK" },
      { size: "L", color: "Black", stockQuantity: 13, sku: "AMS-L-BLK" },
      { size: "XL", color: "Black", stockQuantity: 10, sku: "AMS-XL-BLK" },
    ]
  },
  {
    name: "Floral Print Maxi Dress",
    description: "Beautiful floral print maxi dress perfect for summer. Lightweight, breathable fabric with elegant design. Ideal for parties and special occasions.",
    price: "1299.00",
    category: "Maxi Dress",
    mainCategory: "Kits",
    unit: "per piece",
    images: [],
    inStock: 35,
    lowStockThreshold: 5,
    variants: [
      { size: "S", color: "Pink", stockQuantity: 8, sku: "FMD-S-PNK" },
      { size: "M", color: "Pink", stockQuantity: 10, sku: "FMD-M-PNK" },
      { size: "L", color: "Pink", stockQuantity: 9, sku: "FMD-L-PNK" },
      { size: "XL", color: "Pink", stockQuantity: 8, sku: "FMD-XL-PNK" },
    ]
  },
  {
    name: "Cotton Kurti Set - Blue",
    description: "Comfortable cotton kurti set in beautiful blue color. Includes kurti and matching bottom. Perfect for daily wear with traditional touch.",
    price: "799.00",
    category: "Cotton Kurti Set",
    mainCategory: "Kits",
    unit: "per set",
    images: [],
    inStock: 45,
    lowStockThreshold: 5,
    variants: [
      { size: "S", color: "Blue", stockQuantity: 10, sku: "CKS-S-BLU" },
      { size: "M", color: "Blue", stockQuantity: 12, sku: "CKS-M-BLU" },
      { size: "L", color: "Blue", stockQuantity: 13, sku: "CKS-L-BLU" },
      { size: "XL", color: "Blue", stockQuantity: 10, sku: "CKS-XL-BLU" },
    ]
  },
  {
    name: "Party Wear Saree - Red",
    description: "Stunning red party wear saree with intricate embroidery. Perfect for weddings and special occasions. Comes with matching blouse piece.",
    price: "2499.00",
    category: "Party Wear Sarees",
    mainCategory: "Kits",
    unit: "per piece",
    images: [],
    inStock: 25,
    lowStockThreshold: 3,
    variants: [
      { size: "Free Size", color: "Red", stockQuantity: 8, sku: "PWS-FS-RED" },
      { size: "Free Size", color: "Maroon", stockQuantity: 9, sku: "PWS-FS-MAR" },
      { size: "Free Size", color: "Pink", stockQuantity: 8, sku: "PWS-FS-PNK" },
    ]
  },
  {
    name: "Coord Set - White & Black",
    description: "Trendy coord set in white and black combination. Modern design perfect for casual outings. Comfortable and stylish.",
    price: "1099.00",
    category: "Co-ord Set",
    mainCategory: "Kits",
    unit: "per set",
    images: [],
    inStock: 40,
    lowStockThreshold: 5,
    variants: [
      { size: "S", color: "White", stockQuantity: 10, sku: "CS-S-WHT" },
      { size: "M", color: "White", stockQuantity: 10, sku: "CS-M-WHT" },
      { size: "L", color: "White", stockQuantity: 10, sku: "CS-L-WHT" },
      { size: "XL", color: "White", stockQuantity: 10, sku: "CS-XL-WHT" },
    ]
  },
  {
    name: "Traditional Kurti - Yellow",
    description: "Beautiful traditional kurti in vibrant yellow color. Perfect for festivals and traditional events. Made from premium cotton.",
    price: "599.00",
    category: "Traditional Kurti",
    mainCategory: "Kits",
    unit: "per piece",
    images: [],
    inStock: 48,
    lowStockThreshold: 5,
    variants: [
      { size: "S", color: "Yellow", stockQuantity: 12, sku: "TK-S-YEL" },
      { size: "M", color: "Yellow", stockQuantity: 12, sku: "TK-M-YEL" },
      { size: "L", color: "Yellow", stockQuantity: 12, sku: "TK-L-YEL" },
      { size: "XL", color: "Yellow", stockQuantity: 12, sku: "TK-XL-YEL" },
    ]
  },
  {
    name: "Short Kurti - Multi Color",
    description: "Stylish short kurti available in multiple colors. Perfect for casual wear with jeans or leggings. Comfortable and trendy.",
    price: "449.00",
    category: "Short Kurtis",
    mainCategory: "Kits",
    unit: "per piece",
    images: [],
    inStock: 60,
    lowStockThreshold: 8,
    variants: [
      { size: "S", color: "Red", stockQuantity: 10, sku: "SK-S-RED" },
      { size: "M", color: "Red", stockQuantity: 10, sku: "SK-M-RED" },
      { size: "L", color: "Red", stockQuantity: 10, sku: "SK-L-RED" },
      { size: "S", color: "Blue", stockQuantity: 10, sku: "SK-S-BLU" },
      { size: "M", color: "Blue", stockQuantity: 10, sku: "SK-M-BLU" },
      { size: "L", color: "Blue", stockQuantity: 10, sku: "SK-L-BLU" },
    ]
  },
  {
    name: "Plus Size Collection - Kurti",
    description: "Specially designed kurti for plus size. Comfortable fit with elegant design. Available in multiple sizes for perfect fit.",
    price: "899.00",
    category: "Plus Size Collection",
    mainCategory: "Kits",
    unit: "per piece",
    images: [],
    inStock: 30,
    lowStockThreshold: 5,
    variants: [
      { size: "XXL", color: "Black", stockQuantity: 10, sku: "PSK-XXL-BLK" },
      { size: "XXXL", color: "Black", stockQuantity: 10, sku: "PSK-XXXL-BLK" },
      { size: "4XL", color: "Black", stockQuantity: 10, sku: "PSK-4XL-BLK" },
    ]
  },
  {
    name: "Cotton Saree - Green",
    description: "Pure cotton saree in beautiful green color. Perfect for daily wear and office. Comfortable and easy to maintain.",
    price: "699.00",
    category: "Cotton Saree",
    mainCategory: "Kits",
    unit: "per piece",
    images: [],
    inStock: 35,
    lowStockThreshold: 5,
    variants: [
      { size: "Free Size", color: "Green", stockQuantity: 12, sku: "CS-FS-GRN" },
      { size: "Free Size", color: "Light Green", stockQuantity: 11, sku: "CS-FS-LGRN" },
      { size: "Free Size", color: "Dark Green", stockQuantity: 12, sku: "CS-FS-DGRN" },
    ]
  },
];

async function seedProductsWithVariants() {
  try {
    console.log("🗑️  Clearing existing data...");
    
    // Delete in order of foreign key dependencies
    // 1. Delete order items first (references products)
    await db.delete(orderItems);
    console.log("✅ Cleared all order items");
    
    // 2. Delete orders
    await db.delete(orders);
    console.log("✅ Cleared all orders");
    
    // 3. Delete cart items (references products)
    await db.delete(cartItems);
    console.log("✅ Cleared all cart items");
    
    // 4. Delete product variants (references products)
    await db.delete(productVariants);
    console.log("✅ Cleared all product variants");
    
    // 5. Finally delete products
    await db.delete(products);
    console.log("✅ Cleared all products");

    console.log("\n📦 Adding new products with variants...");

    for (const productData of fashionProducts) {
      const { variants, ...productInfo } = productData;

      // Insert product
      const [newProduct] = await db
        .insert(products)
        .values(productInfo)
        .returning();

      console.log(`✅ Added product: ${newProduct.name} (ID: ${newProduct.id})`);

      // Insert variants for this product
      if (variants && variants.length > 0) {
        for (const variant of variants) {
          await db.insert(productVariants).values({
            productId: newProduct.id,
            sku: variant.sku,
            size: variant.size,
            color: variant.color,
            stockQuantity: variant.stockQuantity,
            lowStockThreshold: 5,
            isActive: true,
            sortOrder: 0,
          });
        }
        console.log(`  ↳ Added ${variants.length} variants`);
      }
    }

    console.log("\n✨ Successfully seeded products with variants!");
    console.log(`📊 Total products: ${fashionProducts.length}`);
    console.log(`📊 Total variants: ${fashionProducts.reduce((sum, p) => sum + (p.variants?.length || 0), 0)}`);
    
  } catch (error) {
    console.error("❌ Error seeding products:", error);
    throw error;
  }
}

// Run the seed function
seedProductsWithVariants()
  .then(() => {
    console.log("\n🎉 Seeding completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Seeding failed:", error);
    process.exit(1);
  });
