import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { CartItem, Product } from "@shared/schema";

// Enhanced cart item with product details for UI
interface CartItemWithProduct extends CartItem {
  product: Product;
}

interface ShoppingCartSlideoutProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItemWithProduct[];
  onUpdateQuantity: (productId: string, newQuantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onCheckout: () => void;
}

export default function ShoppingCartSlideout({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout
}: ShoppingCartSlideoutProps) {
  const subtotal = items.reduce((sum, item) => sum + (Number(item.product.price) * item.quantity), 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const shipping = 0; // Free shipping for all orders
  const tax = 0; // GST set to 0% for all orders
  const total = subtotal + shipping + tax;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center space-x-2">
            <ShoppingBag className="h-5 w-5" />
            <span>Shopping Cart ({itemCount})</span>
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">Your cart is empty</h3>
              <p className="text-muted-foreground">Add a few signature pieces to get started!</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto py-6">
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex space-x-4" data-testid={`cart-item-${item.id}`}>
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      <img
                        src={item.product.images?.[0] || '/api/images/placeholder.jpg'}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-foreground text-sm line-clamp-2">
                        {item.product.name}
                      </h4>
                      <p className="text-sm text-muted-foreground">{item.product.category}</p>
                      <div className="flex items-baseline gap-1 mt-1">
                        <p className="text-sm font-semibold text-primary">
                          ₹{Number(item.product.price).toLocaleString('en-IN')}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {item.product.unit || 'per unit'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end space-y-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onRemoveItem(item.productId)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        data-testid={`button-remove-${item.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => onUpdateQuantity(item.productId, Math.max(0, item.quantity - 1))}
                          disabled={item.quantity <= 1}
                          className="h-8 w-8"
                          data-testid={`button-decrease-${item.id}`}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        
                        <span className="w-8 text-center text-sm font-medium" data-testid={`text-quantity-${item.id}`}>
                          {item.quantity}
                        </span>
                        
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
                          className="h-8 w-8"
                          data-testid={`button-increase-${item.id}`}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <Separator />
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span data-testid="text-subtotal">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="text-amber-600" data-testid="text-shipping">Free</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">GST (0%)</span>
                  <span data-testid="text-tax">₹{tax.toLocaleString('en-IN')}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between font-semibold">
                  <span>Total</span>
                  <span className="text-xl" data-testid="text-total">₹{total.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <SheetFooter>
                <Button 
                  onClick={onCheckout}
                  className="w-full"
                  size="lg"
                  data-testid="button-checkout"
                >
                  Proceed to Checkout
                </Button>
              </SheetFooter>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}