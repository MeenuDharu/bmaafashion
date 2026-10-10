import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useRef, useState } from "react";
import AdminRoute from "@/components/AdminRoute";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { FONT_FAMILIES } from "@/hooks/useSiteSettings";
import type { SiteSettings } from "@shared/schema";
import {
  Loader2, Save, Image, Palette, Type, Upload, X, Plus, Trash2,
  Globe, Phone, Mail, MapPin, Clock, Facebook, Instagram, Twitter, Youtube,
  Linkedin, Megaphone, FileText, Layers, Tag, Star, Shield, ShoppingBag,
  Package, Wrench, Timer, Cookie, BarChart2, Bell, SlidersHorizontal,
  MessageSquare, Truck, BadgeCheck, Eye, EyeOff, AlertTriangle
} from "lucide-react";

const ALLOWED_FONTS = ["Poppins", "Open Sans", "Lato", "Roboto", "Playfair Display"] as const;

const settingsSchema = z.object({
  // Branding
  storeName: z.string().max(100).optional(),
  storeTagline: z.string().max(200).optional(),
  logoUrl: z.string().refine(
    (val) => !val || val === '' || val.startsWith('/') || val.startsWith('http://') || val.startsWith('https://'),
    { message: 'Must be a valid URL or path' }
  ).or(z.literal("")).nullable().optional(),
  fontFamily: z.enum(ALLOWED_FONTS),
  fontColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color"),
  backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color"),
  // Homepage
  heroImage1Url: z.string().refine(
    (val) => !val || val === '' || val.startsWith('/') || val.startsWith('http://') || val.startsWith('https://'),
    { message: 'Must be a valid URL or path' }
  ).or(z.literal("")).nullable().optional(),
  heroImage2Url: z.string().refine(
    (val) => !val || val === '' || val.startsWith('/') || val.startsWith('http://') || val.startsWith('https://'),
    { message: 'Must be a valid URL or path' }
  ).or(z.literal("")).nullable().optional(),
  heroImage3Url: z.string().refine(
    (val) => !val || val === '' || val.startsWith('/') || val.startsWith('http://') || val.startsWith('https://'),
    { message: 'Must be a valid URL or path' }
  ).or(z.literal("")).nullable().optional(),
  heroImage1Duration: z.number().int().min(1).max(60).nullable().optional(),
  heroImage2Duration: z.number().int().min(1).max(60).nullable().optional(),
  heroImage3Duration: z.number().int().min(1).max(60).nullable().optional(),
  heroSlideDuration: z.number().int().min(1).max(60).optional(),
  announcementBar: z.object({
    text: z.string().optional(),
    active: z.boolean().optional(),
    bgColor: z.string().optional(),
    textColor: z.string().optional(),
  }).optional(),
  featuredCategories: z.array(z.string()).optional(),
  customBanners: z.array(z.object({
    id: z.string(),
    imageUrl: z.string().optional(),
    title: z.string().optional(),
    subtitle: z.string().optional(),
    buttonText: z.string().optional(),
    buttonLink: z.string().optional(),
  })).optional(),
  // Policies
  policies: z.object({
    shipping: z.object({
      freeThreshold: z.coerce.number().min(0).optional(),
      shippingCost: z.coerce.number().min(0).optional(),
      deliveryDays: z.string().optional(),
      text: z.string().optional(),
    }).optional(),
    returns: z.object({
      windowDays: z.coerce.number().optional(),
      text: z.string().optional(),
    }).optional(),
    gst: z.object({
      rate: z.coerce.number().optional(),
      text: z.string().optional(),
    }).optional(),
  }).optional(),
  // Contact & Social
  contactInfo: z.object({
    phone: z.string().optional(),
    email: z.string().optional(),
    address: z.string().optional(),
    whatsapp: z.string().optional(),
    businessHours: z.string().optional(),
  }).optional(),
  socialLinks: z.object({
    facebook: z.string().optional(),
    instagram: z.string().optional(),
    twitter: z.string().optional(),
    youtube: z.string().optional(),
    linkedin: z.string().optional(),
  }).optional(),
  // SEO
  seoSettings: z.object({
    home: z.object({ title: z.string().optional(), description: z.string().optional() }).optional(),
    products: z.object({ title: z.string().optional(), description: z.string().optional() }).optional(),
    freshProduce: z.object({ title: z.string().optional(), description: z.string().optional() }).optional(),
    about: z.object({ title: z.string().optional(), description: z.string().optional() }).optional(),
    contact: z.object({ title: z.string().optional(), description: z.string().optional() }).optional(),
    services: z.object({ title: z.string().optional(), description: z.string().optional() }).optional(),
  }).optional(),
  // Promotions
  promotions: z.array(z.object({
    id: z.string(),
    message: z.string().min(1, "Message is required"),
    code: z.string().optional(),
    discountType: z.enum(["percentage", "fixed"]).optional(),
    discountValue: z.coerce.number().min(0).optional(),
    expiry: z.string().optional(),
    active: z.boolean(),
    bgColor: z.string().optional(),
    textColor: z.string().optional(),
  })).optional(),
  // Footer
  footerSettings: z.object({
    copyright: z.string().optional(),
    links: z.array(z.object({
      label: z.string().min(1, "Label required"),
      url: z.string().min(1, "URL required"),
    })).optional(),
    newsletterEnabled: z.boolean().optional(),
    showSocialLinks: z.boolean().optional(),
  }).optional(),
  // Store / Operations
  maintenanceMode: z.object({
    enabled: z.boolean().optional(),
    title: z.string().optional(),
    message: z.string().optional(),
  }).optional(),
  whatsappWidget: z.object({
    enabled: z.boolean().optional(),
    phone: z.string().optional(),
  }).optional(),
  // Homepage sections
  homepageSections: z.object({
    showStats: z.boolean().optional(),
    showWhyChoose: z.boolean().optional(),
    showTestimonials: z.boolean().optional(),
    showFeaturedProducts: z.boolean().optional(),
    showBenefits: z.boolean().optional(),
  }).optional(),
  // Marketing
  popupSettings: z.object({
    enabled: z.boolean().optional(),
    title: z.string().optional(),
    message: z.string().optional(),
    buttonText: z.string().optional(),
    delay: z.coerce.number().optional(),
    couponCode: z.string().optional(),
  }).optional(),
  countdownTimer: z.object({
    enabled: z.boolean().optional(),
    endsAt: z.string().optional(),
    message: z.string().optional(),
    bgColor: z.string().optional(),
    textColor: z.string().optional(),
  }).optional(),
  trustBadges: z.array(z.object({
    id: z.string(),
    label: z.string().min(1, "Label required"),
    icon: z.string().min(1, "Icon required"),
    active: z.boolean(),
  })).optional(),
  // Products
  productSettings: z.object({
    perPage: z.coerce.number().int().min(4).max(100).optional(),
    defaultSort: z.string().optional(),
    newBadgeDays: z.coerce.number().int().min(0).max(365).optional(),
    lowStockThreshold: z.coerce.number().int().min(0).max(1000).optional(),
  }).optional(),
  orderSettings: z.object({
    codEnabled: z.boolean().optional(),
    autoCancelHours: z.coerce.number().int().min(1).max(168).optional(),
    deliveryMessage: z.string().optional(),
  }).optional(),
  // Tracking
  trackingSettings: z.object({
    googleAnalyticsId: z.string().optional(),
    facebookPixelId: z.string().optional(),
  }).optional(),
  // Legal
  cookieConsent: z.object({
    enabled: z.boolean().optional(),
    message: z.string().optional(),
    acceptText: z.string().optional(),
    declineText: z.string().optional(),
  }).optional(),
  // Page Banners
  pageBanners: z.object({
    about: z.object({ imageUrl: z.string().optional(), title: z.string().optional(), subtitle: z.string().optional() }).optional(),
    contact: z.object({ imageUrl: z.string().optional(), title: z.string().optional(), subtitle: z.string().optional() }).optional(),
    services: z.object({ imageUrl: z.string().optional(), title: z.string().optional(), subtitle: z.string().optional() }).optional(),
    products: z.object({ imageUrl: z.string().optional(), title: z.string().optional(), subtitle: z.string().optional() }).optional(),
    freshProduce: z.object({ imageUrl: z.string().optional(), title: z.string().optional(), subtitle: z.string().optional() }).optional(),
  }).optional(),
});

type SettingsForm = z.infer<typeof settingsSchema>;

function SlideDurationPreview({ effectiveDuration, isDefault }: { effectiveDuration: number; isDefault: boolean }) {
  return (
    <div className="space-y-1.5 pt-1">
      <div className="flex items-center gap-1.5">
        <Timer className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <span className="text-xs text-muted-foreground">
          {isDefault
            ? `Slide will display for ${effectiveDuration}s (global default)`
            : `Slide will display for ${effectiveDuration}s`}
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          key={effectiveDuration}
          className="h-full bg-primary rounded-full origin-left"
          style={{
            animation: `slide-progress ${effectiveDuration}s linear infinite`,
          }}
        />
      </div>
    </div>
  );
}

function ImagePreview({ url, label }: { url?: string | null; label: string }) {
  const [broken, setBroken] = useState(false);

  useEffect(() => {
    setBroken(false);
  }, [url]);

  if (!url) {
    return (
      <div className="h-20 w-full rounded-md border border-dashed border-muted-foreground/30 flex items-center justify-center bg-muted/20">
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
    );
  }

  if (broken) {
    return (
      <div className="h-20 w-full rounded-md border border-destructive/40 flex items-center justify-center gap-2 bg-destructive/5">
        <Image className="h-4 w-4 text-destructive/60" />
        <span className="text-xs text-destructive font-medium">Image could not be loaded — URL may be broken or unreachable</span>
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={label}
      className="h-20 w-full rounded-md object-cover border border-border"
      onError={() => setBroken(true)}
    />
  );
}

interface ImageFieldProps {
  label: string;
  value?: string | null;
  onChange: (url: string) => void;
  placeholder?: string;
  error?: string;
}

function ImageField({ label, value, onChange, placeholder, error }: ImageFieldProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [urlBroken, setUrlBroken] = useState(false);

  useEffect(() => {
    setUrlBroken(false);
    if (!value) return;
    const img = new window.Image();
    img.onload = () => setUrlBroken(false);
    img.onerror = () => setUrlBroken(true);
    img.src = value;
  }, [value]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const token = localStorage.getItem("auth_token");
      const response = await fetch("/api/site-settings/upload-image", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || "Upload failed");
      }
      const { url } = await response.json();
      onChange(url);
      toast({ title: "Image uploaded", description: "Image is ready to use." });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message || "Could not upload image.", variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <Label>{label}</Label>
        {urlBroken && (
          <Badge variant="destructive" className="flex items-center gap-1 text-xs">
            <AlertTriangle className="h-3 w-3" />
            Broken URL
          </Badge>
        )}
      </div>
      <div className="flex gap-2">
        <Input
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? "https://example.com/image.jpg"}
          className="flex-1"
        />
        <Button type="button" variant="outline" size="default" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          <span className="ml-1 hidden sm:inline">{uploading ? "Uploading..." : "Upload"}</span>
        </Button>
        {value && (
          <Button type="button" variant="ghost" size="icon" onClick={() => onChange("")} aria-label={`Clear ${label}`}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <input ref={fileInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" className="hidden" onChange={handleFileChange} />
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value || "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-12 rounded-md border border-input cursor-pointer p-1"
        />
        <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder="#000000" className="flex-1" />
      </div>
    </div>
  );
}

const defaultValues: SettingsForm = {
  storeName: "Bmaafashion",
  storeTagline: "",
  logoUrl: "",
  fontFamily: "Poppins",
  fontColor: "#1a1a1a",
  backgroundColor: "#ffffff",
  heroImage1Url: "",
  heroImage2Url: "",
  heroImage3Url: "",
  heroImage1Duration: null,
  heroImage2Duration: null,
  heroImage3Duration: null,
  heroSlideDuration: 5,
  announcementBar: { text: "", active: false, bgColor: "#16a34a", textColor: "#ffffff" },
  featuredCategories: [],
  customBanners: [],
  policies: {
    shipping: { freeThreshold: 5000, shippingCost: 100, deliveryDays: "5-7 business days", text: "" },
    returns: { windowDays: 7, text: "" },
    gst: { rate: 18, text: "" },
  },
  contactInfo: { phone: "", email: "", address: "", whatsapp: "", businessHours: "" },
  socialLinks: { facebook: "", instagram: "", twitter: "", youtube: "", linkedin: "" },
  seoSettings: {
    home: { title: "", description: "" },
    products: { title: "", description: "" },
    freshProduce: { title: "", description: "" },
    about: { title: "", description: "" },
    contact: { title: "", description: "" },
    services: { title: "", description: "" },
  },
  promotions: [],
  footerSettings: { copyright: "", links: [], newsletterEnabled: true, showSocialLinks: true },
  maintenanceMode: { enabled: false, title: "We'll be back soon!", message: "We're making some improvements. Check back shortly." },
  whatsappWidget: { enabled: true, phone: "918438869979" },
  homepageSections: { showStats: true, showWhyChoose: true, showTestimonials: true, showFeaturedProducts: true, showBenefits: true },
  popupSettings: { enabled: false, title: "", message: "", buttonText: "Shop Now", delay: 5, couponCode: "" },
  countdownTimer: { enabled: false, endsAt: "", message: "Sale ends in:", bgColor: "#dc2626", textColor: "#ffffff" },
  trustBadges: [
    { id: "1", label: "100% Organic", icon: "Leaf", active: true },
    { id: "2", label: "Free Shipping", icon: "Truck", active: true },
    { id: "3", label: "Secure Payment", icon: "Shield", active: true },
    { id: "4", label: "Easy Returns", icon: "RotateCcw", active: true },
  ],
  productSettings: { perPage: 12, defaultSort: "name", newBadgeDays: 30, lowStockThreshold: 5 },
  orderSettings: { codEnabled: false, autoCancelHours: 24, deliveryMessage: "Estimated delivery: 5-7 business days" },
  trackingSettings: { googleAnalyticsId: "", facebookPixelId: "" },
  cookieConsent: { enabled: true, message: "We use cookies to improve your experience on our site.", acceptText: "Accept", declineText: "Decline" },
  pageBanners: {
    about: { imageUrl: "", title: "", subtitle: "" },
    contact: { imageUrl: "", title: "", subtitle: "" },
    services: { imageUrl: "", title: "", subtitle: "" },
    products: { imageUrl: "", title: "", subtitle: "" },
    freshProduce: { imageUrl: "", title: "", subtitle: "" },
  },
};

function AdminSettingsContent() {
  const { toast } = useToast();

  const { data: categories = [] } = useQuery<any[]>({ queryKey: ["/api/categories"] });
  const { data: settings, isLoading } = useQuery<SiteSettings>({ queryKey: ["/api/site-settings"] });

  const form = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    defaultValues,
  });

  const { fields: bannerFields, append: appendBanner, remove: removeBanner } = useFieldArray({
    control: form.control,
    name: "customBanners",
  });

  const { fields: promoFields, append: appendPromo, remove: removePromo } = useFieldArray({
    control: form.control,
    name: "promotions",
  });

  const { fields: footerLinkFields, append: appendFooterLink, remove: removeFooterLink } = useFieldArray({
    control: form.control,
    name: "footerSettings.links",
  });

  const { fields: trustBadgeFields, append: appendTrustBadge, remove: removeTrustBadge } = useFieldArray({
    control: form.control,
    name: "trustBadges",
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        storeName: settings.storeName ?? "Bmaafashion",
        storeTagline: settings.storeTagline ?? "",
        logoUrl: settings.logoUrl ?? "",
        fontFamily: (settings.fontFamily as typeof ALLOWED_FONTS[number]) ?? "Poppins",
        fontColor: settings.fontColor ?? "#1a1a1a",
        backgroundColor: settings.backgroundColor ?? "#ffffff",
        heroImage1Url: settings.heroImage1Url ?? "",
        heroImage2Url: settings.heroImage2Url ?? "",
        heroImage3Url: settings.heroImage3Url ?? "",
        heroImage1Duration: settings.heroImage1Duration ?? null,
        heroImage2Duration: settings.heroImage2Duration ?? null,
        heroImage3Duration: settings.heroImage3Duration ?? null,
        heroSlideDuration: settings.heroSlideDuration ?? 5,
        announcementBar: settings.announcementBar ?? { text: "", active: false, bgColor: "#16a34a", textColor: "#ffffff" },
        featuredCategories: (settings.featuredCategories as string[]) ?? [],
        customBanners: (settings.customBanners as any[]) ?? [],
        policies: (settings.policies as any) ?? defaultValues.policies,
        contactInfo: (settings.contactInfo as any) ?? defaultValues.contactInfo,
        socialLinks: (settings.socialLinks as any) ?? defaultValues.socialLinks,
        seoSettings: (settings.seoSettings as any) ?? defaultValues.seoSettings,
        promotions: (settings.promotions as any[]) ?? [],
        footerSettings: (settings.footerSettings as any) ?? defaultValues.footerSettings,
        maintenanceMode: (settings.maintenanceMode as any) ?? defaultValues.maintenanceMode,
        whatsappWidget: (settings.whatsappWidget as any) ?? defaultValues.whatsappWidget,
        homepageSections: (settings.homepageSections as any) ?? defaultValues.homepageSections,
        popupSettings: (settings.popupSettings as any) ?? defaultValues.popupSettings,
        countdownTimer: (settings.countdownTimer as any) ?? defaultValues.countdownTimer,
        trustBadges: (settings.trustBadges as any[]) ?? defaultValues.trustBadges,
        productSettings: (settings.productSettings as any) ?? defaultValues.productSettings,
        orderSettings: (settings.orderSettings as any) ?? defaultValues.orderSettings,
        trackingSettings: (settings.trackingSettings as any) ?? defaultValues.trackingSettings,
        cookieConsent: (settings.cookieConsent as any) ?? defaultValues.cookieConsent,
        pageBanners: (settings.pageBanners as any) ?? defaultValues.pageBanners,
      });
    }
  }, [settings, form]);

  const mutation = useMutation({
    mutationFn: async (data: SettingsForm) => {
      const cleaned = {
        ...data,
        logoUrl: data.logoUrl || null,
        heroImage1Url: data.heroImage1Url || null,
        heroImage2Url: data.heroImage2Url || null,
        heroImage3Url: data.heroImage3Url || null,
      };
      return apiRequest("PUT", "/api/site-settings", cleaned);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-settings"] });
      toast({ title: "Settings saved", description: "All changes are now live on your storefront." });
    },
    onError: () => {
      toast({ title: "Save failed", description: "Could not save settings. Please try again.", variant: "destructive" });
    },
  });

  const onSubmit = (data: SettingsForm) => mutation.mutate(data);
  const watchedValues = form.watch();

  const SaveButton = () => (
    <Button onClick={form.handleSubmit(onSubmit)} disabled={mutation.isPending || !form.formState.isDirty}>
      {mutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
      {mutation.isPending ? "Saving..." : "Save Changes"}
    </Button>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-2xl font-bold">Site Settings</h1>
            <p className="text-muted-foreground text-sm mt-1">
              All changes made here update the storefront instantly.
            </p>
          </div>
          <SaveButton />
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <Tabs defaultValue="branding" className="space-y-6">
              <TabsList className="flex-wrap h-auto gap-1">
                <TabsTrigger value="store" className="flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5" />Store
                </TabsTrigger>
                <TabsTrigger value="branding" className="flex items-center gap-1.5">
                  <Palette className="h-3.5 w-3.5" />Branding
                </TabsTrigger>
                <TabsTrigger value="homepage" className="flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5" />Homepage
                </TabsTrigger>
                <TabsTrigger value="policies" className="flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" />Policies
                </TabsTrigger>
                <TabsTrigger value="products" className="flex items-center gap-1.5">
                  <Package className="h-3.5 w-3.5" />Products
                </TabsTrigger>
                <TabsTrigger value="contact" className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" />Contact &amp; Social
                </TabsTrigger>
                <TabsTrigger value="seo" className="flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5" />SEO
                </TabsTrigger>
                <TabsTrigger value="promotions" className="flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5" />Promotions
                </TabsTrigger>
                <TabsTrigger value="footer" className="flex items-center gap-1.5">
                  <Star className="h-3.5 w-3.5" />Footer
                </TabsTrigger>
                <TabsTrigger value="advanced" className="flex items-center gap-1.5">
                  <Wrench className="h-3.5 w-3.5" />Advanced
                </TabsTrigger>
              </TabsList>

              {/* ── STORE ── */}
              <TabsContent value="store" className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2"><Shield className="h-4 w-4" />Maintenance Mode</CardTitle>
                    <CardDescription>When enabled, visitors see a "Coming Soon" page. Admins can still access the site normally.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField control={form.control} name="maintenanceMode.enabled" render={({ field }) => (
                      <FormItem className="flex items-center gap-3 rounded-md border border-border p-3">
                        <FormControl><Switch checked={!!field.value} onCheckedChange={field.onChange} /></FormControl>
                        <div>
                          <FormLabel className="!mt-0 font-medium">Enable maintenance mode</FormLabel>
                          <p className="text-xs text-muted-foreground">Visitors will see your maintenance page</p>
                        </div>
                      </FormItem>
                    )} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField control={form.control} name="maintenanceMode.title" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Page Title</FormLabel>
                          <FormControl><Input {...field} value={field.value ?? ""} placeholder="We'll be back soon!" /></FormControl>
                        </FormItem>
                      )} />
                    </div>
                    <FormField control={form.control} name="maintenanceMode.message" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Message to Visitors</FormLabel>
                        <FormControl><Textarea {...field} value={field.value ?? ""} rows={3} placeholder="We're making some improvements. Check back shortly." /></FormControl>
                      </FormItem>
                    )} />
                    {watchedValues.maintenanceMode?.enabled && (
                      <div className="rounded-md bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
                        Maintenance mode is ON. Customers will see the maintenance page until you disable this.
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2"><MessageSquare className="h-4 w-4" />WhatsApp Widget</CardTitle>
                    <CardDescription>Floating WhatsApp button shown on all storefront pages for customer support.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField control={form.control} name="whatsappWidget.enabled" render={({ field }) => (
                      <FormItem className="flex items-center gap-3 rounded-md border border-border p-3">
                        <FormControl><Switch checked={!!field.value} onCheckedChange={field.onChange} /></FormControl>
                        <FormLabel className="!mt-0">Show WhatsApp button on storefront</FormLabel>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="whatsappWidget.phone" render={({ field }) => (
                      <FormItem>
                        <FormLabel>WhatsApp Phone Number</FormLabel>
                        <FormControl><Input {...field} value={field.value ?? ""} placeholder="918438869979 (country code + number, no +)" /></FormControl>
                        <p className="text-xs text-muted-foreground">Include country code without the + symbol. Example: 918438869979</p>
                      </FormItem>
                    )} />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ── BRANDING ── */}
              <TabsContent value="branding" className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2"><Image className="h-4 w-4" />Store Identity</CardTitle>
                    <CardDescription>Your store name, tagline, and logo shown across the site.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField control={form.control} name="storeName" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Store Name</FormLabel>
                          <FormControl><Input {...field} placeholder="Bmaafashion" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="storeTagline" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tagline</FormLabel>
                          <FormControl><Input {...field} value={field.value ?? ""} placeholder="Grow Fresh. Live Green." /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    <FormField control={form.control} name="logoUrl" render={({ field, fieldState }) => (
                      <FormItem>
                        <ImageField label="Logo" value={field.value} onChange={field.onChange} placeholder="https://example.com/logo.png" error={fieldState.error?.message} />
                      </FormItem>
                    )} />
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Logo Preview</Label>
                      <ImagePreview url={watchedValues.logoUrl} label="Logo preview" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2"><Palette className="h-4 w-4" />Typography &amp; Colors</CardTitle>
                    <CardDescription>Font and color scheme applied across the entire storefront.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField control={form.control} name="fontFamily" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Font Family</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select a font" /></SelectTrigger></FormControl>
                          <SelectContent>
                            {FONT_FAMILIES.map((font) => (
                              <SelectItem key={font} value={font}>{font}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={form.control} name="fontColor" render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <ColorField label="Primary Font Color" value={field.value} onChange={field.onChange} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="backgroundColor" render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <ColorField label="Background Color" value={field.value} onChange={field.onChange} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    <div
                      className="rounded-md p-4 border border-border text-sm"
                      style={{
                        backgroundColor: watchedValues.backgroundColor ?? "#ffffff",
                        color: watchedValues.fontColor ?? "#1a1a1a",
                        fontFamily: `'${watchedValues.fontFamily}', sans-serif`,
                      }}
                    >
                      Preview: The quick brown fox jumps over the lazy dog. — {watchedValues.storeName || "Bmaafashion"}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ── HOMEPAGE ── */}
              <TabsContent value="homepage" className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2"><Megaphone className="h-4 w-4" />Announcement Bar</CardTitle>
                    <CardDescription>Show a banner at the top of every page for promotions or important info.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      <FormField control={form.control} name="announcementBar.active" render={({ field }) => (
                        <FormItem className="flex items-center gap-2">
                          <FormControl><Switch checked={!!field.value} onCheckedChange={field.onChange} /></FormControl>
                          <FormLabel className="!mt-0">Enable announcement bar</FormLabel>
                        </FormItem>
                      )} />
                    </div>
                    <FormField control={form.control} name="announcementBar.text" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Announcement Text</FormLabel>
                        <FormControl><Input {...field} value={field.value ?? ""} placeholder="Free shipping on orders above ₹5,000!" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={form.control} name="announcementBar.bgColor" render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <ColorField label="Background Color" value={field.value || "#16a34a"} onChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="announcementBar.textColor" render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <ColorField label="Text Color" value={field.value || "#ffffff"} onChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )} />
                    </div>
                    {watchedValues.announcementBar?.active && watchedValues.announcementBar?.text && (
                      <div
                        className="text-center text-sm py-2 px-4 rounded-md"
                        style={{
                          backgroundColor: watchedValues.announcementBar.bgColor || "#16a34a",
                          color: watchedValues.announcementBar.textColor || "#ffffff",
                        }}
                      >
                        {watchedValues.announcementBar.text}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2"><Image className="h-4 w-4" />Hero / Banner Images</CardTitle>
                    <CardDescription>Upload or link up to 3 images for the home page carousel.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="heroSlideDuration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Slide duration (seconds)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              max={60}
                              value={field.value ?? 5}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              className="w-32"
                            />
                          </FormControl>
                          <p className="text-xs text-muted-foreground">
                            How long each image stays on screen before advancing. Between 1 and 60 seconds.
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {([1, 2, 3] as const).map((n) => {
                      const fieldName = `heroImage${n}Url` as "heroImage1Url" | "heroImage2Url" | "heroImage3Url";
                      const durationFieldName = `heroImage${n}Duration` as "heroImage1Duration" | "heroImage2Duration" | "heroImage3Duration";
                      const globalDuration = watchedValues.heroSlideDuration ?? 5;
                      const perImageDuration = watchedValues[durationFieldName];
                      const effectiveDuration = (perImageDuration != null && perImageDuration >= 1) ? perImageDuration : globalDuration;
                      const isDefault = perImageDuration == null || perImageDuration < 1;
                      return (
                        <div key={n} className="space-y-3">
                          <FormField control={form.control} name={fieldName} render={({ field, fieldState }) => (
                            <FormItem>
                              <ImageField label={`Hero Image ${n}`} value={field.value} onChange={field.onChange} placeholder={`https://example.com/hero-${n}.jpg`} error={fieldState.error?.message} />
                            </FormItem>
                          )} />
                          <FormField
                            control={form.control}
                            name={durationFieldName}
                            render={({ field }) => (
                              <FormItem>
                                <div className="flex items-center gap-3">
                                  <FormLabel className="text-sm text-muted-foreground whitespace-nowrap">Duration (seconds)</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      min={1}
                                      max={60}
                                      placeholder={`Default (${globalDuration}s)`}
                                      value={field.value ?? ""}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        if (val === "") { field.onChange(null); return; }
                                        const parsed = parseInt(val, 10);
                                        field.onChange(Number.isNaN(parsed) ? null : parsed);
                                      }}
                                      className="w-36"
                                    />
                                  </FormControl>
                                </div>
                                <p className="text-xs text-muted-foreground">Leave empty to use the global slide duration.</p>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <SlideDurationPreview effectiveDuration={effectiveDuration} isDefault={isDefault} />
                          <ImagePreview url={watchedValues[fieldName]} label={`Hero image ${n} preview`} />
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Featured Categories</CardTitle>
                    <CardDescription>Pick categories to highlight on the homepage. Leave empty to show all.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {categories.map((cat: any) => {
                        const isSelected = (watchedValues.featuredCategories ?? []).includes(cat.mainCategory);
                        return (
                          <button
                            key={cat.mainCategory}
                            type="button"
                            onClick={() => {
                              const current = watchedValues.featuredCategories ?? [];
                              if (isSelected) {
                                form.setValue("featuredCategories", current.filter((c) => c !== cat.mainCategory), { shouldDirty: true });
                              } else {
                                form.setValue("featuredCategories", [...current, cat.mainCategory], { shouldDirty: true });
                              }
                            }}
                            className={`px-3 py-1.5 rounded-md text-sm border transition-colors ${isSelected ? "bg-primary text-primary-foreground border-primary" : "bg-muted/30 border-border hover:bg-muted"}`}
                          >
                            {cat.mainCategory}
                          </button>
                        );
                      })}
                    </div>
                    {categories.length === 0 && <p className="text-sm text-muted-foreground">No categories found.</p>}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3 flex flex-row items-center justify-between gap-2">
                    <div>
                      <CardTitle className="text-base">Custom Banners</CardTitle>
                      <CardDescription>Add promotional banners with images, titles, and call-to-action buttons.</CardDescription>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="default"
                      onClick={() => appendBanner({ id: Date.now().toString(), imageUrl: "", title: "", subtitle: "", buttonText: "", buttonLink: "" })}
                    >
                      <Plus className="h-4 w-4 mr-1" />Add Banner
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {bannerFields.length === 0 && <p className="text-sm text-muted-foreground">No banners yet. Click "Add Banner" to create one.</p>}
                    {bannerFields.map((bannerField, index) => (
                      <div key={bannerField.id} className="border border-border rounded-md p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Banner {index + 1}</span>
                          <Button type="button" variant="ghost" size="icon" onClick={() => removeBanner(index)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                        <FormField control={form.control} name={`customBanners.${index}.imageUrl`} render={({ field }) => (
                          <FormItem>
                            <ImageField label="Banner Image" value={field.value} onChange={field.onChange} />
                          </FormItem>
                        )} />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <FormField control={form.control} name={`customBanners.${index}.title`} render={({ field }) => (
                            <FormItem>
                              <FormLabel>Title</FormLabel>
                              <FormControl><Input {...field} value={field.value ?? ""} placeholder="Summer Sale" /></FormControl>
                            </FormItem>
                          )} />
                          <FormField control={form.control} name={`customBanners.${index}.subtitle`} render={({ field }) => (
                            <FormItem>
                              <FormLabel>Subtitle</FormLabel>
                              <FormControl><Input {...field} value={field.value ?? ""} placeholder="Up to 30% off" /></FormControl>
                            </FormItem>
                          )} />
                          <FormField control={form.control} name={`customBanners.${index}.buttonText`} render={({ field }) => (
                            <FormItem>
                              <FormLabel>Button Text</FormLabel>
                              <FormControl><Input {...field} value={field.value ?? ""} placeholder="Shop Now" /></FormControl>
                            </FormItem>
                          )} />
                          <FormField control={form.control} name={`customBanners.${index}.buttonLink`} render={({ field }) => (
                            <FormItem>
                              <FormLabel>Button Link</FormLabel>
                              <FormControl><Input {...field} value={field.value ?? ""} placeholder="/products" /></FormControl>
                            </FormItem>
                          )} />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2"><Eye className="h-4 w-4" />Section Visibility</CardTitle>
                    <CardDescription>Toggle which sections appear on the homepage.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {(
                      [
                        { name: "homepageSections.showStats" as const, label: "Stats Bar", desc: "Shows customer/project metrics (10+ acres, 100+ customers, etc.)" },
                        { name: "homepageSections.showWhyChoose" as const, label: "Why Hydroponics", desc: "Feature cards explaining benefits of hydroponic farming" },
                        { name: "homepageSections.showBenefits" as const, label: "Benefits Section", desc: "Sustainable farming advantages panel" },
                        { name: "homepageSections.showTestimonials" as const, label: "Testimonials", desc: "Customer reviews and star ratings" },
                        { name: "homepageSections.showFeaturedProducts" as const, label: "Featured Products", desc: "Highlighted product cards on homepage" },
                      ] as const
                    ).map(({ name, label, desc }) => (
                      <FormField key={name} control={form.control} name={name} render={({ field }) => (
                        <FormItem className="flex items-center gap-3 rounded-md border border-border p-3">
                          <FormControl><Switch checked={field.value !== false} onCheckedChange={field.onChange} /></FormControl>
                          <div>
                            <FormLabel className="!mt-0 font-medium">{label}</FormLabel>
                            <p className="text-xs text-muted-foreground">{desc}</p>
                          </div>
                        </FormItem>
                      )} />
                    ))}
                  </CardContent>
                </Card>

                {/* Page Banners */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2"><Layers className="h-4 w-4" />Page Banners</CardTitle>
                    <CardDescription>Set a custom background image, title, and subtitle for each page's hero banner. Leave blank to use the default.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {([
                      { key: "about", label: "About Us", defaultTitle: "About Us", defaultSubtitle: "Redefining the future of agriculture through cutting edge hydroponic farming technology" },
                      { key: "contact", label: "Contact", defaultTitle: "Contact Us", defaultSubtitle: "Get in touch with our hydroponic experts" },
                      { key: "services", label: "Services", defaultTitle: "Our Services", defaultSubtitle: "Empowering Sustainable Farming Through Technology, Design & Expertise" },
                      { key: "products", label: "Shop / Products", defaultTitle: "Hydroponic Systems & Supplies", defaultSubtitle: "Browse our complete collection of premium hydroponic growing systems" },
                      { key: "freshProduce", label: "Fresh Produce", defaultTitle: "Fresh Hydroponic Vegetables", defaultSubtitle: "Grown hydroponically. Harvested fresh. Delivered to your door." },
                    ] as const).map(({ key, label, defaultTitle, defaultSubtitle }) => (
                      <div key={key} className="border border-border rounded-md p-4 space-y-3">
                        <p className="text-sm font-medium">{label}</p>
                        <FormField control={form.control} name={`pageBanners.${key}.imageUrl`} render={({ field }) => (
                          <FormItem>
                            <ImageField label="Banner Image URL" value={field.value} onChange={field.onChange} />
                          </FormItem>
                        )} />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <FormField control={form.control} name={`pageBanners.${key}.title`} render={({ field }) => (
                            <FormItem>
                              <FormLabel>Title</FormLabel>
                              <FormControl><Input {...field} value={field.value ?? ""} placeholder={defaultTitle} /></FormControl>
                            </FormItem>
                          )} />
                          <FormField control={form.control} name={`pageBanners.${key}.subtitle`} render={({ field }) => (
                            <FormItem>
                              <FormLabel>Subtitle</FormLabel>
                              <FormControl><Input {...field} value={field.value ?? ""} placeholder={defaultSubtitle} /></FormControl>
                            </FormItem>
                          )} />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ── PRODUCTS TAB ── */}
              <TabsContent value="products" className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2"><SlidersHorizontal className="h-4 w-4" />Display Settings</CardTitle>
                    <CardDescription>Control how products appear in your shop.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField control={form.control} name="productSettings.perPage" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Products Per Page</FormLabel>
                          <Select onValueChange={(v) => field.onChange(Number(v))} value={String(field.value ?? 12)}>
                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent>
                              {[8, 12, 16, 24, 36, 48].map(n => (
                                <SelectItem key={n} value={String(n)}>{n} products</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="productSettings.defaultSort" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Default Sort Order</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value ?? "name"}>
                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent>
                              <SelectItem value="name">Name (A-Z)</SelectItem>
                              <SelectItem value="price-low">Price: Low to High</SelectItem>
                              <SelectItem value="price-high">Price: High to Low</SelectItem>
                              <SelectItem value="newest">Newest First</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="productSettings.newBadgeDays" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Show "New" Badge (days)</FormLabel>
                          <FormControl><Input type="number" {...field} value={field.value ?? 30} onChange={(e) => field.onChange(Number(e.target.value))} placeholder="30" /></FormControl>
                          <p className="text-xs text-muted-foreground">Products added within this many days show a "New" badge</p>
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="productSettings.lowStockThreshold" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Low Stock Warning (units)</FormLabel>
                          <FormControl><Input type="number" {...field} value={field.value ?? 5} onChange={(e) => field.onChange(Number(e.target.value))} placeholder="5" /></FormControl>
                          <p className="text-xs text-muted-foreground">Show "Only X left" when stock falls below this</p>
                        </FormItem>
                      )} />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2"><Truck className="h-4 w-4" />Order &amp; Checkout Settings</CardTitle>
                    <CardDescription>Configure order options shown during checkout.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField control={form.control} name="orderSettings.codEnabled" render={({ field }) => (
                      <FormItem className="flex items-center gap-3 rounded-md border border-border p-3">
                        <FormControl><Switch checked={!!field.value} onCheckedChange={field.onChange} /></FormControl>
                        <div>
                          <FormLabel className="!mt-0">Enable Cash on Delivery (COD)</FormLabel>
                          <p className="text-xs text-muted-foreground">Allow customers to pay when the order is delivered</p>
                        </div>
                      </FormItem>
                    )} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField control={form.control} name="orderSettings.autoCancelHours" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Auto-cancel Unpaid Orders (hours)</FormLabel>
                          <FormControl><Input type="number" {...field} value={field.value ?? 24} onChange={(e) => field.onChange(Number(e.target.value))} placeholder="24" /></FormControl>
                          <p className="text-xs text-muted-foreground">Cancel pending payment orders after this many hours</p>
                        </FormItem>
                      )} />
                    </div>
                    <FormField control={form.control} name="orderSettings.deliveryMessage" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Delivery Message (shown at checkout)</FormLabel>
                        <FormControl><Input {...field} value={field.value ?? ""} placeholder="Estimated delivery: 5-7 business days" /></FormControl>
                      </FormItem>
                    )} />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ── POLICIES ── */}
              <TabsContent value="policies" className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Shipping Policy</CardTitle>
                    <CardDescription>Structured shipping rules + any extra text shown on the Shipping Policy page.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField control={form.control} name="policies.shipping.freeThreshold" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Free Shipping Above (₹)</FormLabel>
                          <FormControl><Input type="number" {...field} value={field.value ?? ""} placeholder="5000" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="policies.shipping.shippingCost" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Standard Shipping Cost (₹)</FormLabel>
                          <FormControl><Input type="number" min="0" step="0.01" {...field} value={field.value ?? 0} /></FormControl>
                          <p className="text-xs text-muted-foreground">Applied when the order is below the free-shipping threshold.</p>
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="policies.shipping.deliveryDays" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estimated Delivery Time</FormLabel>
                          <FormControl><Input {...field} value={field.value ?? ""} placeholder="5-7 business days" /></FormControl>
                        </FormItem>
                      )} />
                    </div>
                    <FormField control={form.control} name="policies.shipping.text" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Shipping Policy Text</FormLabel>
                        <FormControl>
                          <Textarea {...field} value={field.value ?? ""} rows={6} placeholder="Enter any additional shipping policy details..." />
                        </FormControl>
                      </FormItem>
                    )} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Return &amp; Refund Policy</CardTitle>
                    <CardDescription>Return window rules and policy text shown on the Returns page.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField control={form.control} name="policies.returns.windowDays" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Return Window (Days)</FormLabel>
                        <FormControl><Input type="number" {...field} value={field.value ?? ""} placeholder="7" className="w-32" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="policies.returns.text" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Return Policy Text</FormLabel>
                        <FormControl>
                          <Textarea {...field} value={field.value ?? ""} rows={6} placeholder="Enter additional return/refund policy details..." />
                        </FormControl>
                      </FormItem>
                    )} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">GST &amp; Tax</CardTitle>
                    <CardDescription>GST rate and tax policy details shown to customers.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField control={form.control} name="policies.gst.rate" render={({ field }) => (
                      <FormItem>
                        <FormLabel>GST Rate (%)</FormLabel>
                        <FormControl><Input type="number" {...field} value={field.value ?? ""} placeholder="18" className="w-32" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="policies.gst.text" render={({ field }) => (
                      <FormItem>
                        <FormLabel>GST Policy Notes</FormLabel>
                        <FormControl>
                          <Textarea {...field} value={field.value ?? ""} rows={4} placeholder="All prices are inclusive of GST..." />
                        </FormControl>
                      </FormItem>
                    )} />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ── CONTACT & SOCIAL ── */}
              <TabsContent value="contact" className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2"><Phone className="h-4 w-4" />Contact Information</CardTitle>
                    <CardDescription>Shown on the Contact page and in the footer.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField control={form.control} name="contactInfo.phone" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />Phone</FormLabel>
                          <FormControl><Input {...field} value={field.value ?? ""} placeholder="+91 84388 9620" /></FormControl>
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="contactInfo.whatsapp" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />WhatsApp</FormLabel>
                          <FormControl><Input {...field} value={field.value ?? ""} placeholder="+91 84388 9620" /></FormControl>
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="contactInfo.email" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />Email</FormLabel>
                          <FormControl><Input {...field} value={field.value ?? ""} placeholder="info@bmaafashion.com" /></FormControl>
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="contactInfo.businessHours" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />Business Hours</FormLabel>
                          <FormControl><Input {...field} value={field.value ?? ""} placeholder="Mon - Sat: 9:00 AM - 6:00 PM" /></FormControl>
                        </FormItem>
                      )} />
                    </div>
                    <FormField control={form.control} name="contactInfo.address" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />Address</FormLabel>
                        <FormControl><Textarea {...field} value={field.value ?? ""} rows={3} placeholder="5/375, S. Kolathur, Chennai, Tamil Nadu 600129" /></FormControl>
                      </FormItem>
                    )} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Social Media Links</CardTitle>
                    <CardDescription>Links shown in the footer and contact page.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        { name: "socialLinks.facebook" as const, label: "Facebook", icon: Facebook, placeholder: "https://facebook.com/bmaafashion" },
                        { name: "socialLinks.instagram" as const, label: "Instagram", icon: Instagram, placeholder: "https://instagram.com/bmaafashion" },
                        { name: "socialLinks.twitter" as const, label: "Twitter / X", icon: Twitter, placeholder: "https://twitter.com/bmaafashion" },
                        { name: "socialLinks.youtube" as const, label: "YouTube", icon: Youtube, placeholder: "https://youtube.com/@bmaafashion" },
                        { name: "socialLinks.linkedin" as const, label: "LinkedIn", icon: Linkedin, placeholder: "https://linkedin.com/company/bmaafashion" },
                      ].map(({ name, label, icon: Icon, placeholder }) => (
                        <FormField key={name} control={form.control} name={name} render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-1.5"><Icon className="h-3.5 w-3.5" />{label}</FormLabel>
                            <FormControl><Input {...field} value={field.value ?? ""} placeholder={placeholder} /></FormControl>
                          </FormItem>
                        )} />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ── SEO ── */}
              <TabsContent value="seo" className="space-y-4">
                {[
                  { key: "home" as const, label: "Home Page", path: "/" },
                  { key: "products" as const, label: "Products / Shop", path: "/products" },
                  { key: "freshProduce" as const, label: "Fresh Produce", path: "/fresh-produce" },
                  { key: "about" as const, label: "About Us", path: "/about" },
                  { key: "contact" as const, label: "Contact", path: "/contact" },
                  { key: "services" as const, label: "Services", path: "/services" },
                ].map(({ key, label, path }) => (
                  <Card key={key}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center justify-between gap-2">
                        {label}
                        <Badge variant="secondary" className="text-xs font-normal">{path}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <FormField control={form.control} name={`seoSettings.${key}.title`} render={({ field }) => (
                        <FormItem>
                          <FormLabel>Meta Title</FormLabel>
                          <FormControl><Input {...field} value={field.value ?? ""} placeholder={`${label} | Bmaafashion`} /></FormControl>
                          <p className="text-xs text-muted-foreground">{(field.value ?? "").length} / 60 characters recommended</p>
                        </FormItem>
                      )} />
                      <FormField control={form.control} name={`seoSettings.${key}.description`} render={({ field }) => (
                        <FormItem>
                          <FormLabel>Meta Description</FormLabel>
                          <FormControl>
                            <Textarea {...field} value={field.value ?? ""} rows={3} placeholder="Describe this page for search engines..." />
                          </FormControl>
                          <p className="text-xs text-muted-foreground">{(field.value ?? "").length} / 160 characters recommended</p>
                        </FormItem>
                      )} />
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              {/* ── PROMOTIONS ── */}
              <TabsContent value="promotions" className="space-y-4">
                <Card>
                  <CardHeader className="pb-3 flex flex-row items-center justify-between gap-2">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2"><Tag className="h-4 w-4" />Promotional Banners</CardTitle>
                      <CardDescription>Create discount messages with optional promo codes. Active ones show on the storefront.</CardDescription>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="default"
                      onClick={() => appendPromo({ id: Date.now().toString(), message: "", code: "", discountType: "percentage", discountValue: 0, expiry: "", active: true, bgColor: "#fef3c7", textColor: "#92400e" })}
                    >
                      <Plus className="h-4 w-4 mr-1" />Add Promotion
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {promoFields.length === 0 && <p className="text-sm text-muted-foreground">No promotions yet. Click "Add Promotion" to create one.</p>}
                    {promoFields.map((promoField, index) => (
                      <div key={promoField.id} className="border border-border rounded-md p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FormField control={form.control} name={`promotions.${index}.active`} render={({ field }) => (
                              <FormItem className="flex items-center gap-2">
                                <FormControl><Switch checked={!!field.value} onCheckedChange={field.onChange} /></FormControl>
                                <FormLabel className="!mt-0 text-sm">{field.value ? "Active" : "Inactive"}</FormLabel>
                              </FormItem>
                            )} />
                          </div>
                          <Button type="button" variant="ghost" size="icon" onClick={() => removePromo(index)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                        <FormField control={form.control} name={`promotions.${index}.message`} render={({ field }) => (
                          <FormItem>
                            <FormLabel>Promotion Message</FormLabel>
                            <FormControl><Input {...field} placeholder="Get 15% off on all hydroponic kits!" /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <FormField control={form.control} name={`promotions.${index}.code`} render={({ field }) => (
                            <FormItem>
                              <FormLabel>Promo Code (optional)</FormLabel>
                              <FormControl><Input {...field} value={field.value ?? ""} placeholder="GREEN15" /></FormControl>
                            </FormItem>
                          )} />
                          <div className="grid grid-cols-2 gap-3">
                            <FormField control={form.control} name={`promotions.${index}.discountType`} render={({ field }) => (
                              <FormItem>
                                <FormLabel>Discount Type</FormLabel>
                                <Select value={field.value || "percentage"} onValueChange={field.onChange}>
                                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                  <SelectContent><SelectItem value="percentage">Percentage (%)</SelectItem><SelectItem value="fixed">Fixed (₹)</SelectItem></SelectContent>
                                </Select>
                              </FormItem>
                            )} />
                            <FormField control={form.control} name={`promotions.${index}.discountValue`} render={({ field }) => (
                              <FormItem>
                                <FormLabel>Discount Value</FormLabel>
                                <FormControl><Input type="number" min="0" step="0.01" {...field} value={field.value ?? 0} /></FormControl>
                              </FormItem>
                            )} />
                          </div>
                          <FormField control={form.control} name={`promotions.${index}.expiry`} render={({ field }) => (
                            <FormItem>
                              <FormLabel>Expiry Date (optional)</FormLabel>
                              <FormControl><Input type="date" {...field} value={field.value ?? ""} /></FormControl>
                            </FormItem>
                          )} />
                          <FormField control={form.control} name={`promotions.${index}.bgColor`} render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <ColorField label="Background Color" value={field.value || "#fef3c7"} onChange={field.onChange} />
                              </FormControl>
                            </FormItem>
                          )} />
                          <FormField control={form.control} name={`promotions.${index}.textColor`} render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <ColorField label="Text Color" value={field.value || "#92400e"} onChange={field.onChange} />
                              </FormControl>
                            </FormItem>
                          )} />
                        </div>
                        {watchedValues.promotions?.[index]?.message && (
                          <div
                            className="rounded-md px-4 py-2 text-sm text-center"
                            style={{
                              backgroundColor: watchedValues.promotions[index].bgColor || "#fef3c7",
                              color: watchedValues.promotions[index].textColor || "#92400e",
                            }}
                          >
                            {watchedValues.promotions[index].message}
                            {watchedValues.promotions[index].code && (
                              <span className="ml-2 font-semibold">Use code: {watchedValues.promotions[index].code}</span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ── FOOTER ── */}
              <TabsContent value="footer" className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Footer Settings</CardTitle>
                    <CardDescription>Copyright text, navigation links, and options shown in the footer.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField control={form.control} name="footerSettings.copyright" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Copyright Text</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value ?? ""} placeholder={`© ${new Date().getFullYear()} Bmaafashion. All rights reserved.`} />
                        </FormControl>
                      </FormItem>
                    )} />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={form.control} name="footerSettings.newsletterEnabled" render={({ field }) => (
                        <FormItem className="flex items-center gap-3 rounded-md border border-border p-3">
                          <FormControl><Switch checked={!!field.value} onCheckedChange={field.onChange} /></FormControl>
                          <FormLabel className="!mt-0">Show newsletter signup</FormLabel>
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="footerSettings.showSocialLinks" render={({ field }) => (
                        <FormItem className="flex items-center gap-3 rounded-md border border-border p-3">
                          <FormControl><Switch checked={!!field.value} onCheckedChange={field.onChange} /></FormControl>
                          <FormLabel className="!mt-0">Show social media links</FormLabel>
                        </FormItem>
                      )} />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3 flex flex-row items-center justify-between gap-2">
                    <div>
                      <CardTitle className="text-base">Footer Links</CardTitle>
                      <CardDescription>Custom links shown in the footer navigation.</CardDescription>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="default"
                      onClick={() => appendFooterLink({ label: "", url: "" })}
                    >
                      <Plus className="h-4 w-4 mr-1" />Add Link
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {footerLinkFields.length === 0 && <p className="text-sm text-muted-foreground">No custom links yet. Default links (Privacy, Terms, Shipping, Returns) are always shown.</p>}
                    {footerLinkFields.map((linkField, index) => (
                      <div key={linkField.id} className="flex items-center gap-2">
                        <FormField control={form.control} name={`footerSettings.links.${index}.label`} render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl><Input {...field} placeholder="Label (e.g. Blog)" /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name={`footerSettings.links.${index}.url`} render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl><Input {...field} placeholder="/blog or https://..." /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeFooterLink(index)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ── ADVANCED ── */}
              <TabsContent value="advanced" className="space-y-4">

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2"><Bell className="h-4 w-4" />Popup / Welcome Modal</CardTitle>
                    <CardDescription>Show a promotional popup to new visitors after a delay.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField control={form.control} name="popupSettings.enabled" render={({ field }) => (
                      <FormItem className="flex items-center gap-3 rounded-md border border-border p-3">
                        <FormControl><Switch checked={!!field.value} onCheckedChange={field.onChange} /></FormControl>
                        <FormLabel className="!mt-0">Enable popup on storefront</FormLabel>
                      </FormItem>
                    )} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField control={form.control} name="popupSettings.title" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Popup Title</FormLabel>
                          <FormControl><Input {...field} value={field.value ?? ""} placeholder="Special Offer!" /></FormControl>
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="popupSettings.buttonText" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Button Text</FormLabel>
                          <FormControl><Input {...field} value={field.value ?? ""} placeholder="Shop Now" /></FormControl>
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="popupSettings.delay" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Delay (seconds)</FormLabel>
                          <FormControl><Input type="number" {...field} value={field.value ?? 5} onChange={(e) => field.onChange(Number(e.target.value))} placeholder="5" /></FormControl>
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="popupSettings.couponCode" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Coupon Code (optional)</FormLabel>
                          <FormControl><Input {...field} value={field.value ?? ""} placeholder="WELCOME10" /></FormControl>
                        </FormItem>
                      )} />
                    </div>
                    <FormField control={form.control} name="popupSettings.message" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Message</FormLabel>
                        <FormControl><Textarea {...field} value={field.value ?? ""} rows={2} placeholder="Get 10% off your first order. Use code WELCOME10 at checkout." /></FormControl>
                      </FormItem>
                    )} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2"><Timer className="h-4 w-4" />Countdown Timer</CardTitle>
                    <CardDescription>Show a countdown banner for limited-time sales or offers.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField control={form.control} name="countdownTimer.enabled" render={({ field }) => (
                      <FormItem className="flex items-center gap-3 rounded-md border border-border p-3">
                        <FormControl><Switch checked={!!field.value} onCheckedChange={field.onChange} /></FormControl>
                        <FormLabel className="!mt-0">Enable countdown timer</FormLabel>
                      </FormItem>
                    )} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField control={form.control} name="countdownTimer.endsAt" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sale End Date &amp; Time</FormLabel>
                          <FormControl><Input type="datetime-local" {...field} value={field.value ?? ""} /></FormControl>
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="countdownTimer.message" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Banner Message</FormLabel>
                          <FormControl><Input {...field} value={field.value ?? ""} placeholder="Sale ends in:" /></FormControl>
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="countdownTimer.bgColor" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Background Color</FormLabel>
                          <div className="flex items-center gap-2">
                            <FormControl><Input type="color" {...field} value={field.value ?? "#dc2626"} className="h-9 w-14 cursor-pointer p-1" /></FormControl>
                            <Input {...field} value={field.value ?? "#dc2626"} placeholder="#dc2626" className="flex-1" />
                          </div>
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="countdownTimer.textColor" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Text Color</FormLabel>
                          <div className="flex items-center gap-2">
                            <FormControl><Input type="color" {...field} value={field.value ?? "#ffffff"} className="h-9 w-14 cursor-pointer p-1" /></FormControl>
                            <Input {...field} value={field.value ?? "#ffffff"} placeholder="#ffffff" className="flex-1" />
                          </div>
                        </FormItem>
                      )} />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3 flex flex-row items-center justify-between gap-2">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2"><BadgeCheck className="h-4 w-4" />Trust Badges</CardTitle>
                      <CardDescription>Reassurance icons shown on product and checkout pages.</CardDescription>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="default"
                      onClick={() => appendTrustBadge({ id: Date.now().toString(), label: "", icon: "ShieldCheck", active: true })}
                    >
                      <Plus className="h-4 w-4 mr-1" />Add Badge
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {trustBadgeFields.length === 0 && <p className="text-sm text-muted-foreground">No badges. Click "Add Badge" to create trust badges.</p>}
                    {trustBadgeFields.map((badge, index) => (
                      <div key={badge.id} className="flex items-center gap-2 border border-border rounded-md p-3">
                        <FormField control={form.control} name={`trustBadges.${index}.active`} render={({ field }) => (
                          <FormItem><FormControl><Switch checked={!!field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>
                        )} />
                        <FormField control={form.control} name={`trustBadges.${index}.label`} render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl><Input {...field} placeholder="e.g. Free Shipping" /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={form.control} name={`trustBadges.${index}.icon`} render={({ field }) => (
                          <FormItem className="w-36">
                            <Select onValueChange={field.onChange} value={field.value ?? "ShieldCheck"}>
                              <FormControl><SelectTrigger><SelectValue placeholder="Icon" /></SelectTrigger></FormControl>
                              <SelectContent>
                                <SelectItem value="ShieldCheck">Shield</SelectItem>
                                <SelectItem value="Truck">Truck</SelectItem>
                                <SelectItem value="Leaf">Leaf</SelectItem>
                                <SelectItem value="RotateCcw">Returns</SelectItem>
                                <SelectItem value="Star">Star</SelectItem>
                                <SelectItem value="BadgeCheck">Badge</SelectItem>
                                <SelectItem value="Package">Package</SelectItem>
                                <SelectItem value="Lock">Lock</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )} />
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeTrustBadge(index)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2"><BarChart2 className="h-4 w-4" />Tracking &amp; Analytics</CardTitle>
                    <CardDescription>Add Google Analytics or Facebook Pixel to track visitors.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField control={form.control} name="trackingSettings.googleAnalyticsId" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Google Analytics ID</FormLabel>
                        <FormControl><Input {...field} value={field.value ?? ""} placeholder="G-XXXXXXXXXX or UA-XXXXXXXXX-X" /></FormControl>
                        <p className="text-xs text-muted-foreground">Your GA4 measurement ID starting with G-</p>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="trackingSettings.facebookPixelId" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Facebook Pixel ID</FormLabel>
                        <FormControl><Input {...field} value={field.value ?? ""} placeholder="123456789012345" /></FormControl>
                        <p className="text-xs text-muted-foreground">Your 15-digit Facebook Pixel ID</p>
                      </FormItem>
                    )} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2"><Cookie className="h-4 w-4" />Cookie Consent</CardTitle>
                    <CardDescription>Show a cookie consent banner to comply with privacy regulations.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField control={form.control} name="cookieConsent.enabled" render={({ field }) => (
                      <FormItem className="flex items-center gap-3 rounded-md border border-border p-3">
                        <FormControl><Switch checked={!!field.value} onCheckedChange={field.onChange} /></FormControl>
                        <FormLabel className="!mt-0">Show cookie consent banner</FormLabel>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="cookieConsent.message" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Banner Message</FormLabel>
                        <FormControl><Textarea {...field} value={field.value ?? ""} rows={2} placeholder="We use cookies to improve your experience on our site." /></FormControl>
                      </FormItem>
                    )} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField control={form.control} name="cookieConsent.acceptText" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Accept Button Text</FormLabel>
                          <FormControl><Input {...field} value={field.value ?? ""} placeholder="Accept" /></FormControl>
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="cookieConsent.declineText" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Decline Button Text</FormLabel>
                          <FormControl><Input {...field} value={field.value ?? ""} placeholder="Decline" /></FormControl>
                        </FormItem>
                      )} />
                    </div>
                  </CardContent>
                </Card>

              </TabsContent>

            </Tabs>

            <div className="flex justify-end pt-2 pb-4">
              <SaveButton />
            </div>
          </form>
        </Form>
      </div>
  );
}

export default function AdminSettings() {
  return (
    <AdminRoute>
      <AdminSettingsContent />
    </AdminRoute>
  );
}
