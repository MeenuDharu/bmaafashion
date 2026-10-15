import { storage } from "../server/storage";
import type { InsertCategory, InsertProduct } from "@shared/schema";

/**
 * Seed script to populate the database with dress categories and products
 * Run with: npm run db:seed-dress
 */

const dressCategories: InsertCategory[] = [
  {
    mainCategory: "Women's Fashion",
    subcategories: [
      "Sarees",
      "Salwar Suits",
      "Lehenga Choli",
      "Kurtis & Tunics",
      "Gowns & Dresses",
      "Indo-Western",
      "Ethnic Wear",
      "Party Wear"
    ],
    description: "Elegant collection of traditional and modern women's wear",
    imageUrl: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&h=300&fit=crop"
  },
  {
    mainCategory: "Men's Fashion",
    subcategories: [
      "Kurta Pajama",
      "Sherwanis",
      "Indo-Western",
      "Ethnic Jackets",
      "Nehru Jackets",
      "Formal Wear"
    ],
    description: "Sophisticated men's ethnic and formal collection",
    imageUrl: "https://images.unsplash.com/photo-1622519407650-3df9883f76e5?w=400&h=300&fit=crop"
  },
  {
    mainCategory: "Kids Fashion",
    subcategories: [
      "Girls Ethnic",
      "Boys Ethnic",
      "Party Wear",
      "Casual Wear"
    ],
    description: "Adorable ethnic wear for kids",
    imageUrl: "https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=400&h=300&fit=crop"
  },
  {
    mainCategory: "Accessories",
    subcategories: [
      "Jewelry",
      "Bags & Clutches",
      "Footwear",
      "Dupattas & Stoles",
      "Hair Accessories"
    ],
    description: "Complete your look with our accessories",
    imageUrl: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400&h=300&fit=crop"
  },
  {
    mainCategory: "Bridal Collection",
    subcategories: [
      "Bridal Lehengas",
      "Bridal Sarees",
      "Bridal Gowns",
      "Bridal Accessories"
    ],
    description: "Exquisite bridal wear for your special day",
    imageUrl: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&h=300&fit=crop"
  }
];

const dressProducts: InsertProduct[] = [
  // Women's Fashion - Sarees
  {
    name: "Banarasi Silk Saree - Royal Blue",
    description: "Elegant Banarasi silk saree with intricate golden zari work. Perfect for weddings and special occasions.",
    mainCategory: "Women's Fashion",
    category: "Sarees",
    price: 8999,
    compareAtPrice: 12999,
    imageUrl: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&h=1000&fit=crop",
    inStock: 15,
    lowStockThreshold: 5,
    featured: true
  },
  {
    name: "Kanjivaram Silk Saree - Maroon",
    slug: "kanjivaram-silk-saree-maroon",
    description: "Traditional Kanjivaram silk saree with temple border design.",
    mainCategory: "Women's Fashion",
    category: "Sarees",
    price: 15999,
    compareAtPrice: 19999,
    imageUrl: "https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=800&h=1000&fit=crop",
    inStock: 10,
    lowStockThreshold: 3,
    featured: true
  },
  {
    name: "Georgette Saree with Embroidery",
    slug: "georgette-saree-embroidery",
    description: "Lightweight georgette saree with beautiful floral embroidery.",
    mainCategory: "Women's Fashion",
    category: "Sarees",
    price: 3999,
    compareAtPrice: 5999,
    imageUrl: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800&h=1000&fit=crop",
    inStock: 25,
    lowStockThreshold: 8
  },
  {
    name: "Cotton Saree - Daily Wear",
    slug: "cotton-saree-daily-wear",
    description: "Comfortable cotton saree perfect for daily wear.",
    mainCategory: "Women's Fashion",
    category: "Sarees",
    price: 1499,
    compareAtPrice: 2499,
    imageUrl: "https://images.unsplash.com/photo-1606800052052-a08af7148866?w=800&h=1000&fit=crop",
    inStock: 50,
    lowStockThreshold: 15
  },
  {
    name: "Designer Saree - Party Wear",
    slug: "designer-saree-party-wear",
    description: "Stunning designer saree with sequin work for parties.",
    mainCategory: "Women's Fashion",
    category: "Sarees",
    price: 6999,
    compareAtPrice: 9999,
    imageUrl: "https://images.unsplash.com/photo-1598439210625-5067c578f3f6?w=800&h=1000&fit=crop",
    inStock: 12,
    lowStockThreshold: 4
  },

  // Women's Fashion - Salwar Suits
  {
    name: "Anarkali Suit - Pink",
    slug: "anarkali-suit-pink",
    description: "Beautiful Anarkali suit with dupatta, perfect for festive occasions.",
    mainCategory: "Women's Fashion",
    category: "Salwar Suits",
    price: 4999,
    compareAtPrice: 7999,
    imageUrl: "https://images.unsplash.com/photo-1583391733981-e8c9e1f7b0c5?w=800&h=1000&fit=crop",
    inStock: 20,
    lowStockThreshold: 6,
    featured: true
  },
  {
    name: "Punjabi Suit - Cotton",
    slug: "punjabi-suit-cotton",
    description: "Comfortable cotton Punjabi suit for daily wear.",
    mainCategory: "Women's Fashion",
    category: "Salwar Suits",
    price: 2499,
    compareAtPrice: 3999,
    imageUrl: "https://images.unsplash.com/photo-1591369822096-ffd140ec948f?w=800&h=1000&fit=crop",
    inStock: 30,
    lowStockThreshold: 10
  },
  {
    name: "Palazzo Suit Set",
    slug: "palazzo-suit-set",
    description: "Trendy palazzo suit with printed dupatta.",
    mainCategory: "Women's Fashion",
    category: "Salwar Suits",
    price: 3499,
    compareAtPrice: 5499,
    imageUrl: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800&h=1000&fit=crop",
    inStock: 18,
    lowStockThreshold: 5
  },

  // Women's Fashion - Lehenga Choli
  {
    name: "Bridal Lehenga - Red",
    slug: "bridal-lehenga-red",
    description: "Stunning red bridal lehenga with heavy embroidery and zari work.",
    mainCategory: "Women's Fashion",
    category: "Lehenga Choli",
    price: 25999,
    compareAtPrice: 35999,
    imageUrl: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&h=1000&fit=crop",
    inStock: 5,
    lowStockThreshold: 2,
    featured: true
  },
  {
    name: "Party Wear Lehenga - Navy Blue",
    slug: "party-wear-lehenga-navy",
    description: "Elegant navy blue lehenga perfect for parties and functions.",
    mainCategory: "Women's Fashion",
    category: "Lehenga Choli",
    price: 12999,
    compareAtPrice: 17999,
    imageUrl: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800&h=1000&fit=crop",
    inStock: 8,
    lowStockThreshold: 3
  },

  // Women's Fashion - Kurtis & Tunics
  {
    name: "Cotton Kurti - Floral Print",
    slug: "cotton-kurti-floral",
    description: "Comfortable cotton kurti with beautiful floral print.",
    mainCategory: "Women's Fashion",
    category: "Kurtis & Tunics",
    price: 899,
    compareAtPrice: 1499,
    imageUrl: "https://images.unsplash.com/photo-1591369822096-ffd140ec948f?w=800&h=1000&fit=crop",
    inStock: 40,
    lowStockThreshold: 12
  },
  {
    name: "Designer Kurti - Embroidered",
    slug: "designer-kurti-embroidered",
    description: "Stylish designer kurti with intricate embroidery work.",
    mainCategory: "Women's Fashion",
    category: "Kurtis & Tunics",
    price: 1999,
    compareAtPrice: 2999,
    imageUrl: "https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=800&h=1000&fit=crop",
    inStock: 35,
    lowStockThreshold: 10
  },

  // Men's Fashion - Kurta Pajama
  {
    name: "Silk Kurta Pajama - Cream",
    slug: "silk-kurta-pajama-cream",
    description: "Premium silk kurta pajama set for special occasions.",
    mainCategory: "Men's Fashion",
    category: "Kurta Pajama",
    price: 3999,
    compareAtPrice: 5999,
    imageUrl: "https://images.unsplash.com/photo-1622519407650-3df9883f76e5?w=800&h=1000&fit=crop",
    inStock: 20,
    lowStockThreshold: 6,
    featured: true
  },
  {
    name: "Cotton Kurta Pajama - White",
    slug: "cotton-kurta-pajama-white",
    description: "Comfortable cotton kurta pajama for daily wear.",
    mainCategory: "Men's Fashion",
    category: "Kurta Pajama",
    price: 1999,
    compareAtPrice: 2999,
    imageUrl: "https://images.unsplash.com/photo-1622519407650-3df9883f76e5?w=800&h=1000&fit=crop",
    inStock: 30,
    lowStockThreshold: 10
  },

  // Men's Fashion - Sherwanis
  {
    name: "Wedding Sherwani - Golden",
    slug: "wedding-sherwani-golden",
    description: "Luxurious golden sherwani with intricate embroidery for weddings.",
    mainCategory: "Men's Fashion",
    category: "Sherwanis",
    price: 18999,
    compareAtPrice: 25999,
    imageUrl: "https://images.unsplash.com/photo-1622519407650-3df9883f76e5?w=800&h=1000&fit=crop",
    inStock: 8,
    lowStockThreshold: 3,
    featured: true
  },
  {
    name: "Indo-Western Sherwani",
    slug: "indo-western-sherwani",
    description: "Modern Indo-Western sherwani with contemporary design.",
    mainCategory: "Men's Fashion",
    category: "Sherwanis",
    price: 12999,
    compareAtPrice: 16999,
    imageUrl: "https://images.unsplash.com/photo-1622519407650-3df9883f76e5?w=800&h=1000&fit=crop",
    inStock: 12,
    lowStockThreshold: 4
  },

  // Kids Fashion
  {
    name: "Girls Lehenga Choli - Pink",
    slug: "girls-lehenga-pink",
    description: "Adorable pink lehenga choli for little princesses.",
    mainCategory: "Kids Fashion",
    category: "Girls Ethnic",
    price: 2499,
    compareAtPrice: 3999,
    imageUrl: "https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=800&h=1000&fit=crop",
    inStock: 25,
    lowStockThreshold: 8
  },
  {
    name: "Boys Kurta Pajama Set",
    slug: "boys-kurta-pajama",
    description: "Cute kurta pajama set for boys.",
    mainCategory: "Kids Fashion",
    category: "Boys Ethnic",
    price: 1499,
    compareAtPrice: 2499,
    imageUrl: "https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=800&h=1000&fit=crop",
    inStock: 30,
    lowStockThreshold: 10
  },

  // Accessories
  {
    name: "Kundan Jewelry Set",
    slug: "kundan-jewelry-set",
    description: "Beautiful Kundan jewelry set with necklace and earrings.",
    mainCategory: "Accessories",
    category: "Jewelry",
    price: 4999,
    compareAtPrice: 7999,
    imageUrl: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&h=1000&fit=crop",
    inStock: 15,
    lowStockThreshold: 5,
    featured: true
  },
  {
    name: "Designer Clutch - Golden",
    slug: "designer-clutch-golden",
    description: "Elegant golden clutch perfect for parties.",
    mainCategory: "Accessories",
    category: "Bags & Clutches",
    price: 1999,
    compareAtPrice: 2999,
    imageUrl: "https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=800&h=1000&fit=crop",
    inStock: 20,
    lowStockThreshold: 6
  },
  {
    name: "Silk Dupatta - Banarasi",
    slug: "silk-dupatta-banarasi",
    description: "Premium Banarasi silk dupatta with zari border.",
    mainCategory: "Accessories",
    category: "Dupattas & Stoles",
    price: 2499,
    compareAtPrice: 3999,
    imageUrl: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800&h=1000&fit=crop",
    inStock: 25,
    lowStockThreshold: 8
  },

  // Bridal Collection
  {
    name: "Bridal Lehenga - Maroon",
    slug: "bridal-lehenga-maroon",
    description: "Exquisite maroon bridal lehenga with heavy embellishments.",
    mainCategory: "Bridal Collection",
    category: "Bridal Lehengas",
    price: 35999,
    compareAtPrice: 49999,
    imageUrl: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&h=1000&fit=crop",
    inStock: 3,
    lowStockThreshold: 1,
    featured: true
  },
  {
    name: "Bridal Saree - Silk",
    slug: "bridal-saree-silk",
    description: "Luxurious silk bridal saree with golden work.",
    mainCategory: "Bridal Collection",
    category: "Bridal Sarees",
    price: 22999,
    compareAtPrice: 29999,
    imageUrl: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&h=1000&fit=crop",
    inStock: 5,
    lowStockThreshold: 2,
    featured: true
  }
];

async function seedDressData() {
  try {
    console.log("🌱 Starting dress data seeding...");

    // Check if categories already exist
    const existingCategories = await storage.getCategories();
    const existingCategoryNames = new Set(existingCategories.map(c => c.mainCategory));
    
    // Insert categories
    console.log("📦 Inserting categories...");
    let newCategoriesCount = 0;
    for (const category of dressCategories) {
      if (!existingCategoryNames.has(category.mainCategory)) {
        await storage.createCategory(category);
        console.log(`  ✅ Created category: ${category.mainCategory}`);
        newCategoriesCount++;
      } else {
        console.log(`  ⚠️  Category already exists: ${category.mainCategory}`);
      }
    }

    // Insert products
    console.log("👗 Inserting products...");
    const existingProducts = await storage.getProducts();
    const existingProductSlugs = new Set(existingProducts.map(p => p.slug));
    
    let newProductsCount = 0;
    for (const product of dressProducts) {
      if (!existingProductSlugs.has(product.slug)) {
        await storage.createProduct(product);
        console.log(`  ✅ Created product: ${product.name}`);
        newProductsCount++;
      } else {
        console.log(`  ⚠️  Product already exists: ${product.name}`);
      }
    }

    console.log("\n✨ Dress data seeding completed successfully!");
    console.log(`📊 Summary:`);
    console.log(`   - New Categories: ${newCategoriesCount}/${dressCategories.length}`);
    console.log(`   - New Products: ${newProductsCount}/${dressProducts.length}`);
    
  } catch (error) {
    console.error("❌ Error seeding dress data:", error);
    throw error;
  }
}

// Run the seed function
seedDressData()
  .then(() => {
    console.log("✅ Seeding process completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Seeding process failed:", error);
    process.exit(1);
  });
