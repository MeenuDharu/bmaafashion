import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Package, Calendar, MapPin, CreditCard } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuthenticatedFetch } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import type { Order } from "@shared/schema";
import { useState } from "react";

function OrderHistoryContent() {
  const authenticatedFetch = useAuthenticatedFetch();
  const { toast } = useToast();
  const [retryingPayment, setRetryingPayment] = useState<string | null>(null);
  
  const { data: orders, isLoading, error } = useQuery({
    queryKey: ['/api/orders'],
    queryFn: async () => {
      const response = await authenticatedFetch('/api/orders');
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }
      return response.json();
    }
  });

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      // Check if Razorpay is already loaded
      if ((window as any).Razorpay) {
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

  const retryPayment = async (order: Order) => {
    setRetryingPayment(order.id);
    
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
          orderId: order.id
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
                orderId: order.id
              }),
            });

            const verificationResult = await verifyResponse.json();
            
            if (verifyResponse.ok && verificationResult.status === 'success') {
              toast({
                title: "Payment Successful!",
                description: `Your payment for Order #${order.id.slice(-8)} has been confirmed.`,
              });
              
              // Refresh orders list
              queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
              setRetryingPayment(null);
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
            setRetryingPayment(null);
          }
        },
        prefill: {
          name: order.customerName,
          email: order.customerEmail,
          contact: order.customerPhone || ''
        },
        theme: {
          color: '#16a34a'
        },
        modal: {
          ondismiss: function() {
            setRetryingPayment(null);
            
            // Invalidate orders cache to refresh order status
            queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
            
            toast({
              title: "Payment Cancelled",
              description: "You can try again anytime from your order history.",
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
      setRetryingPayment(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b bg-muted/30">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center space-x-4">
              <Link to="/profile">
                <Button variant="ghost" size="sm" data-testid="button-back-to-profile">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Profile
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold">Order History</h1>
                <p className="text-muted-foreground">View your order history and track deliveries</p>
              </div>
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4 py-8">
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2 mb-4"></div>
                  <div className="h-16 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b bg-muted/30">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center space-x-4">
              <Link to="/profile">
                <Button variant="ghost" size="sm" data-testid="button-back-to-profile">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Profile
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold">Order History</h1>
                <p className="text-muted-foreground">View your order history and track deliveries</p>
              </div>
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Unable to Load Orders</h3>
              <p className="text-muted-foreground mb-4">
                There was an error loading your order history. Please try again.
              </p>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const orderList = orders as Order[];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center space-x-4">
            <Link to="/profile">
              <Button variant="ghost" size="sm" data-testid="button-back-to-profile">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Profile
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Order History</h1>
              <p className="text-muted-foreground">View your order history and track deliveries</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {orderList.length === 0 ? (
          // Empty state
          <Card>
            <CardContent className="p-8 text-center">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Orders Yet</h3>
              <p className="text-muted-foreground mb-4">
                You haven't placed any orders yet. Start shopping to see your order history here.
              </p>
              <Link to="/products">
                <Button data-testid="button-browse-products">
                  Browse Products
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          // Orders list
          <div className="grid gap-6" data-testid="orders-list">
            {orderList.map((order) => (
              <Card key={order.id} className="hover-elevate transition-all duration-200">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg" data-testid={`text-order-id-${order.id}`}>
                        Order #{order.id.slice(-8)}
                      </CardTitle>
                      <CardDescription className="flex items-center space-x-4 mt-1">
                        <span className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>{format(new Date(order.createdAt!), 'MMM dd, yyyy')}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <CreditCard className="h-4 w-4" />
                          <span>₹{parseFloat(order.total).toLocaleString()}</span>
                        </span>
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge 
                        variant={
                          order.paymentStatus === 'pending' ? 'destructive' :
                          order.status === 'delivered' ? 'default' :
                          order.status === 'shipped' ? 'secondary' :
                          order.status === 'processing' ? 'outline' :
                          order.status === 'cancelled' ? 'destructive' :
                          'outline'
                        }
                        data-testid={`badge-status-${order.id}`}
                      >
                        {order.paymentStatus === 'pending' ? 'Payment Pending' :
                         order.status === 'pending' ? 'Pending' :
                         order.status === 'processing' ? 'Processing' :
                         order.status === 'shipped' ? 'Shipped' :
                         order.status === 'delivered' ? 'Delivered' :
                         order.status === 'cancelled' ? 'Cancelled' :
                         order.status}
                      </Badge>
                      {order.paymentStatus === 'pending' && (
                        <Button 
                          onClick={() => retryPayment(order)}
                          disabled={retryingPayment === order.id}
                          size="sm"
                          data-testid={`button-complete-payment-${order.id}`}
                        >
                          {retryingPayment === order.id ? 'Processing...' : 'Complete Payment'}
                        </Button>
                      )}
                      <Link to={`/orders/${order.id}`}>
                        <Button variant="outline" size="sm" data-testid={`button-view-order-${order.id}`}>
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Customer Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-foreground">Customer</p>
                      <p className="text-muted-foreground">{order.customerName}</p>
                      <p className="text-muted-foreground">{order.customerEmail}</p>
                      {order.customerPhone && (
                        <p className="text-muted-foreground">{order.customerPhone}</p>
                      )}
                    </div>
                    
                    <div>
                      <p className="font-medium text-foreground flex items-center space-x-1">
                        <MapPin className="h-4 w-4" />
                        <span>Shipping Address</span>
                      </p>
                      <p className="text-muted-foreground text-xs leading-relaxed">
                        {order.shippingAddress}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  {/* Order Summary */}
                  <div className="flex justify-between items-center text-sm">
                    <div className="space-y-1">
                      <p className="text-muted-foreground">
                        Payment Status: <span className={`font-medium ${
                          order.paymentStatus === 'completed' ? 'text-green-600' : 
                          order.paymentStatus === 'failed' ? 'text-red-600' : 
                          'text-orange-600'
                        }`}>
                          {order.paymentStatus === 'pending' ? 'Pending' :
                           order.paymentStatus === 'completed' ? 'Completed' :
                           order.paymentStatus === 'failed' ? 'Failed' :
                           order.paymentStatus}
                        </span>
                      </p>
                      {order.trackingNumber && (
                        <p className="text-muted-foreground">
                          Tracking: <span className="font-mono font-medium">{order.trackingNumber}</span>
                        </p>
                      )}
                      {order.estimatedDelivery && (
                        <p className="text-muted-foreground">
                          Est. Delivery: {format(new Date(order.estimatedDelivery), 'MMM dd, yyyy')}
                        </p>
                      )}
                    </div>
                    
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary">
                        ₹{parseFloat(order.total).toLocaleString()}
                      </p>
                      {order.subtotal && order.total !== order.subtotal && (
                        <p className="text-xs text-muted-foreground">
                          Subtotal: ₹{parseFloat(order.subtotal).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>

                  {order.notes && (
                    <>
                      <Separator />
                      <div>
                        <p className="font-medium text-sm text-foreground mb-1">Order Notes</p>
                        <p className="text-sm text-muted-foreground">{order.notes}</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function OrderHistory() {
  return (
    <ProtectedRoute>
      <OrderHistoryContent />
    </ProtectedRoute>
  );
}