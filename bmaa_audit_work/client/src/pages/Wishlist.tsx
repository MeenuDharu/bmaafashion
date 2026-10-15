import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Heart, ShoppingCart, Trash2, Package } from "lucide-react";
import { Link } from "wouter";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth, useAuthenticatedFetch } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { queryClient } from "@/lib/queryClient";
import { ProtectedRoute } from "@/components/ProtectedRoute";

interface WishlistItem {
  id: string;
  userId: string;
  productId: string;
  createdAt: string;
  product: {
    id: string;
    name: string;
    description: string;
    price: string;
    category: string;
    images: string[];
    planterCount?: number;
    dimensions?: string;
  };
}

function WishlistContent() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const authenticatedFetch = useAuthenticatedFetch();

  // Fetch wishlist items
  const { data: wishlistItems = [], isLoading, error } = useQuery<WishlistItem[]>({
    queryKey: ['/api/wishlist'],
    queryFn: async () => {
      const response = await authenticatedFetch('/api/wishlist');
      if (!response.ok) {
        throw new Error('Failed to fetch wishlist');
      }
      return response.json();
    },
    enabled: !!user,
  });

  // Remove from wishlist mutation
  const removeFromWishlistMutation = useMutation({
    mutationFn: async (productId: string) => {
      const response = await authenticatedFetch(`/api/wishlist/${productId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove from wishlist');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/wishlist'] });
      toast({ title: "Product removed from wishlist" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  // Add to cart mutation - using the existing cart system
  const addToCartMutation = useMutation({
    mutationFn: async (productId: string) => {
      // Fetch product details to add to cart
      const response = await fetch(`/api/products/${productId}`);
      if (!response.ok) {
        throw new Error('Product not found');
      }
      const product = await response.json();
      return product;
    },
    onSuccess: (product) => {
      addToCart(product);
      toast({ 
        title: "Added to cart",
        description: `${product.name} has been added to your cart`
      });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const handleRemoveFromWishlist = (productId: string) => {
    removeFromWishlistMutation.mutate(productId);
  };

  const handleAddToCart = (productId: string) => {
    addToCartMutation.mutate(productId);
  };

  const handleMoveToCart = (productId: string) => {
    // Add to cart and remove from wishlist
    addToCartMutation.mutate(productId, {
      onSuccess: () => {
        removeFromWishlistMutation.mutate(productId);
      }
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-48"></div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-80 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="text-wishlist-title">
              My Wishlist
            </h1>
            <p className="text-muted-foreground">
              Save your favorite hydroponic products for later
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            <span className="text-sm text-muted-foreground" data-testid="text-wishlist-count">
              {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'}
            </span>
          </div>
        </div>

        {wishlistItems.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-2xl font-semibold mb-2">Your wishlist is empty</h2>
              <p className="text-muted-foreground mb-6">
                Start adding products you love to see them here.
              </p>
              <Link href="/products">
                <Button data-testid="button-browse-products">
                  Browse Products
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {wishlistItems.map((item) => (
              <Card key={item.id} className="group hover-elevate" data-testid={`card-wishlist-${item.productId}`}>
                <CardHeader className="pb-4">
                  <div className="aspect-square relative overflow-hidden rounded-lg bg-muted mb-4">
                    <img
                      src={item.product.images?.[0] || '/placeholder-image.jpg'}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                      data-testid={`img-product-${item.productId}`}
                    />
                    <div className="absolute top-2 right-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="bg-background/80 backdrop-blur-sm hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => handleRemoveFromWishlist(item.productId)}
                        disabled={removeFromWishlistMutation.isPending}
                        data-testid={`button-remove-wishlist-${item.productId}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <CardTitle className="text-lg" data-testid={`text-product-name-${item.productId}`}>
                    {item.product.name}
                  </CardTitle>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-primary" data-testid={`text-price-${item.productId}`}>
                      ₹{item.product.price}
                    </span>
                    <Badge variant="secondary">{item.product.category}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {item.product.description}
                  </p>
                  
                  {item.product.planterCount && (
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      <span>🌱 {item.product.planterCount} planters</span>
                      {item.product.dimensions && (
                        <span>📏 {item.product.dimensions}</span>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleAddToCart(item.productId)}
                        disabled={addToCartMutation.isPending}
                        variant="outline"
                        className="flex-1"
                        data-testid={`button-add-cart-${item.productId}`}
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Add to Cart
                      </Button>
                      <Button
                        onClick={() => handleMoveToCart(item.productId)}
                        disabled={addToCartMutation.isPending || removeFromWishlistMutation.isPending}
                        className="flex-1"
                        data-testid={`button-move-cart-${item.productId}`}
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Move to Cart
                      </Button>
                    </div>
                    <Link href={`/products/${item.productId}`}>
                      <Button
                        variant="ghost"
                        className="w-full"
                        data-testid={`button-view-product-${item.productId}`}
                      >
                        View Details
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Wishlist() {
  return (
    <ProtectedRoute>
      <WishlistContent />
    </ProtectedRoute>
  );
}