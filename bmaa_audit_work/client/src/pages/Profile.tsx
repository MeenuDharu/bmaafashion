import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  User, Mail, Phone, MapPin, Calendar, Edit2, Save, X, Settings, Plus, Home, Star,
  Shield, Bell, Eye, EyeOff, Trash2, Lock, Camera, Package, FileText, AlertTriangle,
  CreditCard, Truck, CheckCircle, Clock, Upload, ImageIcon, MessageCircle
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { useAuth, useAuthenticatedFetch } from "@/context/AuthContext";
import type { User as UserType, UserAddress, UserPreferences, Order } from "@shared/schema";

// Validation schemas with enhanced phone number validation
const updateProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phoneNumber: z.string()
    .optional()
    .refine((phoneNumber) => {
      if (!phoneNumber || phoneNumber.trim() === '') return true; // Optional field
      // Basic international phone number validation
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      return phoneRegex.test(phoneNumber.replace(/[\s\-\(\)]/g, ''));
    }, {
      message: "Please enter a valid phone number (e.g., +91 84388 9620)"
    }),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters")
    .regex(/(?=.*[a-z])/, "Must contain at least one lowercase letter")
    .regex(/(?=.*[A-Z])/, "Must contain at least one uppercase letter")
    .regex(/(?=.*\d)/, "Must contain at least one number"),
  confirmPassword: z.string().min(1, "Please confirm your new password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const deleteAccountSchema = z.object({
  password: z.string().min(1, "Password is required"),
  confirmDeletion: z.literal("DELETE", {
    errorMap: () => ({ message: "Please type 'DELETE' to confirm" }),
  }),
});

type UpdateProfileData = z.infer<typeof updateProfileSchema>;
type ChangePasswordData = z.infer<typeof changePasswordSchema>;
type DeleteAccountData = z.infer<typeof deleteAccountSchema>;

type ProfilePreferences = UserPreferences & {
  emailNotifications?: { orderUpdates?: boolean; promotions?: boolean; stockAlerts?: boolean; newsletter?: boolean };
  privacySettings?: { profileVisibility?: string; showOrderHistory?: boolean; shareActivityData?: boolean };
};

interface PersonalInfoTabProps {
  user: UserType;
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;
  updateProfileMutation: any;
  form: any;
  handleCancel: () => void;
  onSubmit: (data: UpdateProfileData) => void;
}

function PersonalInfoTab({ 
  user, 
  isEditing, 
  setIsEditing, 
  updateProfileMutation, 
  form, 
  handleCancel, 
  onSubmit 
}: PersonalInfoTabProps) {
  const { toast } = useToast();
  const authenticatedFetch = useAuthenticatedFetch();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const validateImageFile = (file: File): string | null => {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return 'Please select a valid image file (JPEG, PNG, or WebP)';
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      return 'Image file size must be less than 5MB';
    }

    return null;
  };

  const handleImageFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    const validationError = validateImageFile(file);
    if (validationError) {
      toast({
        variant: "destructive",
        title: "Invalid file",
        description: validationError,
      });
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    await handleImageUpload(file);
  };

  const handleImageUpload = async (file: File) => {
    setIsUploadingImage(true);
    
    try {
      // Create FormData and append the file
      const formData = new FormData();
      formData.append('profileImage', file);

      const response = await authenticatedFetch('/api/user/profile-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to update profile image');
      }

      // Invalidate user data to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      
      toast({
        title: "Profile image updated",
        description: "Your profile image has been updated successfully.",
      });
      
      setImagePreview(null);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update profile image.",
      });
      setImagePreview(null);
    } finally {
      setIsUploadingImage(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = async () => {
    try {
      // Send an empty FormData to remove the image
      const formData = new FormData();
      formData.append('removeImage', 'true');

      const response = await authenticatedFetch('/api/user/profile-image/remove', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to remove profile image');
      }

      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      setImagePreview(null);
      
      toast({
        title: "Profile image removed",
        description: "Your profile image has been removed successfully.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to remove profile image.",
      });
    }
  };

  const initials = `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase();
  const joinDate = user.createdAt 
    ? new Date(user.createdAt).toLocaleDateString('en-IN', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    : 'Recently';

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Avatar className="w-20 h-20">
                <AvatarImage 
                  src={imagePreview || user.profileImageUrl || ''} 
                  alt={`${user.firstName} ${user.lastName}`} 
                />
                <AvatarFallback className="text-lg font-semibold">
                  {initials || <User className="w-8 h-8" />}
                </AvatarFallback>
                {isUploadingImage && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </Avatar>
              
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageFileSelect}
                className="hidden"
                data-testid="input-profile-image"
              />
              
              {/* Upload button - positioned at bottom-right */}
              <Button 
                size="icon" 
                variant="outline" 
                className="absolute bottom-0 right-0 h-8 w-8 rounded-full shadow-md bg-background"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingImage}
                data-testid="button-change-avatar"
              >
                {isUploadingImage ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
              </Button>
              
              {/* Remove image button - positioned at top-right */}
              {(user.profileImageUrl || imagePreview) && !isUploadingImage && (
                <Button 
                  size="icon" 
                  variant="destructive" 
                  className="absolute top-0 right-0 h-7 w-7 rounded-full shadow-md"
                  onClick={handleRemoveImage}
                  data-testid="button-remove-avatar"
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-semibold" data-testid="text-user-name">
                {user.firstName} {user.lastName}
              </h2>
              <p className="text-muted-foreground" data-testid="text-user-email">{user.email}</p>
              <div className="flex items-center text-sm text-muted-foreground mt-1">
                <Calendar className="w-4 h-4 mr-1" />
                Member since {joinDate}
              </div>
            </div>
            {!isEditing && (
              <Button
                variant="outline"
                onClick={() => setIsEditing(true)}
                data-testid="button-edit-profile"
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>
        </CardHeader>

        <Separator />

        <CardContent className="pt-6">
          {isEditing ? (
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    {...form.register("firstName")}
                    data-testid="input-first-name"
                  />
                  {form.formState.errors.firstName && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.firstName.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    {...form.register("lastName")}
                    data-testid="input-last-name"
                  />
                  {form.formState.errors.lastName && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.lastName.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  {...form.register("email")}
                  data-testid="input-email"
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="phoneNumber">Phone Number (Optional)</Label>
                <Input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  placeholder="+91 84388 9620"
                  {...form.register("phoneNumber")}
                  data-testid="input-phone"
                />
                {form.formState.errors.phoneNumber && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.phoneNumber.message}
                  </p>
                )}
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  data-testid="button-cancel-edit"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateProfileMutation.isPending}
                  data-testid="button-save-profile"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <User className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Full Name</p>
                      <p className="font-medium" data-testid="text-display-name">
                        {user.firstName} {user.lastName}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email Address</p>
                      <p className="font-medium" data-testid="text-display-email">{user.email}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Phone Number</p>
                      <p className="font-medium" data-testid="text-display-phone">
                        {user.phoneNumber || "Not provided"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Shield className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Account Status</p>
                      <Badge variant="secondary" data-testid="badge-account-status">
                        {user.emailVerified ? 'Verified' : 'Unverified'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AccountSettingsTab({ user, setIsEditing }: { user: UserType; setIsEditing: (editing: boolean) => void }) {
  const { toast } = useToast();
  const authenticatedFetch = useAuthenticatedFetch();
  const queryClient = useQueryClient();
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Fetch user preferences
  const { data: preferences } = useQuery<ProfilePreferences>({
    queryKey: ['/api/user/preferences'],
    queryFn: async () => {
      const response = await authenticatedFetch('/api/user/preferences');
      if (!response.ok) throw new Error('Failed to fetch preferences');
      return response.json();
    },
    enabled: !!user,
  });

  // Password change form
  const passwordForm = useForm<ChangePasswordData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Account deletion form
  const deleteForm = useForm<DeleteAccountData>({
    resolver: zodResolver(deleteAccountSchema),
    defaultValues: {
      password: "",
      confirmDeletion: "" as any,
    },
  });

  // Delete account mutation
  const deleteAccountMutation = useMutation({
    mutationFn: async (data: DeleteAccountData) => {
      const response = await authenticatedFetch('/api/user/account', {
        method: 'DELETE',
        body: JSON.stringify({ password: data.password }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete account');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Account deleted",
        description: "Your account has been permanently deleted.",
      });
      // Redirect to home page after successful deletion
      window.location.href = '/';
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: ChangePasswordData) => {
      const response = await authenticatedFetch('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to change password');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Password changed",
        description: "Your password has been updated successfully.",
      });
      passwordForm.reset();
      setIsChangingPassword(false);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  // Update preferences mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await authenticatedFetch('/api/user/preferences', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update preferences');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/preferences'] });
      toast({
        title: "Preferences updated",
        description: "Your preferences have been saved successfully.",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update preferences.",
      });
    },
  });

  const handlePreferenceChange = (section: string, key: string, value: any) => {
    if (!preferences) return;
    
    const updatedPreferences = {
      ...preferences,
      [section]: {
        ...(preferences[section as keyof UserPreferences] as Record<string, unknown> | null | undefined),
        [key]: value,
      },
    };
    
    updatePreferencesMutation.mutate({
      [section]: updatedPreferences[section as keyof UserPreferences],
    });
  };

  return (
    <div className="space-y-6">
      {/* Password Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Lock className="w-5 h-5 mr-2" />
            Password & Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isChangingPassword ? (
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Password</h4>
                <p className="text-sm text-muted-foreground">
                  Update your password to keep your account secure
                </p>
              </div>
              <Button 
                onClick={() => setIsChangingPassword(true)}
                data-testid="button-change-password"
              >
                Change Password
              </Button>
            </div>
          ) : (
            <form onSubmit={passwordForm.handleSubmit((data) => changePasswordMutation.mutate(data))} className="space-y-4">
              <div>
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="relative flex items-center">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? "text" : "password"}
                    {...passwordForm.register("currentPassword")}
                    data-testid="input-current-password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    data-testid="button-toggle-current-password"
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {passwordForm.formState.errors.currentPassword && (
                  <p className="text-sm text-destructive mt-1">
                    {passwordForm.formState.errors.currentPassword.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative flex items-center">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    {...passwordForm.register("newPassword")}
                    data-testid="input-new-password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    data-testid="button-toggle-new-password"
                  >
                    {showNewPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {passwordForm.formState.errors.newPassword && (
                  <p className="text-sm text-destructive mt-1">
                    {passwordForm.formState.errors.newPassword.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative flex items-center">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    {...passwordForm.register("confirmPassword")}
                    data-testid="input-confirm-password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    data-testid="button-toggle-confirm-password"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {passwordForm.formState.errors.confirmPassword && (
                  <p className="text-sm text-destructive mt-1">
                    {passwordForm.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsChangingPassword(false);
                    passwordForm.reset();
                  }}
                  data-testid="button-cancel-password-change"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={changePasswordMutation.isPending}
                  data-testid="button-save-password"
                >
                  {changePasswordMutation.isPending ? "Updating..." : "Update Password"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="w-5 h-5 mr-2" />
            Email Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {preferences && (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Order Updates</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified about order status changes
                  </p>
                </div>
                <Switch
                  checked={preferences.emailNotifications?.orderUpdates || false}
                  onCheckedChange={(checked) => 
                    handlePreferenceChange('emailNotifications', 'orderUpdates', checked)
                  }
                  data-testid="switch-order-updates"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Promotions</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive promotional emails and special offers
                  </p>
                </div>
                <Switch
                  checked={preferences.emailNotifications?.promotions || false}
                  onCheckedChange={(checked) => 
                    handlePreferenceChange('emailNotifications', 'promotions', checked)
                  }
                  data-testid="switch-promotions"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Stock Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when watchlist items are back in stock
                  </p>
                </div>
                <Switch
                  checked={preferences.emailNotifications?.stockAlerts || false}
                  onCheckedChange={(checked) => 
                    handlePreferenceChange('emailNotifications', 'stockAlerts', checked)
                  }
                  data-testid="switch-stock-alerts"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Newsletter</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive our monthly newsletter with tips and updates
                  </p>
                </div>
                <Switch
                  checked={preferences.emailNotifications?.newsletter || false}
                  onCheckedChange={(checked) => 
                    handlePreferenceChange('emailNotifications', 'newsletter', checked)
                  }
                  data-testid="switch-newsletter"
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* SMS Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Phone className="w-5 h-5 mr-2" />
            SMS Notifications
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Configure your SMS notification preferences. Requires a valid phone number.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {preferences && (
            <>
              {/* SMS opt-in/opt-out master control */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label className="text-base font-medium">Enable SMS Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Master control for all SMS notifications. You can opt out at any time.
                  </p>
                </div>
                <Switch
                  checked={preferences.smsNotifications?.enabled || false}
                  onCheckedChange={(checked) => 
                    handlePreferenceChange('smsNotifications', 'enabled', checked)
                  }
                  data-testid="switch-sms-enabled"
                />
              </div>

              <Separator />

              {/* Individual SMS preference controls - disabled if SMS is not enabled */}
              <div className={`space-y-4 ${!(preferences.smsNotifications?.enabled) ? 'opacity-50' : ''}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Order Confirmations</Label>
                    <p className="text-sm text-muted-foreground">
                      Get SMS confirmation when your order is placed
                    </p>
                  </div>
                  <Switch
                    checked={preferences.smsNotifications?.orderConfirmation || false}
                    onCheckedChange={(checked) => 
                      handlePreferenceChange('smsNotifications', 'orderConfirmation', checked)
                    }
                    disabled={!(preferences.smsNotifications?.enabled)}
                    data-testid="switch-sms-order-confirmation"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Order Updates</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified via SMS about order status changes
                    </p>
                  </div>
                  <Switch
                    checked={preferences.smsNotifications?.orderUpdates || false}
                    onCheckedChange={(checked) => 
                      handlePreferenceChange('smsNotifications', 'orderUpdates', checked)
                    }
                    disabled={!(preferences.smsNotifications?.enabled)}
                    data-testid="switch-sms-order-updates"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Payment Confirmations</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive SMS when payments are successfully processed
                    </p>
                  </div>
                  <Switch
                    checked={preferences.smsNotifications?.paymentConfirmation || false}
                    onCheckedChange={(checked) => 
                      handlePreferenceChange('smsNotifications', 'paymentConfirmation', checked)
                    }
                    disabled={!(preferences.smsNotifications?.enabled)}
                    data-testid="switch-sms-payment-confirmation"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Shipping Updates</Label>
                    <p className="text-sm text-muted-foreground">
                      Get SMS notifications when your order ships
                    </p>
                  </div>
                  <Switch
                    checked={preferences.smsNotifications?.shippingUpdates || false}
                    onCheckedChange={(checked) => 
                      handlePreferenceChange('smsNotifications', 'shippingUpdates', checked)
                    }
                    disabled={!(preferences.smsNotifications?.enabled)}
                    data-testid="switch-sms-shipping-updates"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Delivery Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive SMS when your order is delivered
                    </p>
                  </div>
                  <Switch
                    checked={preferences.smsNotifications?.deliveryNotifications || false}
                    onCheckedChange={(checked) => 
                      handlePreferenceChange('smsNotifications', 'deliveryNotifications', checked)
                    }
                    disabled={!(preferences.smsNotifications?.enabled)}
                    data-testid="switch-sms-delivery-notifications"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Promotional Messages</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive SMS about special offers and promotions
                    </p>
                  </div>
                  <Switch
                    checked={preferences.smsNotifications?.promotional || false}
                    onCheckedChange={(checked) => 
                      handlePreferenceChange('smsNotifications', 'promotional', checked)
                    }
                    disabled={!(preferences.smsNotifications?.enabled)}
                    data-testid="switch-sms-promotional"
                  />
                </div>
              </div>

              {/* Phone number status indicator */}
              {!user.phoneNumber && (
                <Alert>
                  <Phone className="h-4 w-4" />
                  <AlertDescription>
                    Add a phone number to your profile to receive SMS notifications.{' '}
                    <Button 
                      variant="link" 
                      className="p-0 h-auto font-medium"
                      onClick={() => setIsEditing(true)}
                      data-testid="link-add-phone"
                    >
                      Add phone number
                    </Button>
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* WhatsApp Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageCircle className="w-5 h-5 mr-2" />
            WhatsApp Notifications
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Configure your WhatsApp notification preferences. Requires a valid WhatsApp number.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {preferences && (
            <>
              {/* WhatsApp Phone Number Configuration */}
              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                <div className="flex-1">
                  <Label className="text-base font-medium">WhatsApp Phone Number</Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Enter your WhatsApp number to receive notifications. Must include country code.
                  </p>
                  <div className="flex space-x-2">
                    <Input
                      type="tel"
                      placeholder="+91 84388 9620"
                      value={user?.phoneNumber || ""}
                      className="max-w-xs"
                      data-testid="input-whatsapp-phone"
                      disabled
                    />
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      data-testid="button-edit-whatsapp-phone"
                    >
                      Update Phone
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Update your phone number in Personal Info to enable WhatsApp notifications
                  </p>
                </div>
              </div>

              {/* WhatsApp opt-in/opt-out master control */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label className="text-base font-medium">Enable WhatsApp Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Master control for all WhatsApp notifications. You can opt out at any time.
                  </p>
                </div>
                <Switch
                  checked={preferences.whatsappNotifications?.isOptedIn || false}
                  onCheckedChange={(checked) => 
                    handlePreferenceChange('whatsappNotifications', 'isOptedIn', checked)
                  }
                  disabled={!user?.phoneNumber}
                  data-testid="switch-whatsapp-enabled"
                />
              </div>

              <Separator />

              {/* Individual WhatsApp preference controls - disabled if WhatsApp is not enabled */}
              <div className={`space-y-4 ${!(preferences.whatsappNotifications?.isOptedIn) ? 'opacity-50' : ''}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Order Confirmations</Label>
                    <p className="text-sm text-muted-foreground">
                      Get WhatsApp confirmation when your order is placed
                    </p>
                  </div>
                  <Switch
                    checked={preferences.whatsappNotifications?.orderConfirmation || false}
                    onCheckedChange={(checked) => 
                      handlePreferenceChange('whatsappNotifications', 'orderConfirmation', checked)
                    }
                    disabled={!(preferences.whatsappNotifications?.isOptedIn)}
                    data-testid="switch-whatsapp-order-confirmation"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Order Updates</Label>
                    <p className="text-sm text-muted-foreground">
                      Status updates for processing, shipped, and delivered orders
                    </p>
                  </div>
                  <Switch
                    checked={preferences.whatsappNotifications?.orderUpdates || false}
                    onCheckedChange={(checked) => 
                      handlePreferenceChange('whatsappNotifications', 'orderUpdates', checked)
                    }
                    disabled={!(preferences.whatsappNotifications?.isOptedIn)}
                    data-testid="switch-whatsapp-order-updates"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Payment Confirmations</Label>
                    <p className="text-sm text-muted-foreground">
                      Confirmation messages for successful payments
                    </p>
                  </div>
                  <Switch
                    checked={preferences.whatsappNotifications?.paymentConfirmations || false}
                    onCheckedChange={(checked) => 
                      handlePreferenceChange('whatsappNotifications', 'paymentConfirmations', checked)
                    }
                    disabled={!(preferences.whatsappNotifications?.isOptedIn)}
                    data-testid="switch-whatsapp-payment-confirmation"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Shipping Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Updates when your order is shipped with tracking details
                    </p>
                  </div>
                  <Switch
                    checked={preferences.whatsappNotifications?.shippingNotifications || false}
                    onCheckedChange={(checked) => 
                      handlePreferenceChange('whatsappNotifications', 'shippingNotifications', checked)
                    }
                    disabled={!(preferences.whatsappNotifications?.isOptedIn)}
                    data-testid="switch-whatsapp-shipping-updates"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Delivery Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Confirmation when your order has been delivered
                    </p>
                  </div>
                  <Switch
                    checked={preferences.whatsappNotifications?.deliveryNotifications || false}
                    onCheckedChange={(checked) => 
                      handlePreferenceChange('whatsappNotifications', 'deliveryNotifications', checked)
                    }
                    disabled={!(preferences.whatsappNotifications?.isOptedIn)}
                    data-testid="switch-whatsapp-delivery-notifications"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Stock Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Notifications when wishlist items come back in stock
                    </p>
                  </div>
                  <Switch
                    checked={preferences.whatsappNotifications?.stockAlerts || false}
                    onCheckedChange={(checked) => 
                      handlePreferenceChange('whatsappNotifications', 'stockAlerts', checked)
                    }
                    disabled={!(preferences.whatsappNotifications?.isOptedIn)}
                    data-testid="switch-whatsapp-stock-alerts"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Account Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Important account updates and security alerts
                    </p>
                  </div>
                  <Switch
                    checked={preferences.whatsappNotifications?.accountNotifications || false}
                    onCheckedChange={(checked) => 
                      handlePreferenceChange('whatsappNotifications', 'accountNotifications', checked)
                    }
                    disabled={!(preferences.whatsappNotifications?.isOptedIn)}
                    data-testid="switch-whatsapp-account-notifications"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Promotional Messages</Label>
                    <p className="text-sm text-muted-foreground">
                      Special offers, discounts, and promotional campaigns
                    </p>
                  </div>
                  <Switch
                    checked={preferences.whatsappNotifications?.promotionalMessages || false}
                    onCheckedChange={(checked) => 
                      handlePreferenceChange('whatsappNotifications', 'promotionalMessages', checked)
                    }
                    disabled={!(preferences.whatsappNotifications?.isOptedIn)}
                    data-testid="switch-whatsapp-promotional"
                  />
                </div>
              </div>

              {/* WhatsApp specific features and compliance info */}
              <div className="p-4 bg-muted/30 rounded-lg">
                <h4 className="font-medium mb-2 flex items-center">
                  <MessageCircle className="w-4 h-4 mr-2 text-green-600" />
                  WhatsApp Features
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Rich media messages with images and documents</li>
                  <li>• Interactive order tracking and status updates</li>
                  <li>• Quick reply options for common actions</li>
                  <li>• Delivery receipts and read confirmations</li>
                </ul>
                <p className="text-xs text-muted-foreground mt-3">
                  We comply with WhatsApp Business policies. You can opt out anytime by replying "STOP".
                </p>
              </div>

              {/* Warning if no phone number */}
              {!user?.phoneNumber && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Add a phone number to your profile to enable WhatsApp notifications.
                    <Button 
                      variant="link" 
                      className="p-0 h-auto ml-1"
                      onClick={() => setIsEditing(true)}
                      data-testid="button-add-phone-whatsapp"
                    >
                      Add phone number
                    </Button>
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Privacy Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Eye className="w-5 h-5 mr-2" />
            Privacy Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {preferences && (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Profile Visibility</Label>
                  <p className="text-sm text-muted-foreground">
                    Control who can see your profile information
                  </p>
                </div>
                <Badge variant="outline" data-testid="badge-profile-visibility">
                  {preferences.privacySettings?.profileVisibility || 'Private'}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Show Order History</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow others to see your public order history
                  </p>
                </div>
                <Switch
                  checked={preferences.privacySettings?.showOrderHistory || false}
                  onCheckedChange={(checked) => 
                    handlePreferenceChange('privacySettings', 'showOrderHistory', checked)
                  }
                  data-testid="switch-order-history"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Share Activity Data</Label>
                  <p className="text-sm text-muted-foreground">
                    Help improve our service by sharing anonymized usage data
                  </p>
                </div>
                <Switch
                  checked={preferences.privacySettings?.shareActivityData || false}
                  onCheckedChange={(checked) => 
                    handlePreferenceChange('privacySettings', 'shareActivityData', checked)
                  }
                  data-testid="switch-activity-data"
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center text-destructive">
            <AlertTriangle className="w-5 h-5 mr-2" />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Account deletion is permanent and cannot be undone. All your data will be lost.
            </AlertDescription>
          </Alert>
          
          <Dialog open={isDeletingAccount} onOpenChange={setIsDeletingAccount}>
            <DialogTrigger asChild>
              <Button 
                variant="destructive" 
                data-testid="button-delete-account"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Account
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="flex items-center text-destructive">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  Delete Account
                </DialogTitle>
                <DialogDescription>
                  This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={deleteForm.handleSubmit((data) => deleteAccountMutation.mutate(data))} className="space-y-4">
                <div>
                  <Label htmlFor="deletePassword">Confirm your password</Label>
                  <Input
                    id="deletePassword"
                    type="password"
                    placeholder="Enter your password"
                    {...deleteForm.register("password")}
                    data-testid="input-delete-password"
                  />
                  {deleteForm.formState.errors.password && (
                    <p className="text-sm text-destructive mt-1">
                      {deleteForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="confirmDeletion">Type "DELETE" to confirm</Label>
                  <Input
                    id="confirmDeletion"
                    placeholder="Type DELETE to confirm"
                    {...deleteForm.register("confirmDeletion")}
                    data-testid="input-confirm-deletion"
                  />
                  {deleteForm.formState.errors.confirmDeletion && (
                    <p className="text-sm text-destructive mt-1">
                      {deleteForm.formState.errors.confirmDeletion.message}
                    </p>
                  )}
                </div>

                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Warning:</strong> This will permanently delete your account, order history, addresses, and all associated data.
                  </AlertDescription>
                </Alert>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDeletingAccount(false);
                      deleteForm.reset();
                    }}
                    data-testid="button-cancel-deletion"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="destructive"
                    disabled={deleteAccountMutation.isPending}
                    data-testid="button-confirm-deletion"
                  >
                    {deleteAccountMutation.isPending ? "Deleting..." : "Delete Account"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}

function AddressesTab({ user }: { user: UserType }) {
  const authenticatedFetch = useAuthenticatedFetch();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<UserAddress | null>(null);
  const [deleteAddressId, setDeleteAddressId] = useState<string | null>(null);

  // Address form schema
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

  // Fetch user addresses
  const { data: addresses = [] } = useQuery<UserAddress[]>({
    queryKey: ['/api/user/addresses'],
    queryFn: async () => {
      const response = await authenticatedFetch('/api/user/addresses');
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!user,
    retry: false,
  });

  const addressForm = useForm<AddressFormData>({
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
      addressForm.reset();
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
      addressForm.reset();
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

  const onSubmit = (data: AddressFormData) => {
    if (editingAddress) {
      updateAddressMutation.mutate({ id: editingAddress.id, data });
    } else {
      createAddressMutation.mutate(data);
    }
  };

  const handleEdit = (address: UserAddress) => {
    setEditingAddress(address);
    addressForm.reset({
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
    addressForm.reset();
  };

  return (
    <>
      <div className="space-y-6">
        {addresses.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <h3 className="text-lg font-medium mb-2">No addresses saved</h3>
              <p className="text-muted-foreground mb-4">
                Add your first shipping address to get started
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)} data-testid="button-add-address-profile">
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Address
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Shipping Addresses</h3>
              <Button onClick={() => setIsAddDialogOpen(true)} data-testid="button-add-address-profile">
                <Plus className="w-4 h-4 mr-2" />
                Add Address
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
                {addresses.map((address) => (
                  <Card key={address.id} className="hover-elevate" data-testid={`card-address-profile-${address.id}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          <Home className="w-4 h-4 text-muted-foreground" />
                          <CardTitle className="text-lg">{address.title}</CardTitle>
                          {address.isDefault && (
                            <Badge variant="secondary" data-testid={`badge-default-profile-${address.id}`}>
                              <Star className="w-3 h-3 mr-1" />
                              Default
                            </Badge>
                          )}
                        </div>
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(address)}
                            data-testid={`button-edit-profile-${address.id}`}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteAddressId(address.id)}
                            data-testid={`button-delete-profile-${address.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-sm">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span>{address.recipientName}</span>
                        </div>
                        <div className="text-sm">
                          <div>{address.street}</div>
                          <div>{address.city}, {address.state} {address.postalCode}</div>
                          <div>{address.country}</div>
                        </div>
                        {address.phoneNumber && (
                          <div className="flex items-center space-x-2 text-sm">
                            <Phone className="w-4 h-4 text-muted-foreground" />
                            <span>{address.phoneNumber}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
      </div>

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
          
          <form onSubmit={addressForm.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Address Title</Label>
                <Input 
                  id="title" 
                  placeholder="e.g., Home, Office" 
                  {...addressForm.register("title")}
                  data-testid="input-address-title-profile"
                />
                {addressForm.formState.errors.title && (
                  <p className="text-sm text-destructive mt-1">{addressForm.formState.errors.title.message}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="recipientName">Recipient Name</Label>
                <Input 
                  id="recipientName" 
                  placeholder="Full name" 
                  {...addressForm.register("recipientName")}
                  data-testid="input-recipient-name-profile"
                />
                {addressForm.formState.errors.recipientName && (
                  <p className="text-sm text-destructive mt-1">{addressForm.formState.errors.recipientName.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="street">Street Address</Label>
              <Input 
                id="street" 
                placeholder="House number, street name, area" 
                {...addressForm.register("street")}
                data-testid="input-street-profile"
              />
              {addressForm.formState.errors.street && (
                <p className="text-sm text-destructive mt-1">{addressForm.formState.errors.street.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input 
                  id="city" 
                  placeholder="City" 
                  {...addressForm.register("city")}
                  data-testid="input-city-profile"
                />
                {addressForm.formState.errors.city && (
                  <p className="text-sm text-destructive mt-1">{addressForm.formState.errors.city.message}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="state">State</Label>
                <Input 
                  id="state" 
                  placeholder="State" 
                  {...addressForm.register("state")}
                  data-testid="input-state-profile"
                />
                {addressForm.formState.errors.state && (
                  <p className="text-sm text-destructive mt-1">{addressForm.formState.errors.state.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="postalCode">Postal Code</Label>
                <Input 
                  id="postalCode" 
                  placeholder="PIN Code" 
                  {...addressForm.register("postalCode")}
                  data-testid="input-postal-code-profile"
                />
                {addressForm.formState.errors.postalCode && (
                  <p className="text-sm text-destructive mt-1">{addressForm.formState.errors.postalCode.message}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="country">Country</Label>
                <Input 
                  id="country" 
                  {...addressForm.register("country")}
                  data-testid="input-country-profile"
                />
                {addressForm.formState.errors.country && (
                  <p className="text-sm text-destructive mt-1">{addressForm.formState.errors.country.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="phoneNumber">Phone Number (Optional)</Label>
              <Input 
                id="phoneNumber" 
                placeholder="Contact number" 
                {...addressForm.register("phoneNumber")}
                data-testid="input-phone-profile"
              />
              {addressForm.formState.errors.phoneNumber && (
                <p className="text-sm text-destructive mt-1">{addressForm.formState.errors.phoneNumber.message}</p>
              )}
            </div>

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
                data-testid="button-save-address-profile"
              >
                {createAddressMutation.isPending || updateAddressMutation.isPending 
                  ? "Saving..." 
                  : (editingAddress ? "Update Address" : "Add Address")
                }
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteAddressId} onOpenChange={() => setDeleteAddressId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Address</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this address? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteAddressId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteAddressId && deleteAddressMutation.mutate(deleteAddressId)}
              disabled={deleteAddressMutation.isPending}
              data-testid="button-confirm-delete-profile"
            >
              {deleteAddressMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function OrderHistoryTab({ user }: { user: UserType }) {
  const authenticatedFetch = useAuthenticatedFetch();

  // Fetch recent orders
  const { data: recentOrders = [] } = useQuery<Order[]>({
    queryKey: ['/api/user/recent-orders'],
    queryFn: async () => {
      const response = await authenticatedFetch('/api/user/recent-orders?limit=5');
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!user,
  });

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'shipped':
        return <Truck className="w-4 h-4 text-blue-600" />;
      case 'processing':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      default:
        return <Package className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return 'text-green-600';
      case 'shipped':
        return 'text-blue-600';
      case 'processing':
        return 'text-yellow-600';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Recent Orders</h3>
        <Link to="/orders">
          <Button variant="outline" data-testid="button-view-all-orders">
            <FileText className="w-4 h-4 mr-2" />
            View All Orders
          </Button>
        </Link>
      </div>

      {recentOrders.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <h3 className="text-lg font-medium mb-2">No orders yet</h3>
            <p className="text-muted-foreground mb-4">
              Start shopping to see your order history here
            </p>
            <Link to="/products">
              <Button data-testid="button-start-shopping">
                Start Shopping
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {recentOrders.map((order) => (
            <Card key={order.id} className="hover-elevate">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(order.status)}
                      <div>
                        <p className="font-medium" data-testid={`order-id-${order.id}`}>
                          Order #{order.id.slice(-8).toUpperCase()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(order.createdAt ?? Date.now()).toLocaleDateString('en-IN')}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-medium" data-testid={`order-total-${order.id}`}>
                      ₹{Number(order.total).toLocaleString('en-IN')}
                    </p>
                    <p className={`text-sm capitalize ${getStatusColor(order.status)}`} data-testid={`order-status-${order.id}`}>
                      {order.status}
                    </p>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Link to={`/orders/${order.id}`}>
                      <Button variant="outline" size="sm" data-testid={`button-view-order-${order.id}`}>
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          <div className="text-center pt-4">
            <Link to="/orders">
              <Button variant="outline" data-testid="button-view-more-orders">
                View All Order History
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Profile() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const { user, isLoading } = useAuth();
  const authenticatedFetch = useAuthenticatedFetch();

  const updateProfileMutation = useMutation({
    mutationFn: async (data: UpdateProfileData) => {
      const response = await authenticatedFetch('/api/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update profile');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      toast({
        title: "Profile updated",
        description: "Your profile information has been saved successfully.",
      });
      setIsEditing(false);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update profile. Please try again.",
      });
    },
  });

  const form = useForm<UpdateProfileData>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      phoneNumber: user?.phoneNumber || "",
    },
  });

  // Update form when user data loads
  useEffect(() => {
    if (user) {
      form.reset({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phoneNumber: user.phoneNumber || "",
      });
    }
  }, [user, form]);

  const onSubmit = (data: UpdateProfileData) => {
    // Check if email is being changed
    const isEmailChanged = data.email !== user?.email;
    
    if (isEmailChanged) {
      toast({
        title: "Email verification required",
        description: "You will receive a verification email to confirm your new email address.",
      });
    }
    
    updateProfileMutation.mutate(data);
  };

  const handleCancel = () => {
    form.reset();
    setIsEditing(false);
  };

  if (!user && !isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="text-center py-12">
            <User className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Sign In Required</h2>
            <p className="text-muted-foreground mb-4">
              You need to sign in to view your profile.
            </p>
            <Button onClick={() => window.location.href = '/login'} data-testid="button-login">
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="h-8 bg-muted animate-pulse rounded" />
          <Card>
            <CardHeader>
              <div className="h-6 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
              <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
              <div className="h-4 bg-muted animate-pulse rounded w-2/3" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground" data-testid="text-page-title">
            My Profile
          </h1>
          {user.role === 'admin' && (
            <Link to="/admin">
              <Button variant="outline" data-testid="button-admin-dashboard">
                <Settings className="w-4 h-4 mr-2" />
                Admin Dashboard
              </Button>
            </Link>
          )}
        </div>

        {/* Tabbed Interface */}
        <Tabs defaultValue="personal" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="personal" data-testid="tab-personal-info">
              <User className="w-4 h-4 mr-2" />
              Personal Info
            </TabsTrigger>
            <TabsTrigger value="settings" data-testid="tab-account-settings">
              <Settings className="w-4 h-4 mr-2" />
              Account Settings
            </TabsTrigger>
            <TabsTrigger value="addresses" data-testid="tab-addresses">
              <MapPin className="w-4 h-4 mr-2" />
              Addresses
            </TabsTrigger>
            <TabsTrigger value="orders" data-testid="tab-order-history">
              <Package className="w-4 h-4 mr-2" />
              Order History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="personal" data-testid="tab-content-personal">
            <PersonalInfoTab
              user={user}
              isEditing={isEditing}
              setIsEditing={setIsEditing}
              updateProfileMutation={updateProfileMutation}
              form={form}
              handleCancel={handleCancel}
              onSubmit={onSubmit}
            />
          </TabsContent>

          <TabsContent value="settings" data-testid="tab-content-settings">
            <AccountSettingsTab user={user} setIsEditing={setIsEditing} />
          </TabsContent>

          <TabsContent value="addresses" data-testid="tab-content-addresses">
            <AddressesTab user={user} />
          </TabsContent>

          <TabsContent value="orders" data-testid="tab-content-orders">
            <OrderHistoryTab user={user} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}