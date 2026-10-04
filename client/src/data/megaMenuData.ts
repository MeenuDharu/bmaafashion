import { MegaMenuCategory } from "@/components/MegaMenu";

// Dummy images - using placeholder images for featured sections
const PLACEHOLDER_IMG = "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=300&fit=crop";
const FRESH_PRODUCE_IMG = "https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=400&h=300&fit=crop";
const DAIRY_IMG = "https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=400&h=300&fit=crop";
const BAKERY_IMG = "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=300&fit=crop";
const BEVERAGES_IMG = "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&h=300&fit=crop";
const SNACKS_IMG = "https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=400&h=300&fit=crop";
const ORGANIC_IMG = "https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=400&h=300&fit=crop";

export const megaMenuCategories: MegaMenuCategory[] = [
  {
    name: "Fresh Produce",
    path: "/products?category=Fresh Produce",
    subcategories: [
      "Vegetables",
      "Fruits",
      "Salads & Cuts",
    ],
    featured: {
      title: "Farm Fresh Daily",
      subtitle: "Handpicked fresh produce delivered to your door",
      image: FRESH_PRODUCE_IMG,
      link: "/products?category=Fresh Produce",
    },
  },
  {
    name: "Dairy & Eggs",
    path: "/products?category=Dairy & Eggs",
    subcategories: [
      "Milk & Cream",
      "Cheese & Butter",
      "Yogurt & Eggs",
    ],
    featured: {
      title: "Pure & Fresh",
      subtitle: "Quality dairy products from trusted farms",
      image: DAIRY_IMG,
      link: "/products?category=Dairy & Eggs",
    },
  },
  {
    name: "Bakery & Bread",
    path: "/products?category=Bakery & Bread",
    subcategories: [
      "Breads",
      "Cakes & Pastries",
      "Cookies & Biscuits",
    ],
    featured: {
      title: "Freshly Baked",
      subtitle: "Delicious baked goods made daily",
      image: BAKERY_IMG,
      link: "/products?category=Bakery & Bread",
    },
  },
  {
    name: "Beverages",
    path: "/products?category=Beverages",
    subcategories: [
      "Hot Beverages",
      "Cold Beverages",
      "Health Drinks",
    ],
    featured: {
      title: "Stay Refreshed",
      subtitle: "Wide range of beverages for every mood",
      image: BEVERAGES_IMG,
      link: "/products?category=Beverages",
    },
  },
  {
    name: "Snacks & Packaged Foods",
    path: "/products?category=Snacks & Packaged Foods",
    subcategories: [
      "Chips & Namkeen",
      "Chocolates & Sweets",
      "Ready to Eat",
    ],
    featured: {
      title: "Snack Time",
      subtitle: "Delicious snacks for every craving",
      image: SNACKS_IMG,
      link: "/products?category=Snacks & Packaged Foods",
    },
  },
  {
    name: "Staples & Cooking",
    path: "/products?category=Staples & Cooking",
    subcategories: [
      "Rice & Grains",
      "Dals & Pulses",
      "Oils & Spices",
    ],
    featured: {
      title: "Kitchen Essentials",
      subtitle: "Premium quality staples for your kitchen",
      image: PLACEHOLDER_IMG,
      link: "/products?category=Staples & Cooking",
    },
  },
  {
    name: "Organic & Healthy",
    path: "/products?category=Organic & Healthy",
    subcategories: [
      "Organic Produce",
      "Health Foods",
      "Natural Products",
    ],
    featured: {
      title: "Live Healthy",
      subtitle: "100% organic and natural products",
      image: ORGANIC_IMG,
      link: "/products?category=Organic & Healthy",
    },
  },
  {
    name: "Offers",
    path: "/products?sale=true",
  },
];
