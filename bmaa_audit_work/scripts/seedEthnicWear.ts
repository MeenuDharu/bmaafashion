import { storage } from "../server/storage";
import type { InsertCategory, InsertProduct } from "../shared/schema";

/**
 * Seed script to populate the database with ethnic wear categories and products
 * Run with: npm run db:seed-ethnic
 */

const ethnicWearCategories: InsertCategory[] = [
  {
    mainCategory: "Under 399 Kurtis",
    subcategories: [],
    imageUrl: "/api/images/category/kurthiset.jpeg"
  },
  {
    mainCategory: "Co-ord Set",
    subcategories: [],
    imageUrl: "/api/images/category/kurthiset.jpeg"
  },
  {
    mainCategory: "Cotton Kurti Set",
    subcategories: [],
    imageUrl: "/api/images/category/kurthiset.jpeg"
  },
  {
    mainCategory: "Cotton Saree",
    subcategories: [],
    imageUrl: "/api/images/category/cottonsaree.jpeg"
  },
  {
    mainCategory: "Maxi Dress",
    subcategories: [],
    imageUrl: "/api/images/category/kurthiset.jpeg"
  },
  {
    mainCategory: "Traditional Kurti Set",
    subcategories: [],
    imageUrl: "/api/images/category/kurthiset.jpeg"
  },
  {
    mainCategory: "Plus Size Collection",
    subcategories: [],
    imageUrl: "/api/images/category/kurthiset.jpeg"
  },
  {
    mainCategory: "Short Kurtis",
    subcategories: [],
    imageUrl: "/api/images/category/kurthiset.jpeg"
  },
  {
    mainCategory: "Cotton Kurtis",
    subcategories: [],
    imageUrl: "/api/images/category/kurthiset.jpeg"
  },
  {
    mainCategory: "Skirt",
    subcategories: [],
    imageUrl: "/api/images/category/kurthiset.jpeg"
  },
  {
    mainCategory: "Party Wear Sarees",
    subcategories: [],
    imageUrl: "/api/images/category/cottonsaree.jpeg"
  }
];

const sampleProducts: InsertProduct[] = [
  // Under 399 Kurtis
  {
    name: "Pink Printed Cotton Kurti",
    description: "Beautiful pink printed cotton kurti perfect for daily wear. Comfortable and stylish.",
    price: "349.00",
    mainCategory: "Under 399 Kurtis",
    category: "Kurtis",
    size: "S, M, L, XL",
    images: ["/api/images/banner1.jpeg"],
    unit: "per piece",
    stock: 50,
    featured: true
  },
  {
    name: "Black Embroidered Short Kurti",
    description: "Elegant black kurti with beautiful embroidery work. Perfect for casual occasions.",
    price: "399.00",
    mainCategory: "Under 399 Kurtis",
    category: "Kurtis",
    size: "M, L, XL, XXL",
    images: ["/api/images/banner2.jpeg"],
    unit: "per piece",
    stock: 45
  },
  
  // Co-ord Set
  {
    name: "Floral Co-ord Set - Peach",
    description: "Trendy floral co-ord set in peach color. Includes top and bottom.",
    price: "899.00",
    mainCategory: "Co-ord Set",
    category: "Co-ord Sets",
    size: "S, M, L, XL",
    images: ["/api/images/banner3.jpeg"],
    unit: "per set",
    stock: 30,
    featured: true
  },
  {
    name: "Checkered Co-ord Set - Blue",
    description: "Stylish checkered pattern co-ord set. Perfect for summer wear.",
    price: "799.00",
    mainCategory: "Co-ord Set",
    category: "Co-ord Sets",
    size: "M, L, XL",
    images: ["/api/images/banner1.jpeg"],
    unit: "per set",
    stock: 35
  },
  
  // Cotton Kurti Set
  {
    name: "Traditional Cotton Kurti Set - Brown",
    description: "Complete cotton kurti set with dupatta. Traditional design with modern comfort.",
    price: "1299.00",
    mainCategory: "Cotton Kurti Set",
    category: "Kurti Sets",
    size: "S, M, L, XL, XXL",
    images: ["/api/images/banner2.jpeg"],
    unit: "per set",
    stock: 25,
    featured: true
  },
  {
    name: "Printed Cotton Kurti Set - Green",
    description: "Beautiful printed cotton kurti set. Includes kurti, bottom and dupatta.",
    price: "1199.00",
    mainCategory: "Cotton Kurti Set",
    category: "Kurti Sets",
    size: "M, L, XL",
    images: ["/api/images/banner3.jpeg"],
    unit: "per set",
    stock: 28
  },
  
  // Cotton Saree
  {
    name: "Red Cotton Saree with Border",
    description: "Elegant red cotton saree with beautiful golden border. Perfect for traditional occasions.",
    price: "1499.00",
    mainCategory: "Cotton Saree",
    category: "Sarees",
    size: "One Size",
    images: ["/api/images/banner1.jpeg"],
    unit: "per piece",
    stock: 20,
    featured: true
  },
  {
    name: "Blue Cotton Saree - Traditional",
    description: "Classic blue cotton saree with traditional design. Comfortable for all-day wear.",
    price: "1299.00",
    mainCategory: "Cotton Saree",
    category: "Sarees",
    size: "One Size",
    images: ["/api/images/banner2.jpeg"],
    unit: "per piece",
    stock: 22
  },
  
  // Maxi Dress
  {
    name: "Floral Maxi Dress - Yellow",
    description: "Beautiful floral maxi dress in vibrant yellow. Perfect for parties and events.",
    price: "1599.00",
    mainCategory: "Maxi Dress",
    category: "Dresses",
    size: "S, M, L, XL",
    images: ["/api/images/banner3.jpeg"],
    unit: "per piece",
    stock: 18,
    featured: true
  },
  {
    name: "Teal Embroidered Maxi Dress",
    description: "Stunning teal maxi dress with intricate embroidery. Elegant and comfortable.",
    price: "1799.00",
    mainCategory: "Maxi Dress",
    category: "Dresses",
    size: "M, L, XL",
    images: ["/api/images/banner1.jpeg"],
    unit: "per piece",
    stock: 15
  },
  
  // Traditional Kurti Set
  {
    name: "Traditional Kurti Set - Multicolor",
    description: "Traditional kurti set with beautiful multicolor dupatta. Perfect for festivals.",
    price: "1899.00",
    mainCategory: "Traditional Kurti Set",
    category: "Kurti Sets",
    size: "S, M, L, XL, XXL",
    images: ["/api/images/banner2.jpeg"],
    unit: "per set",
    stock: 20,
    featured: true
  },
  {
    name: "Silk Blend Traditional Kurti Set",
    description: "Premium silk blend traditional kurti set. Luxurious and elegant.",
    price: "2199.00",
    mainCategory: "Traditional Kurti Set",
    category: "Kurti Sets",
    size: "M, L, XL",
    images: ["/api/images/banner3.jpeg"],
    unit: "per set",
    stock: 12
  },
  
  // Plus Size Collection
  {
    name: "Plus Size Purple Kurti Set",
    description: "Specially designed plus size kurti set in purple. Comfortable fit guaranteed.",
    price: "1499.00",
    mainCategory: "Plus Size Collection",
    category: "Plus Size",
    size: "3XL, 4XL, 5XL, 6XL",
    images: ["/api/images/banner1.jpeg"],
    unit: "per set",
    stock: 15,
    featured: true
  },
  {
    name: "Plus Size Floral Maxi",
    description: "Beautiful floral maxi dress for plus size. Flattering and stylish.",
    price: "1699.00",
    mainCategory: "Plus Size Collection",
    category: "Plus Size",
    size: "3XL, 4XL, 5XL, 6XL",
    images: ["/api/images/banner2.jpeg"],
    unit: "per piece",
    stock: 18
  },
  
  // Short Kurtis
  {
    name: "Short Kurti - Mint Green",
    description: "Trendy short kurti in mint green. Perfect for casual wear with jeans.",
    price: "599.00",
    mainCategory: "Short Kurtis",
    category: "Kurtis",
    size: "S, M, L, XL",
    images: ["/api/images/banner3.jpeg"],
    unit: "per piece",
    stock: 40
  },
  {
    name: "Printed Short Kurti - Floral",
    description: "Stylish printed short kurti with floral design. Modern and comfortable.",
    price: "649.00",
    mainCategory: "Short Kurtis",
    category: "Kurtis",
    size: "M, L, XL",
    images: ["/api/images/banner1.jpeg"],
    unit: "per piece",
    stock: 38
  },
  
  // Cotton Kurtis
  {
    name: "Cotton Kurti - Olive Green",
    description: "Pure cotton kurti in olive green. Breathable and comfortable for daily wear.",
    price: "699.00",
    mainCategory: "Cotton Kurtis",
    category: "Kurtis",
    size: "S, M, L, XL, XXL",
    images: ["/api/images/banner2.jpeg"],
    unit: "per piece",
    stock: 42,
    featured: true
  },
  {
    name: "Block Print Cotton Kurti",
    description: "Traditional block print cotton kurti. Handcrafted with care.",
    price: "799.00",
    mainCategory: "Cotton Kurtis",
    category: "Kurtis",
    size: "M, L, XL",
    images: ["/api/images/banner3.jpeg"],
    unit: "per piece",
    stock: 35
  },
  
  // Skirt
  {
    name: "Printed Skirt - Yellow",
    description: "Beautiful printed skirt in yellow. Perfect for festive occasions.",
    price: "899.00",
    mainCategory: "Skirt",
    category: "Skirts",
    size: "S, M, L, XL",
    images: ["/api/images/banner1.jpeg"],
    unit: "per piece",
    stock: 25
  },
  {
    name: "Traditional Lehenga Skirt",
    description: "Traditional lehenga style skirt with intricate work. Elegant and beautiful.",
    price: "1299.00",
    mainCategory: "Skirt",
    category: "Skirts",
    size: "M, L, XL",
    images: ["/api/images/banner2.jpeg"],
    unit: "per piece",
    stock: 20
  },
  
  // Party Wear Sarees
  {
    name: "Designer Party Wear Saree - Pink",
    description: "Stunning designer saree perfect for parties and weddings. Premium quality.",
    price: "2999.00",
    mainCategory: "Party Wear Sarees",
    category: "Sarees",
    size: "One Size",
    images: ["/api/images/banner3.jpeg"],
    unit: "per piece",
    stock: 10,
    featured: true
  },
  {
    name: "Embroidered Party Saree - Gold",
    description: "Luxurious embroidered saree in golden color. Perfect for special occasions.",
    price: "3499.00",
    mainCategory: "Party Wear Sarees",
    category: "Sarees",
    size: "One Size",
    images: ["/api/images/banner1.jpeg"],
    unit: "per piece",
    stock: 8
  }
];

async function seedEthnicWear() {
  try {
    console.log("🌸 Starting ethnic wear database seeding...");

    // Get existing categories to avoid duplicates
    const existingCategories = await storage.getCategories();
    const existingCategoryNames = existingCategories.map(c => c.mainCategory);

    // Insert categories (skip if already exists)
    console.log("📁 Inserting categories...");
    for (const category of ethnicWearCategories) {
      if (!existingCategoryNames.includes(category.mainCategory)) {
        await storage.createCategory(category);
        console.log(`✅ Added category: ${category.mainCategory}`);
      } else {
        console.log(`⏭️  Skipped existing category: ${category.mainCategory}`);
      }
    }

    // Insert products
    console.log("👗 Inserting products...");
    for (const product of sampleProducts) {
      await storage.createProduct(product);
      console.log(`✅ Added product: ${product.name}`);
    }

    console.log("\n🎉 Database seeding completed successfully!");
    console.log(`📊 Summary:`);
    console.log(`   - Categories: ${ethnicWearCategories.length}`);
    console.log(`   - Products: ${sampleProducts.length}`);
    
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

// Run the seed function
seedEthnicWear()
  .then(() => {
    console.log("✨ Seeding process finished");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Seeding process failed:", error);
    process.exit(1);
  });
