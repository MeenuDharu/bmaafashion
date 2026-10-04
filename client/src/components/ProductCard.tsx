import { useState, useEffect } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ShoppingCart, Eye, Heart, Images, AlertTriangle, CheckCircle, Clock, Bell, TrendingDown, Package } from "lucide-react";
import { Product } from "@shared/schema";
import { useWishlist } from "@/hooks/useWishlist";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { StarRating } from "./StarRating";

// Helper function to convert relative image paths to full API URLs
const getImageUrl = (imagePath: string): string => {
  if (!imagePath) return '/placeholder-image.jpg';
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('/api/images/')) {
    return imagePath;
  }
  // Convert relative paths to full API URLs
  return `/api/images/${imagePath.startsWith('/') ? imagePath.slice(1) : imagePath}`;
};

interface ProductCardProps {
  product: Product;
  onAddToCart?: (productId: string) => void;
  onViewDetails?: (productId: string) => void;
}

export default function ProductCard({ product, onAddToCart, onViewDetails }: ProductCardProps) {
  const { isInWishlist, toggleWishlist, isLoading: isWishlistLoading } = useWishlist();
  const isWishlisted = isInWishlist(product.id);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [isWaitlistDialogOpen, setIsWaitlistDialogOpen] = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [notifyWhenAvailable, setNotifyWhenAvailable] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch product rating data
  const { data: ratingData } = useQuery({
    queryKey: ['/api/products', product.id, 'rating'],
    queryFn: async () => {
      const response = await fetch(`/api/products/${product.id}/rating`);
      if (!response.ok) return null;
      return response.json();
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Enhanced stock status calculation with more granular levels
  const getStockStatus = () => {
    const stockPercent = (product.inStock / (product.lowStockThreshold + 10)) * 100; // Assume normal stock is threshold + 10
    
    if (product.inStock === 0) {
      return { 
        status: 'out_of_stock', 
        label: 'Out of Stock', 
        color: 'destructive' as const,
        urgency: 'critical' as const,
        icon: AlertTriangle,
        message: 'Currently unavailable'
      };
    } else if (product.inStock <= 3) {
      return { 
        status: 'critical_stock', 
        label: 'Only Few Left', 
        color: 'destructive' as const,
        urgency: 'high' as const,
        icon: TrendingDown,
        message: `Only ${product.inStock} left in stock!`
      };
    } else if (product.inStock <= product.lowStockThreshold) {
      return { 
        status: 'low_stock', 
        label: 'Low Stock', 
        color: 'secondary' as const,
        urgency: 'medium' as const,
        icon: AlertTriangle,
        message: `Hurry up! Only ${product.inStock} units left`
      };
    } else if (product.inStock <= product.lowStockThreshold + 5) {
      return { 
        status: 'moderate_stock', 
        label: 'Limited Stock', 
        color: 'outline' as const,
        urgency: 'low' as const,
        icon: Package,
        message: `${product.inStock} units available`
      };
    } else {
      return { 
        status: 'in_stock', 
        label: 'In Stock', 
        color: 'default' as const,
        urgency: 'none' as const,
        icon: CheckCircle,
        message: 'Available for immediate delivery'
      };
    }
  };

  // Calculate stock progress for visual indicator
  const getStockProgress = () => {
    const maxStock = Math.max(product.lowStockThreshold + 20, product.inStock);
    return Math.min((product.inStock / maxStock) * 100, 100);
  };

  // Waitlist signup mutation
  const waitlistMutation = useMutation({
    mutationFn: async (data: { email: string; productId: string; notifyWhenAvailable: boolean }) => {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to join waitlist');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Added to waitlist!",
        description: "We'll notify you when this product is back in stock.",
      });
      setIsWaitlistDialogOpen(false);
      setWaitlistEmail("");
      queryClient.invalidateQueries({ queryKey: ['/api/waitlist'] });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to join waitlist. Please try again.",
      });
    },
  });

  const handleWaitlistSignup = () => {
    const email = user?.email || waitlistEmail;
    if (!email) {
      toast({
        variant: "destructive",
        title: "Email required",
        description: "Please provide an email address for waitlist notifications.",
      });
      return;
    }

    waitlistMutation.mutate({
      email,
      productId: product.id,
      notifyWhenAvailable,
    });
  };

  const stockInfo = getStockStatus();
  
  // Process images and get display images
  const displayImages = product.images?.length > 0 
    ? product.images.map(getImageUrl) 
    : ['/placeholder-image.jpg'];
  
  const hasMultipleImages = displayImages.length > 1;
  const currentImage = displayImages[currentImageIndex] || displayImages[0];
  
  // Auto-cycle through images on hover
  useEffect(() => {
    if (isHovering && hasMultipleImages) {
      const interval = setInterval(() => {
        setCurrentImageIndex(prev => (prev + 1) % displayImages.length);
      }, 1500); // Change image every 1.5 seconds
      
      return () => clearInterval(interval);
    }
  }, [isHovering, hasMultipleImages, displayImages.length]);

  return (
    <Card className="hover-elevate group overflow-hidden rounded-xl border border-border/50 hover:border-primary/30 transition-all duration-500 hover:shadow-2xl bg-white">
      <CardHeader
        className="p-0 relative"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => {
          setIsHovering(false);
          setCurrentImageIndex(0);
        }}
      >
        <div
          className="aspect-[3/4] overflow-hidden relative cursor-pointer bg-muted"
          onClick={() => onViewDetails?.(product.id)}
          data-testid={`link-product-image-${product.id}`}
        >
          <img
            src={currentImage}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
            data-testid={`img-product-${product.id}`}
          />
          
          {/* SOLD OUT Overlay */}
          {product.inStock === 0 && (
            <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-10">
              <div className="bg-red-600 text-white px-8 py-3 text-xl font-bold transform -rotate-12 shadow-lg">
                SOLD OUT
              </div>
            </div>
          )}
          
          {/* Gradient Overlay on Hover */}
          <div
            className={`absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent transition-opacity duration-500 ${
              isHovering ? 'opacity-100' : 'opacity-0'
            }`}
          />
          
          {/* Stock Status Badge and Sale Badge */}
          <div className="absolute top-2 left-2 flex gap-2 flex-col">
            {/* Sale Badge - Show if there's a discount (you can add discount field to product) */}
            {product.inStock > 0 && parseFloat(product.price) < 1000 && (
              <Badge
                variant="destructive"
                className="bg-red-600 text-white text-xs font-bold px-2 py-1"
              >
                SALE
              </Badge>
            )}
            
            <div className="flex gap-2">
            {/* Gallery indicator for multiple images */}
            {hasMultipleImages && (
              <Badge 
                variant="secondary" 
                className="bg-background/80 backdrop-blur-sm text-xs flex items-center gap-1"
                data-testid={`badge-gallery-${product.id}`}
              >
                <Images className="h-3 w-3" />
                {displayImages.length}
              </Badge>
            )}
            
            {/* Stock Status Badge */}
            <Badge 
              variant={stockInfo.color}
              className={`bg-background/90 backdrop-blur-sm text-xs flex items-center gap-1 ${
                stockInfo.status === 'out_of_stock' 
                  ? 'text-red-600 border-red-200 bg-red-50/90' 
                  : stockInfo.status === 'low_stock'
                  ? 'text-orange-600 border-orange-200 bg-orange-50/90'
                  : 'text-amber-600 border-amber-200 bg-amber-50/90'
              }`}
              data-testid={`badge-stock-${product.id}`}
            >
              {stockInfo.status === 'out_of_stock' && <AlertTriangle className="h-3 w-3" />}
              {stockInfo.status === 'low_stock' && <AlertTriangle className="h-3 w-3" />}
              {stockInfo.status === 'in_stock' && <CheckCircle className="h-3 w-3" />}
              {stockInfo.label}
            </Badge>
            </div>
          </div>
          
          {/* Image dots indicator on hover */}
          {hasMultipleImages && isHovering && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-1">
              {displayImages.map((_, index) => (
                <button
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentImageIndex 
                      ? 'bg-primary' 
                      : 'bg-background/60 hover:bg-background/80'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex(index);
                  }}
                  data-testid={`dot-${product.id}-${index}`}
                  aria-label={`View image ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
        
        {/* Wishlist Heart Button - Enhanced */}
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
      </CardHeader>
      
      <CardContent className="p-4 sm:p-5 space-y-2">
        {/* Category Badge */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {product.category}
          </span>
        </div>
        
        {/* Product Name */}
        <h3
          className="font-semibold text-base sm:text-lg text-foreground line-clamp-2 leading-tight cursor-pointer hover:text-primary transition-colors duration-200"
          onClick={() => onViewDetails?.(product.id)}
          data-testid={`text-product-name-${product.id}`}
        >
          {product.name}
        </h3>
        
        {/* Rating Display */}
        {ratingData && ratingData.totalReviews > 0 && ratingData.averageRating !== undefined && ratingData.averageRating !== null && (
          <div className="flex items-center gap-2 mb-2" data-testid={`product-rating-${product.id}`}>
            <StarRating 
              rating={ratingData.averageRating} 
              size="sm" 
              className="flex-shrink-0"
            />
            <span className="text-sm text-muted-foreground">
              {ratingData.averageRating.toFixed(1)} ({ratingData.totalReviews} {ratingData.totalReviews === 1 ? 'review' : 'reviews'})
            </span>
          </div>
        )}
        
        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
          {product.description}
        </p>
      </CardContent>
      
      <CardFooter className="p-4 sm:p-5 pt-0 flex flex-col gap-3">
        {/* Price Section */}
        <div className="flex items-center justify-between w-full">
          <div className="flex flex-col">
            <span className="text-2xl sm:text-3xl font-bold text-primary" data-testid={`text-price-${product.id}`}>
              ₹{Number(product.price).toLocaleString('en-IN')}
            </span>
            {product.unit && (
              <span className="text-xs text-muted-foreground" data-testid={`text-unit-${product.id}`}>
                {product.unit}
              </span>
            )}
          </div>
          
          {/* Stock Indicator */}
          {product.inStock > 0 && product.inStock <= 5 && (
            <Badge variant="secondary" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
              Only {product.inStock} left
            </Badge>
          )}
        </div>
        
        <div className="flex gap-2 w-full">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onViewDetails?.(product.id)}
            data-testid={`button-view-details-${product.id}`}
            className="flex-shrink-0"
          >
            <Eye className="h-4 w-4" />
          </Button>
          
          {product.inStock === 0 ? (
            <Dialog open={isWaitlistDialogOpen} onOpenChange={setIsWaitlistDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="flex-1"
                  data-testid={`button-join-waitlist-${product.id}`}
                >
                  <Bell className="h-4 w-4 mr-2" />
                  <span className="hidden xs:inline">Join Waitlist</span>
                  <span className="xs:hidden">Waitlist</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Join Waitlist
                  </DialogTitle>
                  <DialogDescription>
                    Get notified when "{product.name}" is back in stock. We'll send you an email as soon as it's available again.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  {/* Product Info */}
                  <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                    <img 
                      src={currentImage} 
                      alt={product.name}
                      className="w-12 h-12 object-cover rounded-md"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{product.name}</p>
                      <p className="text-sm text-muted-foreground">₹{Number(product.price).toLocaleString('en-IN')}</p>
                    </div>
                  </div>

                  {/* Email Input (only if user not logged in) */}
                  {!user && (
                    <div className="space-y-2">
                      <Label htmlFor="waitlist-email">Email Address</Label>
                      <Input
                        id="waitlist-email"
                        type="email"
                        placeholder="Enter your email address"
                        value={waitlistEmail}
                        onChange={(e) => setWaitlistEmail(e.target.value)}
                        data-testid="input-waitlist-email"
                      />
                    </div>
                  )}

                  {/* User email display if logged in */}
                  {user && (
                    <div className="flex items-center space-x-2 text-sm">
                      <span className="text-muted-foreground">Notifications will be sent to:</span>
                      <span className="font-medium">{user.email}</span>
                    </div>
                  )}

                  {/* Notification Preferences */}
                  <div className="flex items-center space-between">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="notify-available"
                        checked={notifyWhenAvailable}
                        onCheckedChange={setNotifyWhenAvailable}
                        data-testid="switch-notify-available"
                      />
                      <Label htmlFor="notify-available" className="text-sm">
                        Send email notifications when back in stock
                      </Label>
                    </div>
                  </div>

                  {/* Expected Availability Info */}
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-blue-700">
                      <Clock className="h-4 w-4" />
                      <span className="font-medium">Expected back in stock: 5-7 business days</span>
                    </div>
                    <p className="text-xs text-blue-600 mt-1">
                      We'll notify waitlist members first when inventory arrives.
                    </p>
                  </div>
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsWaitlistDialogOpen(false)}
                    data-testid="button-cancel-waitlist"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleWaitlistSignup}
                    disabled={waitlistMutation.isPending || (!user && !waitlistEmail)}
                    className="flex-1"
                    data-testid="button-confirm-waitlist"
                  >
                    {waitlistMutation.isPending ? (
                      <>
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                        Joining...
                      </>
                    ) : (
                      <>
                        <Bell className="h-4 w-4 mr-2" />
                        Join Waitlist
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ) : (
            <Button
              onClick={() => onAddToCart?.(product.id)}
              disabled={stockInfo.urgency === 'critical' && product.inStock <= 1}
              variant={stockInfo.urgency === 'critical' ? "destructive" : "default"}
              className="flex-1"
              data-testid={`button-add-to-cart-${product.id}`}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              <span className="hidden xs:inline">
                {stockInfo.urgency === 'critical' && product.inStock <= 1 
                  ? 'Last One - Order Now!' 
                  : 'Add to Cart'
                }
              </span>
              <span className="xs:hidden">
                {stockInfo.urgency === 'critical' && product.inStock <= 1 
                  ? 'Last One!' 
                  : 'Add'
                }
              </span>
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}