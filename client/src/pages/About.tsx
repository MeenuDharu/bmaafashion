import { useMemo } from "react";
import {
  Leaf,
  Users,
  Award,
  Target,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import { Link } from "wouter";
import { useSEO } from "@/hooks/use-seo";
import { ORGANIZATION_DATA, LOCAL_BUSINESS_DATA, generateBreadcrumbs } from "@/lib/structured-data-constants";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { safeImageImport, handleImageError as handleImgError, PLACEHOLDER_IMAGE } from "@/lib/image-utils";

// Import images with fallback support
const heroImage = safeImageImport("/attached_assets/bmaafashion.jpeg");
const farmImage = safeImageImport("/attached_assets/heroicimage.png");
const techImage = safeImageImport("/attached_assets/banner1.jpeg");

export default function About() {
  const aboutStructuredData = useMemo(() => [
    ORGANIZATION_DATA,
    LOCAL_BUSINESS_DATA,
    generateBreadcrumbs([
      { name: "Home", url: "/" },
      { name: "About Us", url: "/about" }
    ])
  ], []);

  useSEO({
    title:
      "About Bmaafashion | Fashion & Style Experts",
    description:
      "Learn about Bmaafashion, your trusted fashion partner. Discover our curated collections, style expertise, and commitment to bringing you the latest fashion trends.",
    ogTitle:
      "About Bmaafashion | Redefining Fashion Through Innovation",
    ogDescription:
      "Discover how Bmaafashion is revolutionizing fashion with our curated collections, expert styling, and sustainable fashion practices.",
    ogImage:
      "/attached_assets/bmaafashion.jpeg",
    ogUrl: typeof window !== "undefined" ? window.location.href : undefined,
    keywords: "Bmaafashion about, fashion company, style expertise, curated collections",
    structuredData: aboutStructuredData,
  });
  const values = [
    {
      icon: Leaf,
      title: "Sustainability",
      description:
        "Promoting ethical fashion with sustainable materials and responsible production practices.",
    },
    {
      icon: Award,
      title: "Quality",
      description:
        "Premium fabrics and impeccable craftsmanship in every dress we curate for our boutique.",
    },
    {
      icon: Users,
      title: "Community",
      description:
        "Building a community of fashion enthusiasts who celebrate individual style and elegance.",
    },
    {
      icon: Target,
      title: "Innovation",
      description:
        "Constantly curating the latest fashion trends and timeless classics to inspire your wardrobe.",
    },
  ];

  const achievements = [
    "Exclusive designer dress collections",
    "Premium quality fabrics and materials",
    "Sustainable fashion practices",
    "Complete styling solutions for all occasions",
    "Expert personal styling support",
    "Commitment to customer satisfaction",
  ];

  const { pageBanners } = useSiteSettings();
  const banner = pageBanners?.about;
  const bannerTitle = banner?.title || "About Us";
  const bannerSubtitle = banner?.subtitle || "A considered collection of modern elegance, timeless design, and personal style";
  const bannerImage = banner?.imageUrl || heroImage;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div
        className="relative text-white py-10 sm:py-12 md:py-16 overflow-hidden"
        style={banner?.imageUrl ? { backgroundImage: `url(${banner.imageUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : {}}
      >
        {banner?.imageUrl && <div className="absolute inset-0 bg-black/55" />}
        {!banner?.imageUrl && <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary" />}
        <div className="relative container mx-auto px-4 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6">{bannerTitle}</h1>
          <p className="text-lg sm:text-xl opacity-90 max-w-3xl mx-auto px-4">{bannerSubtitle}</p>
        </div>
      </div>

      {/* Hero Image */}
      <div className="container mx-auto px-4 -mt-6 sm:-mt-8">
        <div className="max-w-6xl mx-auto rounded-xl overflow-hidden shadow-2xl bg-muted">
          <img
            src={bannerImage}
            alt="Bmaafashion boutique collection"
            className="w-full h-[250px] sm:h-[350px] md:h-[400px] object-cover"
            loading="eager"
            decoding="async"
            data-testid="img-hero"
            onError={handleImgError}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 sm:py-12 md:py-16">
        {/* Introduction */}
        <div className="max-w-4xl mx-auto mb-10 sm:mb-12 md:mb-16">
          <p className="text-lg text-muted-foreground leading-relaxed mb-6">
            Welcome to Bmaafashion Boutique, your premier destination for
            curated fashion collections. We are redefining fashion by curating
            exclusive dress collections from emerging and established designers,
            bringing the latest trends and timeless classics to fashion
            enthusiasts everywhere.
          </p>
          <p className="text-lg text-muted-foreground leading-relaxed mb-6">
            Our mission is to provide our community with access to premium,
            ethically-sourced fashion that celebrates individuality and elegance.
            We believe every person deserves to feel confident and beautiful in
            their chosen style. Bmaafashion is dedicated to offering{" "}
            <span className="text-foreground font-semibold">
              exceptional quality, expert curation, and personalized styling services
            </span>
            , combining deep expertise in fashion, sustainability, and customer
            experience.
          </p>
          <p className="text-lg text-muted-foreground leading-relaxed mb-6">
            We leverage industry connections and expert stylists to source unique,
            high-quality dress collections that celebrate contemporary and
            classic styles. Our diverse team, comprising fashion experts, designers,
            and style consultants, shares a vision to make premium fashion
            accessible while promoting sustainable and ethical practices in the
            fashion industry.
          </p>
          <p className="text-lg text-muted-foreground leading-relaxed">
            From casual chic to formal elegance, our carefully curated collections
            offer something for every occasion. We partner with ethical manufacturers
            and support sustainable fashion practices. By choosing Bmaafashion,
            you're investing in quality, supporting ethical fashion, and
            embracing your unique style.
          </p>
        </div>

        {/* Farm Image */}
        <div className="max-w-5xl mx-auto mb-10 sm:mb-12 md:mb-16">
          <div className="rounded-xl overflow-hidden shadow-lg bg-muted">
            <img
              src={farmImage}
              alt="Fashion collections at Bmaafashion boutique"
              className="w-full h-[250px] sm:h-[300px] md:h-[350px] object-cover"
              loading="lazy"
              decoding="async"
              data-testid="img-farm"
              onError={handleImgError}
            />
          </div>
        </div>

        {/* Mission Statement */}
        <div className="max-w-4xl mx-auto mb-10 sm:mb-12 md:mb-16 bg-primary/5 rounded-lg p-4 sm:p-6 md:p-8">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 text-center">
            Our Mission
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed mb-4">
            At Bmaafashion, our mission is to celebrate individuality through
            fashion. We are committed to curating premium dress collections that
            empower people to express their unique style and personality. We
            champion ethical fashion and sustainable practices to make quality,
            beautiful clothing accessible to everyone.
          </p>
          <p className="text-lg text-muted-foreground leading-relaxed">
            By combining expert curation with personalized service, we envision a
            fashion industry where quality, ethics, and personal expression go hand
            in hand. Every dress in our boutique tells a story and celebrates the
            beauty of individuality.
          </p>
        </div>

        {/* Values */}
        <div className="mb-10 sm:mb-12 md:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-8 sm:mb-10 md:mb-12">
            Our Values
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <Card key={index} className="text-center h-full">
                  <CardHeader>
                    <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
                      <Icon className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{value.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm">
                      {value.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Why Choose Bmaafashion */}
        <div className="max-w-4xl mx-auto mb-10 sm:mb-12 md:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 sm:mb-8">
            Why Choose Bmaafashion?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {achievements.map((achievement, index) => (
              <div key={index} className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-1" />
                <span className="text-muted-foreground">{achievement}</span>
              </div>
            ))}
          </div>

          <div className="p-4 sm:p-5 md:p-6 bg-muted/50 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Expert Support</h3>
            <p className="text-sm text-muted-foreground mb-4">
                Our experienced team provides thoughtful styling guidance, considered recommendations,
                and attentive support from discovery to delivery. We're committed to making every
                shopping experience feel personal.
            </p>
            <Link to="/contact">
              <Button
                variant="outline"
                size="sm"
                data-testid="button-get-expert-help"
              >
                Get Expert Help
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Future Vision */}
        <div className="bg-card rounded-xl overflow-hidden border">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
            <div className="p-6 sm:p-7 md:p-8 flex flex-col justify-center">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">
                Looking Forward
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                As we continue to innovate and expand, our goal remains
                unchanged: to make expressive, quality fashion accessible to everyone. We continue
                expanding our collections, strengthening designer partnerships, and creating a
                more thoughtful way to discover clothes that feel truly personal.
              </p>
              <div>
                <Link to="/products">
                  <Button size="lg" data-testid="button-explore-products">
                    Explore Our Products
                  </Button>
                </Link>
              </div>
            </div>
            <div className="h-[350px] md:h-[400px] bg-muted">
              <img
                src={techImage}
                alt="Bmaafashion fashion collection"
                className="w-full h-full object-cover object-center"
                loading="lazy"
                decoding="async"
                data-testid="img-future"
                onError={handleImgError}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
