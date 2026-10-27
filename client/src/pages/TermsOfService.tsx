
import { useMemo } from "react";
import { useSEO } from "@/hooks/use-seo";
import { ORGANIZATION_DATA, generateBreadcrumbs } from "@/lib/structured-data-constants";

export default function TermsOfService() {
  const tosStructuredData = useMemo(
    () => [
      ORGANIZATION_DATA,
      generateBreadcrumbs([
        { name: "Home", url: "/" },
        { name: "Terms and Conditions", url: "/terms-of-service" },
      ]),
    ],
    []
  );

  useSEO({
    title: "Terms and Conditions | Bmaa Fashion",
    description:
      "Read the Terms and Conditions for using the Bmaa Fashion website.",
    ogTitle: "Terms and Conditions | Bmaa Fashion",
    ogDescription:
      "Understand the terms and conditions that apply when using the Bmaa Fashion website.",
    ogImage: "/attached_assets/bmaafashion.jpeg",
    structuredData: tosStructuredData,
  });

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <h1
        className="mb-3 text-4xl font-bold"
        data-testid="heading-terms-of-service"
      >
        Terms and Conditions
      </h1>

      <div className="prose prose-green max-w-none space-y-6">
        <p>
          By accessing or using our website at{" "}
          <a
            href="https://www.bmaafashion.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            https://www.bmaafashion.com
          </a>
          , you agree to be bound by these Terms and Conditions and all
          applicable laws and regulations. If you do not agree with any part
          of these terms, please do not use our website.
        </p>

        <section className="space-y-4">
          <h2 className="mt-8 text-2xl font-semibold">
            1. Use of Website
          </h2>
          <p>
            You may browse our website and submit comments or inquiries where
            applicable. You agree not to use the website for any unlawful,
            illegal, or prohibited activity.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="mt-8 text-2xl font-semibold">
            2. Comments and User-Generated Content
          </h2>
          <p>
            When you leave comments on our website, we collect the data shown
            in the comments form, along with your IP address and browser user
            agent string to help detect spam. Approved comments may be visible
            to the public along with your profile image if you use the Gravatar
            service.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="mt-8 text-2xl font-semibold">
            3. Intellectual Property
          </h2>
          <p>
            All content on this website, including text, images, logos,
            graphics, and design elements, is the exclusive property of
            Blacklovers unless otherwise stated. Any reproduction, duplication,
            copying, or redistribution of content without prior written
            permission is strictly prohibited.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="mt-8 text-2xl font-semibold">
            4. Media Uploads
          </h2>
          <p>
            If you upload images to the website, you should avoid uploading
            images with embedded location data (EXIF GPS). Visitors to the
            website can download and extract location data from such images.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="mt-8 text-2xl font-semibold">
            5. Third-Party Content
          </h2>
          <p>
            This website may include embedded content such as videos, images,
            or articles from third-party websites. Embedded content from other
            websites behaves in the same way as if the visitor has visited the
            other website directly. These third-party websites may collect
            data about you, use cookies, embed additional third-party
            tracking, and monitor your interaction with that embedded
            content.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="mt-8 text-2xl font-semibold">
            6. Account Responsibilities
          </h2>
          <p>
            If you create an account on our website, you are responsible for
            maintaining the confidentiality of your account credentials and
            for all activities that occur under your account.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="mt-8 text-2xl font-semibold">
            7. Modifications to Terms
          </h2>
          <p>
            We reserve the right to update, modify, or replace these Terms and
            Conditions at any time without prior notice. Continued use of the
            website after any changes constitutes acceptance of the revised
            terms.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="mt-8 text-2xl font-semibold">
            8. Governing Law
          </h2>
          <p>
            These Terms and Conditions are governed by and construed in
            accordance with the laws of India.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="mt-8 text-2xl font-semibold">
            9. Contact Information
          </h2>
          <div className="rounded-md bg-muted p-4">
            <p>
              <strong>Email:</strong>{" "}
              <a href="mailto:bmaafahion@gmail.com">
                bmaafahion@gmail.com
              </a>
            </p>
            <p>
              <strong>Address:</strong> 62/75 karuku Main Road, Menambedu,
              Ambattur, Chennai 600053
            </p>
            <p>
              <strong>What's up:</strong>{" "}
              <a href="https://wa.me/918438896206" target="_blank" rel="noopener noreferrer">
                84388 96206
              </a>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
