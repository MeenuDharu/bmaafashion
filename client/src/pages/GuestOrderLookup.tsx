import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation } from "wouter";
import { 
  Search, 
  Package, 
  Calendar, 
  CreditCard, 
  MapPin,
  ArrowLeft,
  User,
  ShoppingBag,
  Eye,
  EyeOff
} from "lucide-react";

import type { Order, OrderItem } from "@shared/schema";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

const lookupSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
  email: z.string().email("Please enter a valid email address"),
});

const createAccountSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LookupFormData = z.infer<typeof lookupSchema>;
type CreateAccountFormData = z.infer<typeof createAccountSchema>;

// Type for order with items from API response
type OrderWithItems = Order & {
  items?: OrderItem[];
};

export default function GuestOrderLookup() {
  const [lookupData, setLookupData] = useState<LookupFormData | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<LookupFormData>({
    resolver: zodResolver(lookupSchema),
    defaultValues: {
      orderId: "",
      email: "",
    },
  });

  // Query for guest order - SECURE: requires both order ID and email
  const { 
    data: order, 
    isLoading, 
    error, 
    refetch 
  } = useQuery<OrderWithItems>({
    queryKey: ['/api/guest/order-lookup', lookupData],
    queryFn: async () => {
      if (!lookupData) throw new Error('No lookup data');
      const response = await fetch('/api/guest/order-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lookupData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to lookup order');
      }
      return response.json();
    },
    enabled: !!lookupData && hasSearched,
    retry: false,
  });

  // Convert single order to array format for consistent display logic
  const orderList = order ? [order] : [];

  const onSubmit = (values: LookupFormData) => {
    setLookupData(values);
    setHasSearched(true);
    refetch();
  };

  // Account creation form
  const accountForm = useForm<CreateAccountFormData>({
    resolver: zodResolver(createAccountSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Account creation mutation
  const createAccountMutation = useMutation({
    mutationFn: async (data: CreateAccountFormData) => {
      if (!order) throw new Error('No order found');
      
      const response = await fetch('/api/guest/create-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          firstName: data.firstName,
          lastName: data.lastName,
          password: data.password,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create account');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Account Created Successfully!",
        description: "Your account has been created and your order history is now linked to it.",
      });
      setIsAccountDialogOpen(false);
      accountForm.reset();
      // Redirect to login page after a short delay
      setTimeout(() => {
        setLocation('/login');
      }, 2000);
    },
    onError: (error) => {
      toast({
        title: "Error Creating Account",
        description: error instanceof Error ? error.message : "Failed to create account",
        variant: "destructive",
      });
    },
  });

  const handleCreateAccount = (data: CreateAccountFormData) => {
    createAccountMutation.mutate(data);
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      confirmed: "bg-blue-100 text-blue-800 border-blue-200", 
      processing: "bg-orange-100 text-orange-800 border-orange-200",
      shipped: "bg-purple-100 text-purple-800 border-purple-200",
      delivered: "bg-green-100 text-green-800 border-green-200",
      cancelled: "bg-red-100 text-red-800 border-red-200",
    };

    return (
      <Badge
        className={`${statusColors[status as keyof typeof statusColors] || statusColors.pending}`}
        data-testid={`status-${status}`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost" size="sm" data-testid="button-back-to-home">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Order Lookup</h1>
              <p className="text-muted-foreground">Find your order using your Order ID and email address</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Email Lookup Form */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Search className="h-5 w-5" />
                <span>Find Your Order</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="orderId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Order ID</FormLabel>
                        <FormControl>
                          <Input 
                            {...field}
                            type="text"
                            placeholder="Enter your order ID (e.g., 12345678-1234-...)"
                            data-testid="input-lookup-order-id"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input 
                            {...field}
                            type="email"
                            placeholder="Enter the email used for your order"
                            data-testid="input-lookup-email"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    data-testid="button-lookup-order"
                    className="w-full"
                  >
                    {isLoading ? "Searching..." : "Find Order"}
                  </Button>
                </form>
              </Form>
              
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 mb-2">How to find your Order ID:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Check your order confirmation email</li>
                  <li>• Look for the Order ID in your payment receipt</li>
                  <li>• Order IDs are in the format: 12345678-1234-5678-9abc-123456789def</li>
                </ul>
                <p className="text-xs text-blue-600 mt-2">
                  Both Order ID and email address are required for security purposes.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Results Section */}
          {hasSearched && (
            <div>
              {isLoading && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Searching for your order...</p>
                  </CardContent>
                </Card>
              )}

              {error && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Order Not Found</h3>
                    <p className="text-muted-foreground mb-4">
                      We couldn't find an order with the provided Order ID and email address combination.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Please check both your Order ID and email address and try again, or contact our support team if you need assistance.
                    </p>
                  </CardContent>
                </Card>
              )}

              {orderList.length === 0 && !isLoading && !error && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Orders Yet</h3>
                    <p className="text-muted-foreground mb-4">
                      You haven't placed any orders with this email address yet.
                    </p>
                    <Link href="/products">
                      <Button data-testid="button-start-shopping">
                        Start Shopping
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}

              {orderList.length > 0 && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">
                      Order Details
                    </h2>
                    <div className="text-sm text-muted-foreground">
                      Order for: <span className="font-medium">{lookupData?.email}</span>
                    </div>
                  </div>

                  {orderList.map((order) => (
                    <Card key={order.id} data-testid={`order-${order.id}`}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">
                              Order #{order.id.slice(-8)}
                            </CardTitle>
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-4 w-4" />
                                <span>{new Date(order.createdAt || new Date()).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <CreditCard className="h-4 w-4" />
                                <span>₹{parseFloat(order.total).toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                          {getStatusBadge(order.status)}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {/* Order Items */}
                          <div>
                            <h4 className="font-medium mb-3">Items Ordered</h4>
                            <div className="space-y-2">
                              {(order.items || []).map((item, index) => (
                                <div key={index} className="flex items-center space-x-3 p-2 bg-muted/50 rounded-lg">
                                  <div className="w-12 h-12 bg-muted rounded border flex items-center justify-center">
                                    <Package className="h-6 w-6 text-muted-foreground" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm line-clamp-1">{item.productName}</p>
                                    <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                                  </div>
                                  <div className="text-sm font-medium">
                                    ₹{parseFloat(item.totalPrice).toLocaleString()}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <Separator />

                          {/* Shipping Address */}
                          <div>
                            <h4 className="font-medium mb-2 flex items-center space-x-2">
                              <MapPin className="h-4 w-4" />
                              <span>Shipping Address</span>
                            </h4>
                            <div className="bg-muted/50 p-3 rounded-lg">
                              <div className="whitespace-pre-line text-sm text-muted-foreground">
                                {order.shippingAddress}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {/* Account Creation Offer */}
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-3">
                        <User className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div className="flex-1">
                          <h3 className="font-semibold text-blue-900 mb-2">
                            Create an Account for Easier Shopping
                          </h3>
                          <p className="text-sm text-blue-700 mb-4">
                            Create an account with this email to manage your orders, save addresses, and checkout faster in the future.
                          </p>
                          <Button
                            className="bg-blue-600 hover:bg-blue-700"
                            data-testid="button-create-account"
                            onClick={() => setIsAccountDialogOpen(true)}
                          >
                            Create Account
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Account Creation Dialog */}
      <Dialog open={isAccountDialogOpen} onOpenChange={setIsAccountDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Your Account</DialogTitle>
            <DialogDescription>
              Create an account to link your order history and enjoy faster checkout in the future.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...accountForm}>
            <form onSubmit={accountForm.handleSubmit(handleCreateAccount)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={accountForm.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input 
                          {...field}
                          placeholder="Enter your first name"
                          data-testid="input-first-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={accountForm.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input 
                          {...field}
                          placeholder="Enter your last name"
                          data-testid="input-last-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={accountForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          {...field}
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter a secure password (min 8 characters)"
                          data-testid="input-password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowPassword(!showPassword)}
                          data-testid="button-toggle-password"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={accountForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input 
                        {...field}
                        type="password"
                        placeholder="Confirm your password"
                        data-testid="input-confirm-password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <User className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-900 mb-1">Account Email</p>
                    <p className="text-blue-700">{lookupData?.email}</p>
                    <p className="text-xs text-blue-600 mt-1">
                      Your order history will be linked to this email address.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAccountDialogOpen(false)}
                  data-testid="button-cancel-account"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createAccountMutation.isPending}
                  data-testid="button-submit-account"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {createAccountMutation.isPending ? "Creating..." : "Create Account"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}