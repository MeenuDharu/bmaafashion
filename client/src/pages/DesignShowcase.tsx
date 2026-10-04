import { useState } from "react";
import { Link } from "wouter";
import EnhancedProductCard from "@/components/EnhancedProductCard";
import CategoryShowcase from "@/components/CategoryShowcase";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { Product } from "@shared/schema";

// Dummy product data
const dummyProducts: Product[] = [
  {
    id: "1",
    name: "Elegant Silk Saree",
    description: "Beautiful handwoven silk saree with intricate golden border and traditional motifs",
    price: "12999",
    category: "Sarees",
    mainCategory: "Women",
    images: ["/attached_assets/bmaafashion.jpeg"],
    inStock: 5,
    lowStockThreshold: 3,
    unit: "piece",
    planterCount: null,
    dimensions: null,
    specifications: null,
    cultivableCrops: null,
    structureMaterial: null,
    reorderPoint: 3,
    maxStock: 20,
    costPrice: "8000",
    supplier: null,
    sku: "SAREE-001",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "2",
    name: "Designer Lehenga Set",
    description: "Stunning bridal lehenga with heavy embroidery and embellishments",
    price: "45999",
    category: "Lehengas",
    mainCategory: "Women",
    images: ["/attached_assets/bmaafashion.jpeg"],
    inStock: 3,
    lowStockThreshold: 3,
    unit: "set",
    planterCount: null,
    dimensions: null,
    specifications: null,
    cultivableCrops: null,
    structureMaterial: null,
    reorderPoint: 2,
    maxStock: 10,
    costPrice: "30000",
    supplier: null,
    sku: "LEHENGA-001",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "3",
    name: "Cotton Kurti",
    description: "Comfortable and stylish cotton kurti perfect for everyday wear",
    price: "1299",
    category: "Kurtis",
    mainCategory: "Women",
    images: ["/attached_assets/bmaafashion.jpeg"],
    inStock: 15,
    lowStockThreshold: 5,
    unit: "piece",
    planterCount: null,
    dimensions: null,
    specifications: null,
    cultivableCrops: null,
    structureMaterial: null,
    reorderPoint: 5,
    maxStock: 50,
    costPrice: "800",
    supplier: null,
    sku: "KURTI-001",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "4",
    name: "Premium Sherwani",
    description: "Luxurious sherwani with intricate embroidery for special occasions",
    price: "25999",
    category: "Sherwanis",
    mainCategory: "Men",
    images: ["/attached_assets/bmaafashion.jpeg"],
    inStock: 0,
    lowStockThreshold: 3,
    unit: "piece",
    planterCount: null,
    dimensions: null,
    specifications: null,
    cultivableCrops: null,
    structureMaterial: null,
    reorderPoint: 2,
    maxStock: 15,
    costPrice: "18000",
    supplier: null,
    sku: "SHERWANI-001",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// Dummy category data
const dummyCategories = [
  {
    title: "Women's Collection",
    description: "Explore our exquisite range of sarees, lehengas, and ethnic wear",
    image: "/attached_assets/bmaafashion.jpeg",
    link: "/products?category=women",
    productCount: 150,
  },
  {
    title: "Men's Collection",
    description: "Discover elegant kurtas, sherwanis, and formal wear",
    image: "/attached_assets/bmaafashion.jpeg",
    link: "/products?category=men",
    productCount: 85,
  },
  {
    title: "Festive Special",
    description: "Celebrate in style with our festive collection",
    image: "/attached_assets/bmaafashion.jpeg",
    link: "/products?collection=festive",
    productCount: 120,
  },
  {
    title: "Wedding Collection",
    description: "Make your special day memorable with our bridal collection",
    image: "/attached_assets/bmaafashion.jpeg",
    link: "/products?collection=wedding",
    productCount: 95,
  },
];

export default function DesignShowcase() {
  const [cartItems, setCartItems] = useState<string[]>([]);

  const handleAddToCart = (productId: string) => {
    setCartItems([...cartItems, productId]);
    alert(`Product ${productId} added to cart!`);
  };

  const handleViewDetails = (productId: string) => {
    alert(`Viewing details for product ${productId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-muted/20 to-white">
      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-transparent" />
        <div className="relative max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-6">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">New Design System</span>
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            Shrideepha Silks Inspired Design
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8 leading-relaxed">
            Experience our elegant new design with mega menu navigation, enhanced product cards,
            and smooth animations inspired by premium fashion e-commerce.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/products">
              <Button size="lg" className="shadow-lg hover:shadow-xl">
                Explore Products
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/about">
              <Button size="lg" variant="outline" className="shadow-md hover:shadow-lg">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Category Showcase Section */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
              Shop by Category
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-primary to-accent mx-auto mb-6" />
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover our curated collections designed for every occasion
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {dummyCategories.map((category, index) => (
              <CategoryShowcase
                key={index}
                title={category.title}
                description={category.description}
                image={category.image}
                link={category.link}
                productCount={category.productCount}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Product Cards Section */}
      <section className="py-16 px-4 bg-gradient-to-br from-muted/30 via-white to-accent/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
              Featured Products
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-primary to-accent mx-auto mb-6" />
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Hover over the cards to see the elegant animations and quick actions
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {dummyProducts.map((product) => (
              <EnhancedProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
                onViewDetails={handleViewDetails}
              />
            ))}
          </div>

          <div className="text-center mt-12">
            <Link to="/products">
              <Button size="lg" variant="outline" className="shadow-md hover:shadow-lg">
                View All Products
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
              Design Features
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-primary to-accent mx-auto mb-6" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Mega Menu Navigation",
                description: "Elegant dropdown menus with category images and subcategories for easy navigation",
                icon: "🎯",
              },
              {
                title: "Enhanced Product Cards",
                description: "Beautiful cards with hover zoom effects, quick actions, and smooth animations",
                icon: "✨",
              },
              {
                title: "Responsive Design",
                description: "Fully responsive layout that works perfectly on all devices and screen sizes",
                icon: "📱",
              },
              {
                title: "Smooth Animations",
                description: "Carefully crafted transitions and micro-interactions for a premium feel",
                icon: "🎨",
              },
              {
                title: "Category Showcases",
                description: "Large, engaging category cards with overlay effects and product counts",
                icon: "🏷️",
              },
              {
                title: "Modern Typography",
                description: "Elegant font hierarchy with proper spacing and readability",
                icon: "📝",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="p-6 rounded-xl bg-white border-2 border-muted hover:border-primary/50 shadow-md hover:shadow-xl transition-all duration-300 group"
              >
                <div className="text-4xl mb-4 transform group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3 text-foreground group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary/5 via-accent/5 to-transparent">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
            Ready to Experience the New Design?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
            Navigate through the menu above to explore all the new features and improvements
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/">
              <Button size="lg" className="shadow-lg hover:shadow-xl">
                Go to Home Page
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/products">
              <Button size="lg" variant="outline" className="shadow-md hover:shadow-lg">
                Browse Products
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
