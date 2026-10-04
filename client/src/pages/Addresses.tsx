import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  MapPin, 
  Plus, 
  Edit2, 
  Trash2, 
  Star, 
  StarOff,
  User,
  Phone,
  Home
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth, useAuthenticatedFetch } from "@/context/AuthContext";
import { queryClient } from "@/lib/queryClient";
import type { UserAddress } from "@shared/schema";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const addressSchema = z.object({
  title: z.string().min(1, "Address title is required"),
  recipientName: z.string().min(1, "Recipient name is required"),
  street: z.string().min(1, "Street address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  postalCode: z.string().min(1, "Postal code is required"),
  country: z.string().min(1, "Country is required"),
  phoneNumber: z.string().optional(),
});

type AddressFormData = z.infer<typeof addressSchema>;

function AddressesContent() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<UserAddress | null>(null);
  const [deleteAddressId, setDeleteAddressId] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const authenticatedFetch = useAuthenticatedFetch();

  // Fetch user addresses
  const { data: addresses = [], isLoading, error } = useQuery<UserAddress[]>({
    queryKey: ['/api/user/addresses'],
    queryFn: async () => {
      const response = await authenticatedFetch('/api/user/addresses');
      if (!response.ok) {
        throw new Error('Failed to fetch addresses');
      }
      return response.json();
    },
    enabled: !!user,
    retry: false,
  });

  const form = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      title: "",
      recipientName: "",
      street: "",
      city: "",
      state: "",
      postalCode: "",
      country: "India",
      phoneNumber: "",
    },
  });

  // Create address mutation
  const createAddressMutation = useMutation({
    mutationFn: async (data: AddressFormData) => {
      const response = await authenticatedFetch('/api/user/addresses', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create address');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/addresses'] });
      toast({ title: "Address added successfully" });
      setIsAddDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ 
        title: "Error", 
        description: "Failed to add address",
        variant: "destructive" 
      });
    },
  });

  // Update address mutation
  const updateAddressMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: AddressFormData }) => {
      const response = await authenticatedFetch(`/api/user/addresses/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update address');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/addresses'] });
      toast({ title: "Address updated successfully" });
      setEditingAddress(null);
      form.reset();
    },
    onError: () => {
      toast({ 
        title: "Error", 
        description: "Failed to update address",
        variant: "destructive" 
      });
    },
  });

  // Delete address mutation
  const deleteAddressMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await authenticatedFetch(`/api/user/addresses/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete address');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/addresses'] });
      toast({ title: "Address deleted successfully" });
      setDeleteAddressId(null);
    },
    onError: () => {
      toast({ 
        title: "Error", 
        description: "Failed to delete address",
        variant: "destructive" 
      });
    },
  });

  // Set default address mutation
  const setDefaultMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await authenticatedFetch(`/api/user/addresses/${id}/default`, {
        method: 'PUT',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to set default address');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/addresses'] });
      toast({ title: "Default address updated" });
    },
    onError: () => {
      toast({ 
        title: "Error", 
        description: "Failed to set default address",
        variant: "destructive" 
      });
    },
  });

  const onSubmit = (data: AddressFormData) => {
    if (editingAddress) {
      updateAddressMutation.mutate({ id: editingAddress.id, data });
    } else {
      createAddressMutation.mutate(data);
    }
  };

  const handleEdit = (address: UserAddress) => {
    setEditingAddress(address);
    form.reset({
      title: address.title,
      recipientName: address.recipientName,
      street: address.street,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
      phoneNumber: address.phoneNumber || "",
    });
  };

  const handleCancelEdit = () => {
    setEditingAddress(null);
    form.reset();
  };


  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-48"></div>
            <div className="grid gap-4 md:grid-cols-2">
              {[1, 2].map((i) => (
                <div key={i} className="p-6 border rounded-lg">
                  <div className="space-y-3">
                    <div className="h-4 bg-muted rounded w-24"></div>
                    <div className="h-4 bg-muted rounded w-32"></div>
                    <div className="h-12 bg-muted rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-primary mb-2">
              Shipping Addresses
            </h1>
            <p className="text-muted-foreground">
              Manage your saved shipping addresses for faster checkout
            </p>
          </div>
          <Button 
            onClick={() => setIsAddDialogOpen(true)}
            data-testid="button-add-address"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Address
          </Button>
        </div>

        {addresses.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <MapPin className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">No addresses saved</h2>
              <p className="text-muted-foreground mb-6">
                Add your first shipping address to get started
              </p>
              <Button 
                onClick={() => setIsAddDialogOpen(true)}
                data-testid="button-add-first-address"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Address
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {addresses.map((address) => (
              <Card 
                key={address.id} 
                className="relative"
                data-testid={`card-address-${address.id}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <Home className="h-4 w-4 text-muted-foreground" />
                      <CardTitle className="text-lg">{address.title}</CardTitle>
                      {address.isDefault && (
                        <Badge variant="secondary" data-testid={`badge-default-${address.id}`}>
                          <Star className="h-3 w-3 mr-1" />
                          Default
                        </Badge>
                      )}
                    </div>
                    <div className="flex space-x-1">
                      {!address.isDefault && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDefaultMutation.mutate(address.id)}
                          disabled={setDefaultMutation.isPending}
                          data-testid={`button-set-default-${address.id}`}
                        >
                          <StarOff className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(address)}
                        data-testid={`button-edit-${address.id}`}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteAddressId(address.id)}
                        data-testid={`button-delete-${address.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{address.recipientName}</span>
                    </div>
                    <div className="text-sm">
                      <div>{address.street}</div>
                      <div>{address.city}, {address.state} {address.postalCode}</div>
                      <div>{address.country}</div>
                    </div>
                    {address.phoneNumber && (
                      <div className="flex items-center space-x-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{address.phoneNumber}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Add/Edit Address Dialog */}
        <Dialog 
          open={isAddDialogOpen || !!editingAddress} 
          onOpenChange={(open) => {
            if (!open) {
              setIsAddDialogOpen(false);
              handleCancelEdit();
            }
          }}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingAddress ? 'Edit Address' : 'Add New Address'}
              </DialogTitle>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address Title</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., Home, Office" 
                            {...field} 
                            data-testid="input-address-title"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="recipientName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Recipient Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Full name" 
                            {...field} 
                            data-testid="input-recipient-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="street"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Street Address</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="House number, street name, area" 
                          {...field} 
                          data-testid="input-street"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="City" 
                            {...field} 
                            data-testid="input-city"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="State" 
                            {...field} 
                            data-testid="input-state"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="postalCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Postal Code</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="PIN Code" 
                            {...field} 
                            data-testid="input-postal-code"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-country">
                              <SelectValue placeholder="Select country" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="India">India</SelectItem>
                            <SelectItem value="United States">United States</SelectItem>
                            <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                            <SelectItem value="Canada">Canada</SelectItem>
                            <SelectItem value="Australia">Australia</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Contact number" 
                          {...field} 
                          data-testid="input-phone"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setIsAddDialogOpen(false);
                      handleCancelEdit();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createAddressMutation.isPending || updateAddressMutation.isPending}
                    data-testid="button-save-address"
                  >
                    {createAddressMutation.isPending || updateAddressMutation.isPending 
                      ? "Saving..." 
                      : (editingAddress ? "Update Address" : "Add Address")
                    }
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteAddressId} onOpenChange={() => setDeleteAddressId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Address</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this address? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteAddressId && deleteAddressMutation.mutate(deleteAddressId)}
                disabled={deleteAddressMutation.isPending}
                data-testid="button-confirm-delete"
              >
                {deleteAddressMutation.isPending ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

export default function Addresses() {
  return (
    <ProtectedRoute>
      <AddressesContent />
    </ProtectedRoute>
  );
}