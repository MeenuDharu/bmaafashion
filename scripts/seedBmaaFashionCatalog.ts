import { db } from "../server/db";
import {
  categories,
  products,
  productVariants,
  wishlists,
  inventoryHistory,
  stockAlerts,
  productReviews,
  reviewHelpfulVotes,
  waitlistEntries,
  cartItems,
  orderStatusHistory,
  orderItems,
  orders,
} from "../shared/schema";

/**
 * BMAA Fashion clean catalog seed.
 *
 * WARNING: This is a DESTRUCTIVE development/test seed.
 * It removes existing product/catalog data and all orders/cart/review/inventory
 * records connected to that catalog, then inserts the products + variants below.
 * It does NOT delete users or user addresses.
 *
 * Run from project root:
 *   npx tsx scripts/seedBmaaFashionCatalog.ts
 */

type VariantSeed = {
  sku: string;
  color: string;
  size: string;
  price: string;
  compareAtPrice: string;
  stockQuantity: number;
  lowStockThreshold: number;
  weight: string;
  images: string[];
};

type ProductSeed = {
  name: string;
  description: string;
  price: string;
  category: string;
  mainCategory: string;
  unit: string;
  images: string[];
  specifications: string[];
  sku: string;
  costPrice: string;
  lowStockThreshold: number;
  reorderPoint: number;
  maxStock: number;
  variants: VariantSeed[];
};

const productsToSeed: ProductSeed[] = [
  {
    name: "Premium Cotton Straight Kurti",
    description: "Comfortable premium cotton straight kurti for everyday wear, office wear and casual outings.",
    price: "899.00",
    category: "Cotton Kurti",
    mainCategory: "Women's Fashion",
    unit: "per piece",
    images: ["/attached_assets/products/cotton-kurti-01.jpg"],
    specifications: ["Material: Premium Cotton", "Pattern: Solid", "Sleeve: 3/4 Sleeve", "Occasion: Casual, Office"],
    sku: "BMAA-KURTI-001",
    costPrice: "420.00",
    lowStockThreshold: 5,
    reorderPoint: 10,
    maxStock: 100,
    variants: [
      { sku: "BMAA-KURTI-001-BLK-S", color: "Black", size: "S", price: "899.00", compareAtPrice: "1199.00", stockQuantity: 8, lowStockThreshold: 3, weight: "0.45", images: ["/attached_assets/products/cotton-kurti-01-black.jpg"] },
      { sku: "BMAA-KURTI-001-BLK-M", color: "Black", size: "M", price: "899.00", compareAtPrice: "1199.00", stockQuantity: 12, lowStockThreshold: 3, weight: "0.45", images: ["/attached_assets/products/cotton-kurti-01-black.jpg"] },
      { sku: "BMAA-KURTI-001-BLK-L", color: "Black", size: "L", price: "949.00", compareAtPrice: "1249.00", stockQuantity: 10, lowStockThreshold: 3, weight: "0.45", images: ["/attached_assets/products/cotton-kurti-01-black.jpg"] },
      { sku: "BMAA-KURTI-001-BLK-XL", color: "Black", size: "XL", price: "949.00", compareAtPrice: "1249.00", stockQuantity: 6, lowStockThreshold: 3, weight: "0.45", images: ["/attached_assets/products/cotton-kurti-01-black.jpg"] },
      { sku: "BMAA-KURTI-001-BLU-S", color: "Blue", size: "S", price: "899.00", compareAtPrice: "1199.00", stockQuantity: 5, lowStockThreshold: 3, weight: "0.45", images: ["/attached_assets/products/cotton-kurti-01-blue.jpg"] },
      { sku: "BMAA-KURTI-001-BLU-M", color: "Blue", size: "M", price: "899.00", compareAtPrice: "1199.00", stockQuantity: 4, lowStockThreshold: 3, weight: "0.45", images: ["/attached_assets/products/cotton-kurti-01-blue.jpg"] },
    ],
  },
  {
    name: "Floral Print Anarkali Kurti",
    description: "Flowing floral print Anarkali kurti with a comfortable silhouette for festive and casual occasions.",
    price: "1199.00",
    category: "Traditional Kurti",
    mainCategory: "Women's Fashion",
    unit: "per piece",
    images: ["/attached_assets/products/anarkali-01.jpg"],
    specifications: ["Material: Rayon", "Pattern: Floral Print", "Style: Anarkali", "Occasion: Festive, Casual"],
    sku: "BMAA-KURTI-002",
    costPrice: "560.00",
    lowStockThreshold: 5,
    reorderPoint: 10,
    maxStock: 100,
    variants: [
      { sku: "BMAA-KURTI-002-PNK-S", color: "Pink", size: "S", price: "1199.00", compareAtPrice: "1599.00", stockQuantity: 7, lowStockThreshold: 3, weight: "0.50", images: ["/attached_assets/products/anarkali-01-pink.jpg"] },
      { sku: "BMAA-KURTI-002-PNK-M", color: "Pink", size: "M", price: "1199.00", compareAtPrice: "1599.00", stockQuantity: 9, lowStockThreshold: 3, weight: "0.50", images: ["/attached_assets/products/anarkali-01-pink.jpg"] },
      { sku: "BMAA-KURTI-002-PNK-L", color: "Pink", size: "L", price: "1249.00", compareAtPrice: "1649.00", stockQuantity: 6, lowStockThreshold: 3, weight: "0.50", images: ["/attached_assets/products/anarkali-01-pink.jpg"] },
      { sku: "BMAA-KURTI-002-BLU-M", color: "Blue", size: "M", price: "1199.00", compareAtPrice: "1599.00", stockQuantity: 5, lowStockThreshold: 3, weight: "0.50", images: ["/attached_assets/products/anarkali-01-blue.jpg"] },
      { sku: "BMAA-KURTI-002-BLU-L", color: "Blue", size: "L", price: "1249.00", compareAtPrice: "1649.00", stockQuantity: 4, lowStockThreshold: 3, weight: "0.50", images: ["/attached_assets/products/anarkali-01-blue.jpg"] },
    ],
  },
  {
    name: "Embroidered Festive Kurti Set",
    description: "Elegant embroidered kurti set with matching bottom and dupatta for festive occasions.",
    price: "1899.00",
    category: "Kurti Set",
    mainCategory: "Women's Fashion",
    unit: "per set",
    images: ["/attached_assets/products/kurti-set-01.jpg"],
    specifications: ["Material: Rayon", "Pattern: Embroidered", "Includes: Kurti + Bottom + Dupatta", "Occasion: Festive, Party"],
    sku: "BMAA-KSET-001",
    costPrice: "900.00",
    lowStockThreshold: 5,
    reorderPoint: 8,
    maxStock: 80,
    variants: [
      { sku: "BMAA-KSET-001-MAR-M", color: "Maroon", size: "M", price: "1899.00", compareAtPrice: "2499.00", stockQuantity: 6, lowStockThreshold: 2, weight: "0.80", images: ["/attached_assets/products/kurti-set-01-maroon.jpg"] },
      { sku: "BMAA-KSET-001-MAR-L", color: "Maroon", size: "L", price: "1899.00", compareAtPrice: "2499.00", stockQuantity: 8, lowStockThreshold: 2, weight: "0.80", images: ["/attached_assets/products/kurti-set-01-maroon.jpg"] },
      { sku: "BMAA-KSET-001-MAR-XL", color: "Maroon", size: "XL", price: "1949.00", compareAtPrice: "2599.00", stockQuantity: 5, lowStockThreshold: 2, weight: "0.80", images: ["/attached_assets/products/kurti-set-01-maroon.jpg"] },
      { sku: "BMAA-KSET-001-NAV-M", color: "Navy Blue", size: "M", price: "1899.00", compareAtPrice: "2499.00", stockQuantity: 4, lowStockThreshold: 2, weight: "0.80", images: ["/attached_assets/products/kurti-set-01-navy.jpg"] },
      { sku: "BMAA-KSET-001-NAV-L", color: "Navy Blue", size: "L", price: "1899.00", compareAtPrice: "2499.00", stockQuantity: 7, lowStockThreshold: 2, weight: "0.80", images: ["/attached_assets/products/kurti-set-01-navy.jpg"] },
    ],
  },
  {
    name: "Casual Short Kurti",
    description: "Soft and comfortable short kurti designed for everyday casual wear.",
    price: "599.00",
    category: "Short Kurti",
    mainCategory: "Women's Fashion",
    unit: "per piece",
    images: ["/attached_assets/products/short-kurti-01.jpg"],
    specifications: ["Material: Cotton Blend", "Sleeve: Short Sleeve", "Neck: Round Neck", "Occasion: Daily Wear"],
    sku: "BMAA-SKURTI-001",
    costPrice: "270.00",
    lowStockThreshold: 5,
    reorderPoint: 10,
    maxStock: 120,
    variants: [
      { sku: "BMAA-SKURTI-001-WHT-S", color: "White", size: "S", price: "599.00", compareAtPrice: "799.00", stockQuantity: 10, lowStockThreshold: 3, weight: "0.30", images: ["/attached_assets/products/short-kurti-01-white.jpg"] },
      { sku: "BMAA-SKURTI-001-WHT-M", color: "White", size: "M", price: "599.00", compareAtPrice: "799.00", stockQuantity: 15, lowStockThreshold: 3, weight: "0.30", images: ["/attached_assets/products/short-kurti-01-white.jpg"] },
      { sku: "BMAA-SKURTI-001-WHT-L", color: "White", size: "L", price: "649.00", compareAtPrice: "849.00", stockQuantity: 12, lowStockThreshold: 3, weight: "0.30", images: ["/attached_assets/products/short-kurti-01-white.jpg"] },
      { sku: "BMAA-SKURTI-001-BLK-M", color: "Black", size: "M", price: "599.00", compareAtPrice: "799.00", stockQuantity: 8, lowStockThreshold: 3, weight: "0.30", images: ["/attached_assets/products/short-kurti-01-black.jpg"] },
      { sku: "BMAA-SKURTI-001-BLK-L", color: "Black", size: "L", price: "649.00", compareAtPrice: "849.00", stockQuantity: 6, lowStockThreshold: 3, weight: "0.30", images: ["/attached_assets/products/short-kurti-01-black.jpg"] },
    ],
  },
  {
    name: "Premium Rayon Co-ord Set",
    description: "Modern rayon co-ord set with a comfortable fit, suitable for casual outings and weekend wear.",
    price: "1499.00",
    category: "Coord Set",
    mainCategory: "Women's Fashion",
    unit: "per set",
    images: ["/attached_assets/products/coord-set-01.jpg"],
    specifications: ["Material: Premium Rayon", "Pattern: Solid", "Includes: Top + Palazzo", "Occasion: Casual"],
    sku: "BMAA-COORD-001",
    costPrice: "700.00",
    lowStockThreshold: 5,
    reorderPoint: 8,
    maxStock: 80,
    variants: [
      { sku: "BMAA-COORD-001-BEI-S", color: "Beige", size: "S", price: "1499.00", compareAtPrice: "1999.00", stockQuantity: 5, lowStockThreshold: 2, weight: "0.65", images: ["/attached_assets/products/coord-set-01-beige.jpg"] },
      { sku: "BMAA-COORD-001-BEI-M", color: "Beige", size: "M", price: "1499.00", compareAtPrice: "1999.00", stockQuantity: 8, lowStockThreshold: 2, weight: "0.65", images: ["/attached_assets/products/coord-set-01-beige.jpg"] },
      { sku: "BMAA-COORD-001-BEI-L", color: "Beige", size: "L", price: "1549.00", compareAtPrice: "2049.00", stockQuantity: 7, lowStockThreshold: 2, weight: "0.65", images: ["/attached_assets/products/coord-set-01-beige.jpg"] },
      { sku: "BMAA-COORD-001-BLK-M", color: "Black", size: "M", price: "1499.00", compareAtPrice: "1999.00", stockQuantity: 6, lowStockThreshold: 2, weight: "0.65", images: ["/attached_assets/products/coord-set-01-black.jpg"] },
      { sku: "BMAA-COORD-001-BLK-L", color: "Black", size: "L", price: "1549.00", compareAtPrice: "2049.00", stockQuantity: 4, lowStockThreshold: 2, weight: "0.65", images: ["/attached_assets/products/coord-set-01-black.jpg"] },
    ],
  },
  {
    name: "Floral Print Maxi Dress",
    description: "Elegant floral maxi dress made with lightweight fabric for summer days, parties and vacations.",
    price: "1299.00",
    category: "Maxi",
    mainCategory: "Women's Fashion",
    unit: "per piece",
    images: ["/attached_assets/products/maxi-01.jpg"],
    specifications: ["Material: Rayon", "Pattern: Floral", "Length: Maxi", "Occasion: Casual, Party"],
    sku: "BMAA-MAXI-001",
    costPrice: "610.00",
    lowStockThreshold: 5,
    reorderPoint: 8,
    maxStock: 80,
    variants: [
      { sku: "BMAA-MAXI-001-PNK-S", color: "Pink", size: "S", price: "1299.00", compareAtPrice: "1799.00", stockQuantity: 5, lowStockThreshold: 2, weight: "0.55", images: ["/attached_assets/products/maxi-01-pink.jpg"] },
      { sku: "BMAA-MAXI-001-PNK-M", color: "Pink", size: "M", price: "1299.00", compareAtPrice: "1799.00", stockQuantity: 9, lowStockThreshold: 2, weight: "0.55", images: ["/attached_assets/products/maxi-01-pink.jpg"] },
      { sku: "BMAA-MAXI-001-PNK-L", color: "Pink", size: "L", price: "1349.00", compareAtPrice: "1849.00", stockQuantity: 7, lowStockThreshold: 2, weight: "0.55", images: ["/attached_assets/products/maxi-01-pink.jpg"] },
      { sku: "BMAA-MAXI-001-BLU-M", color: "Blue", size: "M", price: "1299.00", compareAtPrice: "1799.00", stockQuantity: 4, lowStockThreshold: 2, weight: "0.55", images: ["/attached_assets/products/maxi-01-blue.jpg"] },
      { sku: "BMAA-MAXI-001-BLU-L", color: "Blue", size: "L", price: "1349.00", compareAtPrice: "1849.00", stockQuantity: 5, lowStockThreshold: 2, weight: "0.55", images: ["/attached_assets/products/maxi-01-blue.jpg"] },
    ],
  },
  {
    name: "Party Wear Embroidered Saree",
    description: "Elegant embroidered saree for weddings, celebrations and special occasions with a premium finish.",
    price: "2499.00",
    category: "Party Wear",
    mainCategory: "Women's Fashion",
    unit: "per piece",
    images: ["/attached_assets/products/saree-01.jpg"],
    specifications: ["Material: Georgette", "Work: Embroidery", "Size: Free Size", "Includes: Saree + Blouse Piece"],
    sku: "BMAA-SAREE-001",
    costPrice: "1350.00",
    lowStockThreshold: 3,
    reorderPoint: 5,
    maxStock: 50,
    variants: [
      { sku: "BMAA-SAREE-001-RED-FS", color: "Red", size: "Free Size", price: "2499.00", compareAtPrice: "3299.00", stockQuantity: 5, lowStockThreshold: 2, weight: "0.80", images: ["/attached_assets/products/saree-01-red.jpg"] },
      { sku: "BMAA-SAREE-001-MAR-FS", color: "Maroon", size: "Free Size", price: "2599.00", compareAtPrice: "3399.00", stockQuantity: 4, lowStockThreshold: 2, weight: "0.80", images: ["/attached_assets/products/saree-01-maroon.jpg"] },
      { sku: "BMAA-SAREE-001-PNK-FS", color: "Pink", size: "Free Size", price: "2499.00", compareAtPrice: "3299.00", stockQuantity: 6, lowStockThreshold: 2, weight: "0.80", images: ["/attached_assets/products/saree-01-pink.jpg"] },
    ],
  },
  {
    name: "Pure Cotton Palazzo",
    description: "Comfortable pure cotton palazzo with a relaxed fit, ideal for daily wear and pairing with kurtis.",
    price: "699.00",
    category: "Bottom",
    mainCategory: "Women's Fashion",
    unit: "per piece",
    images: ["/attached_assets/products/palazzo-01.jpg"],
    specifications: ["Material: Pure Cotton", "Fit: Relaxed", "Waist: Elastic", "Occasion: Daily Wear"],
    sku: "BMAA-BOTTOM-001",
    costPrice: "320.00",
    lowStockThreshold: 5,
    reorderPoint: 10,
    maxStock: 120,
    variants: [
      { sku: "BMAA-BOTTOM-001-BLK-S", color: "Black", size: "S", price: "699.00", compareAtPrice: "899.00", stockQuantity: 10, lowStockThreshold: 3, weight: "0.35", images: ["/attached_assets/products/palazzo-01-black.jpg"] },
      { sku: "BMAA-BOTTOM-001-BLK-M", color: "Black", size: "M", price: "699.00", compareAtPrice: "899.00", stockQuantity: 14, lowStockThreshold: 3, weight: "0.35", images: ["/attached_assets/products/palazzo-01-black.jpg"] },
      { sku: "BMAA-BOTTOM-001-BLK-L", color: "Black", size: "L", price: "749.00", compareAtPrice: "949.00", stockQuantity: 11, lowStockThreshold: 3, weight: "0.35", images: ["/attached_assets/products/palazzo-01-black.jpg"] },
      { sku: "BMAA-BOTTOM-001-WHT-M", color: "White", size: "M", price: "699.00", compareAtPrice: "899.00", stockQuantity: 8, lowStockThreshold: 3, weight: "0.35", images: ["/attached_assets/products/palazzo-01-white.jpg"] },
      { sku: "BMAA-BOTTOM-001-WHT-L", color: "White", size: "L", price: "749.00", compareAtPrice: "949.00", stockQuantity: 7, lowStockThreshold: 3, weight: "0.35", images: ["/attached_assets/products/palazzo-01-white.jpg"] },
    ],
  },
  {
    name: "Plus Size Comfort Kurti",
    description: "Comfortable plus-size kurti with an elegant design and relaxed fit for everyday wear.",
    price: "999.00",
    category: "Plus Size Collection",
    mainCategory: "Women's Fashion",
    unit: "per piece",
    images: ["/attached_assets/products/plus-kurti-01.jpg"],
    specifications: ["Material: Cotton Blend", "Fit: Comfort Fit", "Sizes: XXL to 4XL", "Occasion: Daily Wear"],
    sku: "BMAA-PLUS-001",
    costPrice: "470.00",
    lowStockThreshold: 4,
    reorderPoint: 8,
    maxStock: 70,
    variants: [
      { sku: "BMAA-PLUS-001-BLK-XXL", color: "Black", size: "XXL", price: "999.00", compareAtPrice: "1299.00", stockQuantity: 5, lowStockThreshold: 2, weight: "0.50", images: ["/attached_assets/products/plus-kurti-01-black.jpg"] },
      { sku: "BMAA-PLUS-001-BLK-3XL", color: "Black", size: "3XL", price: "1049.00", compareAtPrice: "1349.00", stockQuantity: 4, lowStockThreshold: 2, weight: "0.50", images: ["/attached_assets/products/plus-kurti-01-black.jpg"] },
      { sku: "BMAA-PLUS-001-BLK-4XL", color: "Black", size: "4XL", price: "1099.00", compareAtPrice: "1399.00", stockQuantity: 3, lowStockThreshold: 2, weight: "0.50", images: ["/attached_assets/products/plus-kurti-01-black.jpg"] },
      { sku: "BMAA-PLUS-001-BLU-XXL", color: "Blue", size: "XXL", price: "999.00", compareAtPrice: "1299.00", stockQuantity: 6, lowStockThreshold: 2, weight: "0.50", images: ["/attached_assets/products/plus-kurti-01-blue.jpg"] },
      { sku: "BMAA-PLUS-001-BLU-3XL", color: "Blue", size: "3XL", price: "1049.00", compareAtPrice: "1349.00", stockQuantity: 4, lowStockThreshold: 2, weight: "0.50", images: ["/attached_assets/products/plus-kurti-01-blue.jpg"] },
    ],
  },
  {
    name: "Festive Chanderi Silk Kurti",
    description: "Premium Chanderi silk kurti with traditional motifs, suitable for festivals and special occasions.",
    price: "2499.00",
    category: "Traditional Kurti",
    mainCategory: "Women's Fashion",
    unit: "per piece",
    images: ["/attached_assets/products/chanderi-01.jpg"],
    specifications: ["Material: Chanderi Silk", "Pattern: Traditional Motifs", "Sleeve: 3/4 Sleeve", "Occasion: Festive"],
    sku: "BMAA-TRAD-001",
    costPrice: "1250.00",
    lowStockThreshold: 3,
    reorderPoint: 5,
    maxStock: 50,
    variants: [
      { sku: "BMAA-TRAD-001-YEL-M", color: "Yellow", size: "M", price: "2499.00", compareAtPrice: "3299.00", stockQuantity: 4, lowStockThreshold: 2, weight: "0.48", images: ["/attached_assets/products/chanderi-01-yellow.jpg"] },
      { sku: "BMAA-TRAD-001-YEL-L", color: "Yellow", size: "L", price: "2499.00", compareAtPrice: "3299.00", stockQuantity: 5, lowStockThreshold: 2, weight: "0.48", images: ["/attached_assets/products/chanderi-01-yellow.jpg"] },
      { sku: "BMAA-TRAD-001-GRN-M", color: "Green", size: "M", price: "2599.00", compareAtPrice: "3399.00", stockQuantity: 3, lowStockThreshold: 2, weight: "0.48", images: ["/attached_assets/products/chanderi-01-green.jpg"] },
      { sku: "BMAA-TRAD-001-GRN-L", color: "Green", size: "L", price: "2599.00", compareAtPrice: "3399.00", stockQuantity: 4, lowStockThreshold: 2, weight: "0.48", images: ["/attached_assets/products/chanderi-01-green.jpg"] },
    ],
  },
  {
    name: "A-Line Midi Skirt",
    description: "Classic A-line midi skirt with a flattering silhouette for office wear and evening outings.",
    price: "899.00",
    category: "Skirt",
    mainCategory: "Women's Fashion",
    unit: "per piece",
    images: ["/attached_assets/products/skirt-01.jpg"],
    specifications: ["Material: Premium Fabric", "Fit: A-Line", "Length: Midi", "Occasion: Office, Casual"],
    sku: "BMAA-SKIRT-001",
    costPrice: "410.00",
    lowStockThreshold: 5,
    reorderPoint: 8,
    maxStock: 80,
    variants: [
      { sku: "BMAA-SKIRT-001-BLK-S", color: "Black", size: "S", price: "899.00", compareAtPrice: "1199.00", stockQuantity: 7, lowStockThreshold: 2, weight: "0.40", images: ["/attached_assets/products/skirt-01-black.jpg"] },
      { sku: "BMAA-SKIRT-001-BLK-M", color: "Black", size: "M", price: "899.00", compareAtPrice: "1199.00", stockQuantity: 10, lowStockThreshold: 2, weight: "0.40", images: ["/attached_assets/products/skirt-01-black.jpg"] },
      { sku: "BMAA-SKIRT-001-BLK-L", color: "Black", size: "L", price: "949.00", compareAtPrice: "1249.00", stockQuantity: 8, lowStockThreshold: 2, weight: "0.40", images: ["/attached_assets/products/skirt-01-black.jpg"] },
      { sku: "BMAA-SKIRT-001-NAV-M", color: "Navy Blue", size: "M", price: "899.00", compareAtPrice: "1199.00", stockQuantity: 5, lowStockThreshold: 2, weight: "0.40", images: ["/attached_assets/products/skirt-01-navy.jpg"] },
      { sku: "BMAA-SKIRT-001-NAV-L", color: "Navy Blue", size: "L", price: "949.00", compareAtPrice: "1249.00", stockQuantity: 4, lowStockThreshold: 2, weight: "0.40", images: ["/attached_assets/products/skirt-01-navy.jpg"] },
    ],
  },
];

const categoriesToSeed = [
  { mainCategory: "Women's Fashion", subcategories: ["Kurti Set", "Short Kurti", "Traditional Kurti", "Cotton Kurti", "Coord Set", "Maxi", "Party Wear", "Plus Size Collection", "Bottom", "Skirt"] },
  { mainCategory: "Accessories", subcategories: ["Handbags", "Jewelry", "Scarves", "Belts", "Sunglasses", "Watches"] },
];

async function clearExistingCatalog() {
  console.log("🗑️ Clearing existing product/catalog data...");

  // Delete children first where the FK does not cascade.
  await db.delete(reviewHelpfulVotes);
  await db.delete(productReviews);
  await db.delete(orderStatusHistory);
  await db.delete(orderItems);
  await db.delete(orders);
  await db.delete(cartItems);
  await db.delete(wishlists);
  await db.delete(inventoryHistory);
  await db.delete(stockAlerts);
  await db.delete(waitlistEntries);
  await db.delete(productVariants);
  await db.delete(products);
  await db.delete(categories);

  console.log("✅ Existing catalog/order/cart data cleared.");
  console.log("✅ Users and user addresses were preserved.");
}

async function seedCatalog() {
  let totalVariants = 0;

  for (const product of productsToSeed) {
    const [createdProduct] = await db.insert(products).values({
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
      mainCategory: product.mainCategory,
      unit: product.unit,
      images: product.images,
      specifications: product.specifications,
      inStock: product.variants.reduce((sum, variant) => sum + variant.stockQuantity, 0),
      lowStockThreshold: product.lowStockThreshold,
      reorderPoint: product.reorderPoint,
      maxStock: product.maxStock,
      sku: product.sku,
      supplier: "BMAA Fashion",
      shippingChargeApplicable: false,
      shippingCharge: "0",
      costPrice: product.costPrice,
    }).returning();

    const variantRows = product.variants.map((variant, index) => ({
      productId: createdProduct.id,
      sku: variant.sku,
      color: variant.color,
      size: variant.size,
      price: variant.price,
      compareAtPrice: variant.compareAtPrice,
      stockQuantity: variant.stockQuantity,
      lowStockThreshold: variant.lowStockThreshold,
      weight: variant.weight,
      shippingChargeApplicable: false,
      shippingCharge: "0",
      images: variant.images,
      isActive: true,
      sortOrder: index + 1,
    }));

    await db.insert(productVariants).values(variantRows);
    totalVariants += variantRows.length;

    console.log(`✅ ${createdProduct.name} — ${variantRows.length} variants`);
  }

  for (const category of categoriesToSeed) {
    await db.insert(categories).values(category);
    console.log(`✅ Category: ${category.mainCategory}`);
  }

  console.log("\n🎉 BMAA Fashion catalog seed completed.");
  console.log(`📦 Products: ${productsToSeed.length}`);
  console.log(`🎨 Variants: ${totalVariants}`);
}

async function main() {
  try {
    await clearExistingCatalog();
    await seedCatalog();
    process.exit(0);
  } catch (error) {
    console.error("❌ Catalog seed failed:", error);
    process.exit(1);
  }
}

void main();
