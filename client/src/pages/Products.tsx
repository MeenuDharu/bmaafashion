import { useState, useEffect, useRef, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useSEO } from "@/hooks/use-seo";
import { ORGANIZATION_DATA, generateBreadcrumbs } from "@/lib/structured-data-constants";
import { Search, Filter, Grid3x3, Grid2x2, LayoutGrid, Columns2, List, ChevronDown, ChevronRight, Home, Star } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Product } from "@shared/schema";

interface ProductsProps {
  onAddToCart: (productId: string) => void;
  onViewProductDetails: (productId: string) => void;
}

export default function Products({ onAddToCart, onViewProductDetails }: ProductsProps) {
  const handleViewDetails = (productId: string) => {
    sessionStorage.setItem('productListSource', 'products');
    onViewProductDetails(productId);
  };

  const { pageBanners, seoSettings } = useSiteSettings();
  const banner = pageBanners?.products;
  const bannerTitle = banner?.title || "Fashion Collections";
  const bannerSubtitle = banner?.subtitle || "Browse our complete collection of premium fashion wear and accessories.";

  const productsStructuredData = useMemo(() => [
    ORGANIZATION_DATA,
    generateBreadcrumbs([
      { name: "Home", url: "/" },
      { name: "Products", url: "/products" }
    ]),
    {
      "@type": "CollectionPage",
      name: "Fashion Collections",
      description: "Browse our complete range of fashion collections - dresses, tops, and accessories.",
      url: typeof window !== 'undefined' ? `${window.location.origin}/products` : undefined
    }
  ], []);

  useSEO({
    title: seoSettings?.products?.title || "Buy Fashion Collections Online | Bmaafashion",
    description: seoSettings?.products?.description || "Shop premium dress collections online at Bmaafashion. Exclusive designs, quality fabrics, and trendy styles for every occasion.",
    ogTitle: "Shop Dress Collections - Bmaafashion",
    ogDescription: "Discover Bmaafashion's exclusive dress collections. From casual to formal wear, find the perfect style for every occasion with premium quality fabrics.",
    ogImage: "/attached_assets/bmaafashion.jpeg",
    ogUrl: typeof window !== 'undefined' ? window.location.href : undefined,
    keywords: "dress collections, fashion boutique, premium dresses, casual dresses, formal wear, online fashion",
    structuredData: productsStructuredData,
  });

  const { productSettings } = useSiteSettings();
  const PRODUCTS_PER_PAGE = productSettings?.perPage ?? 12;

  const [location, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedMainCategory, setSelectedMainCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>(productSettings?.defaultSort ?? "featured");

  useEffect(() => {
    if (productSettings?.defaultSort) setSortBy(productSettings.defaultSort);
  }, [productSettings?.defaultSort]);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [gridColumns, setGridColumns] = useState<1 | 2 | 3 | 4>(4);
  
  // Filter states
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1500]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [availabilityFilter, setAvailabilityFilter] = useState<string[]>(["in_stock", "out_of_stock"]);
  const [minRating, setMinRating] = useState<number>(0);
  
  // Collapsible states
  const [collectionsOpen, setCollectionsOpen] = useState(true);
  const [availabilityOpen, setAvailabilityOpen] = useState(true);
  const [priceOpen, setPriceOpen] = useState(true);
  const [sizeOpen, setSizeOpen] = useState(true);
  const [reviewsOpen, setReviewsOpen] = useState(true);
  const [featuredOpen, setFeaturedOpen] = useState(true);

  const productSectionRef = useRef<HTMLDivElement>(null);

  // Handle URL parameters
  useEffect(() => {
    const updateFromURL = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const categoryParam = urlParams.get('category');
      const subcategoryParam = urlParams.get('subcategory');
      const searchParam = urlParams.get('search');
      
      if (categoryParam) {
        setSelectedMainCategory(categoryParam);
      } else {
        setSelectedMainCategory("all");
      }
      
      if (subcategoryParam) {
        setSelectedCategory(subcategoryParam);
      } else if (categoryParam) {
        setSelectedCategory("all");
      } else {
        setSelectedCategory("all");
      }
      
      if (searchParam) {
        setSearchTerm(searchParam);
      } else {
        setSearchTerm("");
      }
    };
    
    updateFromURL();
    window.addEventListener('popstate', updateFromURL);
    
    return () => {
      window.removeEventListener('popstate', updateFromURL);
    };
  }, [location]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, sortBy, priceRange, selectedSizes, availabilityFilter, minRating]);

  // Scroll to product section when page changes
  useEffect(() => {
    if (productSectionRef.current) {
      productSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [currentPage]);

  // Fetch products
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['/api/products'],
    queryFn: async () => {
      const response = await fetch('/api/products');
      if (!response.ok) throw new Error('Failed to fetch products');
      return response.json() as Promise<Product[]>;
    }
  });

  // Fetch categories
  const { data: categoriesData = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: async () => {
      const response = await fetch('/api/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      return response.json() as Promise<{id: string; mainCategory: string; subcategories: string[]}[]>;
    }
  });

  // Available sizes - dynamically extracted from products
  const availableSizes = useMemo(() => {
    const sizesSet = new Set<string>();
    products.forEach(product => {
      if (product.size) {
        // Split by comma if multiple sizes are in one string
        const sizes = product.size.split(',').map(s => s.trim()).filter(s => s);
        sizes.forEach(size => {
          sizesSet.add(size);
        });
      }
    });
    // Sort sizes in a logical order
    const sizeOrder = ["XS", "S", "M", "L", "XL", "XXL", "2XL", "3XL", "4XL", "5XL", "6XL", "Free Size", "One Size"];
    return Array.from(sizesSet).sort((a, b) => {
      const indexA = sizeOrder.indexOf(a);
      const indexB = sizeOrder.indexOf(b);
      if (indexA === -1 && indexB === -1) return a.localeCompare(b);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
  }, [products]);

  // Build categories list - Show all main categories when "Home" is selected
  const categories = useMemo(() => {
    if (selectedCategory === "all") {
      // When "Home" is selected, show all main categories
      return categoriesData
        .map(cat => ({
          name: cat.mainCategory,
          count: products.filter(p => p.mainCategory === cat.mainCategory).length,
          isMainCategory: true
        }))
        .filter(cat => cat.count > 0);
    } else {
      // When a specific category is selected, show its subcategories
      const selectedCat = categoriesData.find(cat =>
        cat.mainCategory === selectedCategory || cat.subcategories.includes(selectedCategory)
      );
      
      if (selectedCat) {
        return selectedCat.subcategories
          .map(subcategory => ({
            name: subcategory,
            count: products.filter(p => p.category === subcategory).length,
            isMainCategory: false
          }))
          .filter(cat => cat.count > 0);
      }
      
      return [];
    }
  }, [categoriesData, selectedCategory, products]);

  // Get products for the current category selection (for availability counts)
  const categoryProducts = useMemo(() => {
    if (selectedCategory === "all") {
      return products;
    }
    
    const isMainCategory = categoriesData.some(cat => cat.mainCategory === selectedCategory);
    if (isMainCategory) {
      return products.filter(p => p.mainCategory === selectedCategory);
    } else {
      return products.filter(p => p.category === selectedCategory);
    }
  }, [products, selectedCategory, categoriesData]);

  // Calculate price range from products
  const productPriceRange = useMemo(() => {
    if (products.length === 0) return { min: 0, max: 1500 };
    const prices = products.map(p => parseFloat(p.price));
    return {
      min: Math.floor(Math.min(...prices)),
      max: Math.ceil(Math.max(...prices))
    };
  }, [products]);

  // Update price range when products load
  useEffect(() => {
    setPriceRange([productPriceRange.min, productPriceRange.max]);
  }, [productPriceRange.min, productPriceRange.max]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    const filtered = products
      .filter(product => {
        const matchesSearch = searchTerm === "" ||
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.category.toLowerCase().includes(searchTerm.toLowerCase());
        
        // When "Home" is selected, show all products
        // When a main category is selected, show products from that main category
        // When a subcategory is selected, show products from that subcategory
        let matchesCategory = true;
        if (selectedCategory !== "all") {
          // Check if selectedCategory is a main category or subcategory
          const isMainCategory = categoriesData.some(cat => cat.mainCategory === selectedCategory);
          if (isMainCategory) {
            matchesCategory = product.mainCategory === selectedCategory;
          } else {
            matchesCategory = product.category === selectedCategory;
          }
        }
        
        const productPrice = parseFloat(product.price);
        const matchesPrice = productPrice >= priceRange[0] && productPrice <= priceRange[1];
        
        const matchesAvailability =
          (availabilityFilter.includes("in_stock") && product.inStock > 0) ||
          (availabilityFilter.includes("out_of_stock") && product.inStock === 0);
        
        // Size filtering - check if product has any of the selected sizes
        const matchesSize = selectedSizes.length === 0 || (product.size && selectedSizes.some(selectedSize => {
          const productSizes = product.size!.split(',').map(s => s.trim());
          return productSizes.includes(selectedSize);
        }));
        
        return matchesSearch && matchesCategory && matchesPrice && matchesAvailability && matchesSize;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "price-low":
            return parseFloat(a.price) - parseFloat(b.price);
          case "price-high":
            return parseFloat(b.price) - parseFloat(a.price);
          case "name":
            return a.name.localeCompare(b.name);
          case "featured":
          default:
            return 0; // Keep original order for featured
        }
      });
    
    return filtered;
  }, [products, searchTerm, selectedCategory, sortBy, priceRange, availabilityFilter, selectedSizes, categoriesData]);

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
  const endIndex = startIndex + PRODUCTS_PER_PAGE;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  // Get featured product (first product for now)
  const featuredProduct = products[0];

  // Generate page numbers
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const toggleSize = (size: string) => {
    setSelectedSizes(prev =>
      prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
    );
  };

  const toggleAvailability = (value: string) => {
    setAvailabilityFilter(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
  };

  const clearAllFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    setSelectedMainCategory("all");
    setPriceRange([productPriceRange.min, productPriceRange.max]);
    setSelectedSizes([]);
    setAvailabilityFilter(["in_stock", "out_of_stock"]);
    setMinRating(0);
  };

  const hasActiveFilters = 
    searchTerm !== "" || 
    selectedCategory !== "all" || 
    selectedMainCategory !== "all" ||
    priceRange[0] !== productPriceRange.min || 
    priceRange[1] !== productPriceRange.max ||
    selectedSizes.length > 0 ||
    availabilityFilter.length !== 2 ||
    minRating > 0;

  if (productsLoading || categoriesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Get current category name for breadcrumb and hero
  const currentCategoryName = selectedCategory === "all" ? "Home" : selectedCategory;

  // Get selected category data for hero section display
  const selectedCategoryData = useMemo(() => {
    if (selectedCategory === "all") {
      return {
        name: "Home",
        description: "Discover our complete collection of premium fashion wear",
        isHome: true
      };
    }
    
    // Check if it's a main category
    const isMainCategory = categoriesData.some(cat => cat.mainCategory === selectedCategory);
    
    if (isMainCategory) {
      return {
        name: selectedCategory,
        description: `Explore our ${selectedCategory.toLowerCase()} collection`,
        isMainCategory: true
      };
    }
    
    // It's a subcategory
    const parentCategory = categoriesData.find(cat =>
      cat.subcategories.includes(selectedCategory)
    );
    
    return {
      name: selectedCategory,
      description: `Explore our collection of ${selectedCategory.toLowerCase()}`,
      mainCategory: parentCategory?.mainCategory,
      isSubcategory: true
    };
  }, [selectedCategory, categoriesData]);

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb & Page Header - Sharanz Style */}
      <div className="bg-gradient-to-b from-muted/30 to-white border-b">
        <div className="container mx-auto px-4 py-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm mb-6">
            <a href="/" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
              <Home className="h-4 w-4" />
              Home
            </a>
            <ChevronRight className="h-3 w-3 text-muted-foreground" />
            <span className="text-foreground font-medium">{currentCategoryName}</span>
          </div>
          
          {/* Hero Section - Display selected category name */}
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-3 tracking-tight">
              {selectedCategoryData.name}
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {selectedCategoryData.description}
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 md:py-10">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
          {/* Sidebar - Sharanz Style */}
          <aside className="w-full lg:w-72 flex-shrink-0">
            <div className="space-y-4 lg:sticky lg:top-24">
              {/* Filter Header */}
              <div className="flex items-center justify-between pb-3 border-b">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filters
                </h2>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFilters}
                    className="text-xs text-primary hover:text-primary/80"
                  >
                    Clear All
                  </Button>
                )}
              </div>
              {/* Collections - Sharanz Style */}
              <Collapsible open={collectionsOpen} onOpenChange={setCollectionsOpen}>
                <div className="space-y-3 pb-4 border-b">
                  <CollapsibleTrigger className="flex items-center justify-between w-full group hover:text-primary transition-colors">
                    <h3 className="font-bold text-base uppercase tracking-wide">Categories</h3>
                    <ChevronDown className={`h-4 w-4 transition-transform ${collectionsOpen ? 'rotate-180' : ''}`} />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-1 pt-2">
                    <button
                      onClick={() => setSelectedCategory("all")}
                      className={`block w-full text-left text-sm py-2 px-3 rounded-md transition-all ${
                        selectedCategory === "all"
                          ? "bg-primary/10 text-primary font-semibold"
                          : "text-foreground hover:bg-muted hover:text-primary"
                      }`}
                    >
                      <span className="flex items-center justify-between">
                        Home
                        {selectedCategory === "all" && <span className="text-xs">✓</span>}
                      </span>
                    </button>
                    {categories.map((category) => {
                      const isSelected = selectedCategory === category.name;
                      return (
                        <button
                          key={category.name}
                          onClick={() => setSelectedCategory(category.name)}
                          className={`block w-full text-left text-sm py-2 px-3 rounded-md transition-all ${
                            isSelected
                              ? "bg-primary/10 text-primary font-semibold"
                              : "text-foreground hover:bg-muted hover:text-primary"
                          }`}
                        >
                          <span className="flex items-center justify-between">
                            {category.name}
                            <span className="text-xs text-muted-foreground">({category.count})</span>
                          </span>
                        </button>
                      );
                    })}
                  </CollapsibleContent>
                </div>
              </Collapsible>

              {/* Availability - Sharanz Style */}
              <Collapsible open={availabilityOpen} onOpenChange={setAvailabilityOpen}>
                <div className="space-y-3 pb-4 border-b">
                  <CollapsibleTrigger className="flex items-center justify-between w-full hover:text-primary transition-colors">
                    <h3 className="font-bold text-base uppercase tracking-wide">Availability</h3>
                    <ChevronDown className={`h-4 w-4 transition-transform ${availabilityOpen ? 'rotate-180' : ''}`} />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-2 pt-2">
                    <label className="flex items-center space-x-3 cursor-pointer group py-1">
                      <Checkbox
                        id="in-stock"
                        checked={availabilityFilter.includes("in_stock")}
                        onCheckedChange={() => toggleAvailability("in_stock")}
                        className="border-2"
                      />
                      <span className="text-sm group-hover:text-primary transition-colors flex-1">
                        In Stock
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({categoryProducts.filter(p => p.inStock > 0).length})
                      </span>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer group py-1">
                      <Checkbox
                        id="out-of-stock"
                        checked={availabilityFilter.includes("out_of_stock")}
                        onCheckedChange={() => toggleAvailability("out_of_stock")}
                        className="border-2"
                      />
                      <span className="text-sm group-hover:text-primary transition-colors flex-1">
                        Out of Stock
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({categoryProducts.filter(p => p.inStock === 0).length})
                      </span>
                    </label>
                  </CollapsibleContent>
                </div>
              </Collapsible>

              {/* Price - Sharanz Style */}
              <Collapsible open={priceOpen} onOpenChange={setPriceOpen}>
                <div className="space-y-3 pb-4 border-b">
                  <CollapsibleTrigger className="flex items-center justify-between w-full hover:text-primary transition-colors">
                    <h3 className="font-bold text-base uppercase tracking-wide">Price</h3>
                    <ChevronDown className={`h-4 w-4 transition-transform ${priceOpen ? 'rotate-180' : ''}`} />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-4 pt-2">
                    <Slider
                      min={productPriceRange.min}
                      max={productPriceRange.max}
                      step={10}
                      value={priceRange}
                      onValueChange={(value) => setPriceRange(value as [number, number])}
                      className="w-full"
                    />
                    <div className="flex items-center justify-between text-sm bg-muted/50 px-3 py-2 rounded-md">
                      <span className="font-semibold text-foreground">
                        ₹{priceRange[0].toLocaleString()}
                      </span>
                      <span className="text-muted-foreground">to</span>
                      <span className="font-semibold text-foreground">
                        ₹{priceRange[1].toLocaleString()}
                      </span>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>

              {/* Size - Sharanz Style */}
              <Collapsible open={sizeOpen} onOpenChange={setSizeOpen}>
                <div className="space-y-3 pb-4 border-b">
                  <CollapsibleTrigger className="flex items-center justify-between w-full hover:text-primary transition-colors">
                    <h3 className="font-bold text-base uppercase tracking-wide">Size</h3>
                    <ChevronDown className={`h-4 w-4 transition-transform ${sizeOpen ? 'rotate-180' : ''}`} />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-2">
                    <div className="grid grid-cols-3 gap-2">
                      {availableSizes.map((size) => (
                        <Button
                          key={size}
                          variant={selectedSizes.includes(size) ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleSize(size)}
                          className={`text-xs font-semibold transition-all ${
                            selectedSizes.includes(size)
                              ? "bg-primary text-primary-foreground shadow-md"
                              : "hover:border-primary hover:text-primary"
                          }`}
                        >
                          {size}
                        </Button>
                      ))}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>

              {/* Customer Reviews - Sharanz Style */}
              <Collapsible open={reviewsOpen} onOpenChange={setReviewsOpen}>
                <div className="space-y-3 pb-4 border-b">
                  <CollapsibleTrigger className="flex items-center justify-between w-full hover:text-primary transition-colors">
                    <h3 className="font-bold text-base uppercase tracking-wide">Rating</h3>
                    <ChevronDown className={`h-4 w-4 transition-transform ${reviewsOpen ? 'rotate-180' : ''}`} />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-1 pt-2">
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <button
                        key={rating}
                        onClick={() => setMinRating(rating === minRating ? 0 : rating)}
                        className={`flex items-center gap-2 w-full text-left text-sm py-2 px-3 rounded-md transition-all ${
                          minRating === rating
                            ? "bg-primary/10 text-primary font-semibold"
                            : "text-foreground hover:bg-muted hover:text-primary"
                        }`}
                      >
                        <div className="flex gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3.5 w-3.5 ${
                                i < rating ? "fill-primary text-primary" : "fill-gray-200 text-gray-200"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="flex-1">& Up</span>
                        {minRating === rating && <span className="text-xs">✓</span>}
                      </button>
                    ))}
                  </CollapsibleContent>
                </div>
              </Collapsible>

              {/* Featured Product - Sharanz Style */}
              {featuredProduct && (
                <>
                  <Collapsible open={featuredOpen} onOpenChange={setFeaturedOpen}>
                    <div className="space-y-3">
                      <CollapsibleTrigger className="flex items-center justify-between w-full hover:text-primary transition-colors">
                        <h3 className="font-bold text-base uppercase tracking-wide">Featured</h3>
                        <ChevronDown className={`h-4 w-4 transition-transform ${featuredOpen ? 'rotate-180' : ''}`} />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pt-2">
                        <div className="border-2 rounded-xl overflow-hidden hover:border-primary transition-all shadow-sm hover:shadow-lg">
                          <img
                            src={featuredProduct.images?.[0] ? `/api/images/${featuredProduct.images[0]}` : '/placeholder-image.jpg'}
                            alt={featuredProduct.name}
                            className="w-full h-48 object-cover hover:scale-105 transition-transform duration-500"
                          />
                          <div className="p-4 space-y-3 bg-gradient-to-b from-white to-muted/20">
                            <h4 className="font-semibold text-sm line-clamp-2 text-foreground">{featuredProduct.name}</h4>
                            <p className="text-2xl font-bold text-primary">
                              ₹{parseFloat(featuredProduct.price).toLocaleString()}
                            </p>
                            <Button
                              size="sm"
                              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                              onClick={() => handleViewDetails(featuredProduct.id)}
                            >
                              View Details
                            </Button>
                          </div>
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                </>
              )}
            </div>
          </aside>

          {/* Main Content - Sharanz Style */}
          <main className="flex-1 min-w-0">
            {/* Toolbar - Sharanz Style */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b">
              <div className="flex items-center gap-4">
                <p className="text-sm font-medium text-foreground">
                  <span className="text-primary font-bold">{filteredProducts.length}</span> Products
                </p>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">Sort:</span>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[160px] border-2 font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="featured">Featured</SelectItem>
                      <SelectItem value="name">Name A-Z</SelectItem>
                      <SelectItem value="price-low">Price: Low to High</SelectItem>
                      <SelectItem value="price-high">Price: High to Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-1 border-2 rounded-lg p-1 bg-muted/30">
                  <Button
                    variant={viewMode === "grid" && gridColumns === 1 ? "default" : "ghost"}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      setViewMode("grid");
                      setGridColumns(1);
                    }}
                    title="1 Column"
                  >
                    <Columns2 className="h-4 w-4 rotate-90" />
                  </Button>
                  <Button
                    variant={viewMode === "grid" && gridColumns === 2 ? "default" : "ghost"}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      setViewMode("grid");
                      setGridColumns(2);
                    }}
                    title="2 Columns"
                  >
                    <Grid2x2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "grid" && gridColumns === 3 ? "default" : "ghost"}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      setViewMode("grid");
                      setGridColumns(3);
                    }}
                    title="3 Columns"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "grid" && gridColumns === 4 ? "default" : "ghost"}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      setViewMode("grid");
                      setGridColumns(4);
                    }}
                    title="4 Columns"
                  >
                    <Grid3x3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setViewMode("list")}
                    title="List View"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Active Filters - Sharanz Style */}
            {hasActiveFilters && (
              <div className="flex items-center gap-2 mb-6 flex-wrap bg-muted/30 p-4 rounded-lg border">
                <span className="text-sm font-semibold text-foreground">Active Filters:</span>
                {searchTerm && (
                  <Badge variant="secondary" className="gap-1 bg-primary/10 text-primary border-primary/20 font-medium">
                    Search: {searchTerm}
                  </Badge>
                )}
                {selectedCategory !== "all" && (
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 font-medium">
                    Category: {selectedCategory}
                  </Badge>
                )}
                {selectedSizes.length > 0 && (
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 font-medium">
                    Sizes: {selectedSizes.join(", ")}
                  </Badge>
                )}
                {availabilityFilter.length === 1 && (
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 font-medium">
                    {availabilityFilter[0] === "in_stock" ? "In Stock Only" : "Out of Stock Only"}
                  </Badge>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllFilters}
                  className="h-7 text-xs font-semibold border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground ml-auto"
                >
                  Clear All
                </Button>
              </div>
            )}

            {/* Product Grid - Sharanz Style */}
            <div ref={productSectionRef}>
              {filteredProducts.length === 0 ? (
                <div className="text-center py-20 bg-muted/20 rounded-xl border-2 border-dashed">
                  <div className="text-7xl mb-6">🔍</div>
                  <h3 className="text-2xl font-bold mb-3 text-foreground">No products found</h3>
                  <p className="text-muted-foreground mb-6 text-lg">
                    Try adjusting your search or filter criteria
                  </p>
                  <Button
                    variant="default"
                    onClick={clearAllFilters}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8"
                  >
                    Show All Products
                  </Button>
                </div>
              ) : (
                <>
                  <div className={`grid gap-5 ${
                    viewMode === "grid"
                      ? gridColumns === 1
                        ? "grid-cols-1 max-w-2xl mx-auto"
                        : gridColumns === 2
                        ? "grid-cols-1 sm:grid-cols-2"
                        : gridColumns === 3
                        ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                        : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                      : "grid-cols-1"
                  }`}>
                    {paginatedProducts.map((product, index) => (
                      <div
                        key={product.id}
                        className="group animate-in fade-in duration-500"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <ProductCard
                          product={product}
                          onAddToCart={() => onAddToCart(product.id)}
                          onViewDetails={() => handleViewDetails(product.id)}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Pagination - Sharanz Style */}
                  {totalPages > 1 && (
                    <div className="mt-12 pt-8 border-t">
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              onClick={(e) => {
                                e.preventDefault();
                                if (currentPage > 1) setCurrentPage(currentPage - 1);
                              }}
                              className={`${
                                currentPage === 1
                                  ? "pointer-events-none opacity-50"
                                  : "cursor-pointer hover:bg-primary hover:text-primary-foreground font-semibold"
                              }`}
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
                                  className={`cursor-pointer font-semibold ${
                                    currentPage === page
                                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                      : "hover:bg-primary/10 hover:text-primary"
                                  }`}
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
                              className={`${
                                currentPage === totalPages
                                  ? "pointer-events-none opacity-50"
                                  : "cursor-pointer hover:bg-primary hover:text-primary-foreground font-semibold"
                              }`}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  )}
                </>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}