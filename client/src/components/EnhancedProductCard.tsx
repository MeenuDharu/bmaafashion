import { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Eye, Heart } from "lucide-react";
import { Product } from "@shared/schema";
import { useWishlist } from "@/hooks/useWishlist";
import { StarRating } from "./StarRating";
import { useQuery } from "@tanstack/react-query";

// Helper function to convert relative image paths to full API URLs
const getImageUrl = (imagePath: string): string => {
  if (!imagePath) return '/placeholder-image.jpg';
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('/api/images/')) {
    return imagePath;
  }
  return `/api/images/${imagePath.startsWith('/') ? imagePath.slice(1) : imagePath}`;
};

interface EnhancedProductCardProps {
  product: Product;
  onAddToCart?: (productId: string) => void;
  onViewDetails?: (productId: string) => void;
}

export default function EnhancedProductCard({ 
  product, 
  onAddToCart, 
  onViewDetails 
}: EnhancedProductCardProps) {
  const { isInWishlist, toggleWishlist, isLoading: isWishlistLoading } = useWishlist();
  const isWishlisted = isInWishlist(product.id);
  const [isHovering, setIsHovering] = useState(false);

  // Fetch product rating data
  const { data: ratingData } = useQuery({
    queryKey: ['/api/products', product.id, 'rating'],
    queryFn: async () => {
      const response = await fetch(`/api/products/${product.id}/rating`);
      if (!response.ok) return null;
      return response.json();
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const displayImages = product.images?.length > 0 
    ? product.images.map(getImageUrl) 
    : ['/placeholder-image.jpg'];
  
  const currentImage = displayImages[0];
  const isOutOfStock = product.inStock === 0;

  return (
    <Card 
      className="group overflow-hidden rounded-xl border border-border/50 hover:border-primary/30 transition-all duration-500 hover:shadow-2xl bg-white"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Image Section */}
      <div className="relative aspect-[3/4] overflow-hidden bg-muted">
        <img 
          src={currentImage} 
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
          data-testid={`img-product-${product.id}`}
        />
        
        {/* Gradient Overlay on Hover */}
        <div 
          className={`absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent transition-opacity duration-500 ${
            isHovering ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Stock Badge */}
        {isOutOfStock && (
          <div className="absolute top-3 left-3">
            <Badge variant="destructive" className="bg-red-600 text-white font-semibold px-3 py-1">
              Out of Stock
            </Badge>
          </div>
        )}

        {/* Sale Badge */}
        {product.category === "Sale" && (
          <div className="absolute top-3 right-3">
            <Badge className="bg-amber-500 text-white font-semibold px-3 py-1">
              SALE
            </Badge>
          </div>
        )}

        {/* Wishlist Button - Always visible on mobile, hover on desktop */}
        <div className={`absolute top-3 right-3 transition-all duration-300 ${
          isHovering ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 lg:opacity-100 lg:translate-y-0'
        }`}>
          <Button
            size="icon"
            variant="ghost"
            className="bg-white/90 backdrop-blur-sm hover:bg-white hover:scale-110 transition-all duration-300 rounded-full h-10 w-10 shadow-lg"
            onClick={(e) => {
              e.stopPropagation();
              toggleWishlist(product.id);
            }}
            disabled={isWishlistLoading}
            data-testid={`button-wishlist-${product.id}`}
          >
            <Heart 
              className={`h-5 w-5 transition-all duration-300 ${
                isWishlisted 
                  ? 'fill-red-500 text-red-500 scale-110' 
                  : 'text-muted-foreground hover:text-red-500'
              }`} 
            />
          </Button>
        </div>

        {/* Quick Action Buttons - Slide up on hover */}
        <div 
          className={`absolute bottom-0 left-0 right-0 p-4 flex gap-2 transition-all duration-500 ${
            isHovering ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
          }`}
        >
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onViewDetails?.(product.id)}
            className="flex-1 bg-white/95 hover:bg-white backdrop-blur-sm font-medium shadow-lg"
            data-testid={`button-quick-view-${product.id}`}
          >
            <Eye className="h-4 w-4 mr-2" />
            Quick View
          </Button>
          
          {!isOutOfStock && (
            <Button
              size="sm"
              onClick={() => onAddToCart?.(product.id)}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-lg"
              data-testid={`button-add-to-cart-${product.id}`}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Add to Cart
            </Button>
          )}
        </div>
      </div>
      
      {/* Content Section */}
      <CardContent className="p-4 space-y-2">
        {/* Category */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {product.category}
          </span>
          {ratingData && ratingData.totalReviews > 0 && (
            <div className="flex items-center gap-1">
              <StarRating rating={ratingData.averageRating} size="sm" />
              <span className="text-xs text-muted-foreground">
                ({ratingData.totalReviews})
              </span>
            </div>
          )}
        </div>

        {/* Product Name */}
        <h3 
          className="font-semibold text-base text-foreground line-clamp-2 leading-tight cursor-pointer hover:text-primary transition-colors duration-200"
          onClick={() => onViewDetails?.(product.id)}
          data-testid={`text-product-name-${product.id}`}
        >
          {product.name}
        </h3>
        
        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
          {product.description}
        </p>
      </CardContent>
      
      {/* Footer with Price */}
      <CardFooter className="p-4 pt-0 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-2xl font-bold text-primary" data-testid={`text-price-${product.id}`}>
            ₹{Number(product.price).toLocaleString('en-IN')}
          </span>
          {product.unit && (
            <span className="text-xs text-muted-foreground">
              {product.unit}
            </span>
          )}
        </div>
        
        {/* Stock Indicator */}
        {!isOutOfStock && product.inStock <= 5 && (
          <Badge variant="secondary" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
            Only {product.inStock} left
          </Badge>
        )}
      </CardFooter>
    </Card>
  );
}
