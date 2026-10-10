import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ShoppingCart, Check, AlertCircle, MapPin, User, Mail, Phone, Tag } from "lucide-react";
import { Link, useLocation } from "wouter";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useCart } from "@/context/CartContext";
import { useAuth, useAuthenticatedFetch } from "@/context/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AddressSelector from "@/components/AddressSelector";
import type { UserAddress } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";

// Form validation schema
const checkoutFormSchema = z.object({
  customerName: z.string().min(2, "Name must be at least 2 characters"),
  customerEmail: z.string().email("Please enter a valid email address"),
  customerPhone: z.string().min(10, "Phone number must be at least 10 digits"),
  orderNotes: z.string().optional(),
});

type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;

type GuestAddressData = {
  title: string;
  recipientName: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phoneNumber: string;
};

function CheckoutContent() {
  const { items, getTotalPrice, clearCart, isMigrating, isLoading } = useCart();
  const { toast } = useToast();
  const { user } = useAuth();
  const { orderSettings, policies, promotions } = useSiteSettings();
  const authenticatedFetch = useAuthenticatedFetch();
  const [, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<any | null>(null);
  const [promoError, setPromoError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"razorpay" | "cod">("razorpay");
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState<string>("");
  const [selectedAddress, setSelectedAddress] = useState<UserAddress | null>(null);
  const [guestAddress, setGuestAddress] = useState<GuestAddressData | null>(null);
  const [giftCardCode, setGiftCardCode] = useState("");
  const [giftCardBalance, setGiftCardBalance] = useState(0);
  const [loyaltyBalance, setLoyaltyBalance] = useState(0);
  const [loyaltyPointsRedeemed, setLoyaltyPointsRedeemed] = useState(0);
  
  // Guest checkout states
  const [checkoutMode, setCheckoutMode] = useState<'guest' | 'signin' | 'authenticated'>('guest');
  const [guestEmail, setGuestEmail] = useState('');
  const [emailValidationResult, setEmailValidationResult] = useState<{
    hasAccount: boolean;
    message: string;
  } | null>(null);
  const [isValidatingEmail, setIsValidatingEmail] = useState(false);

  // Set checkout mode based on user authentication status
  useEffect(() => {
    if (user) {
      setCheckoutMode('authenticated');
    } else {
      setCheckoutMode('guest');
    }
  }, [user]);

  useEffect(() => {
    if (!user) { setLoyaltyBalance(0); setLoyaltyPointsRedeemed(0); return; }
    fetch('/api/loyalty', { headers: { Authorization: `Bearer ${localStorage.getItem('auth_token') || ''}` } }).then(r => r.ok ? r.json() : null).then(data => setLoyaltyBalance(Number(data?.account?.pointsBalance || 0))).catch(() => setLoyaltyBalance(0));
  }, [user]);

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      customerName: user ? `${user.firstName} ${user.lastName}` : "",
      customerEmail: user?.email || guestEmail,
      customerPhone: user?.phoneNumber || "",
      orderNotes: "",
    },
  });

  // Update form values when user logs in or guestEmail changes
  useEffect(() => {
    if (user) {
      // Update all form fields when user is authenticated
      const fullName = user.lastName 
        ? `${user.firstName} ${user.lastName}` 
        : user.firstName || '';
      form.setValue('customerName', fullName);
      form.setValue('customerEmail', user.email);
      if (user.phoneNumber) {
        form.setValue('customerPhone', user.phoneNumber);
      }
    } else if (guestEmail) {
      // Update email for guest checkout
      form.setValue('customerEmail', guestEmail);
    }
  }, [user, guestEmail, form]);

  // Email validation for guest checkout
  const validateGuestEmail = async (email: string) => {
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      return;
    }

    setIsValidatingEmail(true);
    try {
      const response = await fetch('/api/guest/validate-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        const result = await response.json();
        setEmailValidationResult(result);
        
        if (result.hasAccount) {
          toast({
            title: "Account Found",
            description: result.message,
            variant: "default",
          });
        }
      }
    } catch (error) {
      console.error('Email validation error:', error);
    } finally {
      setIsValidatingEmail(false);
    }
  };

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

  const calculatePromotion = (code: string) => {
    const normalized = code.trim().toUpperCase();
    if (!normalized) return null;
    const found = (promotions || []).find((p: any) => p?.active && p?.code?.trim?.().toUpperCase() === normalized);
    if (!found) return null;
    if (found.expiry) {
      const expiry = new Date(found.expiry).getTime();
      if (!Number.isNaN(expiry) && expiry < Date.now()) return null;
    }
    return found;
  };

  const applyGiftCard = async () => {
    if (!giftCardCode.trim()) return;
    try {
      const r = await fetch('/api/gift-cards/check', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: giftCardCode.trim().toUpperCase() }) });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Invalid gift card');
      setGiftCardCode(data.code); setGiftCardBalance(Number(data.remainingAmount || 0));
    } catch (e) { setGiftCardBalance(0); setPromoError(e instanceof Error ? e.message : 'Invalid gift card'); }
  };

  const applyPromoCode = async () => {
    const normalized = promoCode.trim().toUpperCase();
    if (!normalized) return;
    try {
      const response = await fetch('/api/coupons/validate', {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...(localStorage.getItem('auth_token') ? { Authorization: `Bearer ${localStorage.getItem('auth_token')}` } : {}) },
        body: JSON.stringify({ code: normalized, subtotal, productIds: items.map(i => i.product.id), categories: items.map(i => i.product.category).filter(Boolean) })
      });
      if (response.ok) {
        const result = await response.json();
        setAppliedPromo({ ...result, discountType: result.discountType, discountValue: result.discountValue });
        setPromoError('');
        return;
      }
    } catch {}
    const found = calculatePromotion(normalized);
    if (!found) { setAppliedPromo(null); setPromoError('Invalid or expired promotion code.'); return; }
    setAppliedPromo(found); setPromoError('');
  };

  const [shippingQuote, setShippingQuote] = useState<any>(null);



  const subtotal = getTotalPrice();
  const inferredPromoValue = appliedPromo?.discountValue || Number((String(appliedPromo?.message || "").match(/(\d+(?:\.\d+)?)\s*%/) || [])[1] || 0);
  const discount = appliedPromo
    ? appliedPromo.discountType === "fixed"
      ? Math.min(subtotal, Math.max(0, Number(appliedPromo.discountValue || 0)))
      : Math.min(subtotal, subtotal * Math.min(100, Math.max(0, inferredPromoValue)) / 100)
    : 0;
  const loyaltyDiscount = user ? Math.min(Math.floor(loyaltyPointsRedeemed / 10), Math.max(0, subtotal - discount)) : 0;
  const taxableSubtotal = Math.max(0, subtotal - discount - loyaltyDiscount);
  const freeThreshold = Math.max(0, Number(policies?.shipping?.freeThreshold ?? 0));
  const configuredShipping = Math.max(0, Number(policies?.shipping?.shippingCost ?? 0));
  const shipping = shippingQuote ? Number(shippingQuote.shipping || 0) : (freeThreshold > 0 && taxableSubtotal >= freeThreshold ? 0 : configuredShipping);
  const taxRate = Math.max(0, Number(policies?.gst?.rate ?? 0));
  const tax = taxableSubtotal * taxRate / 100;
  const giftCardApplied = Math.min(giftCardBalance, taxableSubtotal + shipping + tax);
  const total = Math.max(0, taxableSubtotal + shipping + tax - giftCardApplied);

  useEffect(() => {
    const address = selectedAddress || guestAddress;
    if (!address?.country) { setShippingQuote(null); return; }
    const timer = setTimeout(async () => {
      try {
        const response = await fetch('/api/shipping/quote', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            country: address.country, state: address.state, subtotal: taxableSubtotal,
            items: items.map(item => ({ productId: item.productId, quantity: item.quantity }))
          })
        });
        setShippingQuote(response.ok ? await response.json() : null);
      } catch { setShippingQuote(null); }
    }, 150);
    return () => clearTimeout(timer);
  }, [selectedAddress, guestAddress, taxableSubtotal, items]);

  useEffect(() => {
    if (!items.length) return;
    const sessionId = localStorage.getItem('bmaa_session_id') || crypto.randomUUID();
    localStorage.setItem('bmaa_session_id', sessionId);
    const timer = setTimeout(() => fetch('/api/abandoned-cart/track', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-session-id': sessionId }, body: JSON.stringify({ sessionId, customerEmail: user?.email || form.getValues('customerEmail') || undefined, customerName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : undefined, items: items.map(i => ({ productId: i.product.id, name: i.product.name, quantity: i.quantity, size: i.size, color: i.color })), cartTotal: subtotal }) }).catch(() => undefined), 1500);
    return () => clearTimeout(timer);
  }, [items, user, form, subtotal]);


  const onSubmit = async (values: CheckoutFormValues) => {
    // Validate that an address is selected
    if (!selectedAddress && !guestAddress) {
      toast({
        title: "Address Required",
        description: "Please select or enter a shipping address.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Prepare shipping address data
      const shippingAddressData = selectedAddress ? {
        title: selectedAddress.title,
        recipientName: selectedAddress.recipientName,
        street: selectedAddress.street,
        city: selectedAddress.city,
        state: selectedAddress.state,
        postalCode: selectedAddress.postalCode,
        country: selectedAddress.country,
        phoneNumber: selectedAddress.phoneNumber,
      } : guestAddress;

      // Create shipping address string for the order
      const shippingAddressString = `${shippingAddressData?.recipientName}\n${shippingAddressData?.street}\n${shippingAddressData?.city}, ${shippingAddressData?.state} ${shippingAddressData?.postalCode}\n${shippingAddressData?.country}${shippingAddressData?.phoneNumber ? '\nPhone: ' + shippingAddressData.phoneNumber : ''}`;

      // First create the order in our database
      const orderData = {
        ...values,
        shippingAddress: shippingAddressString,
        status: "pending",
        paymentStatus: "pending",
        notes: values.orderNotes || null,
        // subtotal, shippingCost, taxAmount, total calculated server-side
      };
      
      const orderItems = items.map(item => ({
        productId: item.productId,
        variantId: item.variantId || null,
        productName: item.product.name,
        productPrice: item.variant?.price ?? item.product.price,
        quantity: item.quantity,
        size: item.size || null,
        color: item.color || null,
        totalPrice: (parseFloat(item.variant?.price ?? item.product.price) * item.quantity).toString(),
      }));

      // Create order in our database - use different endpoints for guest vs authenticated users
      let order;
      
      if (checkoutMode === 'authenticated' && user) {
        // Authenticated user flow
        const orderResponse = await authenticatedFetch('/api/orders', {
          method: 'POST',
          body: JSON.stringify({ ...orderData, items: orderItems, promoCode: appliedPromo?.code || promoCode || null, paymentMethod }),
        });

        if (!orderResponse.ok) {
          const errorData = await orderResponse.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to create order');
        }

        order = await orderResponse.json();
      } else {
        // SECURE Guest checkout flow - monetary fields calculated server-side
        const guestOrderData = {
          customerName: values.customerName,
          customerEmail: guestEmail || values.customerEmail,
          customerPhone: values.customerPhone,
          shippingAddress: shippingAddressData,
          billingAddress: shippingAddressData, // Using same address for now
          useSameAddress: true,
          orderNotes: values.orderNotes,
          promoCode: appliedPromo?.code || promoCode || undefined,
          paymentMethod,
          items: orderItems.map(item => ({
            productId: item.productId,
            variantId: item.variantId || null,
            quantity: item.quantity,
            size: item.size,
            color: item.color,
            // productName, productPrice, totalPrice calculated server-side for security
          })),
          // subtotal, shippingCost, taxAmount, total calculated server-side for security
        };

        const orderResponse = await fetch('/api/guest/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(guestOrderData),
        });

        if (!orderResponse.ok) {
          const errorData = await orderResponse.json();
          
          // Check if account already exists (409 status)
          if (orderResponse.status === 409 && errorData.requireLogin) {
            toast({
              title: "Account Already Exists",
              description: errorData.message || "An account already exists with this email address. Please sign in to complete your order.",
              variant: "destructive",
            });
            setIsSubmitting(false);
            return;
          }
          
          throw new Error(errorData.error || 'Failed to create guest order');
        }

        order = await orderResponse.json();
      }

      if (paymentMethod === "cod") {
        setOrderId(order.id);
        setOrderPlaced(true);
        clearCart();
        toast({ title: "Order Placed Successfully!", description: `Your Order #${order.id.slice(-8)} is confirmed for Cash on Delivery.` });
        return;
      }

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

      // Create Razorpay order - use different endpoints for guest vs authenticated users
      let paymentResponse;
      if (checkoutMode === 'authenticated' && user) {
        // Authenticated user payment flow
        paymentResponse = await authenticatedFetch('/api/payments/create-razorpay-order', {
          method: 'POST',
          body: JSON.stringify({
            orderId: order.id
          }),
        });
      } else {
        // SECURE Guest payment flow
        paymentResponse = await fetch('/api/guest/payments/create-razorpay-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: order.id
          }),
        });
      }

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
            // Verify payment on server - use different endpoints for guest vs authenticated users
            let verifyResponse;
            if (checkoutMode === 'authenticated' && user) {
              // Authenticated user payment verification
              verifyResponse = await authenticatedFetch('/api/payments/verify-razorpay-payment', {
                method: 'POST',
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  orderId: order.id
                }),
              });
            } else {
              // SECURE Guest payment verification
              verifyResponse = await fetch('/api/guest/payments/verify-razorpay-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  orderId: order.id
                }),
              });
            }

            const verificationResult = await verifyResponse.json();
            
            if (verifyResponse.ok && verificationResult.status === 'success') {
              setOrderId(order.id);
              setOrderPlaced(true);
              clearCart();
              
              toast({
                title: "Payment Successful!",
                description: `Your Order #${order.id.slice(-8)} has been confirmed.`,
              });
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
          }
        },
        prefill: {
          name: values.customerName,
          email: values.customerEmail,
          contact: values.customerPhone
        },
        theme: {
          color: '#16a34a' // Green color matching the theme
        },
        modal: {
          ondismiss: function() {
            setIsSubmitting(false);
            
            // Invalidate orders cache so the new pending order appears immediately
            queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
            
            // Redirect users to orders page where they can retry payment
            if (user) {
              toast({
                title: "Payment Cancelled",
                description: "Redirecting to your orders. You can complete the payment anytime.",
              });
              // Redirect to orders page
              setTimeout(() => {
                setLocation('/orders');
              }, 1500);
            } else {
              toast({
                title: "Payment Cancelled",
                description: "Your order has been saved. Please sign in to complete the payment from your order history.",
              });
              // Redirect to home for guests
              setTimeout(() => {
                setLocation('/');
              }, 1500);
            }
          }
        }
      };

      // @ts-ignore - Razorpay is loaded dynamically
      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (error) {
      console.error('Error during checkout:', error);
      toast({
        title: "Checkout Failed",
        description: error instanceof Error ? error.message : "There was an error processing your order. Please try again.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };


  // Show loading state while cart is loading or migrating
  if ((isMigrating || isLoading) && items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md mx-auto px-4">
          <ShoppingCart className="h-16 w-16 text-muted-foreground mx-auto mb-6 animate-pulse" />
          <h1 className="text-2xl font-bold mb-4">Loading Your Cart...</h1>
          <p className="text-muted-foreground">
            Please wait while we sync your cart items.
          </p>
        </div>
      </div>
    );
  }

  // If cart is empty (and not loading/migrating), redirect to products
  if (items.length === 0 && !orderPlaced && !isLoading && !isMigrating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md mx-auto px-4">
          <ShoppingCart className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
          <h1 className="text-2xl font-bold mb-4">Your Cart is Empty</h1>
          <p className="text-muted-foreground mb-6">
            Add some products to your cart before proceeding to checkout.
          </p>
          <Link href="/products">
            <Button>Browse Products</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Order confirmation screen
  if (orderPlaced) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md mx-auto px-4 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="h-8 w-8 text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold mb-4">Order Placed Successfully!</h1>
          <p className="text-muted-foreground mb-2">
            Thank you for your order. We'll send you a confirmation email shortly.
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            Order ID: <span className="font-mono font-medium">Order #{orderId.slice(-8)}</span>
          </p>
          
          <div className="space-y-3">
            <Link href="/orders">
              <Button className="w-full">View Order History</Button>
            </Link>
            <Link href="/products">
              <Button className="w-full">Continue Shopping</Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="w-full">Back to Home</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center space-x-4">
            <Link href="/products">
              <Button variant="ghost" size="sm" data-testid="button-back-to-products">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Products
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Checkout</h1>
              <p className="text-muted-foreground">Complete your order</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Summary - Shows first on mobile, right side on desktop */}
          <div className="space-y-6 lg:order-2">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
                <CardDescription>
                  {items.length} item{items.length !== 1 ? 's' : ''} in your cart
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Cart Items */}
                <div className="space-y-3" data-testid="order-items">
                  {items.map((item) => (
                    <div key={item.id} className="flex space-x-3">
                      <div className="w-12 h-12 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                        <img 
                          src={item.product.images?.[0]} 
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm line-clamp-2">{item.product.name}</h4>
                        {(item.size || item.color) && (
                          <p className="text-xs text-muted-foreground">
                            {item.size && `Size: ${item.size}`}
                            {item.size && item.color && ' • '}
                            {item.color && `Color: ${item.color}`}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Qty: {item.quantity} × ₹{parseFloat(item.variant?.price ?? item.product.price).toLocaleString()} {item.product.unit || 'per unit'}
                        </p>
                      </div>
                      <div className="text-sm font-medium">
                        ₹{(parseFloat(item.variant?.price ?? item.product.price) * item.quantity).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Promotion Code */}
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input value={promoCode} onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); setPromoError(""); }} placeholder="Promotion code" />
                    <Button type="button" variant="outline" onClick={applyPromoCode}><Tag className="h-4 w-4 mr-1" />Apply</Button>
                  </div>
                  {promoError && <p className="text-xs text-destructive">{promoError}</p>}
                  {appliedPromo && <p className="text-xs text-green-600">Code {appliedPromo.code} applied successfully.</p>}
                </div>

                <div className="space-y-3 border rounded-lg p-3">
                  <div className="flex gap-2"><Input value={giftCardCode} onChange={e=>setGiftCardCode(e.target.value.toUpperCase())} placeholder="Gift card code"/><Button type="button" variant="outline" onClick={applyGiftCard}>Apply Gift Card</Button></div>
                  {giftCardApplied > 0 && <p className="text-xs text-green-600">Gift card applied: ₹{giftCardApplied.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</p>}
                  {user && loyaltyBalance > 0 && <div className="flex items-center justify-between gap-3 text-sm"><span>Rewards: {loyaltyBalance} points available (100 points = ₹10)</span><Input className="w-28" type="number" min="0" max={loyaltyBalance} step="10" value={loyaltyPointsRedeemed} onChange={e=>setLoyaltyPointsRedeemed(Math.min(loyaltyBalance, Math.max(0, Number(e.target.value)||0)))} /></div>}
                </div>

                {/* Payment Method */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">Payment Method</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Button type="button" variant={paymentMethod === "razorpay" ? "default" : "outline"} onClick={() => setPaymentMethod("razorpay")}>Online Payment</Button>
                    {orderSettings?.codEnabled && <Button type="button" variant={paymentMethod === "cod" ? "default" : "outline"} onClick={() => setPaymentMethod("cod")}>Cash on Delivery</Button>}
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span data-testid="text-subtotal">₹{subtotal.toLocaleString()}</span>
                  </div>
                  {discount > 0 && <div className="flex justify-between text-green-600"><span>Discount {appliedPromo?.code ? `(${appliedPromo.code})` : ""}</span><span>-₹{discount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span></div>}
                  {loyaltyDiscount > 0 && <div className="flex justify-between text-green-600"><span>Rewards</span><span>-₹{loyaltyDiscount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span></div>}
                  {giftCardApplied > 0 && <div className="flex justify-between text-green-600"><span>Gift card</span><span>-₹{giftCardApplied.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span></div>}
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span className={shipping === 0 ? "text-amber-600" : ""} data-testid="text-shipping">{shipping === 0 ? "Free" : `₹${shipping.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GST ({taxRate}%)</span>
                    <span data-testid="text-tax">₹{tax.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-base">
                    <span>Total</span>
                    <span data-testid="text-total">₹{total.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {orderSettings?.deliveryMessage && <p className="text-sm text-muted-foreground">{orderSettings.deliveryMessage}</p>}

            {/* Security Notice */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <AlertCircle className="h-4 w-4" />
                  <span>Secure checkout - Your information is protected</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Customer Information and Address Selection */}
          <div className="lg:col-span-2 lg:order-1 space-y-6">
            {/* Checkout Mode Toggle - only show if user is not authenticated */}
            {checkoutMode !== 'authenticated' && (
              <Card>
                <CardHeader>
                  <CardTitle>Checkout Options</CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs value={checkoutMode} onValueChange={(value) => setCheckoutMode(value as 'guest' | 'signin')}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="guest" data-testid="tab-guest-checkout">Continue as Guest</TabsTrigger>
                      <TabsTrigger value="signin" data-testid="tab-signin">Sign In</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="guest" className="mt-4">
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          Checkout quickly without creating an account. You can create an account after your order.
                        </p>
                        
                        {/* Guest Email Validation */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Email Address</label>
                          <div className="flex space-x-2">
                            <Input
                              type="email"
                              placeholder="Enter your email address"
                              value={guestEmail}
                              onChange={(e) => setGuestEmail(e.target.value)}
                              onBlur={() => validateGuestEmail(guestEmail)}
                              data-testid="input-guest-email"
                              className="flex-1"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => validateGuestEmail(guestEmail)}
                              disabled={isValidatingEmail}
                              data-testid="button-validate-email"
                            >
                              {isValidatingEmail ? 'Checking...' : 'Validate'}
                            </Button>
                          </div>
                          
                          {emailValidationResult && (
                            <div className={`p-3 rounded-lg text-sm ${
                              emailValidationResult.hasAccount 
                                ? 'bg-yellow-50 border border-yellow-200 text-yellow-800' 
                                : 'bg-green-50 border border-green-200 text-green-800'
                            }`}>
                              <div className="flex items-center space-x-2">
                                {emailValidationResult.hasAccount ? (
                                  <AlertCircle className="h-4 w-4" />
                                ) : (
                                  <Check className="h-4 w-4" />
                                )}
                                <span>{emailValidationResult.message}</span>
                              </div>
                              {emailValidationResult.hasAccount && (
                                <div className="mt-2">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCheckoutMode('signin')}
                                    data-testid="button-switch-to-signin"
                                  >
                                    Sign In Instead
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="signin" className="mt-4">
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          Sign in to access your saved addresses and order history.
                        </p>
                        <div className="space-y-2">
                          <Link href="/login?returnTo=/checkout">
                            <Button className="w-full" data-testid="button-go-to-login">
                              Go to Sign In Page
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            )}

            {/* Only show form when user is authenticated or in guest mode (not signin mode) */}
            {checkoutMode !== 'signin' && (
              <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="h-5 w-5" />
                    <span>Customer Information</span>
                  </CardTitle>
                  <CardDescription>
                    Please provide your details for delivery and order confirmation.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Personal Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="customerName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                placeholder="Enter your full name"
                                data-testid="input-customer-name"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="customerPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                placeholder="Enter your phone number"
                                data-testid="input-customer-phone"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="customerEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="email"
                              placeholder="Enter your email address"
                              value={checkoutMode === 'guest' ? guestEmail : field.value}
                              onChange={checkoutMode === 'guest' ? (e) => setGuestEmail(e.target.value) : field.onChange}
                              disabled={false}
                              data-testid="input-customer-email"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Order Notes */}
                    <FormField
                      control={form.control}
                      name="orderNotes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Order Notes (Optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field}
                              placeholder="Any special instructions or notes for your order"
                              data-testid="input-order-notes"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                  </form>
                </Form>
              </CardContent>
            </Card>

            {/* Shipping Address Selection */}
            <AddressSelector
              selectedAddressId={selectedAddress?.id}
              onAddressSelect={setSelectedAddress}
              onGuestAddressChange={setGuestAddress}
              allowGuestCheckout={!user}
            />
            {/* Payment Section */}
            <Card>
              <CardHeader>
                <CardTitle>Payment</CardTitle>
                <CardDescription>{orderSettings?.deliveryMessage || "Complete your order with secure payment"}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={form.handleSubmit(onSubmit)}
                  size="lg" 
                  className="w-full"
                  disabled={isSubmitting || (!selectedAddress && !guestAddress)}
                  data-testid="button-place-order"
                >
                  {isSubmitting ? "Processing..." : `Pay ₹${total.toLocaleString()} with Razorpay`}
                </Button>
              </CardContent>
            </Card>
            </>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Checkout() {
  return <CheckoutContent />;
}