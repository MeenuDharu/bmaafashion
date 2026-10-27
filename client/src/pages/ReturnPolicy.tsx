
import { useMemo } from "react";
import { useSEO } from "@/hooks/use-seo";
import { ORGANIZATION_DATA, generateBreadcrumbs } from "@/lib/structured-data-constants";
import { useSiteSettings } from "@/hooks/useSiteSettings";

export default function ReturnPolicy() {
  const { contactInfo } = useSiteSettings();

  const returnStructuredData = useMemo(
    () => [
      ORGANIZATION_DATA,
      generateBreadcrumbs([
        { name: "Home", url: "/" },
        { name: "Return Policy", url: "/return-policy" },
      ]),
    ],
    []
  );

  useSEO({
    title: "Exchange, Return & Refund Policy | Bmaafashion",
    description:
      "Read Bmaa Fashion's exchange, return, refund, cancellation, and exchange shipping policies.",
    ogTitle: "Exchange, Return & Refund Policy | Bmaafashion",
    ogDescription:
      "Learn about exchange eligibility, unboxing video requirements, refunds, cancellations, and exchange shipping responsibility.",
    ogImage: "/attached_assets/bmaafashion.jpeg",
    structuredData: returnStructuredData,
  });

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1
        className="text-4xl font-bold mb-8"
        data-testid="heading-return-policy"
      >
        Exchange, Return &amp; Refund Policy
      </h1>

      <div className="prose prose-green max-w-none space-y-6">
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold mt-8">
            1. Exchange Policy
          </h2>

          <h3 className="text-xl font-semibold">
            Parcel Opening Video Required:
          </h3>
          <p>
            To raise any complaint regarding a damaged or incorrect product,
            please ensure you record a full unboxing video from start to end
            without any pause or edits. This is mandatory for all exchange
            requests.
          </p>

          <p>
            Exchange is only applicable for damaged items, supported with
            valid unboxing video proof.
          </p>

          <p>
            If an exchange is approved, the replacement product will be
            delivered within 7 to 12 working days after we receive and verify
            the returned item.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold mt-8">
            2. Return and Refund Policy
          </h2>

          <p>
            Returns are not accepted for any products under any circumstances.
          </p>

          <p>
            Customers are requested to review all product details carefully
            before placing an order.
          </p>

          <p>
            We do not offer a general refund policy.
          </p>

          <p>
            However, in rare and exceptional cases where a refund is deemed
            necessary, the refund will be initiated only through the original
            website payment gateway used at the time of purchase.
          </p>

          <p>
            Refund processing may take 3–5 working days. The refunded amount
            will be credited to the same payment method used for the
            transaction. Customers are advised to check their bank statement
            to confirm receipt of the refund.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold mt-8">
            3. Cancellation Policy
          </h2>

          <p>
            Orders cannot be cancelled or modified once confirmed.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold mt-8">
            4. Exchange Shipping Responsibility
          </h2>

          <p>
            For any unavoidable exchanges, the return courier must be arranged
            by the customer.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold mt-8">
            5. Contact Us
          </h2>

          <p>
            For exchange, return, or refund-related questions, please contact
            us using the details below.
          </p>

          <div className="bg-muted p-4 rounded-md">
            <p>
              <strong>Bmaa Fashion Support</strong>
            </p>
            <p>
              Email: {contactInfo?.email || "returns@bmaafashion.com"}
            </p>
            <p>
              Phone: {contactInfo?.phone || "+91-84388 9620"}
            </p>
            <p>
              Support Hours:{" "}
              {contactInfo?.businessHours ||
                "Sunday to Saturday, 10:00 AM to 09:30 PM IST"}
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
