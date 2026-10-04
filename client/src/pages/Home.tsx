import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useSEO } from "@/hooks/use-seo";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { ORGANIZATION_DATA, WEBSITE_DATA, LOCAL_BUSINESS_DATA, generateBreadcrumbs } from "@/lib/structured-data-constants";
import { Button } from "@/components/ui/button";
import {
  Heart,
  ChevronRight,
  ChevronLeft,
  Star,
  Quote,
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";

// Customer reviews data
const customerReviews = [
  {
    name: "Priya Sharma",
    location: "Mumbai",
    rating: 5,
    review: "Absolutely love the quality and designs! The kurtis are so comfortable and stylish. Perfect for both casual and formal occasions. Highly recommend!",
    image: "/api/images/banner1.jpeg"
  },
  {
    name: "Anjali Reddy",
    location: "Hyderabad",
    rating: 5,
    review: "Beautiful collection of sarees! The fabric quality is excellent and the colors are vibrant. Great customer service too. Will definitely shop again!",
    image: "/api/images/banner2.jpeg"
  },
  {
    name: "Meera Patel",
    location: "Ahmedabad",
    rating: 5,
    review: "The co-ord sets are amazing! Perfect fit and the material is premium. Received so many compliments. Best ethnic wear store!",
    image: "/api/images/banner3.jpeg"
  },
  {
    name: "Lakshmi Iyer",
    location: "Chennai",
    rating: 5,
    review: "Excellent shopping experience! The traditional kurti sets are gorgeous and the plus size collection is fantastic. Thank you for inclusive sizing!",
    image: "/api/images/banner1.jpeg"
  }
];

export default function Home() {
  const { whatsappWidget } = useSiteSettings();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentReview, setCurrentReview] = useState(0);

  const homeStructuredData = useMemo(() => [
    ORGANIZATION_DATA,
    WEBSITE_DATA,
    LOCAL_BUSINESS_DATA,
    generateBreadcrumbs([{ name: "Home", url: "/" }])
  ], []);

  useSEO({
    title: "Premium Women's Ethnic Wear | Kurtis, Sarees, Co-ord Sets",
    description: "Shop premium women's ethnic wear collection. Explore kurtis, cotton sarees, co-ord sets, maxi dresses, traditional kurti sets, plus size collection and more.",
    ogTitle: "Premium Women's Ethnic Wear Collection",
    ogDescription: "Discover beautiful ethnic wear for every occasion. Quality kurtis, sarees, and traditional outfits.",
    ogImage: "/api/images/banner1.jpeg",
    ogUrl: typeof window !== "undefined" ? window.location.href : undefined,
    keywords: "kurtis, cotton sarees, co-ord sets, maxi dress, traditional kurti, plus size, party wear sarees, ethnic wear, women fashion",
    structuredData: homeStructuredData,
  });
  
  // Fetch all products
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ["/api/products"],
    queryFn: async () => {
      const response = await fetch("/api/products");
      if (!response.ok) throw new Error("Failed to fetch products");
      return response.json();
    },
  });

  // Fetch all categories
  const { data: categoriesData = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const response = await fetch("/api/categories");
      if (!response.ok) throw new Error("Failed to fetch categories");
      return response.json();
    },
  });

  // Hero slides from products
  const heroSlides = useMemo(() => {
    if (products.length > 0) {
      const productsWithImages = products.filter((p: any) => p.images && p.images.length > 0);
      if (productsWithImages.length >= 3) {
        return productsWithImages.slice(0, 3).map((p: any) => ({
          image: p.images[0],
          title: p.name,
          category: p.mainCategory
        }));
      }
    }
    return [
      { image: "/api/images/banner1.jpeg", title: "New Collection", category: "Ethnic Wear" },
      { image: "/api/images/banner2.jpeg", title: "Trending Now", category: "Fashion" },
      { image: "/api/images/banner3.jpeg", title: "Best Sellers", category: "Popular" }
    ];
  }, [products]);

  // Auto-scroll hero
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  // Auto-scroll reviews
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentReview((prev) => (prev + 1) % customerReviews.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  // Categories with images and counts
  const categories = useMemo(() => {
    return categoriesData.map((cat: any) => {
      const categoryProducts = products.filter((p: any) => p.mainCategory === cat.mainCategory);
      const categoryImage = cat.imageUrl || (categoryProducts.length > 0 && categoryProducts[0].images?.[0]) || "/api/placeholder.jpg";
      
      return {
        id: cat.id,
        name: cat.mainCategory,
        image: categoryImage,
        productCount: categoryProducts.length
      };
    });
  }, [categoriesData, products]);

  // Get all products for display
  const allProducts = useMemo(() => {
    return products.slice(0, 12);
  }, [products]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white">
      {/* Premium Hero Section */}
      <section className="relative w-full h-[500px] md:h-[650px] lg:h-[750px] overflow-hidden">
        {heroSlides.map((slide: any, index: number) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <img
              src={slide.image}
              alt={slide.title}
              className="w-full h-full object-cover"
              loading={index === 0 ? "eager" : "lazy"}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent"></div>
            
            {/* Hero Content Overlay */}
            <div className="absolute inset-0 flex items-end justify-center pb-20 md:pb-24">
              <div className="text-center text-white px-4">
                <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-3 md:mb-4 drop-shadow-lg">
                  {slide.title}
                </h1>
                <p className="text-lg md:text-xl mb-6 drop-shadow-md opacity-90">
                  {slide.category}
                </p>
                <Link to="/products">
                  <Button size="lg" className="bg-white text-black hover:bg-gray-100 font-semibold px-8 py-6 text-base md:text-lg rounded-full shadow-xl">
                    Shop Now
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        ))}

        {/* Elegant Navigation */}
        <button
          onClick={() => setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length)}
          className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-3 md:p-4 rounded-full shadow-2xl transition-all hover:scale-110 z-10"
        >
          <ChevronLeft className="h-5 w-5 md:h-6 md:w-6 text-gray-800" />
        </button>
        <button
          onClick={() => setCurrentSlide((prev) => (prev + 1) % heroSlides.length)}
          className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-3 md:p-4 rounded-full shadow-2xl transition-all hover:scale-110 z-10"
        >
          <ChevronRight className="h-5 w-5 md:h-6 md:w-6 text-gray-800" />
        </button>

        {/* Elegant Dots */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-10">
          {heroSlides.map((_: any, index: number) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-2.5 rounded-full transition-all duration-500 ${
                index === currentSlide ? 'w-10 bg-white shadow-lg' : 'w-2.5 bg-white/60 hover:bg-white/80'
              }`}
            />
          ))}
        </div>
      </section>

      {/* Categories Section - Premium Design */}
      <section className="py-16 md:py-24 px-4 max-w-7xl mx-auto">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Shop by Category
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-pink-500 to-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Discover Our Curated Collections</p>
        </div>

        {categoriesLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900"></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
            {categories.map((category: any) => (
              <Link key={category.id} to={`/products?category=${encodeURIComponent(category.name)}`}>
                <div className="group cursor-pointer">
                  <div className="relative overflow-hidden rounded-2xl aspect-[3/4] mb-4 shadow-lg hover:shadow-2xl transition-all duration-500">
                    <img
                      src={category.image}
                      alt={category.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                      <h3 className="text-white font-bold text-center text-base md:text-lg drop-shadow-lg">
                        {category.name}
                      </h3>
                    </div>
                  </div>
                  <h3 className="text-center font-semibold text-sm md:text-base text-gray-800 group-hover:text-gray-600 transition-colors">
                    {category.name}
                  </h3>
                  {category.productCount > 0 && (
                    <p className="text-center text-xs text-gray-500 mt-1">
                      {category.productCount} {category.productCount === 1 ? 'Product' : 'Products'}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Products Section - Premium Grid */}
      <section className="py-16 md:py-24 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-12 md:mb-16">
            <div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-2 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                New Arrivals
              </h2>
              <div className="w-20 h-1 bg-gradient-to-r from-pink-500 to-purple-500"></div>
            </div>
            <Link to="/products">
              <Button variant="outline" className="border-2 hover:bg-gray-50 font-semibold">
                View All
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {productsLoading ? (
            <div className="flex justify-center py-12">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900"></div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
              {allProducts.map((product: any) => (
                <Link key={product.id} to={`/products/${product.id}`}>
                  <div className="group bg-white rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-500 border border-gray-100">
                    <div className="relative aspect-[3/4] overflow-hidden bg-gray-50">
                      <img
                        src={product.images?.[0] || "/api/placeholder.jpg"}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        loading="lazy"
                      />
                      <button
                        className="absolute top-3 right-3 bg-white rounded-full p-2.5 shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                        onClick={(e) => e.preventDefault()}
                      >
                        <Heart className="h-4 w-4 text-gray-700 hover:text-red-500 hover:fill-red-500 transition-colors" />
                      </button>
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors"></div>
                    </div>
                    <div className="p-4 md:p-5">
                      <h3 className="text-sm md:text-base font-semibold mb-2 line-clamp-2 text-gray-800 group-hover:text-gray-600 transition-colors leading-snug">
                        {product.name}
                      </h3>
                      <div className="flex items-center justify-between">
                        <span className="text-lg md:text-xl font-bold text-gray-900">
                          ₹{product.price}
                        </span>
                        {product.size && (
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {product.size}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Customer Reviews Carousel - Premium Design */}
      <section className="py-16 md:py-24 px-4 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-white">
              What Our Customers Say
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-pink-500 to-purple-500 mx-auto mb-4"></div>
            <p className="text-gray-300 text-lg">Trusted by thousands of happy customers</p>
          </div>

          {/* Reviews Carousel */}
          <div className="relative">
            <div className="overflow-hidden">
              {customerReviews.map((review, index) => (
                <div
                  key={index}
                  className={`transition-all duration-700 ${
                    index === currentReview ? 'opacity-100 block' : 'opacity-0 hidden'
                  }`}
                >
                  <div className="bg-white rounded-3xl p-8 md:p-12 shadow-2xl max-w-3xl mx-auto">
                    <Quote className="h-12 w-12 text-pink-500 mb-6 opacity-50" />
                    
                    {/* Star Rating */}
                    <div className="flex gap-1 mb-6 justify-center">
                      {[...Array(review.rating)].map((_, i) => (
                        <Star key={i} className="h-6 w-6 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>

                    {/* Review Text */}
                    <p className="text-gray-700 text-lg md:text-xl leading-relaxed mb-8 text-center italic">
                      "{review.review}"
                    </p>

                    {/* Reviewer Info */}
                    <div className="flex items-center justify-center gap-4">
                      <div className="w-14 h-14 rounded-full overflow-hidden border-4 border-pink-100">
                        <img
                          src={review.image}
                          alt={review.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="text-left">
                        <h4 className="font-bold text-gray-900 text-lg">{review.name}</h4>
                        <p className="text-gray-500 text-sm">{review.location}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Navigation Arrows */}
            <button
              onClick={() => setCurrentReview((prev) => (prev - 1 + customerReviews.length) % customerReviews.length)}
              className="absolute left-0 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 backdrop-blur-sm p-3 rounded-full transition-all hover:scale-110"
            >
              <ChevronLeft className="h-6 w-6 text-white" />
            </button>
            <button
              onClick={() => setCurrentReview((prev) => (prev + 1) % customerReviews.length)}
              className="absolute right-0 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 backdrop-blur-sm p-3 rounded-full transition-all hover:scale-110"
            >
              <ChevronRight className="h-6 w-6 text-white" />
            </button>

            {/* Dots Indicator */}
            <div className="flex gap-2 justify-center mt-8">
              {customerReviews.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentReview(index)}
                  className={`h-2.5 rounded-full transition-all duration-500 ${
                    index === currentReview ? 'w-10 bg-white' : 'w-2.5 bg-white/40 hover:bg-white/60'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Floating WhatsApp Button - Premium Style */}
      {(whatsappWidget?.enabled !== false) && (
        <a
          href={`https://wa.me/${whatsappWidget?.phone ?? "918438896206"}`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-50 bg-[#25D366] text-white rounded-full p-4 shadow-2xl hover:shadow-[#25D366]/50 hover:scale-110 transition-all duration-300 animate-pulse hover:animate-none"
          aria-label="Chat on WhatsApp"
        >
          <SiWhatsapp className="h-6 w-6 md:h-7 md:w-7" />
        </a>
      )}
    </div>
  );
}
