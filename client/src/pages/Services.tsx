import { useMemo } from "react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useSEO } from "@/hooks/use-seo";
import { ORGANIZATION_DATA, SERVICES_DATA, generateBreadcrumbs } from "@/lib/structured-data-constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  Sprout,
  GraduationCap,
  Gauge,
  Wrench,
  TrendingUp,
  Warehouse,
  Package,
  BarChart3,
  Wifi,
  ArrowRight,
} from "lucide-react";
import { Link } from "wouter";

export default function Services() {
  const servicesStructuredData = useMemo(() => [
    ORGANIZATION_DATA,
    ...SERVICES_DATA,
    generateBreadcrumbs([
      { name: "Home", url: "/" },
      { name: "Services", url: "/services" }
    ])
  ], []);

  const { pageBanners, seoSettings } = useSiteSettings();
  const banner = pageBanners?.services;
  const bannerTitle = banner?.title || "Our Services";
  const bannerSubtitle = banner?.subtitle || "Expert Fashion Curation & Styling Services for Every Occasion";

  useSEO({
    title: seoSettings?.services?.title || "Premium Fashion & Styling Services | Bmaafashion",
    description:
      seoSettings?.services?.description ||
      "Expert personal styling, fashion curation, and boutique services. From seasonal collections to occasion-specific dresses, expert consultations, and sustainable fashion guidance.",
    ogTitle: "Fashion Styling & Boutique Services | Bmaafashion",
    ogDescription:
      "Premium dress collections with personalized styling consultations, fashion curation, and sustainable fashion solutions for every occasion.",
    ogImage:
      "/attached_assets/bmaafashion.jpeg",
    ogUrl: typeof window !== "undefined" ? window.location.href : undefined,
    keywords: "personal styling, fashion consulting, boutique services, dress collections, fashion curation, sustainable fashion",
    structuredData: servicesStructuredData,
  });

  const services = [
    {
      icon: Sprout,
      title: "Personal Styling Consultations",
      subtitle: "Find Your Perfect Look, Curated For You",
      description:
        "Every style journey starts with understanding YOU. Our fashion experts provide personalized styling consultations tailored to your body type, skin tone, lifestyle, and preferences. We combine fashion expertise with personal insights to curate dress recommendations that make you feel confident and beautiful.",
      description2:
        "From casual everyday wear to special occasion dresses, we guide you through color palettes, silhouettes, and styling techniques that complement your unique personality and celebrate your individuality.",
      deliverables: [
        "Personal color and style analysis",
        "Body type and silhouette consultation",
        "Seasonal wardrobe planning",
        "Styling tips and pairing suggestions",
      ],
    },
    {
      icon: TrendingUp,
      title: "Exclusive Collection Curation",
      subtitle: "Trend Spotting. Quality First. Style Always.",
      description:
        "At Bmaafashion, we continuously scout and curate the finest dress collections from emerging and established designers. Our team stays ahead of fashion trends while maintaining a commitment to quality, ethics, and sustainability in every piece.",
      description2:
        "Whether you're looking for contemporary designs, timeless classics, or seasonal trends, we ensure every dress in our collection meets our rigorous standards for quality, design, and sustainability.",
      deliverables: [
        "Trend forecasting and seasonal collections",
        "Designer partnership and collaboration",
        "Quality assurance and fabric assessment",
        "Limited edition and exclusive piece sourcing",
      ],
    },
    {
      icon: Warehouse,
      title: "Boutique Styling Events",
      subtitle: "Experience Fashion. Create Memories.",
      description:
        "Bmaafashion hosts exclusive boutique styling events, fashion shows, and try-on experiences. Our curated events celebrate fashion, bring communities together, and help customers discover their signature style in a vibrant, welcoming atmosphere.",
      description2:
        "From intimate styling parties to seasonal fashion showcases, we create memorable fashion experiences that inspire confidence and celebrate the art of dressing beautifully.",
      deliverables: [
        "Boutique styling events and fashion shows",
        "Seasonal collection launches",
        "Personal shopping experiences",
        "Fashion consultation workshops",
      ],
    },
    {
      icon: Package,
      title: "Occasion-Based Dress Solutions",
      subtitle: "Every Moment, Every Dress, Every Story",
      description:
        "Special occasions deserve special attention. Bmaafashion offers comprehensive occasion-based dress solutions for weddings, parties, corporate events, and celebrations. Our team works with you to find the perfect dress that makes your special moment unforgettable.",
      description2:
        "With a curated selection of formal, semi-formal, and casual occasion dresses, we ensure you have access to premium options for every milestone and celebration in your life.",
      deliverables: [
        "Wedding and bridal collection consultation",
        "Party and festive occasion dresses",
        "Corporate and professional wear",
        "Custom fitting and alterations",
      ],
    },
    {
      icon: Wifi,
      title: "Sustainable Fashion Guidance",
      subtitle: "Style With Conscience. Fashion With Purpose.",
      description:
        "We believe fashion should be beautiful AND responsible. Bmaafashion guides customers in making sustainable fashion choices through education on ethical sourcing, eco-friendly materials, and responsible consumption habits.",
      description2:
        "From understanding fabric origins to learning care tips that extend dress life, we empower our customers to make fashion choices that align with their values and support a healthier planet.",
      deliverables: [
        "Sustainable fabric and material education",
        "Ethical sourcing and brand partnerships",
        "Garment care and longevity tips",
        "Fashion upcycling and wardrobe refresh guidance",
      ],
    },
    {
      icon: GraduationCap,
      title: "Fashion Styling Workshops",
      subtitle: "Learn. Inspire. Express Yourself.",
      description:
        "Bmaafashion conducts fashion styling workshops and masterclasses to help individuals build confidence in their personal style. Our sessions combine fashion theory, practical styling techniques, and confidence building exercises.",
      description2:
        "Whether you're a fashion enthusiast looking to elevate your style or someone seeking guidance on building a versatile wardrobe, our workshops empower you with knowledge and skills to style with confidence.",
      deliverables: [
        "Color and style analysis workshops",
        "Capsule wardrobe building techniques",
        "Occasion-specific styling masterclasses",
        "Fashion accessory pairing and coordination",
      ],
    },
    {
      icon: Wrench,
      title: "Customer Support & Loyalty Program",
      subtitle: "Style Support Every Step of the Way",
      description:
        "Our commitment to our customers goes beyond the purchase. Bmaafashion offers comprehensive customer support, alterations, and a loyalty program that rewards our regular customers with exclusive access to new collections and special styling sessions.",
      description2:
        "From fitting assistance to maintenance advice, we ensure your dress fits perfectly and lasts longer. Our loyalty members enjoy early access to collections, special discounts, and personalized shopping experiences.",
      deliverables: [
        "Dress fitting and alteration services",
        "Garment care and maintenance guidance",
        "VIP membership and loyalty rewards",
        "Personal shopper and concierge services",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div
        className="relative text-white py-20 overflow-hidden"
        style={banner?.imageUrl ? { backgroundImage: `url(${banner.imageUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : {}}
      >
        {banner?.imageUrl && <div className="absolute inset-0 bg-black/55" />}
        {!banner?.imageUrl && <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary" />}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-5xl font-bold mb-6" data-testid="heading-services">{bannerTitle}</h1>
            <p className="text-xl sm:text-2xl opacity-95 mb-4">{bannerSubtitle}</p>
            {!banner?.subtitle && (
              <p className="text-lg opacity-90">
                At Bmaafashion, we offer thoughtful styling and curation designed around your life, your taste, and your most important occasions. From personal edits to wardrobe guidance, we pair refined fashion with attentive service.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Services Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="space-y-12">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <Card
                key={index}
                className="hover-elevate overflow-hidden"
                data-testid={`card-service-${index}`}
              >
                <div className="grid md:grid-cols-3 gap-6">
                  {/* Left Column - Icon and Title */}
                  <div className="md:col-span-1 bg-primary/5 p-6 flex flex-col items-start">
                    <div className="h-16 w-16 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <Icon className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground mb-2">
                      {service.title}
                    </h3>
                    <p className="text-sm font-medium text-primary">
                      {service.subtitle}
                    </p>
                  </div>

                  {/* Right Column - Content */}
                  <div className="md:col-span-2 p-6">
                    <p className="text-muted-foreground mb-4 leading-relaxed">
                      {service.description}
                    </p>
                    <p className="text-muted-foreground mb-6 leading-relaxed">
                      {service.description2}
                    </p>

                    <div>
                      <h4 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wide">
                        {index === 0
                          ? "Deliverables:"
                          : index === 1
                            ? "Services Include:"
                            : index === 2
                              ? "Capabilities:"
                              : index === 3
                                ? "Turnkey Scope Includes:"
                                : index === 4
                                  ? "Key Features:"
                                  : index === 5
                                    ? "Programs Include:"
                                    : "Support Includes:"}
                      </h4>
                      <ul className="grid sm:grid-cols-2 gap-3">
                        {service.deliverables.map((item, itemIndex) => (
                          <li
                            key={itemIndex}
                            className="flex items-start gap-2"
                          >
                            <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-foreground">
                              {item}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-primary via-primary to-secondary text-white relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full px-4 py-2 mb-6">
              <CheckCircle className="h-5 w-5 text-white" />
              <span className="text-sm font-medium text-white">Free Consultation • No Commitment Required</span>
            </div>

            <h2 className="text-4xl sm:text-5xl font-bold mb-6 leading-tight">
              Ready to Build Your Sustainable Farming Future?
            </h2>
            <p className="text-xl sm:text-2xl opacity-95 mb-10 leading-relaxed">
              Let's transform your vision into a profitable, sustainable farm.
            </p>
            
            {/* Primary CTA Button - Extra Prominent */}
            <div className="mb-8">
              <Link to="/contact">
                <Button
                  size="lg"
                  className="bg-white text-primary text-lg px-10 py-7 h-auto font-bold shadow-2xl"
                  data-testid="button-contact"
                >
                  Request a Quote
                  <ArrowRight className="ml-3 h-6 w-6" />
                </Button>
              </Link>
            </div>

            {/* Trust signals and quick contact */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-white/90">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                <span className="text-sm">Response within 24 hours</span>
              </div>
              <div className="hidden sm:block w-1 h-1 bg-white/50 rounded-full"></div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                <span className="text-sm">Expert consultation guaranteed</span>
              </div>
              <div className="hidden sm:block w-1 h-1 bg-white/50 rounded-full"></div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                <span className="text-sm">Custom solutions for every budget</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
