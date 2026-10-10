import { useState, useEffect, useRef, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Leaf, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import ProductCard from "@/components/ProductCard";
import type { Product } from "@shared/schema";
import { useSEO } from "@/hooks/use-seo";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { ORGANIZATION_DATA, generateBreadcrumbs } from "@/lib/structured-data-constants";

const PRODUCTS_PER_PAGE = 12;

interface FreshProduceProps {
  onAddToCart: (productId: string) => void;
  onViewProductDetails: (productId: string) => void;
}

export default function FreshProduce({ onAddToCart, onViewProductDetails }: FreshProduceProps) {
  const handleViewDetails = (productId: string) => {
    // Store source in sessionStorage so ProductDetail knows where we came from
    sessionStorage.setItem('productListSource', 'fresh-produce');
    onViewProductDetails(productId);
  };
  const freshProduceStructuredData = useMemo(() => [
    ORGANIZATION_DATA,
    generateBreadcrumbs([
      { name: "Home", url: "/" },
      { name: "Collections", url: "/fresh-produce" }
    ]),
    {
      "@type": "CollectionPage",
      name: "Dress Collections",
      description: "Premium curated dress collections for every occasion and style.",
      url: typeof window !== 'undefined' ? `${window.location.origin}/fresh-produce` : undefined
    }
  ], []);

  const { pageBanners, seoSettings } = useSiteSettings();
  const banner = pageBanners?.freshProduce;
  const bannerTitle = banner?.title || "Dress Collections";
  const bannerSubtitle = banner?.subtitle || "Curated dress collections for every occasion. Premium fabrics, exclusive designs, and timeless elegance. Discover your perfect style.";

  useSEO({
    title: seoSettings?.freshProduce?.title || "Premium Dress Collections | Fashion Boutique | Bmaafashion",
    description: seoSettings?.freshProduce?.description || "Shop exclusive dress collections with premium fabrics and exquisite designs. From casual to formal wear, find the perfect dress for every occasion.",
    ogTitle: "Dress Collections - Bmaafashion Boutique",
    ogDescription: "Premium dress collections with exclusive designs and high-quality fabrics. Shop seasonal collections and timeless classics.",
    ogImage: "/attached_assets/bmaafashion.jpeg",
    keywords: "dress collections, boutique fashion, premium dresses, casual dresses, formal wear, fashion online",
    structuredData: freshProduceStructuredData,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const productSectionRef = useRef<HTMLDivElement>(null);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory]);

  // Scroll to product section when page changes
  useEffect(() => {
    if (productSectionRef.current) {
      productSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [currentPage]);

  const { data: products, isLoading } = useQuery({
    queryKey: ['/api/products'],
    queryFn: async () => {
      const response = await fetch('/api/products');
      if (!response.ok) throw new Error('Failed to fetch products');
      return response.json() as Promise<Product[]>;
    }
  });

  // Filter for fresh produce only (using mainCategory field)
  const freshProduceProducts = products?.filter(p => 
    p.mainCategory === "Fresh Produce"
  ) || [];

  // Get unique categories from fresh produce products
  const freshProduceCategories = Array.from(new Set(freshProduceProducts.map(p => p.category)));

  // Apply search and category filters
  const filteredProducts = freshProduceProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
  const endIndex = startIndex + PRODUCTS_PER_PAGE;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      if (currentPage > 3) {
        pages.push("...");
      }
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) {
        pages.push("...");
      }
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section
        className="relative text-white py-20 overflow-hidden"
        style={banner?.imageUrl ? { backgroundImage: `url(${banner.imageUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : {}}
      >
        {banner?.imageUrl && <div className="absolute inset-0 bg-black/55" />}
        {!banner?.imageUrl && <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary" />}
        <div className="relative container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-full mb-6">
              <Leaf className="h-5 w-5" />
              <span className="text-sm font-medium">Premium Dress Collections</span>
            </div>
            <h1 className="text-5xl font-bold mb-6" data-testid="heading-fresh-produce">{bannerTitle}</h1>
            <p className="text-xl opacity-90 mb-8">{bannerSubtitle}</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Badge variant="outline" className="px-4 py-2 text-base text-white border-white/60">
                Premium Quality
              </Badge>
              <Badge variant="outline" className="px-4 py-2 text-base text-white border-white/60">
                Exclusive Designs
              </Badge>
              <Badge variant="outline" className="px-4 py-2 text-base text-white border-white/60">
                Seasonal Collections
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="container mx-auto px-4 py-12">
        {/* Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search dresses and collections..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-fresh-produce"
                />
              </div>
              <div className="min-w-[200px]">
                <Select
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger data-testid="select-category-filter">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" data-testid="filter-all">
                      All Categories
                    </SelectItem>
                    {freshProduceCategories.map((category: string) => (
                      <SelectItem
                        key={category}
                        value={category}
                        data-testid={`filter-${category.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filter Summary */}
        {!isLoading && filteredProducts.length > 0 && (
          <div className="mb-6 text-sm text-muted-foreground">
            Showing {startIndex + 1}-{Math.min(endIndex, filteredProducts.length)} of {filteredProducts.length} vegetables
          </div>
        )}

        {/* Product Section */}
        <div ref={productSectionRef}>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <Card key={i} className="animate-pulse">
                  <div className="h-48 bg-muted rounded-t-lg"></div>
                  <CardContent className="p-4 space-y-3">
                    <div className="h-4 bg-muted rounded"></div>
                    <div className="h-3 bg-muted rounded w-3/4"></div>
                    <div className="h-6 bg-muted rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Leaf className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No vegetables found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search or filters
              </p>
            </div>
          ) : (
            <>
              {/* Product Grid - Simple grid for all categories, or with heading for specific category */}
              {selectedCategory !== "all" && (
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <Leaf className="h-6 w-6 text-amber-600" />
                  {selectedCategory}
                  <span className="text-sm text-muted-foreground font-normal ml-2">
                    ({filteredProducts.length} products)
                  </span>
                </h2>
              )}
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {paginatedProducts.map((product) => (
                <ProductCard 
                  key={product.id} 
                  product={product}
                  onAddToCart={() => onAddToCart(product.id)}
                  onViewDetails={() => handleViewDetails(product.id)}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination className="mt-12" data-testid="pagination">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 1) setCurrentPage(currentPage - 1);
                      }}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      data-testid="button-previous-page"
                    />
                  </PaginationItem>

                  {getPageNumbers().map((page, index) => {
                    if (page === "...") {
                      return (
                        <PaginationItem key={`ellipsis-${index}`}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    }

                    return (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage(page as number);
                          }}
                          isActive={currentPage === page}
                          className="cursor-pointer"
                          data-testid={`button-page-${page}`}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}

                  <PaginationItem>
                    <PaginationNext
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                      }}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      data-testid="button-next-page"
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </>
          )}
        </div>
      </section>
    </div>
  );
}
