import { useMemo } from "react";
import { useSEO } from "@/hooks/use-seo";
import { ORGANIZATION_DATA, generateBreadcrumbs } from "@/lib/structured-data-constants";
import { useSiteSettings } from "@/hooks/useSiteSettings";

export default function ReturnPolicy() {
  const { policies, contactInfo } = useSiteSettings();
  const returnStructuredData = useMemo(() => [
    ORGANIZATION_DATA,
    generateBreadcrumbs([
      { name: "Home", url: "/" },
      { name: "Return Policy", url: "/return-policy" }
    ])
  ], []);

  useSEO({
    title: "Return & Refund Policy | Bmaafashion",
    description: "Bmaafashion Return & Refund Policy. 7 day hassle free returns on dress collections. Learn about our refund process, return shipping, and exchange policy.",
    ogTitle: "Return & Refund Policy | Bmaafashion",
    ogDescription: "Shop with confidence! Our flexible return policy offers 7 day returns, full refunds, and free return shipping on defective products.",
    ogImage: "/attached_assets/bmaafashion.jpeg",
    structuredData: returnStructuredData,
  });

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8" data-testid="heading-return-policy">Return & Refund Policy</h1>
      
      <div className="prose prose-green max-w-none space-y-6">
        <p className="text-muted-foreground">
          <strong>Last Updated:</strong> October 7, 2025
        </p>

        <p>
          At Bmaa Fashion, we want you to be completely satisfied with your purchase. If you're not
          happy with your order, we're here to help with our hassle free return and refund policy.
        </p>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold mt-8">1. Return Window</h2>
          <p>
            You have <strong>7 days</strong> from the date of delivery to initiate a return for most 
            products. Some products may have different return windows:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Standard Products:</strong> 7 days</li>
            <li><strong>Electronic Components:</strong> 7 days (must be unopened)</li>
            <li><strong>Growing Supplies:</strong> 7 days (must be unused and in original packaging)</li>
            <li><strong>Custom/Made to Order Items:</strong> Non returnable (unless defective)</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold mt-8">2. Return Eligibility</h2>
          <p>
            To be eligible for a return, items must meet the following conditions:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Product is unused and in the same condition as received</li>
            <li>Product is in original packaging with all accessories and documentation</li>
            <li>Product has no signs of installation, wear, or damage</li>
            <li>Return request is made within the applicable return window</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold mt-8">3. Non Returnable Items</h2>
          <p>
            The following items cannot be returned:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Custom or personalized hydroponic systems</li>
            <li>Seeds, nutrients, and growing media (unless defective)</li>
            <li>Products marked as "Final Sale" or "Non Returnable"</li>
            <li>Assembled or installed products</li>
            <li>Products without original packaging or missing components</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold mt-8">4. How to Initiate a Return</h2>
          <p>
            To start a return:
          </p>
          <ol className="list-decimal pl-6 space-y-2">
            <li>Log into your Bmaa Fashion account and go to Order History</li>
            <li>Select the order and click "Request Return"</li>
            <li>Choose the reason for return and provide any additional details</li>
            <li>Submit the return request and wait for approval (usually within 24 hours)</li>
            <li>Once approved, you'll receive a return shipping label via email</li>
          </ol>
          <p>
            Alternatively, contact our support team at returns@bmaafashion.com with your order number 
            and reason for return.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold mt-8">5. Return Shipping</h2>
          <p><strong>Return Shipping Costs:</strong></p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Defective/Damaged Products:</strong> We cover return shipping costs</li>
            <li><strong>Wrong Item Shipped:</strong> We cover return shipping costs</li>
            <li><strong>Change of Mind:</strong> Customer is responsible for return shipping costs</li>
            <li><strong>Buyer's Remorse:</strong> Customer is responsible for return shipping costs</li>
          </ul>
          <p>
            Use the prepaid return label we provide. If you choose a different shipping method, we 
            cannot guarantee reimbursement for those costs.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold mt-8">6. Inspection and Processing</h2>
          <p>
            Once we receive your return:
          </p>
          <ol className="list-decimal pl-6 space-y-2">
            <li>Our team will inspect the product within 2-3 business days</li>
            <li>We'll verify the product meets return eligibility criteria</li>
            <li>You'll receive an email notification about the inspection results</li>
            <li>If approved, your refund will be processed within 5-7 business days</li>
          </ol>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold mt-8">7. Refund Methods & Timeline (RBI Compliant)</h2>
          <p>
            <strong>Refund Processing:</strong> Refunds are initiated within 2 business days of return approval 
            and processed to your original payment method in compliance with Reserve Bank of India (RBI) guidelines:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Credit/Debit Card:</strong> 5-7 business days (as per RBI mandate for merchant refunds)</li>
            <li><strong>UPI/Net Banking:</strong> Instant to 3 business days (NPCI/RBI real time settlement)</li>
            <li><strong>Wallet Payments (Paytm/PhonePe):</strong> Instant to 2 business days</li>
            <li><strong>EMI/Buy Now Pay Later:</strong> 7-10 business days (processed through originating bank)</li>
          </ul>
          <p>
            <strong>Failed Refunds:</strong> If a refund fails due to incorrect bank details or closed account, 
            we will contact you within 48 hours to arrange an alternative refund method. Per RBI guidelines, 
            we may issue a demand draft or NEFT transfer to your updated bank details.
          </p>
          <p>
            <strong>Shipping Charges:</strong> Shipping charges are non refundable unless the return is due to 
            our error (wrong item, defective product, damaged during shipping).
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold mt-8">8. Exchanges</h2>
          <p>
            We currently do not offer direct exchanges. If you need a different product:
          </p>
          <ol className="list-decimal pl-6 space-y-2">
            <li>Return your original item for a refund</li>
            <li>Place a new order for the desired product</li>
          </ol>
          <p>
            For defective products, we'll expedite a replacement shipment upon receiving the return.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold mt-8">9. Damaged or Defective Products</h2>
          <p>
            If you receive a damaged or defective product:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Contact us within 48 hours of delivery</li>
            <li>Provide clear photos of the damage/defect and packaging</li>
            <li>We'll arrange for immediate pickup and replacement</li>
            <li>No return shipping costs for you</li>
          </ul>
          <p>
            For damaged shipments, please retain all original packaging until the issue is resolved.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold mt-8">10. Cancellations</h2>
          <p>
            You can cancel your order before it ships:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Log into your account and go to Order History</li>
            <li>Click "Cancel Order" if the option is available</li>
            <li>Full refund will be processed within 3-5 business days</li>
          </ul>
          <p>
            Once an order has shipped, you must follow the return process to get a refund.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold mt-8">11. Warranty Claims</h2>
          <p>
            Many of our products come with manufacturer warranties. For warranty claims:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Contact us with your order number and issue description</li>
            <li>We'll coordinate with the manufacturer on your behalf</li>
            <li>Warranty terms vary by product (typically 6 months to 2 years)</li>
            <li>Warranty does not cover misuse, damage, or normal wear and tear</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold mt-8">12. Restocking Fees</h2>
          <p>
            Restocking fees may apply in certain situations:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Large Equipment:</strong> 15% restocking fee may apply</li>
            <li><strong>Opened Electronics:</strong> 10% restocking fee may apply</li>
            <li><strong>Defective/Wrong Items:</strong> No restocking fee</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold mt-8">13. International Returns</h2>
          <p>
            We currently only ship within India. All return policies apply to domestic orders only.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold mt-8">14. Contact Us</h2>
          <p>
            For return or refund assistance, please contact us:
          </p>
          <div className="bg-muted p-4 rounded-md">
            <p><strong>Bmaa Fashion Returns Department</strong></p>
            <p>Email: {contactInfo?.email || "returns@bmaafashion.com"}</p>
            <p>Phone: {contactInfo?.phone || "+91-84388 9620"}</p>
            <p>Support Hours: {contactInfo?.businessHours || "Monday to Saturday, 9 AM to 6 PM IST"}</p>
          </div>
        </section>
      </div>
    </div>
  );
}
