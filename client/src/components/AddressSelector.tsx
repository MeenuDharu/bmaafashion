import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  MapPin, 
  Plus, 
  Star, 
  User, 
  Phone, 
  Home,
  Check,
  Edit2,
  Trash2
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
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

const addressSchema = z.object({
  title: z.string().min(1, "Address title is required"),
  recipientName: z.string().min(1, "Recipient name is required"),
  street: z.string().min(1, "Street address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  postalCode: z.string().min(1, "Postal code is required"),
  country: z.string().min(1, "Country is required"),
  phoneNumber: z.string().min(1, "Phone number is required"),
});

type AddressFormData = z.infer<typeof addressSchema>;

interface AddressSelectorProps {
  selectedAddressId?: string;
  onAddressSelect: (address: UserAddress | null) => void;
  onGuestAddressChange?: (address: AddressFormData | null) => void;
  allowGuestCheckout?: boolean;
}

export default function AddressSelector({
  selectedAddressId,
  onAddressSelect,
  onGuestAddressChange,
  allowGuestCheckout = false
}: AddressSelectorProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<UserAddress | null>(null);
  const [deleteAddressId, setDeleteAddressId] = useState<string | null>(null);
  const [useGuestAddress, setUseGuestAddress] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const authenticatedFetch = useAuthenticatedFetch();

  // Fetch user addresses
  const { data: addresses = [], isLoading } = useQuery<UserAddress[]>({
    queryKey: ['/api/user/addresses'],
    queryFn: async () => {
      if (!user) return [];
      const response = await authenticatedFetch('/api/user/addresses');
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!user,
    retry: false,
  });

  const form = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      title: "",
      recipientName: user ? `${user.firstName} ${user.lastName}` : "",
      street: "",
      city: "",
      state: "",
      postalCode: "",
      country: "India",
      phoneNumber: user?.phoneNumber || "",
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
    onSuccess: (newAddress) => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/addresses'] });
      toast({ title: "Address added successfully" });
      setIsAddDialogOpen(false);
      form.reset();
      onAddressSelect(newAddress);
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
    onSuccess: (updatedAddress) => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/addresses'] });
      toast({ title: "Address updated successfully" });
      setEditingAddress(null);
      form.reset();
      onAddressSelect(updatedAddress);
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
      // Clear selection if deleted address was selected
      if (selectedAddressId === deleteAddressId) {
        onAddressSelect(null);
      }
    },
    onError: () => {
      toast({ 
        title: "Error", 
        description: "Failed to delete address",
        variant: "destructive" 
      });
    },
  });

  // Auto-select default address when addresses are loaded
  useEffect(() => {
    if (!isLoading && addresses.length > 0 && user && !selectedAddressId && !useGuestAddress) {
      const defaultAddress = addresses.find(addr => addr.isDefault);
      const addressToSelect = defaultAddress || addresses[0]; // Fall back to first address if no default
      
      if (addressToSelect) {
        onAddressSelect(addressToSelect);
      }
    }
  }, [addresses, isLoading, user, selectedAddressId, useGuestAddress, onAddressSelect]);

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
    form.reset({
      title: "",
      recipientName: user ? `${user.firstName} ${user.lastName}` : "",
      street: "",
      city: "",
      state: "",
      postalCode: "",
      country: "India",
      phoneNumber: user?.phoneNumber || "",
    });
  };

  const handleAddressChange = (addressId: string) => {
    if (addressId === 'guest') {
      setUseGuestAddress(true);
      onAddressSelect(null);
    } else {
      setUseGuestAddress(false);
      const selectedAddress = addresses.find(addr => addr.id === addressId) || null;
      onAddressSelect(selectedAddress);
    }
  };

  const handleGuestFormChange = () => {
    if (onGuestAddressChange) {
      const formData = form.getValues();
      // Check if required fields are filled (including phone number)
      if (formData.recipientName && formData.street && formData.city && 
          formData.state && formData.postalCode && formData.country && formData.phoneNumber) {
        onGuestAddressChange(formData);
      } else {
        onGuestAddressChange(null);
      }
    }
  };

  if (!user && !allowGuestCheckout) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Sign in required</h3>
          <p className="text-muted-foreground">
            Please sign in to select or manage your shipping addresses.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading && user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Select Shipping Address</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="p-4 border rounded-lg animate-pulse">
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-24"></div>
                  <div className="h-4 bg-muted rounded w-32"></div>
                  <div className="h-8 bg-muted rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const defaultAddress = addresses.find(addr => addr.isDefault);
  const initialSelectedId = selectedAddressId || defaultAddress?.id || '';

  return (
    <>
      <Card data-testid="card-address-selector">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Select Shipping Address</CardTitle>
            {user && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAddDialogOpen(true)}
                data-testid="button-add-address-checkout"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add New
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={useGuestAddress ? 'guest' : initialSelectedId}
            onValueChange={handleAddressChange}
            className="space-y-4"
          >
            {/* Saved Addresses */}
            {user && addresses.map((address) => (
              <div key={address.id} className="space-y-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem 
                    value={address.id} 
                    id={address.id} 
                    data-testid={`radio-address-${address.id}`}
                  />
                  <Label 
                    htmlFor={address.id} 
                    className="flex-1 cursor-pointer"
                    data-testid={`label-address-${address.id}`}
                  >
                    <Card className="p-4 hover-elevate">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          <Home className="w-4 h-4 text-muted-foreground mt-1" />
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className="font-medium text-sm">{address.title}</h4>
                              {address.isDefault && (
                                <Badge variant="secondary" className="text-xs">
                                  <Star className="w-3 h-3 mr-1" />
                                  Default
                                </Badge>
                              )}
                            </div>
                            <div className="space-y-1 text-sm text-muted-foreground">
                              <div className="flex items-center space-x-2">
                                <User className="w-3 h-3" />
                                <span>{address.recipientName}</span>
                              </div>
                              <div>{address.street}</div>
                              <div>{address.city}, {address.state} {address.postalCode}</div>
                              <div>{address.country}</div>
                              {address.phoneNumber && (
                                <div className="flex items-center space-x-2">
                                  <Phone className="w-3 h-3" />
                                  <span>{address.phoneNumber}</span>
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2 mt-3">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleEdit(address);
                                }}
                                data-testid={`button-edit-address-${address.id}`}
                              >
                                <Edit2 className="w-3 h-3 mr-1" />
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setDeleteAddressId(address.id);
                                }}
                                data-testid={`button-delete-address-${address.id}`}
                              >
                                <Trash2 className="w-3 h-3 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        </div>
                        <div className="ml-2">
                          {selectedAddressId === address.id && (
                            <Check className="w-4 h-4 text-primary" />
                          )}
                        </div>
                      </div>
                    </Card>
                  </Label>
                </div>
              </div>
            ))}

            {/* No Addresses State */}
            {user && addresses.length === 0 && (
              <div className="text-center py-8">
                <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No addresses saved</h3>
                <p className="text-muted-foreground mb-4">
                  Add your first shipping address to continue
                </p>
                <Button 
                  onClick={() => setIsAddDialogOpen(true)}
                  data-testid="button-add-first-address-checkout"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Shipping Address
                </Button>
              </div>
            )}

            {/* Guest Checkout Option */}
            {allowGuestCheckout && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem 
                    value="guest" 
                    id="guest" 
                    data-testid="radio-guest-address"
                  />
                  <Label htmlFor="guest" className="cursor-pointer">
                    {user ? "Use a different address" : "Enter shipping address"}
                  </Label>
                </div>
                
                {useGuestAddress && (
                  <Card className="p-4">
                    <Form {...form}>
                      <div className="space-y-4">
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
                                    onChange={(e) => {
                                      field.onChange(e);
                                      handleGuestFormChange();
                                    }}
                                    data-testid="input-guest-title"
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
                                    onChange={(e) => {
                                      field.onChange(e);
                                      handleGuestFormChange();
                                    }}
                                    data-testid="input-guest-recipient-name"
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
                                  onChange={(e) => {
                                    field.onChange(e);
                                    handleGuestFormChange();
                                  }}
                                  data-testid="input-guest-street"
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
                                    onChange={(e) => {
                                      field.onChange(e);
                                      handleGuestFormChange();
                                    }}
                                    data-testid="input-guest-city"
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
                                    onChange={(e) => {
                                      field.onChange(e);
                                      handleGuestFormChange();
                                    }}
                                    data-testid="input-guest-state"
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
                                    onChange={(e) => {
                                      field.onChange(e);
                                      handleGuestFormChange();
                                    }}
                                    data-testid="input-guest-postal-code"
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
                                <Select 
                                  onValueChange={(value) => {
                                    field.onChange(value);
                                    handleGuestFormChange();
                                  }} 
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger data-testid="select-guest-country">
                                      <SelectValue placeholder="Select country" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="India">India</SelectItem>
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
                              <FormLabel>Phone Number</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Contact number" 
                                  {...field}
                                  onChange={(e) => {
                                    field.onChange(e);
                                    handleGuestFormChange();
                                  }}
                                  data-testid="input-guest-phone"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {user && (
                          <div className="pt-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const formData = form.getValues();
                                if (form.formState.isValid) {
                                  createAddressMutation.mutate(formData);
                                }
                              }}
                              disabled={!form.formState.isValid || createAddressMutation.isPending}
                              data-testid="button-save-guest-address"
                            >
                              {createAddressMutation.isPending ? "Saving..." : "Save for future use"}
                            </Button>
                          </div>
                        )}
                      </div>
                    </Form>
                  </Card>
                )}
              </div>
            )}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Add/Edit Address Dialog */}
      {user && (
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
                            data-testid="input-new-address-title"
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
                            data-testid="input-new-recipient-name"
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
                          data-testid="input-new-street"
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
                            data-testid="input-new-city"
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
                            data-testid="input-new-state"
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
                            data-testid="input-new-postal-code"
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
                            <SelectTrigger data-testid="select-new-country">
                              <SelectValue placeholder="Select country" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="India">India</SelectItem>
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
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Contact number" 
                          {...field} 
                          data-testid="input-new-phone"
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
                    data-testid="button-save-new-address"
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
      )}

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
              data-testid="button-confirm-delete-checkout"
            >
              {deleteAddressMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}