import { useMemo } from "react";
import { useSEO } from "@/hooks/use-seo";
import { ORGANIZATION_DATA, generateBreadcrumbs } from "@/lib/structured-data-constants";

export default function PrivacyPolicy() {
  const policyStructuredData = useMemo(() => [
    ORGANIZATION_DATA,
    generateBreadcrumbs([
      { name: "Home", url: "/" },
      { name: "Privacy Policy", url: "/privacy-policy" },
    ]),
  ], []);

  useSEO({
    title: "Privacy Policy | Bmaa Fashion",
    description: "Learn how Bmaa Fashion collects, uses, and protects your personal information when you shop with us.",
    ogTitle: "Privacy Policy | Bmaa Fashion",
    ogDescription: "Understand how Bmaa Fashion protects your personal information and respects your privacy.",
    ogImage: "/attached_assets/bmaafashion.jpeg",
    structuredData: policyStructuredData,
  });

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <h1 className="mb-3 text-4xl font-bold" data-testid="heading-privacy-policy">
        Privacy Policy <span className="block mt-2 text-2xl font-semibold">தனியுரிமைக் கொள்கை</span>
      </h1>

      <div className="prose prose-green max-w-none space-y-6">
        <p className="text-muted-foreground"><strong>Effective Date:</strong> September 7, 2026</p>
        <p>
          At <strong>Bmaa Fashion</strong>, we respect your privacy and are committed to protecting your personal information.
          This Privacy Policy explains how we collect, use, share, and safeguard information when you visit our website,
          create an account, or place an order with us.
        </p>

        <section className="space-y-4">
          <h2 className="mt-8 text-2xl font-semibold">1. Information We Collect</h2>
          <p>We may collect information you provide directly to us, including when you place an order, contact us, or subscribe to our updates.</p>
          <ul className="list-disc space-y-2 pl-6">
            <li><strong>Contact details:</strong> your name, email address, phone number, billing address, and shipping address.</li>
            <li><strong>Order details:</strong> products ordered, order history, delivery preferences, and communications relating to your order.</li>
            <li><strong>Payment details:</strong> payment information needed to complete a purchase. Payments are handled by our authorised payment partners; we do not store complete card details on our servers.</li>
            <li><strong>Website information:</strong> device, browser, IP address, pages visited, and cookie preferences collected automatically when you use our website.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="mt-8 text-2xl font-semibold">2. How We Use Your Information</h2>
          <p>We use your information to:</p>
          <ul className="list-disc space-y-2 pl-6">
            <li>Process payments, confirm orders, and arrange delivery.</li>
            <li>Provide order updates, customer support, and respond to your enquiries.</li>
            <li>Improve our products, website, services, and shopping experience.</li>
            <li>Send promotional messages only where permitted by law or with your consent. You can opt out at any time.</li>
            <li>Detect, investigate, and help prevent fraud, misuse, or security issues.</li>
            <li>Meet our legal, tax, and accounting obligations.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="mt-8 text-2xl font-semibold">3. How We Share Information</h2>
          <p>We do not sell your personal information. We share it only when necessary with trusted third parties, such as:</p>
          <ul className="list-disc space-y-2 pl-6">
            <li>Payment processors that securely process your transaction.</li>
            <li>Delivery and logistics partners that deliver your order.</li>
            <li>Service providers supporting our website, communications, and business operations.</li>
            <li>Authorities or other parties where disclosure is required by law or needed to protect our rights, customers, or business.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="mt-8 text-2xl font-semibold">4. Payment and Data Security</h2>
          <p>
            We use reasonable technical and organisational safeguards to protect your personal information. Payment transactions are encrypted and processed by authorised payment providers. Although we work to protect your information, no internet transmission or storage system can be guaranteed to be completely secure.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="mt-8 text-2xl font-semibold">5. Cookies</h2>
          <p>
            We use cookies and similar technologies to keep the website working, remember items in your shopping cart and preferences, understand website usage, and improve your browsing experience. You can manage or block cookies through your browser settings; some website features may then not function properly.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="mt-8 text-2xl font-semibold">6. Your Choices and Rights</h2>
          <p>Subject to applicable law, you may request access to, correction of, or deletion of your personal information. You may also withdraw consent for marketing communications at any time by using the unsubscribe option or contacting us.</p>
          <p>To make a request, email us at <a href="mailto:privacy@bmaafashion.com">privacy@bmaafashion.com</a>.</p>
        </section>

        <section className="space-y-4">
          <h2 className="mt-8 text-2xl font-semibold">7. Third-Party Links</h2>
          <p>Our website may link to other websites. Bmaa Fashion is not responsible for the privacy practices or content of third-party sites. Please review their privacy policies before sharing information with them.</p>
        </section>

        <section className="space-y-4">
          <h2 className="mt-8 text-2xl font-semibold">8. Children's Privacy</h2>
          <p>Our website and services are not intended for children under 18. We do not knowingly collect personal information from children. If you believe a child has provided us personal information, please contact us so that we can take appropriate action.</p>
        </section>

        <section className="space-y-4">
          <h2 className="mt-8 text-2xl font-semibold">9. Changes to This Policy</h2>
          <p>We may update this Privacy Policy from time to time. Any updated version will be posted on this page with a revised effective date. We encourage you to review this page periodically.</p>
        </section>

        <section className="space-y-4">
          <h2 className="mt-8 text-2xl font-semibold">10. Contact Us</h2>
          <p>If you have questions about this Privacy Policy or how we handle your information, please contact us:</p>
          <div className="rounded-md bg-muted p-4">
            <p><strong>Bmaa Fashion</strong></p>
            <p>Email: <a href="mailto:privacy@bmaafashion.com">privacy@bmaafashion.com</a></p>
            <p>Phone: +91-84388 9620</p>
            <p>Address: 5/375, S. Kolathur, Indirapuri, Kovilambakkam, Chennai, Tamil Nadu 600129</p>
          </div>
        </section>
      </div>
    </div>
  );
}

