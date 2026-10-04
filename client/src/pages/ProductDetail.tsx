import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { ArrowLeft, ShoppingCart, Check, AlertCircle, Package, Ruler, Leaf, Building, Heart, AlertTriangle, CheckCircle, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/hooks/useWishlist";
import { ProductReviews } from "@/components/ProductReviews";
import ProductImageGallery from "@/components/ProductImageGallery";
import { Product } from "@shared/schema";
import { useSEO } from "@/hooks/use-seo";
import { ORGANIZATION_DATA, generateBreadcrumbs, generateProductSchema } from "@/lib/structured-data-constants";

interface ProductDetailProps {
  onAddToCart: (productId: string, quantity?: number) => void;
}

export default function ProductDetail({ onAddToCart }: ProductDetailProps) {
  const [, params] = useRoute("/products/:id");
  const productId = params?.id;
  const { toast } = useToast();
  const { user } = useAuth();
  const { items, addToCart } = useCart();
  const { isInWishlist, toggleWishlist, isLoading: isWishlistLoading } = useWishlist();
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  
  // Available sizes - you can customize this based on your product data
  const availableSizes = ["S", "M", "L", "XL", "XXL"];
  
  // Detect where the user came from to provide proper back navigation
  const sourceFrom = sessionStorage.getItem('productListSource');
  const backLink = sourceFrom === 'fresh-produce' ? '/fresh-produce' : '/products';
  const backLabel = sourceFrom === 'fresh-produce' ? 'Back to Fresh Produce' : 'Back to Products';

  // Fetch product details
  const { data: product, isLoading, error } = useQuery({
    queryKey: ['/api/products', productId],
    queryFn: async () => {
      if (!productId) throw new Error('No product ID provided');
      const response = await fetch(`/api/products/${productId}`);
      if (!response.ok) throw new Error('Product not found');
      return response.json() as Promise<Product>;
    },
    enabled: !!productId
  });

  // Fetch related products (same category)
  const { data: relatedProducts = [] } = useQuery({
    queryKey: ['/api/products', { category: product?.category }],
    queryFn: async () => {
      if (!product?.category) return [];
      const response = await fetch(`/api/products?category=${encodeURIComponent(product.category)}`);
      if (!response.ok) return [];
      const products = await response.json() as Product[];
      return products.filter(p => p.id !== productId).slice(0, 3);
    },
    enabled: !!product?.category
  });

  const productStructuredData = useMemo(() => {
    if (!product) return null;
    const primaryImage = product.images && product.images.length > 0 ? product.images[0] : null;
    return [
      ORGANIZATION_DATA,
      generateProductSchema({
        id: product.id,
        name: product.name,
        description: product.description,
        price: parseFloat(product.price),
        originalPrice: null,
        imageUrl: primaryImage,
        category: product.category,
        stockQuantity: product.inStock
      }),
      generateBreadcrumbs([
        { name: "Home", url: "/" },
        { name: "Products", url: "/products" },
        { name: product.name, url: `/products/${product.id}` }
      ])
    ];
  }, [product]);

  const productImage = product?.images && product.images.length > 0 ? product.images[0] : null;

  useSEO({
    title: product ? `${product.name} | Buy Online | Bmaafashion` : "Product | Bmaafashion",
    description: product 
      ? `Buy ${product.name} online at Bmaafashion. ${product.description.slice(0, 120)}... Premium dress collections with free shipping on orders above Rs.5,000.`
      : "Shop premium dress collections at Bmaafashion.",
    ogTitle: product ? `${product.name} - Bmaafashion` : "Fashion Product",
    ogDescription: product 
      ? `${product.description.slice(0, 150)}...`
      : "Premium dress collections for every occasion.",
    ogImage: productImage || "/attached_assets/bmaafashion.jpeg",
    ogType: "product",
    keywords: product 
      ? `${product.name}, ${product.category}, dress collection, buy online India, Bmaafashion`
      : "hydroponic products",
    structuredData: productStructuredData || undefined,
  });

  // Calculate stock status
  const getStockStatus = () => {
    if (!product) return { status: 'out_of_stock', label: 'Out of Stock', color: 'destructive' as const };
    
    if (product.inStock === 0) {
      return { status: 'out_of_stock', label: 'Out of Stock', color: 'destructive' as const };
    } else if (product.inStock <= product.lowStockThreshold) {
      return { status: 'low_stock', label: 'Low Stock', color: 'secondary' as const };
    } else {
      return { status: 'in_stock', label: 'In Stock', color: 'default' as const };
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;
    
    // Enhanced stock validation
    if (product.inStock === 0) {
      toast({
        title: "Out of Stock",
        description: "This product is currently out of stock",
        variant: "destructive",
      });
      return;
    }
    
    if (quantity > product.inStock) {
      toast({
        title: "Insufficient Stock",
        description: `Only ${product.inStock} units available`,
        variant: "destructive",
      });
      return;
    }
    
    // Get current quantity in cart before adding
    const currentCartItem = items.find(item => item.productId === product.id);
    const currentQuantity = currentCartItem?.quantity || 0;
    const newTotal = currentQuantity + quantity;
    
    setIsAddingToCart(true);
    try {
      // Use cart context directly with size parameter
      const success = await addToCart(product, quantity, selectedSize || undefined);
      
      if (success) {
        // Show enhanced message with current and new total
        const message = currentQuantity > 0
          ? `${quantity} added (${newTotal} total in cart)${selectedSize ? ` - Size: ${selectedSize}` : ''}`
          : `${quantity} x ${product.name}${selectedSize ? ` (Size: ${selectedSize})` : ''} added to your cart`;
        
        toast({
          title: "Added to Cart",
          description: message,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add product to cart",
        variant: "destructive",
      });
    } finally {
      setIsAddingToCart(false);
    }
  };

  if (!productId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
          <Link href="/products">
            <Button>Browse Products</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The product you're looking for doesn't exist or has been removed.
          </p>
          <Link href="/products">
            <Button>Browse Products</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isInStock = product.inStock > 0;
  const stockInfo = getStockStatus();
  const formattedPrice = parseFloat(product.price).toLocaleString();

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground" data-testid="link-breadcrumb-home">
              Home
            </Link>
            <span>/</span>
            <Link href={backLink} className="hover:text-foreground" data-testid="link-breadcrumb-products">
              {sourceFrom === 'fresh-produce' ? 'Fresh Produce' : 'Products'}
            </Link>
            <span>/</span>
            <Link 
              to={`/products?category=${encodeURIComponent(product.category)}`} 
              className="hover:text-foreground"
              data-testid="link-breadcrumb-category"
            >
              {product.category}
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Link href={backLink}>
          <Button variant="ghost" className="mb-6" data-testid="button-back">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {backLabel}
          </Button>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Image Gallery */}
          <div className="space-y-4">
            <ProductImageGallery 
              images={product.images || []}
              productName={product.name}
              className=""
            />
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Header */}
            <div>
              <Badge variant="secondary" className="mb-3" data-testid="badge-category">
                {product.category}
              </Badge>
              <h1 className="text-3xl font-bold mb-4" data-testid="text-product-name">
                {product.name}
              </h1>
              <p className="text-lg text-muted-foreground whitespace-pre-wrap" data-testid="text-product-description">
                {product.description}
              </p>
            </div>

            {/* Price and Stock Status */}
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-primary" data-testid="text-product-price">
                    ₹{formattedPrice}
                  </span>
                  <span className="text-lg text-muted-foreground" data-testid="text-product-unit">
                    {product.unit || 'per unit'}
                  </span>
                </div>
                <Badge 
                  variant={stockInfo.color}
                  className={`flex items-center gap-1 ${
                    stockInfo.status === 'out_of_stock' 
                      ? 'bg-red-100 text-red-800 border-red-200' 
                      : stockInfo.status === 'low_stock'
                      ? 'bg-orange-100 text-orange-800 border-orange-200'
                      : 'bg-green-100 text-green-800 border-green-200'
                  }`}
                  data-testid={`badge-stock-status`}
                >
                  {stockInfo.status === 'out_of_stock' && <AlertTriangle className="h-3 w-3" />}
                  {stockInfo.status === 'low_stock' && <AlertTriangle className="h-3 w-3" />}
                  {stockInfo.status === 'in_stock' && <CheckCircle className="h-3 w-3" />}
                  {stockInfo.label}
                </Badge>
              </div>
              
              {/* Enhanced Stock Information */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <h3 className="font-medium text-sm flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Stock Information
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Available:</span>
                    <span 
                      className={`ml-2 font-semibold ${
                        stockInfo.status === 'out_of_stock' 
                          ? 'text-red-600' 
                          : stockInfo.status === 'low_stock'
                          ? 'text-orange-600'
                          : 'text-green-600'
                      }`}
                      data-testid="text-stock-available"
                    >
                      {product.inStock} units
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status:</span>
                    <span 
                      className={`ml-2 font-medium ${
                        stockInfo.status === 'out_of_stock' 
                          ? 'text-red-600' 
                          : stockInfo.status === 'low_stock'
                          ? 'text-orange-600'
                          : 'text-green-600'
                      }`}
                      data-testid="text-detailed-stock-status"
                    >
                      {stockInfo.label}
                    </span>
                  </div>
                </div>
                
                {/* Low Stock Warning */}
                {stockInfo.status === 'low_stock' && (
                  <div className="flex items-center gap-2 text-orange-600 bg-orange-50 p-2 rounded border border-orange-200">
                    <TrendingDown className="h-4 w-4" />
                    <span className="text-xs font-medium">
                      Hurry! Only {product.inStock} units left in stock
                    </span>
                  </div>
                )}
                
                {/* Out of Stock Warning */}
                {stockInfo.status === 'out_of_stock' && (
                  <div className="flex items-center gap-2 text-red-600 bg-red-50 p-2 rounded border border-red-200">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-xs font-medium">
                      This product is currently out of stock. Check back later.
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Quantity and Add to Cart */}
            <div className="space-y-4">
              {/* Size Selector */}
              {isInStock && (
                <div className="space-y-2">
                  <label htmlFor="size" className="font-medium">Size (Optional):</label>
                  <div className="flex flex-wrap gap-2">
                    {availableSizes.map((size) => (
                      <Button
                        key={size}
                        variant={selectedSize === size ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedSize(size)}
                        className="min-w-[3rem]"
                      >
                        {size}
                      </Button>
                    ))}
                    {selectedSize && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedSize("")}
                        className="text-muted-foreground"
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                </div>
              )}
              
              {isInStock && (
                <div className="flex items-center space-x-4">
                  <label htmlFor="quantity" className="font-medium">Quantity:</label>
                  <div className="flex items-center border rounded-md">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                      data-testid="button-quantity-decrease"
                      className="h-8 w-8 p-0"
                    >
                      -
                    </Button>
                    <span className="px-4 py-1 border-x min-w-[3rem] text-center" data-testid="text-quantity">
                      {quantity}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setQuantity(Math.min(product.inStock, quantity + 1))}
                      disabled={quantity >= product.inStock}
                      data-testid="button-quantity-increase"
                      className="h-8 w-8 p-0"
                    >
                      +
                    </Button>
                  </div>
                  {quantity >= product.inStock && stockInfo.status === 'low_stock' && (
                    <span className="text-xs text-orange-600">Maximum available quantity</span>
                  )}
                </div>
              )}

              <div className="flex space-x-3">
                <Button
                  size="lg"
                  className="flex-1"
                  onClick={handleAddToCart}
                  disabled={!isInStock || isAddingToCart}
                  variant={!isInStock ? "secondary" : "default"}
                  data-testid="button-add-to-cart"
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  {!isInStock 
                    ? "Out of Stock" 
                    : isAddingToCart 
                    ? "Adding..." 
                    : `Add ${quantity} to Cart`
                  }
                </Button>
                
                {user && (
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => toggleWishlist(product.id)}
                    disabled={isWishlistLoading}
                    data-testid="button-wishlist-toggle"
                    className="px-4"
                  >
                    <Heart 
                      className={`h-5 w-5 transition-colors ${
                        isInWishlist(product.id) 
                          ? 'fill-red-500 text-red-500' 
                          : 'text-muted-foreground hover:text-red-500'
                      }`} 
                    />
                  </Button>
                )}
              </div>
            </div>

            {/* Key Features */}
            {product.planterCount && (
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <Package className="h-4 w-4 text-primary" />
                    <span>{product.planterCount} Planters</span>
                  </div>
                  {product.dimensions && (
                    <div className="flex items-center space-x-2">
                      <Ruler className="h-4 w-4 text-primary" />
                      <span>{product.dimensions}</span>
                    </div>
                  )}
                  {product.cultivableCrops && (
                    <div className="flex items-center space-x-2">
                      <Leaf className="h-4 w-4 text-primary" />
                      <span>{product.cultivableCrops}</span>
                    </div>
                  )}
                  {product.structureMaterial && (
                    <div className="flex items-center space-x-2">
                      <Building className="h-4 w-4 text-primary" />
                      <span>{product.structureMaterial}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Detailed Information */}
        <div className="mt-16 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Specifications */}
          {product.specifications && product.specifications.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Specifications</CardTitle>
                <CardDescription>Technical details and features</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2" data-testid="list-specifications">
                  {product.specifications.map((spec, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{spec}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Product Details */}
          <Card>
            <CardHeader>
              <CardTitle>Product Details</CardTitle>
              <CardDescription>Key information about this product</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Stock Information */}
              <div>
                <dt className="font-medium text-sm">Stock Status</dt>
                <dd className={`text-sm font-medium ${
                  stockInfo.status === 'out_of_stock' 
                    ? 'text-red-600' 
                    : stockInfo.status === 'low_stock'
                    ? 'text-orange-600'
                    : 'text-green-600'
                }`}>
                  {stockInfo.label} ({product.inStock} units)
                </dd>
              </div>
              
              {product.planterCount && (
                <div>
                  <dt className="font-medium text-sm">Planter Capacity</dt>
                  <dd className="text-sm text-muted-foreground">{product.planterCount} plants</dd>
                </div>
              )}
              {product.dimensions && (
                <div>
                  <dt className="font-medium text-sm">Dimensions</dt>
                  <dd className="text-sm text-muted-foreground">{product.dimensions}</dd>
                </div>
              )}
              {product.cultivableCrops && (
                <div>
                  <dt className="font-medium text-sm">Suitable Crops</dt>
                  <dd className="text-sm text-muted-foreground">{product.cultivableCrops}</dd>
                </div>
              )}
              {product.structureMaterial && (
                <div>
                  <dt className="font-medium text-sm">Material</dt>
                  <dd className="text-sm text-muted-foreground">{product.structureMaterial}</dd>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Category Info */}
          <Card>
            <CardHeader>
              <CardTitle>Category</CardTitle>
              <CardDescription>Browse similar products</CardDescription>
            </CardHeader>
            <CardContent>
              <Link 
                to={`/products?category=${encodeURIComponent(product.category)}`}
                data-testid="link-browse-category"
              >
                <Button variant="outline" className="w-full">
                  Browse {product.category}
                  <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Reviews Section */}
        <div className="mt-16">
          <ProductReviews 
            productId={productId!}
            currentUserId={user?.id}
            currentUserRole={user?.role}
          />
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold mb-8">Related Products</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <Card key={relatedProduct.id} className="group hover-elevate">
                  <CardContent className="p-4">
                    <div className="aspect-square bg-muted rounded-lg overflow-hidden mb-4">
                      <img
                        src={relatedProduct.images?.[0] || '/placeholder-image.jpg'}
                        alt={relatedProduct.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <h3 className="font-semibold mb-2 line-clamp-2">{relatedProduct.name}</h3>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {relatedProduct.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <div className="flex items-baseline gap-1">
                          <span className="font-bold text-primary">
                            ₹{parseFloat(relatedProduct.price).toLocaleString()}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {relatedProduct.unit || 'per unit'}
                          </span>
                        </div>
                      </div>
                      <Link href={`/products/${relatedProduct.id}`}>
                        <Button size="sm" variant="outline">
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}