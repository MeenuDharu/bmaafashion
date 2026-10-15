import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Package, Calendar, MapPin, CreditCard, Truck, CheckCircle, Clock, RefreshCw, RotateCcw, X, AlertTriangle, Download, Eye, MessageSquare, Phone } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { useAuth, useAuthenticatedFetch } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { Order, OrderItem } from "@shared/schema";

// Extend Window interface for Razorpay
declare global {
  interface Window {
    Razorpay: any;
  }
}

interface OrderWithItems extends Order {
  items: OrderItem[];
}

function OrderDetailContent() {
  const [match, params] = useRoute('/orders/:id');
  const orderId = params?.id;
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const authenticatedFetch = useAuthenticatedFetch();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!authLoading && !user && orderId) {
      const orderAccessToken = sessionStorage.getItem(`order_access_token_${orderId}`);
      if (!orderAccessToken) {
        setLocation('/login');
      }
    }
  }, [authLoading, user, orderId, setLocation]);

  // Check if user is using order access token (limited access) or full authentication
  const isOrderAccessMode = !!sessionStorage.getItem(`order_access_token_${orderId}`);
  
  // Component state for enhanced features
  const [selectedTab, setSelectedTab] = useState("overview");
  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [selectedReturnItems, setSelectedReturnItems] = useState<string[]>([]);
  const [returnReason, setReturnReason] = useState("");
  const [returnNotes, setReturnNotes] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [retryingPayment, setRetryingPayment] = useState(false);

  // Fetch order details
  const { data: order, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/orders', orderId],
    enabled: !!orderId,
    queryFn: async () => {
      if (!orderId) throw new Error('No order ID provided');
      
      const orderAccessToken = sessionStorage.getItem(`order_access_token_${orderId}`);
      
      if (orderAccessToken) {
        const response = await fetch(`/api/orders/${orderId}/with-token`, {
          headers: {
            'Authorization': `Bearer ${orderAccessToken}`,
          }
        });
        if (!response.ok) {
          sessionStorage.removeItem(`order_access_token_${orderId}`);
          throw new Error('Invalid or expired order access link');
        }
        return response.json();
      }
      
      const response = await authenticatedFetch(`/api/orders/${orderId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch order details');
      }
      return response.json();
    }
  });

  // Fetch order status history (only for authenticated users, not order access mode)
  const { data: statusHistory = [] } = useQuery({
    queryKey: ['/api/orders', orderId, 'status-history'],
    enabled: !!orderId && !isOrderAccessMode,
    queryFn: async () => {
      if (!orderId) return [];
      const response = await authenticatedFetch(`/api/orders/${orderId}/status-history`);
      if (!response.ok) return [];
      return response.json();
    }
  });

  // Return request mutation
  const returnMutation = useMutation({
    mutationFn: async (data: { items: string[]; reason: string; notes: string }) => {
      const response = await authenticatedFetch(`/api/returns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to request return');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Return Request Submitted",
        description: "Your return request has been submitted successfully. We'll contact you soon with further instructions.",
      });
      setIsReturnDialogOpen(false);
      setSelectedReturnItems([]);
      setReturnReason("");
      setReturnNotes("");
      queryClient.invalidateQueries({ queryKey: ['/api/orders', orderId] });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to submit return request. Please try again.",
      });
    },
  });

  // Cancel order mutation
  const cancelMutation = useMutation({
    mutationFn: async (reason: string) => {
      const response = await authenticatedFetch(`/api/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (!response.ok) throw new Error('Failed to cancel order');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Order Cancelled",
        description: "Your order has been cancelled successfully. Any payments will be refunded within 5-7 business days.",
      });
      setIsCancelDialogOpen(false);
      setCancelReason("");
      queryClient.invalidateQueries({ queryKey: ['/api/orders', orderId] });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to cancel order. Please try again.",
      });
    },
  });

  // Load Razorpay script helper
  const loadRazorpayScript = () => {
    return new Promise<boolean>((resolve) => {
      // Check if Razorpay is already loaded
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Retry payment function
  const retryPayment = async (orderToRetry: OrderWithItems) => {
    setRetryingPayment(true);
    
    try {
      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Failed to load payment gateway');
      }

      // Get Razorpay key
      const keyResponse = await fetch('/api/payments/razorpay-key');
      if (!keyResponse.ok) {
        throw new Error('Payment service unavailable');
      }
      
      const keyData = await keyResponse.json();
      const razorpayKey = keyData.key;
      
      if (!razorpayKey) {
        throw new Error('Payment service configuration error');
      }

      // Create Razorpay order for existing order
      const paymentResponse = await authenticatedFetch('/api/payments/create-razorpay-order', {
        method: 'POST',
        body: JSON.stringify({
          orderId: orderToRetry.id
        }),
      });

      if (!paymentResponse.ok) {
        throw new Error('Failed to initialize payment');
      }

      const razorpayOrder = await paymentResponse.json();

      // Configure Razorpay options
      const options = {
        key: razorpayKey,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: 'BMAA FASHION',
        description: 'Elegance Redefined',
        order_id: razorpayOrder.id,
        handler: async function (response: any) {
          try {
            // Verify payment on server
            const verifyResponse = await authenticatedFetch('/api/payments/verify-razorpay-payment', {
              method: 'POST',
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderId: orderToRetry.id
              }),
            });

            const verificationResult = await verifyResponse.json();
            
            if (verifyResponse.ok && verificationResult.status === 'success') {
              toast({
                title: "Payment Successful!",
                description: `Your payment for Order #${orderToRetry.id.slice(-8)} has been confirmed.`,
              });
              
              // Refresh order details AND orders list
              queryClient.invalidateQueries({ queryKey: ['/api/orders', orderId] });
              queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
              setRetryingPayment(false);
            } else {
              throw new Error('Payment verification failed');
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            toast({
              title: "Payment Verification Failed",
              description: "Please contact support if amount was deducted.",
              variant: "destructive",
            });
            setRetryingPayment(false);
          }
        },
        prefill: {
          name: orderToRetry.customerName,
          email: orderToRetry.customerEmail,
          contact: orderToRetry.customerPhone || ''
        },
        theme: {
          color: '#16a34a'
        },
        modal: {
          ondismiss: function() {
            setRetryingPayment(false);
            
            // Invalidate cache to refresh order status AND orders list
            queryClient.invalidateQueries({ queryKey: ['/api/orders', orderId] });
            queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
            
            toast({
              title: "Payment Cancelled",
              description: "You can try again anytime.",
            });
          }
        }
      };

      // @ts-ignore - Razorpay is loaded dynamically
      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (error) {
      console.error('Error retrying payment:', error);
      toast({
        title: "Payment Failed",
        description: "There was an error processing your payment. Please try again.",
        variant: "destructive",
      });
      setRetryingPayment(false);
    }
  };

  // Helper functions for enhanced order tracking
  const getOrderProgress = (status: string) => {
    const statusOrder = ['pending', 'processing', 'shipped', 'delivered'];
    const currentIndex = statusOrder.indexOf(status);
    return currentIndex >= 0 ? ((currentIndex + 1) / statusOrder.length) * 100 : 0;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'shipped': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'processing': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'cancelled': return 'text-red-600 bg-red-50 border-red-200';
      case 'pending': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const canCancelOrder = (orderStatus: string) => {
    // Disable cancel/return features in order access mode (limited access)
    if (isOrderAccessMode) return false;
    return ['pending', 'processing'].includes(orderStatus);
  };

  const canRequestReturn = (orderStatus: string) => {
    // Disable cancel/return features in order access mode (limited access)
    if (isOrderAccessMode) return false;
    return ['delivered'].includes(orderStatus);
  };

  const handleReturnSubmit = () => {
    if (selectedReturnItems.length === 0) {
      toast({
        variant: "destructive",
        title: "No items selected",
        description: "Please select at least one item to return.",
      });
      return;
    }

    if (!returnReason) {
      toast({
        variant: "destructive",
        title: "Reason required",
        description: "Please provide a reason for the return.",
      });
      return;
    }

    returnMutation.mutate({
      items: selectedReturnItems,
      reason: returnReason,
      notes: returnNotes,
    });
  };

  const handleCancelSubmit = () => {
    if (!cancelReason) {
      toast({
        variant: "destructive",
        title: "Reason required",
        description: "Please provide a reason for cancellation.",
      });
      return;
    }

    cancelMutation.mutate(cancelReason);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b bg-muted/30">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center space-x-4">
              <Link to="/orders">
                <Button variant="ghost" size="sm" data-testid="button-back-to-orders">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Orders
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold">Order Details</h1>
                <p className="text-muted-foreground">Loading order information...</p>
              </div>
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4 py-8">
          <div className="grid gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2 mb-4"></div>
                  <div className="h-32 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b bg-muted/30">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center space-x-4">
              <Link to="/orders">
                <Button variant="ghost" size="sm" data-testid="button-back-to-orders">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Orders
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold">Order Not Found</h1>
                <p className="text-muted-foreground">The requested order could not be found</p>
              </div>
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Order Not Found</h3>
              <p className="text-muted-foreground mb-4">
                This order doesn't exist or you don't have permission to view it.
              </p>
              <Link to="/orders">
                <Button data-testid="button-view-all-orders">
                  View All Orders
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const orderData = order as OrderWithItems;

  // Status progression
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="h-5 w-5 text-amber-600" />;
      case 'shipped':
        return <Truck className="h-5 w-5 text-blue-600" />;
      case 'processing':
        return <Package className="h-5 w-5 text-orange-600" />;
      default:
        return <Package className="h-5 w-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/orders">
                <Button variant="ghost" size="sm" data-testid="button-back-to-orders">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Orders
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold" data-testid="text-order-title">
                  Order #{orderData.id.slice(-8)}
                </h1>
                <p className="text-muted-foreground">
                  Placed on {format(new Date(orderData.createdAt!), 'MMMM dd, yyyy')}
                </p>
              </div>
            </div>
            
            {/* Retry Payment Button for Pending Payments */}
            {orderData.paymentStatus === 'pending' && !isOrderAccessMode && (
              <Button 
                onClick={() => retryPayment(orderData)}
                disabled={retryingPayment}
                size="default"
                data-testid="button-retry-payment"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                {retryingPayment ? 'Processing...' : 'Complete Payment'}
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Payment Pending Alert */}
            {orderData.paymentStatus === 'pending' && !isOrderAccessMode && (
              <Alert className="border-orange-200 bg-orange-50" data-testid="alert-payment-pending">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800">
                  <div className="flex items-center justify-between">
                    <span>
                      Your order has been created but payment is still pending. 
                      Please complete the payment to confirm your order.
                    </span>
                    <Button 
                      onClick={() => retryPayment(orderData)}
                      disabled={retryingPayment}
                      size="sm"
                      variant="default"
                      className="ml-4"
                      data-testid="button-retry-payment-alert"
                    >
                      {retryingPayment ? 'Processing...' : 'Pay Now'}
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}
            
            {/* Order Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  {getStatusIcon(orderData.status)}
                  <span>Order Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <Badge 
                    variant={
                      orderData.status === 'delivered' ? 'default' :
                      orderData.status === 'shipped' ? 'secondary' :
                      orderData.status === 'processing' ? 'outline' :
                      orderData.status === 'cancelled' ? 'destructive' :
                      'outline'
                    }
                    className="text-sm"
                    data-testid="badge-order-status"
                  >
                    {orderData.status === 'pending' ? 'Order Pending' :
                     orderData.status === 'processing' ? 'Processing' :
                     orderData.status === 'shipped' ? 'Shipped' :
                     orderData.status === 'delivered' ? 'Delivered' :
                     orderData.status === 'cancelled' ? 'Cancelled' :
                     orderData.status}
                  </Badge>
                  
                  <Badge 
                    variant={
                      orderData.paymentStatus === 'completed' ? 'default' :
                      orderData.paymentStatus === 'failed' ? 'destructive' :
                      'outline'
                    }
                    data-testid="badge-payment-status"
                  >
                    Payment {orderData.paymentStatus === 'pending' ? 'Pending' :
                             orderData.paymentStatus === 'completed' ? 'Completed' :
                             orderData.paymentStatus === 'failed' ? 'Failed' :
                             orderData.paymentStatus}
                  </Badge>
                </div>

                {orderData.trackingNumber && (
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm font-medium mb-1">Tracking Number</p>
                    <p className="font-mono text-sm text-primary" data-testid="text-tracking-number">
                      {orderData.trackingNumber}
                    </p>
                  </div>
                )}

                {orderData.estimatedDelivery && (
                  <div className="mt-4">
                    <p className="text-sm text-muted-foreground">
                      Estimated Delivery: <span className="font-medium" data-testid="text-estimated-delivery">
                        {format(new Date(orderData.estimatedDelivery), 'MMMM dd, yyyy')}
                      </span>
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle>Order Items</CardTitle>
                <CardDescription>
                  {orderData.items?.length || 0} item{(orderData.items?.length || 0) !== 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4" data-testid="order-items">
                  {orderData.items?.map((item) => (
                    <div key={item.id} className="flex space-x-4 p-4 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium" data-testid={`text-item-name-${item.id}`}>
                          {item.productName}
                        </h4>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                          <span>Quantity: {item.quantity}</span>
                          <span>Price: ₹{parseFloat(item.productPrice).toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium" data-testid={`text-item-total-${item.id}`}>
                          ₹{parseFloat(item.totalPrice).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Order Notes */}
            {orderData.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Order Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm" data-testid="text-order-notes">{orderData.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5" />
                  <span>Customer Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-medium text-sm">Name</p>
                  <p className="text-sm text-muted-foreground" data-testid="text-customer-name">
                    {orderData.customerName}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-sm">Email</p>
                  <p className="text-sm text-muted-foreground" data-testid="text-customer-email">
                    {orderData.customerEmail}
                  </p>
                </div>
                {orderData.customerPhone && (
                  <div>
                    <p className="font-medium text-sm">Phone</p>
                    <p className="text-sm text-muted-foreground" data-testid="text-customer-phone">
                      {orderData.customerPhone}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Shipping Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5" />
                  <span>Shipping Address</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed" data-testid="text-shipping-address">
                  {orderData.shippingAddress}
                </p>
              </CardContent>
            </Card>

            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {orderData.subtotal && orderData.subtotal !== orderData.total && (
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span data-testid="text-subtotal">₹{parseFloat(orderData.subtotal).toLocaleString()}</span>
                  </div>
                )}
                
                {orderData.shippingCost && parseFloat(orderData.shippingCost) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Shipping</span>
                    <span data-testid="text-shipping-cost">₹{parseFloat(orderData.shippingCost).toLocaleString()}</span>
                  </div>
                )}
                
                {orderData.taxAmount && parseFloat(orderData.taxAmount) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Tax</span>
                    <span data-testid="text-tax-amount">₹{parseFloat(orderData.taxAmount).toLocaleString()}</span>
                  </div>
                )}
                
                <Separator />
                
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span data-testid="text-order-total">₹{parseFloat(orderData.total).toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrderDetail() {
  return <OrderDetailContent />;
}