import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Phone, MapPin, Clock, Send, CheckCircle } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { z } from "zod";
import { useSEO } from "@/hooks/use-seo";
import { ORGANIZATION_DATA, generateContactPageSchema, generateBreadcrumbs } from "@/lib/structured-data-constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

// Form validation schema
const contactFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  subject: z.string().min(1, "Please select a subject"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

export default function Contact() {
  const { contactInfo: settingsContact, pageBanners, seoSettings } = useSiteSettings();

  const contactStructuredData = useMemo(() => [
    ORGANIZATION_DATA,
    generateContactPageSchema(),
    generateBreadcrumbs([
      { name: "Home", url: "/" },
      { name: "Contact Us", url: "/contact" }
    ])
  ], []);

  useSEO({
    title: seoSettings?.contact?.title || "Contact Bmaafashion | Fashion Support & Inquiry",
    description: seoSettings?.contact?.description || "Get in touch with Bmaafashion for fashion inquiries, customer support, or business partnerships. We're here to help!",
    ogTitle: "Contact Us - Bmaafashion",
    ogDescription: "Have questions about our dress collections? Our expert styling team is here to help. Contact us for product information, styling advice, or custom services.",
    ogImage: "/attached_assets/bmaafashion.jpeg",
    ogUrl: typeof window !== 'undefined' ? window.location.href : undefined,
    keywords: "contact Bmaafashion, fashion support, customer service",
    structuredData: contactStructuredData,
  });
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      subject: "",
      message: "",
    },
  });

  const onSubmit = async (values: ContactFormValues) => {
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      setIsSubmitted(true);
      form.reset();
      
      toast({
        title: "Message Sent Successfully!",
        description: "Thank you for contacting us. We'll get back to you within 24 hours.",
      });
    } catch (error) {
      console.error('Contact form error:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const banner = pageBanners?.contact;
  const bannerTitle = banner?.title || "Contact Us";
  const bannerSubtitle = banner?.subtitle || "Get in touch with our hydroponic experts. We're here to help you grow successfully with personalized support and guidance.";

  const contactInfo = [
    {
      icon: Mail,
      title: "Email",
      detail: settingsContact?.email || "info@bmaafashion.com",
      description: "Send us an email anytime"
    },
    {
      icon: Phone,
      title: "Phone",
      detail: settingsContact?.phone || "+91 84388 9620",
      description: "Call us for immediate assistance"
    },
    {
      icon: MapPin,
      title: "Address",
      detail: settingsContact?.address || "5/375, S. Kolathur, Indirapuri, Kovilambakkam, Chennai, Tamil Nadu 600129",
      description: "Visit our main office"
    },
    {
      icon: Clock,
      title: "Business Hours",
      detail: settingsContact?.businessHours || "Mon - Sat: 9:00 AM - 6:00 PM",
      description: "Sunday: Closed"
    }
  ];

  const subjects = [
    "Product Inquiry",
    "Technical Support",
    "Bulk Orders",
    "Installation Services",
    "Training & Education",
    "Partnership Opportunities",
    "General Questions",
    "Other"
  ];

  // Scroll to top when success page is shown
  useEffect(() => {
    if (isSubmitted) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [isSubmitted]);

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md mx-auto px-4 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-8 w-8 text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold mb-4">Message Sent!</h1>
          <p className="text-muted-foreground mb-6">
            Thank you for contacting us. Our team will review your message and 
            get back to you within 24 hours.
          </p>
          <Button onClick={() => setIsSubmitted(false)}>
            Send Another Message
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div
        className="relative text-white py-10 sm:py-12 md:py-16 overflow-hidden"
        style={banner?.imageUrl ? { backgroundImage: `url(${banner.imageUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : {}}
      >
        {banner?.imageUrl && <div className="absolute inset-0 bg-black/55" />}
        {!banner?.imageUrl && <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary" />}
        <div className="relative container mx-auto px-4 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6">{bannerTitle}</h1>
          <p className="text-lg sm:text-xl opacity-90 max-w-2xl mx-auto px-4">{bannerSubtitle}</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 sm:py-12 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-10 md:gap-12">
          {/* Contact Information */}
          <div className="space-y-6 sm:space-y-8">
            <div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6">Get in Touch</h2>
              <p className="text-muted-foreground mb-8">
                Have questions about our products or need expert advice? 
                Our team is ready to help you succeed with hydroponic growing.
              </p>
            </div>

            <div className="space-y-6">
              {contactInfo.map((info, index) => {
                const Icon = info.icon;
                return (
                  <Card key={index}>
                    <CardContent className="flex items-start space-x-3 sm:space-x-4 pt-4 sm:pt-5 md:pt-6">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">{info.title}</h3>
                        <p className="font-medium text-sm mb-1">{info.detail}</p>
                        <p className="text-xs text-muted-foreground">{info.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Send us a Message</CardTitle>
                <CardDescription>
                  Fill out the form below and we'll get back to you as soon as possible.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                placeholder="Enter your full name"
                                data-testid="input-contact-name"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                placeholder="Enter your phone number"
                                data-testid="input-contact-phone"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

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
                              placeholder="Enter your email address"
                              data-testid="input-contact-email"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="subject"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subject</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-contact-subject">
                                <SelectValue placeholder="Select a subject" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {subjects.map((subject) => (
                                <SelectItem key={subject} value={subject}>
                                  {subject}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Message</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field}
                              placeholder="Tell us how we can help you..."
                              className="min-h-[120px]"
                              data-testid="input-contact-message"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit" 
                      size="lg" 
                      className="w-full"
                      disabled={isSubmitting}
                      data-testid="button-send-message"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {isSubmitting ? "Sending..." : "Send Message"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}