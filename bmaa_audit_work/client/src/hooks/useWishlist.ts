import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth, useAuthenticatedFetch } from "@/context/AuthContext";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface WishlistItem {
  id: string;
  userId: string;
  productId: string;
  createdAt: string;
  product?: any;
}

export function useWishlist() {
  const { user } = useAuth();
  const authenticatedFetch = useAuthenticatedFetch();
  const { toast } = useToast();

  // Fetch wishlist items
  const { data: wishlistItems = [] } = useQuery<WishlistItem[]>({
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

  // Check if a product is in wishlist
  const isInWishlist = (productId: string): boolean => {
    return wishlistItems.some(item => item.productId === productId);
  };

  // Add to wishlist mutation
  const addToWishlistMutation = useMutation({
    mutationFn: async (productId: string) => {
      const response = await authenticatedFetch('/api/wishlist', {
        method: 'POST',
        body: JSON.stringify({ productId }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add to wishlist');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/wishlist'] });
      toast({ title: "Added to wishlist" });
    },
    onError: (error: Error) => {
      if (error.message.includes('already in wishlist')) {
        toast({ 
          title: "Already in wishlist", 
          description: "This product is already in your wishlist",
          variant: "default" 
        });
      } else {
        toast({ 
          title: "Error", 
          description: error.message,
          variant: "destructive" 
        });
      }
    },
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
      toast({ title: "Removed from wishlist" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const toggleWishlist = (productId: string) => {
    if (!user) {
      toast({ 
        title: "Sign in required", 
        description: "Please sign in to manage your wishlist",
        variant: "default" 
      });
      return;
    }

    if (isInWishlist(productId)) {
      removeFromWishlistMutation.mutate(productId);
    } else {
      addToWishlistMutation.mutate(productId);
    }
  };

  return {
    wishlistItems,
    isInWishlist,
    toggleWishlist,
    isLoading: addToWishlistMutation.isPending || removeFromWishlistMutation.isPending,
    addToWishlistPending: addToWishlistMutation.isPending,
    removeFromWishlistPending: removeFromWishlistMutation.isPending,
    addToWishlist: addToWishlistMutation.mutate,
    removeFromWishlist: removeFromWishlistMutation.mutate,
    wishlistCount: wishlistItems.length,
  };
}