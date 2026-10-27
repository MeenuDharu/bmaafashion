
import { useMemo } from "react";
import { useSEO } from "@/hooks/use-seo";
import { ORGANIZATION_DATA, generateBreadcrumbs } from "@/lib/structured-data-constants";
import { useSiteSettings } from "@/hooks/useSiteSettings";

export default function ShippingPolicy() {
  const { contactInfo } = useSiteSettings();

  const shippingStructuredData = useMemo(() => [
    ORGANIZATION_DATA,
    generateBreadcrumbs([
      { name: "Home", url: "/" },
      { name: "Shipping Policy", url: "/shipping-policy" }
    ])
  ], []);

  useSEO({
    title: "Shipping Policy | Bmaafashion",
    description:
      "Bmaa Fashion's dispatch, delivery, undelivered parcel, and reshipment policies for made-to-order fashion products.",
    ogTitle: "Shipping Policy | Bmaafashion",
    ogDescription:
      "Learn about manufacturing time, dispatch timelines, delivery estimates, and reshipment charges at Bmaa Fashion.",
    ogImage: "/attached_assets/bmaafashion.jpeg",
    structuredData: shippingStructuredData,
  });

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1
        className="text-4xl font-bold mb-8"
        data-testid="heading-shipping-policy"
      >
        Shipping Policy
      </h1>

      <div className="prose prose-green max-w-none space-y-6">
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold mt-8">
            1. Dispatch &amp; Delivery Policy
          </h2>

          <p>
            All products are made-to-order. Once an order is placed, we will
            begin the manufacturing/stitching process for the product.
            Therefore, products will be dispatched within 10–15 working days
            from the date of order, depending on the manufacturing and
            stitching process.
          </p>

          <p>
            Once the product is dispatched, the estimated delivery time is
            5–8 working days, depending on the customer&apos;s location and
            the courier service.
          </p>

          <p>
            In some cases, delivery delays may occur due to courier-related
            issues, including unserviceable locations, weather conditions,
            or other unavoidable circumstances. If such delays happen,
            customers may contact us via WhatsApp, and we will assist in
            coordinating with the courier to resolve the issue.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold mt-8">
            2. Undelivered &amp; Reshipment Policy
          </h2>

          <p>
            If a parcel is undelivered due to an incorrect address,
            incorrect phone number, or non-response to courier calls,
            the customer must bear the reshipment charges.
          </p>

          <p>
            If a parcel is returned due to the location being unserviceable,
            we will reship the product without any additional charges.
          </p>

          <p>
            Reshipment will be processed only after the parcel is received
            back from the respective courier service.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold mt-8">3. Contact Us</h2>

          <p>
            For shipping-related questions or delivery concerns, please
            contact us using the details below.
          </p>

          <div className="bg-muted p-4 rounded-md">
            <p>
              <strong>Bmaa Fashion Shipping Support</strong>
            </p>
            <p>
              Email: {contactInfo?.email || "shipping@bmaafashion.com"}
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
