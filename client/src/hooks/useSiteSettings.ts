import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import type { SiteSettings } from "@shared/schema";

const GOOGLE_FONTS_LINK_ID = "google-fonts-site-settings";

const FONT_FAMILIES = [
  "Poppins",
  "Open Sans",
  "Lato",
  "Roboto",
  "Playfair Display",
];

function loadGoogleFont(family: string) {
  const existing = document.getElementById(GOOGLE_FONTS_LINK_ID);
  if (existing) existing.remove();
  const link = document.createElement("link");
  link.id = GOOGLE_FONTS_LINK_ID;
  link.rel = "stylesheet";
  const encoded = encodeURIComponent(family);
  link.href = `https://fonts.googleapis.com/css2?family=${encoded}:wght@400;500;600;700&display=swap`;
  document.head.appendChild(link);
}

export function useSiteSettings() {
  const { data: settings, isLoading } = useQuery<SiteSettings>({
    queryKey: ["/api/site-settings"],
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!settings) return;

    const root = document.documentElement;

    if (settings.backgroundColor) {
      root.style.setProperty("--site-bg", settings.backgroundColor);
    }
    if (settings.fontColor) {
      root.style.setProperty("--site-font-color", settings.fontColor);
    }
    if (settings.fontFamily) {
      loadGoogleFont(settings.fontFamily);
      root.style.setProperty("--site-font-family", `'${settings.fontFamily}', sans-serif`);
    }
  }, [settings]);

  const heroSlides: { url: string; duration: number | null }[] = settings
    ? (
        [
          { url: settings.heroImage1Url, duration: settings.heroImage1Duration ?? null },
          { url: settings.heroImage2Url, duration: settings.heroImage2Duration ?? null },
          { url: settings.heroImage3Url, duration: settings.heroImage3Duration ?? null },
        ] as { url: string | null | undefined; duration: number | null }[]
      ).filter((s): s is { url: string; duration: number | null } => Boolean(s.url))
    : [];

  const heroImages = heroSlides.map((s) => s.url);
  const heroImageDurations = heroSlides.map((s) => s.duration);

  return {
    settings,
    isLoading,
    // Branding
    storeName: settings?.storeName ?? "Bmaafashion",
    storeTagline: settings?.storeTagline ?? null,
    logoUrl: settings?.logoUrl ?? null,
    fontFamily: settings?.fontFamily ?? "Poppins",
    fontColor: settings?.fontColor ?? "#1a1a1a",
    backgroundColor: settings?.backgroundColor ?? "#ffffff",
    // Homepage
    heroImages,
    heroImageDurations,
    heroSlideDuration: settings?.heroSlideDuration ?? 5,
    announcementBar: settings?.announcementBar ?? null,
    featuredCategories: settings?.featuredCategories ?? [],
    customBanners: settings?.customBanners ?? [],
    homepageSections: settings?.homepageSections ?? {
      showStats: true, showWhyChoose: true, showTestimonials: true,
      showFeaturedProducts: true, showBenefits: true,
    },
    // Promotions & Marketing
    promotions: settings?.promotions ?? [],
    popupSettings: settings?.popupSettings ?? null,
    countdownTimer: settings?.countdownTimer ?? null,
    trustBadges: settings?.trustBadges ?? [],
    // Policies
    policies: settings?.policies ?? null,
    // Contact
    contactInfo: settings?.contactInfo ?? null,
    socialLinks: settings?.socialLinks ?? null,
    // SEO
    seoSettings: settings?.seoSettings ?? null,
    // Footer
    footerSettings: settings?.footerSettings ?? null,
    // Store operations
    maintenanceMode: settings?.maintenanceMode ?? null,
    whatsappWidget: settings?.whatsappWidget ?? { enabled: true, phone: "918438869979" },
    // Products
    productSettings: settings?.productSettings ?? {
      perPage: 12, defaultSort: "name", newBadgeDays: 30, lowStockThreshold: 5,
    },
    orderSettings: settings?.orderSettings ?? null,
    // Tracking
    trackingSettings: settings?.trackingSettings ?? null,
    // Legal
    cookieConsent: settings?.cookieConsent ?? null,
    // Page Banners
    pageBanners: settings?.pageBanners ?? null,
  };
}

export { FONT_FAMILIES };
