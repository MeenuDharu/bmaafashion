import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, Minus, Plus, ShoppingCart, Package, CheckCircle } from "lucide-react";
import { Product } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/hooks/use-toast";

interface ProductVariant {
  id: string;
  productId: string;
  sku: string | null;
  color: string | null;
  size: string | null;
  price: string | null;
  compareAtPrice: string | null;
  stockQuantity: number;
  lowStockThreshold: number | null;
  weight: string | null;
  images: string[];
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

interface VariantSelectorDialogProps {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VariantSelectorDialog({ product, open, onOpenChange }: VariantSelectorDialogProps) {
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [sizeError, setSizeError] = useState("");
  const [colorError, setColorError] = useState("");
  const { addToCart, items } = useCart();
  const { toast } = useToast();

  // Fetch product variants
  const { data: variants = [], isLoading } = useQuery<ProductVariant[]>({
    queryKey: ['/api/products', product.id, 'variants'],
    queryFn: async () => {
      const response = await fetch(`/api/products/${product.id}/variants`);
      if (!response.ok) {
        // If no variants endpoint exists yet, return empty array
        if (response.status === 404) return [];
        throw new Error('Failed to fetch variants');
      }
      return response.json();
    },
    enabled: open,
  });

  // Extract unique sizes and colors from variants
  const availableSizes = Array.from(new Set(variants.filter(v => v.size).map(v => v.size!)));
  const availableColors = Array.from(new Set(variants.filter(v => v.color).map(v => v.color!)));

  // Find the selected variant
  const selectedVariant = variants.find(
    v => v.size === selectedSize && v.color === selectedColor
  );

  // Get available stock for selected variant
  const availableStock = selectedVariant?.stockQuantity || 0;
  const maxQuantity = Math.min(availableStock, 10); // Max 10 per order

  // Reset selections when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedSize("");
      setSelectedColor("");
      setQuantity(1);
      setSizeError("");
      setColorError("");
    }
  }, [open]);

  // Auto-select if only one option available
  useEffect(() => {
    if (availableSizes.length === 1 && !selectedSize) {
      setSelectedSize(availableSizes[0]);
    }
    if (availableColors.length === 1 && !selectedColor) {
      setSelectedColor(availableColors[0]);
    }
  }, [availableSizes, availableColors, selectedSize, selectedColor]);

  const handleAddToCart = async () => {
    // Validate selections
    let hasError = false;

    if (availableSizes.length > 0 && !selectedSize) {
      setSizeError("Please select a size");
      hasError = true;
    }

    if (availableColors.length > 0 && !selectedColor) {
      setColorError("Please select a color");
      hasError = true;
    }

    if (hasError) {
      toast({
        title: "Selection Required",
        description: "Please select all required options",
        variant: "destructive",
      });
      return;
    }

    // Check the quantity already in the cart for this exact variant.
    const existingCartItem = items.find(item =>
      item.productId === product.id &&
      (item.size ?? undefined) === (selectedSize || undefined) &&
      (item.color ?? undefined) === (selectedColor || undefined)
    );
    const currentCartQuantity = existingCartItem?.quantity || 0;
    const requestedTotal = currentCartQuantity + quantity;

    if (selectedVariant && selectedVariant.stockQuantity < requestedTotal) {
      toast({
        title: "Maximum Quantity Reached",
        description: currentCartQuantity > 0
          ? `You already have ${currentCartQuantity} in your cart. Only ${selectedVariant.stockQuantity} units are available for this variant.`
          : `Only ${selectedVariant.stockQuantity} units available`,
        variant: "destructive",
      });
      return;
    }

    // Add to cart
    const success = await addToCart(
      product,
      quantity,
      selectedSize || undefined,
      selectedColor || undefined,
      selectedVariant?.id
    );

    if (success) {
      onOpenChange(false);
      toast({
        title: "Added to Cart",
        description: `${quantity} × ${product.name}${selectedSize ? ` (${selectedSize})` : ''}${selectedColor ? ` - ${selectedColor}` : ''} added to your cart`,
      });
    }
  };

  const getStockStatus = () => {
    if (!selectedVariant) return null;
    
    const stock = selectedVariant.stockQuantity;
    const threshold = selectedVariant.lowStockThreshold || 5;

    if (stock === 0) {
      return { label: 'Out of Stock', color: 'destructive' as const, icon: AlertCircle };
    } else if (stock <= 3) {
      return { label: `Only ${stock} left!`, color: 'destructive' as const, icon: AlertCircle };
    } else if (stock <= threshold) {
      return { label: `${stock} in stock`, color: 'secondary' as const, icon: Package };
    } else {
      return { label: 'In Stock', color: 'default' as const, icon: CheckCircle };
    }
  };

  const stockStatus = getStockStatus();

  // If no variants exist, show message
  if (!isLoading && variants.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>No Variants Available</DialogTitle>
            <DialogDescription>
              This product doesn't have any variants configured yet.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center p-6">
            <div className="text-center">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                Please contact support or check back later.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Select Options</DialogTitle>
          <DialogDescription>
            Choose your preferred size and color for {product.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Product Info */}
          <div className="flex items-center space-x-4 p-3 bg-muted rounded-lg">
            <img
              src={product.images?.[0] || '/placeholder-image.jpg'}
              alt={product.name}
              className="w-16 h-16 object-cover rounded-md"
            />
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm line-clamp-2">{product.name}</h4>
              <p className="text-lg font-bold text-primary">
                ₹{Number(product.price).toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          {/* Size Selection */}
          {availableSizes.length > 0 && (
            <div className="space-y-2">
              <label className="font-medium text-sm">
                Size <span className="text-destructive">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {availableSizes.map((size) => {
                  const sizeVariants = variants.filter(v => v.size === size);
                  const hasStock = sizeVariants.some(v => v.stockQuantity > 0);
                  
                  return (
                    <Button
                      key={size}
                      variant={selectedSize === size ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setSelectedSize(size);
                        setSizeError("");
                      }}
                      disabled={!hasStock}
                      className={`min-w-[3rem] ${
                        sizeError && !selectedSize ? 'border-destructive' : ''
                      }`}
                    >
                      {size}
                    </Button>
                  );
                })}
              </div>
              {sizeError && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {sizeError}
                </p>
              )}
            </div>
          )}

          {/* Color Selection */}
          {availableColors.length > 0 && (
            <div className="space-y-2">
              <label className="font-medium text-sm">
                Color <span className="text-destructive">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {availableColors.map((color) => {
                  const colorVariants = variants.filter(v => v.color === color);
                  const hasStock = colorVariants.some(v => v.stockQuantity > 0);
                  
                  return (
                    <Button
                      key={color}
                      variant={selectedColor === color ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setSelectedColor(color);
                        setColorError("");
                      }}
                      disabled={!hasStock}
                      className={`${
                        colorError && !selectedColor ? 'border-destructive' : ''
                      }`}
                    >
                      {color}
                    </Button>
                  );
                })}
              </div>
              {colorError && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {colorError}
                </p>
              )}
            </div>
          )}

          {/* Stock Status */}
          {stockStatus && (
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <stockStatus.icon className="h-4 w-4" />
                <span className="text-sm font-medium">Availability:</span>
              </div>
              <Badge variant={stockStatus.color}>{stockStatus.label}</Badge>
            </div>
          )}

          <Separator />

          {/* Quantity Selection */}
          {selectedVariant && selectedVariant.stockQuantity > 0 && (
            <div className="space-y-2">
              <label className="font-medium text-sm">Quantity</label>
              <div className="flex items-center space-x-4">
                <div className="flex items-center border rounded-md">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="h-10 w-10 p-0"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="px-4 py-2 border-x min-w-[3rem] text-center font-medium">
                    {quantity}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                    disabled={quantity >= maxQuantity}
                    className="h-10 w-10 p-0"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {quantity >= maxQuantity && (
                  <span className="text-xs text-muted-foreground">
                    Maximum quantity reached
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleAddToCart}
            disabled={
              !selectedVariant ||
              selectedVariant.stockQuantity === 0 ||
              (availableSizes.length > 0 && !selectedSize) ||
              (availableColors.length > 0 && !selectedColor)
            }
            className="flex-1"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Add {quantity} to Cart
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
