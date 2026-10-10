import { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Product, ProductVariant, CartItem } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from './AuthContext';

// Local cart item interface for localStorage (guests)
interface LocalCartItem {
  productId: string;
  quantity: number;
  size?: string;
  color?: string;
  variantId?: string;
  addedAt: string;
}

// Enhanced cart item with product details for UI
interface CartItemWithProduct extends CartItem {
  product: Product;
  variant: ProductVariant | null;
}

interface CartContextType {
  items: CartItemWithProduct[];
  isCartOpen: boolean;
  isLoading: boolean;
  isSyncing: boolean;
  isMigrating: boolean;
  sessionId: string;
  addToCart: (product: Product, quantity?: number, size?: string, color?: string, variantId?: string) => Promise<boolean>;
  removeFromCart: (productId: string, quantity?: number, size?: string, color?: string, variantId?: string) => Promise<boolean>;
  updateQuantity: (productId: string, quantity: number, size?: string, color?: string, variantId?: string) => Promise<boolean>;
  clearCart: () => Promise<void>;
  openCart: () => void;
  closeCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  validateStock: (productId: string, requestedQuantity: number, size?: string, color?: string, variantId?: string) => Promise<{ isValid: boolean; availableStock: number; }>;
  syncCartWithServer: () => Promise<void>;
  mergeGuestCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Helper function to generate unique session ID for guests
function generateSessionId(): string {
  return `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Helper function to get or create session ID
function getSessionId(): string {
  let sessionId = localStorage.getItem('cart_session_id');
  if (!sessionId) {
    sessionId = generateSessionId();
    localStorage.setItem('cart_session_id', sessionId);
  }
  return sessionId;
}

// Helper functions for localStorage cart management
const LOCAL_CART_KEY = 'cart_items';

function saveLocalCart(items: LocalCartItem[]): void {
  localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(items));
}

function getLocalCart(): LocalCartItem[] {
  try {
    const stored = localStorage.getItem(LOCAL_CART_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function clearLocalCart(): void {
  localStorage.removeItem(LOCAL_CART_KEY);
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [sessionId] = useState(() => getSessionId());
  const { toast } = useToast();
  const { user, token, registerCartMigrationCallback } = useAuth();
  const queryClient = useQueryClient();

  // Debouncing state for performance optimization
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const pendingUpdates = useRef<Map<string, { productId: string; quantity: number; timestamp: number; size?: string; color?: string; variantId?: string }>>(new Map());
  const optimisticCartState = useRef<CartItemWithProduct[]>([]);
  
  // Track pending cart item creations to avoid updating optimistic IDs
  const pendingCreates = useRef<Map<string, Promise<any>>>(new Map());

  // Performance optimization: Debounce database updates by 100ms
  const DEBOUNCE_DELAY = 100;

  // CRITICAL: Fetch cart data early to prevent initialization errors
  // This MUST be declared before any callbacks that reference cartItems
  const { data: cartItems = [], isLoading, refetch } = useQuery<CartItemWithProduct[]>({
    queryKey: ['cart', user?.id, sessionId],
    // Don't fetch cart while migration is in progress
    enabled: !isMigrating,
    queryFn: async () => {
      if (user && token) {
        // Authenticated user: fetch from server
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-session-id': sessionId,
        };

        const response = await fetch('/api/cart', {
          headers,
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch cart');
        }

        const serverCartData = await response.json();
        
        // Update optimistic state with server data
        optimisticCartState.current = serverCartData;
        
        return serverCartData;
      } else {
        // Guest user: read from localStorage and convert to proper format
        const localItems = getLocalCart();
        const cartWithProducts: CartItemWithProduct[] = [];
        
        for (const localItem of localItems) {
          // Fetch product data for each cart item
          try {
            const productResponse = await fetch(`/api/products/${localItem.productId}`);
            if (productResponse.ok) {
              const product = await productResponse.json();
              cartWithProducts.push({
                id: `local_${localItem.productId}_${localItem.size || 'nosize'}_${localItem.color || 'nocolor'}`,
                userId: null,
                sessionId,
                productId: localItem.productId,
                variantId: localItem.variantId || null,
                quantity: localItem.quantity,
                size: localItem.size || null,
                color: localItem.color || null,
                addedAt: new Date(localItem.addedAt),
                updatedAt: new Date(localItem.addedAt),
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                createdAt: new Date(localItem.addedAt),
                product,
                variant: null,
              });
            }
          } catch (error) {
            console.error('Failed to fetch product for cart item:', localItem.productId, error);
          }
        }
        
        // Update optimistic state with local data
        optimisticCartState.current = cartWithProducts;
        
        return cartWithProducts;
      }
    },
    staleTime: 1000 * 60, // 1 minute
    refetchOnWindowFocus: false,
  });

  // Helper to clear pending debounce timeout (stable reference)
  const clearDebounceTimeout = useCallback(() => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
      debounceTimeout.current = null;
    }
  }, []);

  // Helper to process pending updates
  const processPendingUpdates = useCallback(async () => {
    if (pendingUpdates.current.size === 0) return;

    const updates = Array.from(pendingUpdates.current.values());
    pendingUpdates.current.clear();

    console.log(`🔄 Processing ${updates.length} debounced cart updates`);

    // Process each pending update
    for (const update of updates) {
      try {
        if (user && token) {
          // CRITICAL FIX: Wait for any pending cart item creation to complete
          // This prevents trying to update using optimistic IDs
          const pendingCreate = pendingCreates.current.get(update.productId);
          if (pendingCreate) {
            console.log(`⏳ Waiting for pending cart item creation for product ${update.productId}`);
            try {
              await pendingCreate;
              console.log(`✅ Pending create completed for product ${update.productId}`);
            } catch (error) {
              console.error(`❌ Pending create failed for product ${update.productId}:`, error);
              // Continue anyway - the item might already exist
            }
          }
          
          // Refresh cart data first to ensure we have the latest server state
          await queryClient.invalidateQueries({ queryKey: ['cart', user?.id, sessionId] });
          await new Promise(resolve => setTimeout(resolve, 50)); // Small delay for cache update
          
          // Get current cart items from query cache (real server data, not optimistic)
          const currentCartItems = queryClient.getQueryData(['cart', user?.id, sessionId]) as CartItemWithProduct[] || [];
          
          console.log(`🔍 Found ${currentCartItems.length} cart items in cache for product ${update.productId}`);
          
          // Find the cart item to update using the current cart data (must use real server ID, not optimistic ID)
          const cartItem = currentCartItems.find(item => item.productId === update.productId && item.variantId === (update.variantId || undefined) && !item.id.startsWith('optimistic_'));
          
          console.log(`🎯 Cart item found for update:`, cartItem ? `ID: ${cartItem.id}, Qty: ${cartItem.quantity}` : 'NOT FOUND');
          
          if (update.quantity === 0 && cartItem) {
            // Remove item
            console.log(`🗑️ Removing cart item ${cartItem.id} for product ${update.productId}`);
            await fetch(`/api/cart/${cartItem.id}`, {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${token}`,
              },
              credentials: 'include',
            });
          } else if (cartItem && update.quantity > 0) {
            // Update quantity
            console.log(`🔄 Updating cart item ${cartItem.id} for product ${update.productId} to quantity ${update.quantity}`);
            await fetch(`/api/cart/${cartItem.id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
              credentials: 'include',
              body: JSON.stringify({ quantity: update.quantity }),
            });
          } else if (!cartItem && update.quantity > 0) {
            // Item doesn't exist in cart yet, need to add it
            console.log(`➕ Adding new cart item for product ${update.productId} with quantity ${update.quantity}`);
            await fetch('/api/cart', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
              credentials: 'include',
              body: JSON.stringify({
                productId: update.productId,
                variantId: update.variantId || null,
                quantity: update.quantity,
                size: update.size || null,
                color: update.color || null,
              }),
            });
          }
        } else {
          // Guest user: update localStorage
          const localItems = getLocalCart();
          const itemIndex = localItems.findIndex(item => item.productId === update.productId && item.variantId === (update.variantId || undefined));

          if (itemIndex >= 0) {
            if (update.quantity === 0) {
              localItems.splice(itemIndex, 1);
            } else {
              localItems[itemIndex].quantity = update.quantity;
            }
            saveLocalCart(localItems);
          }
        }
      } catch (error) {
        console.error('❌ Error processing debounced update:', error);
      }
    }

    // Refresh cart data after processing updates
    queryClient.invalidateQueries({ queryKey: ['cart'] });
  }, [user, token, sessionId, queryClient]);

  // Debounced update method for performance optimization
  const debouncedCartUpdate = useCallback((productId: string, quantity: number, size?: string, color?: string, variantId?: string) => {
    console.log(`⏰ Scheduling debounced update for product ${productId}: quantity ${quantity}`);
    
    // Clear existing timeout
    clearDebounceTimeout();
    
    // Update pending updates map (overwrites previous updates for same product)
    pendingUpdates.current.set(productId, {
      productId,
      quantity,
      size,
      color,
      variantId,
      timestamp: Date.now(),
    });
    
    // Schedule new timeout
    debounceTimeout.current = setTimeout(() => {
      processPendingUpdates();
    }, DEBOUNCE_DELAY);
  }, [clearDebounceTimeout, processPendingUpdates]);

  // Update optimistic cart state for immediate UI feedback
  const updateOptimisticState = useCallback((productId: string, quantity: number, product?: Product, size?: string, color?: string, variantId?: string) => {
    optimisticCartState.current = optimisticCartState.current.filter(item => !(item.productId === productId && item.variantId === (variantId || undefined)));
    
    if (quantity > 0 && product) {
      optimisticCartState.current.push({
        id: `optimistic_${productId}`,
        userId: user?.id || null,
        sessionId,
        productId,
        quantity,
        size: size || null,
        color: color || null,
        variantId: variantId || null,
        addedAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        createdAt: new Date(),
        product,
        variant: null,
      });
    }
    
    // Trigger re-render by invalidating query cache
    queryClient.setQueryData(['cart', user?.id, sessionId], [...optimisticCartState.current]);
  }, [user, sessionId, queryClient]);

  // Cleanup debounce timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
        debounceTimeout.current = null;
      }
    };
  }, []);


  // Sync cart with server when user logs in
  const syncCartWithServer = useCallback(async () => {
    if (!user || !token) return;

    setIsSyncing(true);
    try {
      const localItems = getLocalCart();
      
      if (localItems.length === 0) {
        console.log('🔄 No local cart items to sync');
        return;
      }

      console.log(`🔄 Syncing ${localItems.length} local cart items for user: ${user.email}`);

      const response = await fetch('/api/cart/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({ localCartItems: localItems }),
      });

      if (!response.ok) {
        throw new Error('Failed to sync cart');
      }

      const result = await response.json();
      
      // Clear local cart after successful sync
      clearLocalCart();
      
      // Refresh cart data
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      
      console.log(`✅ Cart synced successfully: ${result.syncedCount} items`);
      
      if (result.syncedCount > 0) {
        toast({
          title: "Cart Synced",
          description: `${result.syncedCount} items synced with your account`,
        });
      }
    } catch (error) {
      console.error('❌ Error syncing cart:', error);
      toast({
        title: "Sync Failed",
        description: "Could not sync your cart. Items are saved locally.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  }, [user, token]);

  // Merge guest cart with user cart (called during login)
  const mergeGuestCart = useCallback(async () => {
    if (!user || !token || !sessionId) return;

    setIsSyncing(true);
    try {
      console.log(`🔄 Merging guest cart (session: ${sessionId}) for user: ${user.email}`);

      const response = await fetch('/api/cart/merge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({ sessionId }),
      });

      if (!response.ok) {
        throw new Error('Failed to merge cart');
      }

      const result = await response.json();
      
      // Clear local cart after successful merge
      clearLocalCart();
      
      // Refresh cart data
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      
      console.log(`✅ Cart merged successfully: ${result.mergedCount} items`);
      
      if (result.mergedCount > 0) {
        toast({
          title: "Cart Merged",
          description: `${result.mergedCount} items added to your account`,
        });
      }
    } catch (error) {
      console.error('❌ Error merging cart:', error);
      toast({
        title: "Merge Failed",
        description: "Could not merge your cart items.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  }, [user, token, sessionId]);

  // Create stable cart migration callback that doesn't depend on changing functions
  const cartMigrationCallback = useMemo(() => {
    return async () => {
      console.log('🔄 Cart migration callback triggered');
      
      // Get fresh token from context closure
      const currentToken = token;
      if (!currentToken) {
        console.log('❌ No token available for cart migration');
        return;
      }

      const hasLocalCart = getLocalCart().length > 0;
      if (hasLocalCart) {
        console.log('📦 Found local cart, triggering sync with server');
        
        setIsSyncing(true);
        try {
          const localItems = getLocalCart();
          
          if (localItems.length === 0) {
            console.log('🔄 No local cart items to sync');
            return;
          }

          console.log(`🔄 Syncing ${localItems.length} local cart items with token`);

          const response = await fetch('/api/cart/sync', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${currentToken}`,
            },
            credentials: 'include',
            body: JSON.stringify({ localCartItems: localItems }),
          });

          if (!response.ok) {
            throw new Error('Failed to sync cart');
          }

          const result = await response.json();
          
          // Clear local cart after successful sync
          clearLocalCart();
          
          // Refresh cart data
          queryClient.invalidateQueries({ queryKey: ['cart'] });
          
          console.log(`✅ Cart synced successfully: ${result.syncedCount} items`);
          
          if (result.syncedCount > 0) {
            toast({
              title: "Cart Synced",
              description: `${result.syncedCount} items synced with your account`,
            });
          }
        } catch (error) {
          console.error('❌ Error syncing cart:', error);
          toast({
            title: "Sync Failed",
            description: "Could not sync your cart. Items are saved locally.",
            variant: "destructive",
          });
        } finally {
          setIsSyncing(false);
        }
      } else {
        console.log('📦 No local cart found, skipping migration');
      }
    };
  }, [token]);

  // Trigger cart migration automatically when user logs in (token becomes available)
  const prevTokenRef = useRef<string | null>(null);
  const migrationTriggeredRef = useRef(false);
  
  useEffect(() => {
    const hadNoToken = !prevTokenRef.current;
    const nowHasToken = !!token;
    const hasLocalCart = getLocalCart().length > 0;
    
    // Trigger migration if:
    // 1. User just logged in (went from no token to having a token) with local cart, OR
    // 2. On initial mount, user is already logged in with local cart
    const shouldMigrate = hasLocalCart && nowHasToken && 
      ((hadNoToken && nowHasToken) || (!migrationTriggeredRef.current && nowHasToken));
    
    if (shouldMigrate) {
      migrationTriggeredRef.current = true;
      console.log('🔄 Auto-triggering cart migration');
      setIsMigrating(true);
      cartMigrationCallback().finally(() => {
        setIsMigrating(false);
        // Refetch cart after migration completes
        queryClient.invalidateQueries({ queryKey: ['cart'] });
      });
    }
    
    prevTokenRef.current = token;
  }, [token, cartMigrationCallback, queryClient]);
  
  // DEPRECATED: Register cart migration callback with AuthContext
  // We now auto-trigger migration when token changes instead
  // useEffect(() => {
  //   if (registerCartMigrationCallback && cartMigrationCallback) {
  //     console.log('🔗 Registering cart migration callback with auth context');
  //     registerCartMigrationCallback(cartMigrationCallback);
  //   }
  // }, [registerCartMigrationCallback, cartMigrationCallback]);

  // Auto-sync cart when user logs in (this is now handled by the callback above)
  // useEffect(() => {
  //   if (user && token) {
  //     const hasLocalCart = getLocalCart().length > 0;
  //     if (hasLocalCart) {
  //       syncCartWithServer();
  //     }
  //   }
  // }, [user, token, syncCartWithServer]);

  // Cart mutation for adding items
  const addToCartMutation = useMutation({
    mutationFn: async ({ product, quantity = 1, size, color, variantId }: { product: Product; quantity?: number; size?: string; color?: string; variantId?: string }) => {
      if (user && token) {
        // Authenticated user: use API
        const response = await fetch('/api/cart', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'x-session-id': sessionId,
          },
          credentials: 'include',
          body: JSON.stringify({
            productId: product.id,
            quantity,
            size,
            color,
            variantId,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to add to cart');
        }

        return response.json();
      } else {
        // Guest user: use localStorage
        const localItems = getLocalCart();
        const existingItemIndex = localItems.findIndex(item =>
          item.productId === product.id &&
          item.variantId === (variantId || undefined) &&
          item.size === size &&
          item.color === color
        );

        if (existingItemIndex >= 0) {
          localItems[existingItemIndex].quantity += quantity;
        } else {
          localItems.push({
            productId: product.id,
            quantity,
            size,
            color,
            variantId,
            addedAt: new Date().toISOString(),
          });
        }

        saveLocalCart(localItems);
        return { success: true };
      }
    },
    onSuccess: (data, variables) => {
      // Remove pending create for this product
      pendingCreates.current.delete(variables.product.id);
      
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast({
        title: "Added to Cart",
        description: "Item added to your cart successfully",
      });
    },
    onError: (error: Error, variables) => {
      // Remove pending create for this product
      pendingCreates.current.delete(variables.product.id);
      
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Cart mutation for updating quantity
  const updateQuantityMutation = useMutation({
    mutationFn: async ({ productId, quantity, size, color, variantId }: { productId: string; quantity: number; size?: string; color?: string; variantId?: string }) => {
      if (user && token) {
        // Find the cart item to update
        const cartItem = cartItems.find(item => item.productId === productId && item.variantId === (variantId || undefined) && item.size === (size || null) && item.color === (color || null));
        if (!cartItem) {
          throw new Error('Cart item not found');
        }

        if (quantity === 0) {
          // Remove item
          const response = await fetch(`/api/cart/${cartItem.id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
            credentials: 'include',
          });

          if (!response.ok) {
            throw new Error('Failed to remove item');
          }

          return response.json();
        } else {
          // Update quantity
          const response = await fetch(`/api/cart/${cartItem.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            credentials: 'include',
            body: JSON.stringify({ quantity }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update quantity');
          }

          return response.json();
        }
      } else {
        // Guest user: use localStorage
        const localItems = getLocalCart();
        const itemIndex = localItems.findIndex(item => item.productId === productId && item.variantId === (variantId || undefined) && item.size === (size || undefined) && item.color === (color || undefined));

        if (itemIndex >= 0) {
          if (quantity === 0) {
            localItems.splice(itemIndex, 1);
          } else {
            localItems[itemIndex].quantity = quantity;
          }
          saveLocalCart(localItems);
        }

        return { success: true };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Cart mutation for clearing cart
  const clearCartMutation = useMutation({
    mutationFn: async () => {
      if (user && token) {
        // Authenticated user: use API
        const response = await fetch('/api/cart', {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'x-session-id': sessionId,
          },
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to clear cart');
        }

        return response.json();
      } else {
        // Guest user: clear localStorage
        clearLocalCart();
        return { success: true };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast({
        title: "Cart Cleared",
        description: "All items removed from your cart",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Validate stock availability
  const validateStock = async (
    productId: string,
    requestedQuantity: number,
    size?: string,
    color?: string,
    variantId?: string
  ): Promise<{ isValid: boolean; availableStock: number; }> => {
    try {
      if (variantId || size || color) {
        const response = await fetch(`/api/products/${productId}/variants`);
        if (!response.ok) throw new Error('Failed to check variant stock');
        const variants = await response.json();
        const variant = variants.find((v: ProductVariant) =>
          (variantId ? v.id === variantId : true) &&
          (!variantId || ((v.size ?? null) === (size ?? null) && (v.color ?? null) === (color ?? null))) &&
          v.isActive !== false
        );
        const availableStock = Number(variant?.stockQuantity || 0);
        return { isValid: !!variant && availableStock >= requestedQuantity, availableStock };
      }

      const response = await fetch(`/api/inventory/${productId}`);
      if (!response.ok) throw new Error('Failed to check stock');
      const stockData = await response.json();
      const availableStock = Number(stockData.quantityInStock || 0);
      return { isValid: availableStock >= requestedQuantity, availableStock };
    } catch (error) {
      console.error('Stock validation error:', error);
      return { isValid: false, availableStock: 0 };
    }
  };

  // Public API methods with debounced updates and optimistic UI
  const addToCart = async (product: Product, quantity: number = 1, size?: string, color?: string, variantId?: string): Promise<boolean> => {
    if (addToCartMutation.isPending) return false;
    
    try {
      // Check stock availability first - use optimistic state for real-time accuracy
      const optimisticItem = optimisticCartState.current.find(item =>
        item.productId === product.id &&
        item.variantId === (variantId || undefined) &&
        item.size === (size || null) &&
        item.color === (color || null)
      );
      const queryItem = cartItems.find(item =>
        item.productId === product.id &&
        item.variantId === (variantId || undefined) &&
        item.size === (size || null) &&
        item.color === (color || null)
      );
      const existingItem = optimisticItem || queryItem;
      const currentQuantityInCart = existingItem?.quantity || 0;
      const requestedQuantity = currentQuantityInCart + quantity;
      
      console.log(`🛒 Adding ${quantity} to cart - Current: ${currentQuantityInCart}, New total: ${requestedQuantity}`, size ? `Size: ${size}` : '', color ? `Color: ${color}` : '');
      
      const stockCheck = await validateStock(product.id, requestedQuantity, size, color, variantId);
      
      if (!stockCheck.isValid) {
        if (stockCheck.availableStock === 0) {
          toast({
            title: "Out of Stock",
            description: `${product.name} is currently out of stock`,
            variant: "destructive",
          });
        } else if (stockCheck.availableStock <= currentQuantityInCart) {
          toast({
            title: "Maximum Quantity Reached",
            description: `You already have the maximum available quantity (${stockCheck.availableStock}) in your cart`,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Insufficient Stock",
            description: `Only ${stockCheck.availableStock} units available. You have ${currentQuantityInCart} in cart`,
            variant: "destructive",
          });
        }
        return false;
      }
      
      console.log('Added to cart:', product.id, size ? `Size: ${size}` : '', color ? `Color: ${color}` : '');
      
      // Track this pending cart item creation
      const createPromise = addToCartMutation.mutateAsync({ product, quantity, size, color, variantId });
      pendingCreates.current.set(product.id, createPromise);
      
      // Always use direct server mutation - backend handles upsert (add to existing quantity)
      await createPromise;
      
      return true;
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast({
        title: "Error",
        description: "Failed to add item to cart",
        variant: "destructive",
      });
      return false;
    }
  };

  const removeFromCart = async (productId: string, quantity?: number, size?: string, color?: string, variantId?: string): Promise<boolean> => {
    try {
      // Use optimistic update for immediate UI feedback
      updateOptimisticState(productId, 0, undefined, size, color, variantId);
      
      // Cancel any pending debounced updates for this product to prevent re-adding
      pendingUpdates.current.delete(productId);
      
      // Make immediate server update for deletion to avoid race conditions
      if (user && token) {
        // Find the cart item to delete
        const cartItem = optimisticCartState.current.find(item => item.productId === productId && item.variantId === (variantId || undefined) && item.size === (size || null) && item.color === (color || null)) || 
                         cartItems.find(item => item.productId === productId && item.variantId === (variantId || undefined) && item.size === (size || null) && item.color === (color || null));
        
        if (cartItem) {
          await fetch(`/api/cart/${cartItem.id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
            credentials: 'include',
          });
          
          // Refresh cart data immediately
          refetch();
        }
      } else {
        // Guest user: immediately update localStorage
        const localItems = getLocalCart();
        const filteredItems = localItems.filter(item => !(item.productId === productId && item.variantId === (variantId || undefined) && item.size === (size || undefined) && item.color === (color || undefined)));
        saveLocalCart(filteredItems);
        
        // Refresh cart data immediately
        refetch();
      }
      
      return true;
    } catch (error) {
      console.error('Error removing from cart:', error);
      return false;
    }
  };

  const updateQuantity = async (productId: string, quantity: number, size?: string, color?: string, variantId?: string): Promise<boolean> => {
    if (quantity < 0) return false;
    
    // Find the product for optimistic update and error recovery
    const existingItem = cartItems.find(item => item.productId === productId && item.variantId === (variantId || undefined) && item.size === (size || null) && item.color === (color || null));
    const product = existingItem?.product;
    
    try {
      // Check stock availability for the new quantity
      if (quantity > 0) {
        const stockCheck = await validateStock(productId, quantity, size, color, variantId);
        
        if (!stockCheck.isValid) {
          toast({
            title: "Insufficient Stock",
            description: `Only ${stockCheck.availableStock} units available`,
            variant: "destructive",
          });
          return false;
        }
      }
      
      // Use optimistic update for immediate UI feedback
      updateOptimisticState(productId, quantity, product, size || existingItem?.size || undefined, color || existingItem?.color || undefined, variantId || existingItem?.variantId || undefined);
      
      // Use direct mutation for quantity updates instead of debounced system
      // This ensures the server update happens immediately without conflicts
      await updateQuantityMutation.mutateAsync({ productId, quantity, size, color, variantId });
      
      return true;
    } catch (error) {
      console.error('Error updating quantity:', error);
      // Revert optimistic state on error
      if (existingItem && product) {
        updateOptimisticState(productId, existingItem.quantity, product);
      }
      return false;
    }
  };

  const clearCart = async (): Promise<void> => {
    if (clearCartMutation.isPending) return;
    
    try {
      await clearCartMutation.mutateAsync();
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  const getTotalItems = () => {
    return cartItems.length; // Number of unique products, not total quantity
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => {
      const product = item.product;
      const unitPrice = item.variant?.price ?? product?.price;
      return total + (unitPrice ? Number(unitPrice) * item.quantity : 0);
    }, 0);
  };

  // Memoize context value for stable HMR exports and better performance
  const contextValue = useMemo<CartContextType>(() => ({
    items: cartItems,
    isCartOpen,
    isLoading: isLoading || addToCartMutation.isPending || updateQuantityMutation.isPending || clearCartMutation.isPending,
    isSyncing,
    isMigrating,
    sessionId,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    openCart,
    closeCart,
    getTotalItems,
    getTotalPrice,
    validateStock,
    syncCartWithServer,
    mergeGuestCart,
  }), [
    cartItems,
    isCartOpen,
    isLoading,
    addToCartMutation.isPending,
    updateQuantityMutation.isPending,
    clearCartMutation.isPending,
    isSyncing,
    isMigrating,
    sessionId,
    // Note: Functions are defined above with stable dependencies or no dependencies
    // so they don't need to be included in this dependency array
  ]);

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
}

// Stable useCart hook export for HMR compatibility
export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};