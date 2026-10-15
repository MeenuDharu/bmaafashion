import { useMemo } from "react";
import { useSEO } from "@/hooks/use-seo";
import { ORGANIZATION_DATA, generateBreadcrumbs } from "@/lib/structured-data-constants";
import { useSiteSettings } from "@/hooks/useSiteSettings";

export default function ShippingPolicy() {
  const { policies, contactInfo } = useSiteSettings();
  const shippingStructuredData = useMemo(() => [
    ORGANIZATION_DATA,
    generateBreadcrumbs([
      { name: "Home", url: "/" },
      { name: "Shipping Policy", url: "/shipping-policy" }
    ])
  ], []);

  useSEO({
    title: "Shipping Policy | Bmaafashion",
    description: "Bmaafashion Shipping Policy - Learn about delivery times, shipping costs, and our shipping process across India. Free shipping available on orders above ₹5,000.",
    ogTitle: "Shipping Policy | Bmaafashion",
    ogDescription: "Fast and reliable shipping across India. View our delivery timeframes, shipping costs, and tracking information for hydroponic systems.",
    ogImage: "/attached_assets/bmaafashion.jpeg",
    structuredData: shippingStructuredData,
  });

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8" data-testid="heading-shipping-policy">Shipping Policy</h1>
      
      <div className="prose prose-green max-w-none space-y-6">
        <p className="text-muted-foreground">
          <strong>Last Updated:</strong> October 7, 2025
        </p>

        <p>
          At Bmaa Fashion, we are committed to delivering your fashion products
          safely and efficiently across India. Please review our shipping policy below.
        </p>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold mt-8">1. Shipping Coverage</h2>
          <p>
            We currently ship to all states and union territories within India. International shipping 
            is not available at this time.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold mt-8">2. Processing Time</h2>
          <p>
            Orders are typically processed within 1 to 3 business days (Monday to Friday, excluding public holidays). 
            During peak seasons or promotional events, processing times may be extended. You will receive 
            an order confirmation email once your order is placed, and a shipping confirmation with tracking 
            information once it ships.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold mt-8">3. Delivery Timeframes</h2>
          <p>Estimated delivery times vary based on your location:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Metro Cities:</strong> 3-5 business days</li>
            <li><strong>Tier 2 Cities:</strong> 5-7 business days</li>
            <li><strong>Rural Areas:</strong> 7-10 business days</li>
            <li><strong>Remote Locations:</strong> 10-15 business days</li>
          </ul>
          <p>
            These are estimates and actual delivery times may vary due to factors beyond our control, 
            including weather conditions, carrier delays, or customs clearance (for interstate shipments).
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold mt-8">4. Shipping Costs</h2>
          <p>
            Shipping costs are calculated at checkout based on:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Product weight and dimensions</li>
            <li>Delivery location</li>
            <li>Selected shipping method</li>
          </ul>
          <p>
            <strong>Free Shipping:</strong> We offer free standard shipping on orders above ₹5,000 
            within metro cities. Free shipping thresholds for other regions may vary.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold mt-8">5. Shipping Methods</h2>
          <p>We partner with reliable logistics providers including:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Standard Shipping:</strong> 5-7 business days (most affordable)</li>
            <li><strong>Express Shipping:</strong> 2-3 business days (additional charges apply)</li>
            <li><strong>Same Day/Next Day:</strong> Available in select metro cities (premium charges)</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold mt-8">6. Order Tracking</h2>
          <p>
            Once your order ships, you'll receive a tracking number via email and SMS. You can track 
            your shipment at any time by:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Logging into your Bmaa Fashion account</li>
            <li>Using the tracking link in your shipping confirmation email</li>
            <li>Contacting our customer support team</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold mt-8">7. Packaging</h2>
          <p>
            All products are carefully packaged to ensure they arrive in perfect condition. Hydroponic 
            systems and delicate items receive extra protective packaging. We use eco friendly packaging 
            materials wherever possible.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold mt-8">8. Delivery Process</h2>
          <p>
            Our delivery partners will make up to 3 delivery attempts. If delivery is unsuccessful after 
            3 attempts, the shipment will be returned to our warehouse. Please ensure:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>A valid phone number is provided for delivery coordination</li>
            <li>Someone is available to receive the package</li>
            <li>The delivery address is accurate and complete</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold mt-8">9. Damaged or Lost Shipments</h2>
          <p>
            If your package arrives damaged or is lost in transit:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Contact us within 48 hours of delivery (for damaged packages)</li>
            <li>Provide photos of the damaged package and product</li>
            <li>We will arrange for a replacement or refund</li>
          </ul>
          <p>
            For lost shipments, we will investigate with our logistics partner and provide a resolution 
            within 7-10 business days.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold mt-8">10. Address Changes</h2>
          <p>
            Once an order is shipped, we cannot change the delivery address. Please ensure your shipping 
            address is correct before completing your purchase. If you need to update your address before 
            shipment, contact us immediately at support@bmaafashion.com
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold mt-8">11. Bulk Orders</h2>
          <p>
            For bulk orders (10+ units) or commercial installations:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Custom shipping quotes are provided</li>
            <li>White glove delivery and installation services may be available</li>
            <li>Contact our B2B team for specialized logistics support</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold mt-8">12. Customs and Duties</h2>
          <p>
            For interstate shipments, some states may require additional documentation or impose local 
            taxes. Any such charges are the responsibility of the customer and are not included in our 
            shipping costs.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold mt-8">13. Contact Us</h2>
          <p>
            For shipping related questions or concerns, please contact us:
          </p>
          <div className="bg-muted p-4 rounded-md">
            <p><strong>Bmaa Fashion Shipping Support</strong></p>
            <p>Email: {contactInfo?.email || "shipping@bmaafashion.com"}</p>
            <p>Phone: {contactInfo?.phone || "+91-84388 9620"}</p>
            <p>Support Hours: {contactInfo?.businessHours || "Monday to Saturday, 9 AM to 6 PM IST"}</p>
          </div>
        </section>
      </div>
    </div>
  );
}
