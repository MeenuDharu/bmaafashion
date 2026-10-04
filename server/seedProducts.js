const { storage } = require('./storage.ts');

const sampleProducts = [
  {
    name: "NFT Flat Bed Kit (Small)",
    description: "Perfect starter kit for hydroponic beginners. Compact design suitable for home use with easy setup and maintenance.",
    price: "15000",
    category: "Home Grower Kit",
    images: ["/api/images/nft-small.jpg"],
    specifications: ["ABS coated pipe", "Double layer UPVC channels"],
    planterCount: 36,
    dimensions: "4.9 x 2.9 x 2.8 ft",
    cultivableCrops: "Leafy greens",
    structureMaterial: "ABS coated pipe",
    inStock: 8,
  },
  {
    name: "NFT Flat Bed Kit (Medium)",
    description: "Ideal for medium-scale home farming. Higher capacity with professional-grade components for consistent yields.",
    price: "25000",
    category: "Home Grower Kit",
    images: ["/api/images/nft-medium.jpg"],
    specifications: ["ABS coated pipe", "Double layer UPVC channels"],
    planterCount: 114,
    dimensions: "9.8 x 4.2 x 2.7 ft",
    cultivableCrops: "Leafy greens",
    structureMaterial: "ABS coated pipe",
    inStock: 5,
  },
  {
    name: "NFT Flat Bed Kit (Commercial)",
    description: "Large-scale commercial hydroponic system. Built for high-volume production with industrial-grade materials.",
    price: "65000",
    category: "Commercial Kit",
    images: ["/api/images/nft-commercial.jpg"],
    specifications: ["ABS coated pipe", "Double layer UPVC channels"],
    planterCount: 300,
    dimensions: "19.6 x 5.9 x 2.7 ft",
    cultivableCrops: "Leafy greens",
    structureMaterial: "ABS coated pipe",
    inStock: 3,
  },
  {
    name: "Dutch Bucket Kit (Medium)",
    description: "Excellent for growing vine crops and vegetables. Modular design allows for easy expansion and maintenance.",
    price: "18000",
    category: "Home Grower Kit",
    images: ["/api/images/dutch-bucket.jpg"],
    specifications: ["MS tube structure", "Modular bucket system"],
    planterCount: 10,
    dimensions: "4 x 2 x 0.8 ft",
    cultivableCrops: "Vegetables, vine crops",
    structureMaterial: "MS tube",
    inStock: 6,
  },
  {
    name: "NFT A-Frame Kit (Medium)",
    description: "Space-efficient vertical growing system. Maximizes growing capacity in minimal footprint.",
    price: "22000",
    category: "Home Grower Kit",
    image: "/api/images/nft-aframe.jpg",
    specifications: ["ABS coated pipe", "A-frame design"],
    planterCount: 36,
    dimensions: "4.9 x 2.9 x 2.8 ft",
    cultivableCrops: "Leafy greens",
    structureMaterial: "ABS coated pipe",
    inStock: 4,
  },
  {
    name: "NFT A-Frame Kit (Commercial)",
    description: "High-capacity vertical farming solution. Perfect for commercial operations requiring maximum yield per square foot.",
    price: "85000",
    category: "Commercial Kit",
    image: "/api/images/nft-aframe-commercial.jpg",
    specifications: ["MS tube structure", "High-capacity design"],
    planterCount: 300,
    dimensions: "22.6 x 4.4 x 5.2 ft",
    cultivableCrops: "Leafy greens",
    structureMaterial: "MS tube",
    inStock: 2,
  },
  {
    name: "Cocopeat & Husk Bags (5kg)",
    description: "Premium quality growing medium made from coconut coir. Low EC, perfect pH balance for hydroponic systems.",
    price: "800",
    category: "Coir Products",
    image: "/api/images/cocopeat-bags.jpg",
    specifications: ["EC ≤ 0.2", "pH 5.8–6.5", "Moisture: Air 30:70"],
    planterCount: null,
    dimensions: "5kg bag",
    cultivableCrops: "All hydroponic crops",
    structureMaterial: "100% Natural coir",
    inStock: 25,
  },
  {
    name: "Perlite Growing Medium",
    description: "Lightweight volcanic glass growing medium. Excellent drainage and aeration properties for root health.",
    price: "1200",
    category: "Grow Media",
    image: "/api/images/perlite.jpg",
    specifications: ["0.5–4 mm", "Density: 120–150 Kg/m³"],
    planterCount: null,
    dimensions: "10kg bag",
    cultivableCrops: "All hydroponic crops",
    structureMaterial: "Volcanic glass",
    inStock: 15,
  },
  {
    name: "Submersible Pump JQP 2500",
    description: "Reliable water pump for hydroponic systems. Quiet operation with excellent flow rate and durability.",
    price: "2500",
    category: "Accessories",
    image: "/api/images/pump.jpg",
    specifications: ["35W power", "2500L/hr flow rate"],
    planterCount: null,
    dimensions: "Compact design",
    cultivableCrops: "System component",
    structureMaterial: "High-grade plastic",
    inStock: 12,
  },
  {
    name: "pH Meter - HM Digital pH-80",
    description: "Digital pH meter for accurate monitoring of nutrient solution. Essential for maintaining optimal growing conditions.",
    price: "3500",
    category: "Accessories",
    image: "/api/images/ph-meter.jpg",
    specifications: ["pH Range: 0–14", "Temperature compensation", "Digital calibration"],
    planterCount: null,
    dimensions: "Portable handheld",
    cultivableCrops: "System component",
    structureMaterial: "Waterproof plastic",
    inStock: 20,
  },
];

async function seedProducts() {
  try {
    console.log('Checking existing products...');
    const existingProducts = await storage.getProducts();
    
    if (existingProducts.length === 0) {
      console.log('No products found. Seeding database with sample products...');
      for (const product of sampleProducts) {
        const created = await storage.createProduct(product);
        console.log(`Created product: ${created.name}`);
      }
      console.log('✅ Database seeded successfully with', sampleProducts.length, 'products');
    } else {
      console.log('📦 Products already exist in database:', existingProducts.length, 'products found');
    }
  } catch (error) {
    console.error('❌ Error seeding products:', error);
  }
}

seedProducts();