import { Link } from "wouter";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { SiFacebook, SiInstagram, SiX, SiYoutube, SiLinkedin } from "react-icons/si";
import { Leaf, Mail, Phone, MapPin, Clock } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const defaultPolicyLinks = [
  { label: "Privacy Policy", url: "/privacy-policy" },
  { label: "Terms of Service", url: "/terms-of-service" },
  { label: "Shipping Policy", url: "/shipping-policy" },
  { label: "Return Policy", url: "/return-policy" },
];

export default function Footer() {
  const { storeName, contactInfo, socialLinks, footerSettings } = useSiteSettings();
  const { toast } = useToast();
  const [email, setEmail] = useState("");

  const copyright = footerSettings?.copyright || `© ${new Date().getFullYear()} ${storeName}. All rights reserved.`;
  const showNewsletter = footerSettings?.newsletterEnabled !== false;
  const showSocial = footerSettings?.showSocialLinks !== false;
  const customLinks = footerSettings?.links ?? [];
  const allPolicyLinks = [...defaultPolicyLinks, ...customLinks];

  const hasSocialLinks = socialLinks && (
    socialLinks.facebook || socialLinks.instagram || socialLinks.twitter ||
    socialLinks.youtube || socialLinks.linkedin
  );

  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    toast({ title: "Subscribed!", description: `You'll receive updates from ${storeName}.` });
    setEmail("");
  };

  return (
    <footer className="bg-secondary border-t border-secondary/20 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Brand */}
          <div className="space-y-5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-primary rounded-lg shadow-sm">
                <Leaf className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-xl text-white">{storeName}</span>
            </div>
            <p className="text-sm text-white/80 leading-relaxed">
              A curated fashion destination for timeless silhouettes, statement pieces, and elevated everyday style.
            </p>
            {showSocial && hasSocialLinks && (
              <div className="flex items-center gap-4 flex-wrap">
                {socialLinks?.facebook && (
                  <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-primary transition-all duration-300 hover:scale-110">
                    <SiFacebook className="h-5 w-5" />
                  </a>
                )}
                {socialLinks?.instagram && (
                  <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-primary transition-all duration-300 hover:scale-110">
                    <SiInstagram className="h-5 w-5" />
                  </a>
                )}
                {socialLinks?.twitter && (
                  <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-primary transition-all duration-300 hover:scale-110">
                    <SiX className="h-5 w-5" />
                  </a>
                )}
                {socialLinks?.youtube && (
                  <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-primary transition-all duration-300 hover:scale-110">
                    <SiYoutube className="h-5 w-5" />
                  </a>
                )}
                {socialLinks?.linkedin && (
                  <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-primary transition-all duration-300 hover:scale-110">
                    <SiLinkedin className="h-5 w-5" />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div className="space-y-5">
            <h3 className="font-semibold text-base text-white tracking-wide">Quick Links</h3>
            <nav className="space-y-3">
              {[
                { label: "Home", url: "/" },
                { label: "Shop", url: "/products" },
                { label: "Fresh Produce", url: "/fresh-produce" },
                { label: "Services", url: "/services" },
                { label: "About Us", url: "/about" },
                { label: "Contact", url: "/contact" },
              ].map((link) => (
                <Link key={link.url} href={link.url} className="block text-sm text-white/70 hover:text-primary transition-all duration-300 hover:translate-x-1">
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Policies */}
          <div className="space-y-5">
            <h3 className="font-semibold text-base text-white tracking-wide">Policies &amp; Info</h3>
            <nav className="space-y-3">
              {allPolicyLinks.map((link) => (
                <Link key={link.url} href={link.url} className="block text-sm text-white/70 hover:text-primary transition-all duration-300 hover:translate-x-1">
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Contact + Newsletter */}
          <div className="space-y-5">
            <h3 className="font-semibold text-base text-white tracking-wide">Contact Us</h3>
            <div className="space-y-3">
              {contactInfo?.phone ? (
                <a href={`tel:${contactInfo.phone}`} className="flex items-start gap-2.5 text-sm text-white/70 hover:text-primary transition-colors">
                  <Phone className="h-4 w-4 mt-0.5 shrink-0" /><span>{contactInfo.phone}</span>
                </a>
              ) : (
                <a href="tel:+918438869979" className="flex items-start gap-2.5 text-sm text-white/70 hover:text-primary transition-colors">
                  <Phone className="h-4 w-4 mt-0.5 shrink-0" /><span>+91 84388 9620</span>
                </a>
              )}
              {contactInfo?.email ? (
                <a href={`mailto:${contactInfo.email}`} className="flex items-start gap-2.5 text-sm text-white/70 hover:text-primary transition-colors">
                  <Mail className="h-4 w-4 mt-0.5 shrink-0" /><span>{contactInfo.email}</span>
                </a>
              ) : (
                <a href="mailto:info@bmaafashion.com" className="flex items-start gap-2.5 text-sm text-white/70 hover:text-primary transition-colors">
                  <Mail className="h-4 w-4 mt-0.5 shrink-0" /><span>info@bmaafashion.com</span>
                </a>
              )}
              {contactInfo?.address && (
                <div className="flex items-start gap-2.5 text-sm text-white/70">
                  <MapPin className="h-4 w-4 mt-0.5 shrink-0" /><span>{contactInfo.address}</span>
                </div>
              )}
              {contactInfo?.businessHours && (
                <div className="flex items-start gap-2.5 text-sm text-white/70">
                  <Clock className="h-4 w-4 mt-0.5 shrink-0" /><span>{contactInfo.businessHours}</span>
                </div>
              )}
            </div>

            {showNewsletter && (
              <div className="space-y-3 pt-2">
                <p className="text-sm font-medium text-white">Stay Updated</p>
                <form onSubmit={handleNewsletter} className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 text-sm bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/15"
                  />
                  <Button type="submit" size="default" className="bg-primary text-primary-foreground hover:bg-primary/90">Subscribe</Button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 flex-wrap">
          <p className="text-sm text-white/60">{copyright}</p>
          <p className="text-sm text-white/60 flex items-center gap-2">
            <span>Curated with care in India</span>
            <span className="text-primary">✦</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
