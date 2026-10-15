import { useMemo } from "react";
import { useSEO } from "@/hooks/use-seo";
import { ORGANIZATION_DATA, generateBreadcrumbs } from "@/lib/structured-data-constants";

export default function TermsOfService() {
  const tosStructuredData = useMemo(() => [
    ORGANIZATION_DATA,
    generateBreadcrumbs([
      { name: "Home", url: "/" },
      { name: "Terms of Service", url: "/terms-of-service" },
    ]),
  ], []);

  useSEO({
    title: "Terms of Service | Bmaa Fashion",
    description: "Read the terms, ordering conditions, and shipping policy for Bmaa Fashion.",
    ogTitle: "Terms of Service | Bmaa Fashion",
    ogDescription: "Understand the terms that apply when you shop with Bmaa Fashion.",
    ogImage: "/attached_assets/bmaafashion.jpeg",
    structuredData: tosStructuredData,
  });

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <h1 className="mb-3 text-4xl font-bold" data-testid="heading-terms-of-service">
        Terms of Service <span className="block mt-2 text-2xl font-semibold">சேவை விதிமுறைகள்</span>
      </h1>

      <div className="prose prose-green max-w-none space-y-6">
        <p className="text-muted-foreground"><strong>Effective Date:</strong> September 7, 2026</p>
        <p>
          Welcome to <strong>Bmaa Fashion</strong>. By accessing our website or placing an order, you agree to these Terms of Service and our Privacy Policy. Please read them before shopping with us.
        </p>

        <section className="space-y-4">
          <h2 className="mt-8 text-2xl font-semibold">1. Eligibility and Use of Our Website</h2>
          <p>By placing an order, you confirm that you are at least 18 years old, or that you are using the website with the supervision and consent of a parent or legal guardian. You agree to use our website only for lawful purposes and to provide accurate information when placing an order.</p>
        </section>

        <section className="space-y-4">
          <h2 className="mt-8 text-2xl font-semibold">2. Product Information and Availability</h2>
          <p>
            We make every effort to display our dresses, fabrics, colours, sizes, and styles accurately. Colours may appear slightly different depending on your device, screen settings, lighting, or the nature of the fabric. Product availability is subject to change, and we may limit quantities or discontinue an item at any time.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="mt-8 text-2xl font-semibold">3. Pricing and Payment</h2>
          <p>
            Prices are displayed in Indian Rupees (INR), unless stated otherwise. Prices, offers, and availability may change without notice. The final payable amount, including applicable delivery charges and taxes where applicable, will be shown at checkout. You must provide accurate payment information and be authorised to use the selected payment method.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="mt-8 text-2xl font-semibold">4. Orders and Acceptance</h2>
          <p>
            An order confirmation acknowledges that we have received your order; it does not mean that the order has been accepted. We may refuse, cancel, or limit an order if an item is unavailable, there is an error in the price or product information, payment cannot be verified, or fraud or misuse is suspected. If payment has already been made for a cancelled order, we will arrange a refund in accordance with the applicable payment process.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="mt-8 text-2xl font-semibold">5. Shipping Policy <span className="text-lg font-medium">ஷிப்பிங் கொள்கை</span></h2>
          <p>Thank you for shopping with Bmaa Fashion. The following shipping terms apply to your order:</p>
          <ul className="list-disc space-y-2 pl-6">
            <li><strong>Processing time:</strong> Orders are generally processed within 1–3 business days. Orders are not processed or dispatched on weekends or public holidays.</li>
            <li><strong>Shipping charges and estimates:</strong> Shipping charges are calculated and shown at checkout. Standard delivery generally takes 5–7 business days after dispatch, depending on your location and the delivery partner.</li>
            <li><strong>Delays:</strong> Delivery estimates are not guaranteed. Weather, holidays, courier capacity, or circumstances outside our control may cause delays.</li>
            <li><strong>Tracking:</strong> Once your order is dispatched, we will send a shipment confirmation with tracking details when they are available.</li>
            <li><strong>Incorrect address:</strong> Please check your delivery address carefully. Bmaa Fashion cannot be responsible for delays or losses caused by an incomplete or incorrect address supplied at checkout.</li>
            <li><strong>Damaged deliveries:</strong> If your parcel or product arrives damaged, contact us promptly with clear photos of the package and item so we can assist you.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="mt-8 text-2xl font-semibold">6. Returns and Refunds</h2>
          <p>Returns, exchanges, and refunds are governed by our applicable Return Policy. Please review that policy and the product details before placing an order, as eligibility may vary by product.</p>
        </section>

        <section className="space-y-4">
          <h2 className="mt-8 text-2xl font-semibold">7. Intellectual Property</h2>
          <p>All website content, including images, product descriptions, designs, logos, text, and graphics, belongs to Bmaa Fashion or its licensors. You may not copy, reproduce, distribute, or use this content without our prior written permission.</p>
        </section>

        <section className="space-y-4">
          <h2 className="mt-8 text-2xl font-semibold">8. Limitation of Liability</h2>
          <p>To the extent permitted by law, Bmaa Fashion will not be liable for indirect, incidental, or consequential losses arising from your use of the website or purchase of products. Nothing in these terms limits rights that cannot be excluded under applicable law.</p>
        </section>

        <section className="space-y-4">
          <h2 className="mt-8 text-2xl font-semibold">9. Changes to These Terms</h2>
          <p>We may update these Terms of Service from time to time. Changes take effect when posted on this page. Your continued use of our website after changes are posted means that you accept the updated terms.</p>
        </section>

        <section className="space-y-4">
          <h2 className="mt-8 text-2xl font-semibold">10. Contact Us</h2>
          <p>If you have questions about these Terms of Service or your order, please contact us:</p>
          <div className="rounded-md bg-muted p-4">
            <p><strong>Bmaa Fashion</strong></p>
            <p>Email: <a href="mailto:support@bmaafashion.com">support@bmaafashion.com</a></p>
            <p>Phone: +91-84388 9620</p>
            <p>Address: 5/375, S. Kolathur, Indirapuri, Kovilambakkam, Chennai, Tamil Nadu 600129</p>
          </div>
        </section>
      </div>
    </div>
  );
}
