import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Package, Leaf, Wrench } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Product } from "@shared/schema";
import { useSEO } from "@/hooks/use-seo";
import { ORGANIZATION_DATA, generateBreadcrumbs } from "@/lib/structured-data-constants";

interface CategoriesProps {
  onNavigateToProducts: () => void;
  onNavigateToCategory: (mainCategory: string, subcategory: string) => void;
}

export default function Categories({ onNavigateToProducts, onNavigateToCategory }: CategoriesProps) {
  const categoriesStructuredData = useMemo(() => [
    ORGANIZATION_DATA,
    generateBreadcrumbs([
      { name: "Home", url: "/" },
      { name: "Categories", url: "/categories" }
    ])
  ], []);

  useSEO({
    title: "Curated Fashion Collections | Shop by Category | Bmaafashion",
    description: "Browse Bmaafashion's fashion collections by category. Discover curated styles, trending pieces, and timeless fashion.",
    ogTitle: "Shop Fashion by Category - Bmaafashion",
    ogDescription: "Explore our organized fashion collections. From casual wear to formal attire.",
    ogImage: "/attached_assets/bmaafashion.jpeg",
    keywords: "fashion categories, clothing, accessories, curated collections, trending styles",
    structuredData: categoriesStructuredData,
  });
  // Fetch categories
  const { data: categoriesData = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: async () => {
      const response = await fetch('/api/categories');
      console.log('Fetched categories:', response);
      if (!response.ok) throw new Error('Failed to fetch categories');
      return response.json() as Promise<{id: string; mainCategory: string; subcategories: string[]}[]>;
    }
  });

  // Fetch products to calculate counts
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['/api/products'],
    queryFn: async () => {
      const response = await fetch('/api/products');
      if (!response.ok) throw new Error('Failed to fetch products');
      return response.json() as Promise<Product[]>;
    }
  });

  // Build subcategories list with counts (flatten all subcategories from all main categories)
  const categories = categoriesData
    .flatMap(cat =>
      cat.subcategories.map(subcategory => ({
        name: subcategory,
        mainCategory: cat.mainCategory,
        count: products.filter(p => p.category === subcategory).length
      }))
    )
    .filter(cat => cat.count > 0); // Only show subcategories that have products

  const isLoading = categoriesLoading || productsLoading;

  // Get icon for category
  const getCategoryIcon = (categoryName: string) => {
    const name = categoryName.toLowerCase();
    if (name.includes('saree') || name.includes('lehenga') || name.includes('suit')) {
      return Package;
    }
    if (name.includes('kurta') || name.includes('ethnic')) {
      return Leaf;
    }
    return Wrench;
  };

  // Get category description - generic since we have many subcategories
  const getCategoryDescription = (categoryName: string, mainCategory: string) => {
    return `Explore our collection of ${categoryName.toLowerCase()} in ${mainCategory}`;
  };

  // Get sample products for subcategory
  const getCategoryProducts = (subcategory: string) => {
    return products.filter(product => product.category === subcategory).slice(0, 3);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="bg-background">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-primary to-secondary text-white py-8 sm:py-10 md:py-12">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4">Shop by Category</h1>
          <p className="text-base sm:text-lg opacity-90 max-w-2xl mx-auto px-4">
            Explore our curated fashion collections organized by category.
            Find the perfect style for every occasion.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 sm:py-10 md:py-12">
        {/* Quick Navigation */}
        <div className="flex justify-center mb-6 sm:mb-8">
          <Button
            onClick={onNavigateToProducts}
            variant="outline"
            data-testid="button-all-products"
            className="flex items-center gap-2"
          >
            <Package className="h-4 w-4" />
            View All Products
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Category Grid */}
        {categories.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold mb-2">No categories found</h3>
            <p className="text-muted-foreground mb-4">
              Categories will appear here once products are added to the system.
            </p>
            <Button
              onClick={onNavigateToProducts}
              data-testid="button-view-products"
            >
              View All Products
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {categories.map((category) => {
            const Icon = getCategoryIcon(category.name);
            const categoryProducts = getCategoryProducts(category.name);
            
            return (
              <Card 
                key={category.name}
                className="group hover-elevate cursor-pointer transition-all duration-300"
                data-testid={`card-category-${category.name.replace(/\s+/g, '-').toLowerCase()}`}
                onClick={() => onNavigateToCategory(category.mainCategory, category.name)}
              >
                <CardHeader className="text-center pb-4">
                  <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <Icon className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-xl mb-2">{category.name}</CardTitle>
                  <CardDescription className="text-sm">
                    {getCategoryDescription(category.name, category.mainCategory)}
                  </CardDescription>
                  <div className="mt-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-primary/10 text-primary">
                      {category.mainCategory}
                    </span>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  {/* Product Count Badge */}
                  <div className="text-center mb-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-secondary/10 text-secondary">
                      {category.count} Product{category.count !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Sample Products */}
                  {categoryProducts.length > 0 && (
                    <div className="space-y-2 mb-4">
                      <h4 className="font-medium text-sm text-muted-foreground">Featured Items:</h4>
                      {categoryProducts.map((product) => (
                        <div key={product.id} className="flex items-center justify-between text-sm">
                          <span className="truncate flex-1">{product.name}</span>
                          <span className="text-primary font-medium ml-2">
                            ₹{parseFloat(product.price).toLocaleString()}
                          </span>
                        </div>
                      ))}
                      {category.count > 3 && (
                        <div className="text-xs text-muted-foreground text-center pt-1">
                          +{category.count - 3} more items
                        </div>
                      )}
                    </div>
                  )}

                  {/* Call to Action */}
                  <Button
                    variant="ghost"
                    className="w-full group-hover:bg-primary group-hover:text-white transition-colors"
                    data-testid={`button-browse-${category.name.replace(/\s+/g, '-').toLowerCase()}`}
                  >
                    Browse {category.name}
                    <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
          </div>
        )}

        {/* Call to Action Section */}
        <div className="mt-16 text-center bg-card rounded-xl p-8 border">
          <h2 className="text-2xl font-bold mb-4">Need Help Finding Something?</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Our fashion experts are here to help you find the perfect outfit.
            Browse all products or contact us for personalized styling advice.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={onNavigateToProducts}
              data-testid="button-browse-all"
            >
              Browse All Products
            </Button>
            <Button
              variant="outline"
              data-testid="button-get-help"
            >
              Contact Us
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}