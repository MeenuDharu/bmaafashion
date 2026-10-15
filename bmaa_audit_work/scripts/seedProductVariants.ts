// Seed script to add product variants with dummy data
// Run with: npx tsx scripts/seedProductVariants.ts

import { db } from "../server/db";
import { products, productVariants } from "../shared/schema";
import { eq } from "drizzle-orm";

async function seedProductVariants() {
  console.log("🌱 Starting product variants seeding...");

  try {
    // Get some existing products
    const existingProducts = await db.select().from(products).limit(5);

    if (existingProducts.length === 0) {
      console.log("❌ No products found. Please seed products first.");
      return;
    }

    console.log(`📦 Found ${existingProducts.length} products to add variants to`);

    // Define variant data for different product types
    const colors = ["Red", "Blue", "Black", "White", "Green", "Pink", "Navy", "Maroon"];
    const sizes = ["S", "M", "L", "XL", "XXL"];

    let totalVariantsCreated = 0;

    for (const product of existingProducts) {
      console.log(`\n📝 Adding variants for: ${product.name}`);

      // Randomly select 2-3 colors and 3-4 sizes for variety
      const productColors = colors.slice(0, Math.floor(Math.random() * 2) + 2);
      const productSizes = sizes.slice(0, Math.floor(Math.random() * 2) + 3);

      const variants = [];

      for (const color of productColors) {
        for (const size of productSizes) {
          // Generate random stock between 5 and 50
          const stock = Math.floor(Math.random() * 46) + 5;
          
          // XL and XXL might cost slightly more
          const basePrice = parseFloat(product.price);
          const priceMultiplier = (size === "XL" || size === "XXL") ? 1.1 : 1.0;
          const variantPrice = (basePrice * priceMultiplier).toFixed(2);

          // Generate SKU
          const colorCode = color.substring(0, 3).toUpperCase();
          const sizeCode = size;
          const randomCode = Math.random().toString(36).substring(2, 6).toUpperCase();
          const sku = `${colorCode}-${sizeCode}-${randomCode}`;

          variants.push({
            productId: product.id,
            color,
            size,
            price: variantPrice,
            stockQuantity: stock,
            lowStockThreshold: 5,
            sku,
            isActive: true,
            sortOrder: 0,
          });
        }
      }

      // Insert variants for this product
      if (variants.length > 0) {
        await db.insert(productVariants).values(variants);
        console.log(`   ✅ Created ${variants.length} variants`);
        totalVariantsCreated += variants.length;

        // Show sample variants
        console.log(`   📊 Sample variants:`);
        variants.slice(0, 3).forEach(v => {
          console.log(`      - ${v.color} ${v.size}: ₹${v.price} (${v.stockQuantity} units) [${v.sku}]`);
        });
        if (variants.length > 3) {
          console.log(`      ... and ${variants.length - 3} more`);
        }
      }
    }

    console.log(`\n✅ Successfully created ${totalVariantsCreated} product variants!`);
    console.log("\n📊 Summary:");
    console.log(`   - Products with variants: ${existingProducts.length}`);
    console.log(`   - Total variants created: ${totalVariantsCreated}`);
    console.log(`   - Average variants per product: ${(totalVariantsCreated / existingProducts.length).toFixed(1)}`);

  } catch (error) {
    console.error("❌ Error seeding product variants:", error);
    throw error;
  }
}

// Run the seed function
seedProductVariants()
  .then(() => {
    console.log("\n🎉 Variant seeding completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Variant seeding failed:", error);
    process.exit(1);
  });
