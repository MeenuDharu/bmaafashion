import { db } from "../server/db";
import { products, categories } from "../shared/schema";
import { eq } from "drizzle-orm";

/**
 * Seed script for fashion products with sizes
 * Run with: npm run seed:fashion
 */

const fashionCategories = [
  {
    mainCategory: "Women's Fashion",
    subcategories: [
      "Kurti Set",
      "Short Kurti",
      "Traditional Kurti",
      "Cotton Kurti",
      "Coord Set",
      "Maxi",
      "Skirt",
      "Party Wear",
      "Plus Size Collection",
      "Dress",
      "Gown",
      "Lehenga",
      "Saree Blouse",
      "Top",
      "Bottom",
      "Jumpsuit",
      "Romper",
    ],
    imageUrl: "/attached_assets/category/kurthiset.jpeg",
  },
  {
    mainCategory: "Accessories",
    subcategories: [
      "Handbags",
      "Jewelry",
      "Scarves",
      "Belts",
      "Sunglasses",
      "Watches",
    ],
    imageUrl: "/attached_assets/category/accessories.jpeg",
  },
];

const fashionProducts = [
  // Kurti Sets
  {
    name: "Floral Print Cotton Kurti Set",
    description: "Beautiful floral print cotton kurti set with matching palazzo pants. Perfect for casual and semi-formal occasions. Made from 100% pure cotton for maximum comfort.",
    price: "1299.00",
    unit: "per piece",
    size: "S, M, L, XL, XXL",
    mainCategory: "Women's Fashion",
    category: "Kurti Set",
    images: [
      "/attached_assets/products/kurti-set-1.jpg",
      "/attached_assets/products/kurti-set-1-back.jpg",
    ],
    specifications: [
      "Material: 100% Cotton",
      "Pattern: Floral Print",
      "Sleeve: 3/4 Sleeve",
      "Includes: Kurti + Palazzo",
      "Wash Care: Machine Wash",
    ],
    inStock: 50,
    lowStockThreshold: 10,
    sku: "KS-FLR-001",
  },
  {
    name: "Embroidered Kurti Set - Navy Blue",
    description: "Elegant navy blue kurti set with intricate embroidery work. Features beautiful thread work on the neckline and sleeves. Comes with matching dupatta.",
    price: "1899.00",
    unit: "per piece",
    size: "S, M, L, XL, XXL, XXXL",
    mainCategory: "Women's Fashion",
    category: "Kurti Set",
    images: [
      "/attached_assets/products/kurti-set-2.jpg",
    ],
    specifications: [
      "Material: Rayon",
      "Pattern: Embroidered",
      "Sleeve: Full Sleeve",
      "Includes: Kurti + Palazzo + Dupatta",
      "Occasion: Festive, Party",
    ],
    inStock: 35,
    lowStockThreshold: 8,
    sku: "KS-EMB-002",
  },
  {
    name: "Printed Anarkali Kurti Set",
    description: "Stunning printed Anarkali style kurti set in vibrant colors. Flared design with gota patti work. Perfect for festivals and celebrations.",
    price: "2199.00",
    unit: "per piece",
    size: "M, L, XL, XXL",
    mainCategory: "Women's Fashion",
    category: "Kurti Set",
    images: [
      "/attached_assets/products/kurti-set-3.jpg",
    ],
    specifications: [
      "Material: Georgette",
      "Pattern: Digital Print",
      "Style: Anarkali",
      "Includes: Kurti + Legging + Dupatta",
      "Occasion: Wedding, Festival",
    ],
    inStock: 25,
    lowStockThreshold: 5,
    sku: "KS-ANK-003",
  },

  // Short Kurtis
  {
    name: "Casual Short Kurti - White",
    description: "Comfortable white short kurti perfect for daily wear. Simple yet elegant design with side slits. Pairs well with jeans or leggings.",
    price: "599.00",
    unit: "per piece",
    size: "S, M, L, XL",
    mainCategory: "Women's Fashion",
    category: "Short Kurti",
    images: [
      "/attached_assets/products/short-kurti-1.jpg",
    ],
    specifications: [
      "Material: Cotton Blend",
      "Length: 28 inches",
      "Sleeve: Short Sleeve",
      "Neck: Round Neck",
      "Wash Care: Hand Wash",
    ],
    inStock: 60,
    lowStockThreshold: 15,
    sku: "SK-WHT-001",
  },
  {
    name: "Printed Short Kurti - Multicolor",
    description: "Vibrant multicolor printed short kurti with trendy design. Features button detailing and side pockets. Great for college and casual outings.",
    price: "749.00",
    unit: "per piece",
    size: "S, M, L, XL, XXL",
    mainCategory: "Women's Fashion",
    category: "Short Kurti",
    images: [
      "/attached_assets/products/short-kurti-2.jpg",
    ],
    specifications: [
      "Material: Rayon",
      "Length: 26 inches",
      "Sleeve: Sleeveless",
      "Pattern: Abstract Print",
      "Features: Side Pockets",
    ],
    inStock: 45,
    lowStockThreshold: 10,
    sku: "SK-PRT-002",
  },

  // Traditional Kurtis
  {
    name: "Chanderi Silk Traditional Kurti",
    description: "Luxurious Chanderi silk kurti with traditional motifs. Hand-block printed with natural dyes. Perfect for special occasions and festivals.",
    price: "2499.00",
    unit: "per piece",
    size: "M, L, XL, XXL",
    mainCategory: "Women's Fashion",
    category: "Traditional Kurti",
    images: [
      "/attached_assets/products/traditional-kurti-1.jpg",
    ],
    specifications: [
      "Material: Chanderi Silk",
      "Print: Hand Block Print",
      "Length: 42 inches",
      "Sleeve: 3/4 Sleeve",
      "Occasion: Festive, Traditional",
    ],
    inStock: 20,
    lowStockThreshold: 5,
    sku: "TK-CND-001",
  },

  // Cotton Kurtis
  {
    name: "Pure Cotton Kurti - Yellow",
    description: "Bright yellow pure cotton kurti with comfortable fit. Breathable fabric perfect for summer. Features beautiful neckline embroidery.",
    price: "899.00",
    unit: "per piece",
    size: "S, M, L, XL, XXL",
    mainCategory: "Women's Fashion",
    category: "Cotton Kurti",
    images: [
      "/attached_assets/products/cotton-kurti-1.jpg",
    ],
    specifications: [
      "Material: 100% Pure Cotton",
      "Color: Yellow",
      "Length: 38 inches",
      "Sleeve: Short Sleeve",
      "Wash Care: Machine Wash",
    ],
    inStock: 55,
    lowStockThreshold: 12,
    sku: "CK-YEL-001",
  },

  // Coord Sets
  {
    name: "Co-ord Set - Crop Top & Palazzo",
    description: "Trendy co-ord set with crop top and wide-leg palazzo pants. Modern design perfect for parties and casual outings. Comfortable and stylish.",
    price: "1599.00",
    unit: "per piece",
    size: "S, M, L, XL",
    mainCategory: "Women's Fashion",
    category: "Coord Set",
    images: [
      "/attached_assets/products/coord-set-1.jpg",
    ],
    specifications: [
      "Material: Crepe",
      "Includes: Crop Top + Palazzo",
      "Pattern: Solid",
      "Occasion: Party, Casual",
      "Fit: Regular",
    ],
    inStock: 40,
    lowStockThreshold: 10,
    sku: "CS-CRP-001",
  },

  // Maxi Dresses
  {
    name: "Floral Maxi Dress",
    description: "Elegant floral print maxi dress with flowing silhouette. Perfect for beach vacations and summer parties. Comfortable and breezy.",
    price: "1799.00",
    unit: "per piece",
    size: "S, M, L, XL, XXL",
    mainCategory: "Women's Fashion",
    category: "Maxi",
    images: [
      "/attached_assets/products/maxi-1.jpg",
    ],
    specifications: [
      "Material: Georgette",
      "Length: Floor Length",
      "Pattern: Floral Print",
      "Sleeve: Sleeveless",
      "Occasion: Beach, Party",
    ],
    inStock: 30,
    lowStockThreshold: 8,
    sku: "MX-FLR-001",
  },

  // Skirts
  {
    name: "A-Line Midi Skirt - Black",
    description: "Classic black A-line midi skirt. Versatile piece that can be dressed up or down. Features side zipper and comfortable waistband.",
    price: "899.00",
    unit: "per piece",
    size: "28, 30, 32, 34, 36, 38",
    mainCategory: "Women's Fashion",
    category: "Skirt",
    images: [
      "/attached_assets/products/skirt-1.jpg",
    ],
    specifications: [
      "Material: Polyester Blend",
      "Length: Midi",
      "Style: A-Line",
      "Closure: Side Zipper",
      "Occasion: Office, Casual",
    ],
    inStock: 50,
    lowStockThreshold: 10,
    sku: "SK-BLK-001",
  },

  // Party Wear
  {
    name: "Sequin Party Dress",
    description: "Glamorous sequin party dress that sparkles. Perfect for cocktail parties and special events. Figure-hugging silhouette with elegant design.",
    price: "2999.00",
    unit: "per piece",
    size: "S, M, L, XL",
    mainCategory: "Women's Fashion",
    category: "Party Wear",
    images: [
      "/attached_assets/products/party-wear-1.jpg",
    ],
    specifications: [
      "Material: Sequin Fabric",
      "Length: Knee Length",
      "Sleeve: Sleeveless",
      "Occasion: Party, Cocktail",
      "Care: Dry Clean Only",
    ],
    inStock: 15,
    lowStockThreshold: 5,
    sku: "PW-SEQ-001",
  },

  // Plus Size Collection
  {
    name: "Plus Size Kurti - Floral",
    description: "Beautiful floral kurti designed specifically for plus size. Comfortable fit with flattering cut. Made from soft, breathable fabric.",
    price: "1299.00",
    unit: "per piece",
    size: "XXL, XXXL, 4XL, 5XL",
    mainCategory: "Women's Fashion",
    category: "Plus Size Collection",
    images: [
      "/attached_assets/products/plus-size-1.jpg",
    ],
    specifications: [
      "Material: Cotton Blend",
      "Fit: Relaxed",
      "Pattern: Floral",
      "Length: 40 inches",
      "Occasion: Daily Wear",
    ],
    inStock: 35,
    lowStockThreshold: 8,
    sku: "PS-FLR-001",
  },

  // Dresses
  {
    name: "Casual Summer Dress",
    description: "Light and airy summer dress perfect for hot days. Features adjustable straps and side pockets. Easy to wear and maintain.",
    price: "999.00",
    unit: "per piece",
    size: "S, M, L, XL",
    mainCategory: "Women's Fashion",
    category: "Dress",
    images: [
      "/attached_assets/products/dress-1.jpg",
    ],
    specifications: [
      "Material: Cotton",
      "Length: Knee Length",
      "Sleeve: Sleeveless",
      "Features: Adjustable Straps, Pockets",
      "Occasion: Casual, Daily Wear",
    ],
    inStock: 45,
    lowStockThreshold: 10,
    sku: "DR-SUM-001",
  },

  // Accessories (No size required)
  {
    name: "Designer Handbag - Brown",
    description: "Elegant brown designer handbag with multiple compartments. Made from premium quality faux leather. Perfect for office and casual use.",
    price: "1499.00",
    unit: "per piece",
    size: null,
    mainCategory: "Accessories",
    category: "Handbags",
    images: [
      "/attached_assets/products/handbag-1.jpg",
    ],
    specifications: [
      "Material: Faux Leather",
      "Color: Brown",
      "Compartments: 3 Main + 2 Side Pockets",
      "Closure: Zipper",
      "Dimensions: 12x10x4 inches",
    ],
    inStock: 40,
    lowStockThreshold: 10,
    sku: "HB-BRN-001",
  },
  {
    name: "Oxidized Jewelry Set",
    description: "Beautiful oxidized jewelry set including necklace and earrings. Traditional design perfect for ethnic wear. Lightweight and comfortable.",
    price: "599.00",
    unit: "per piece",
    size: null,
    mainCategory: "Accessories",
    category: "Jewelry",
    images: [
      "/attached_assets/products/jewelry-1.jpg",
    ],
    specifications: [
      "Material: Oxidized Metal",
      "Includes: Necklace + Earrings",
      "Style: Traditional",
      "Color: Silver",
      "Occasion: Festive, Party",
    ],
    inStock: 60,
    lowStockThreshold: 15,
    sku: "JW-OXD-001",
  },
  {
    name: "Silk Scarf - Multicolor",
    description: "Luxurious silk scarf with vibrant multicolor print. Can be worn multiple ways. Adds elegance to any outfit.",
    price: "799.00",
    unit: "per piece",
    size: null,
    mainCategory: "Accessories",
    category: "Scarves",
    images: [
      "/attached_assets/products/scarf-1.jpg",
    ],
    specifications: [
      "Material: Pure Silk",
      "Dimensions: 70x70 cm",
      "Pattern: Abstract Print",
      "Care: Dry Clean",
      "Occasion: All Occasions",
    ],
    inStock: 35,
    lowStockThreshold: 8,
    sku: "SC-SLK-001",
  },
];

async function seedFashionData() {
  console.log("🌱 Starting fashion products seed...");

  try {
    // Step 1: Seed Categories
    console.log("📁 Seeding categories...");
    for (const category of fashionCategories) {
      const existing = await db
        .select()
        .from(categories)
        .where(eq(categories.mainCategory, category.mainCategory))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(categories).values(category);
        console.log(`✅ Added category: ${category.mainCategory}`);
      } else {
        // Update subcategories if category exists
        await db
          .update(categories)
          .set({
            subcategories: category.subcategories,
            imageUrl: category.imageUrl,
          })
          .where(eq(categories.mainCategory, category.mainCategory));
        console.log(`🔄 Updated category: ${category.mainCategory}`);
      }
    }

    // Step 2: Seed Products
    console.log("\n📦 Seeding products...");
    let addedCount = 0;
    let skippedCount = 0;

    for (const product of fashionProducts) {
      const existing = await db
        .select()
        .from(products)
        .where(eq(products.sku, product.sku || ""))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(products).values({
          ...product,
          specifications: product.specifications || [],
          images: product.images || [],
        });
        console.log(`✅ Added product: ${product.name} (${product.size || 'No size'})`);
        addedCount++;
      } else {
        console.log(`⏭️  Skipped (exists): ${product.name}`);
        skippedCount++;
      }
    }

    console.log("\n✨ Seed completed successfully!");
    console.log(`📊 Summary:`);
    console.log(`   - Categories: ${fashionCategories.length}`);
    console.log(`   - Products added: ${addedCount}`);
    console.log(`   - Products skipped: ${skippedCount}`);
    console.log(`   - Total products: ${fashionProducts.length}`);
    
    console.log("\n📋 Products with sizes:");
    const withSizes = fashionProducts.filter(p => p.size);
    console.log(`   - ${withSizes.length} products have size options`);
    
    console.log("\n📋 Products without sizes (accessories):");
    const withoutSizes = fashionProducts.filter(p => !p.size);
    console.log(`   - ${withoutSizes.length} products (accessories)`);

  } catch (error) {
    console.error("❌ Error seeding fashion data:", error);
    throw error;
  }
}

// Run the seed function
seedFashionData()
  .then(() => {
    console.log("\n🎉 Fashion seed script completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Fashion seed script failed:", error);
    process.exit(1);
  });
