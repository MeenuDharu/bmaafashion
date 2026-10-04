export const SITE_URL = typeof window !== 'undefined' ? window.location.origin : 'https://bmaafashion.com';

export const ORGANIZATION_DATA = {
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: "Bmaafashion",
  legalName: "Bmaafashion Fashion Solutions",
  description: "Premium fashion collections and curated styles. Your trusted partner for trendy and timeless fashion.",
  url: SITE_URL,
  logo: {
    "@type": "ImageObject",
    url: `${SITE_URL}/attached_assets/bmaafashion.jpeg`,
    width: 400,
    height: 400
  },
  image: `${SITE_URL}/attached_assets/bmaafashion.jpeg`,
  foundingDate: "2021",
  founder: {
    "@type": "Organization",
    name: "EEB Engineering"
  },
  address: {
    "@type": "PostalAddress",
    streetAddress: "5/375, S. Kolathur, Indirapuri, Kovilambakkam",
    addressLocality: "Chennai",
    addressRegion: "Tamil Nadu",
    postalCode: "600129",
    addressCountry: "IN"
  },
  contactPoint: [
    {
      "@type": "ContactPoint",
      telephone: "+91-84388-69979",
      contactType: "customer service",
      availableLanguage: ["English", "Tamil", "Hindi"],
      areaServed: "IN"
    },
    {
      "@type": "ContactPoint",
      email: "info@bmaafashion.com",
      contactType: "sales"
    }
  ],
  sameAs: [
    "https://www.facebook.com/profile.php?id=61578506319123",
    "https://www.instagram.com/spire_greens",
    "https://www.linkedin.com/company/Bmaa Fashion/",
    "https://www.youtube.com/@Bmaa Fashion"
  ],
  areaServed: {
    "@type": "Country",
    name: "India"
  },
  priceRange: "$$",
  currenciesAccepted: "INR",
  paymentAccepted: ["Cash", "Credit Card", "Debit Card", "UPI", "Net Banking"]
};

export const WEBSITE_DATA = {
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  url: SITE_URL,
  name: "Bmaafashion",
  description: "Curated fashion collections with trendy and timeless styles",
  publisher: {
    "@id": `${SITE_URL}/#organization`
  },
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${SITE_URL}/products?search={search_term_string}`
    },
    "query-input": "required name=search_term_string"
  }
};

export const LOCAL_BUSINESS_DATA = {
  "@type": "LocalBusiness",
  "@id": `${SITE_URL}/#localbusiness`,
  name: "Bmaa Fashion",
  image: `${SITE_URL}/attached_assets/bmaafashion.jpeg`,
  priceRange: "$$",
  telephone: "+91-84388-69979",
  email: "info@bmaafashion.com",
  address: {
    "@type": "PostalAddress",
    streetAddress: "5/375, S. Kolathur, Indirapuri, Kovilambakkam",
    addressLocality: "Chennai",
    addressRegion: "Tamil Nadu",
    postalCode: "600129",
    addressCountry: "IN"
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 12.9516,
    longitude: 80.1946
  },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      opens: "09:00",
      closes: "18:00"
    }
  ],
  url: SITE_URL,
  sameAs: [
    "https://www.facebook.com/bmaafashion",
    "https://www.instagram.com/bmaafashion",
    "https://www.linkedin.com/company/bmaafashion/",
    "https://www.youtube.com/@bmaafashion"
  ]
};

export const SERVICES_DATA = [
  {
    "@type": "Service",
    name: "Custom Farm Design & Setup",
    description: "End-to-end hydroponic farm design and installation including site analysis, 2D/3D layouts, material sourcing, and plug-and-play systems.",
    provider: {
      "@id": `${SITE_URL}/#organization`
    },
    areaServed: {
      "@type": "Country",
      name: "India"
    },
    serviceType: "Agricultural Consulting"
  },
  {
    "@type": "Service",
    name: "High Value Crop Planning",
    description: "Data-backed crop strategies to maximize yield and profitability with market-aligned hydroponic crop selection.",
    provider: {
      "@id": `${SITE_URL}/#organization`
    },
    areaServed: {
      "@type": "Country",
      name: "India"
    },
    serviceType: "Agricultural Consulting"
  },
  {
    "@type": "Service",
    name: "Training & Education",
    description: "Comprehensive hydroponic farming training programs covering nutrient management, pest control, and commercial operations.",
    provider: {
      "@id": `${SITE_URL}/#organization`
    },
    areaServed: {
      "@type": "Country",
      name: "India"
    },
    serviceType: "Training"
  },
  {
    "@type": "Service",
    name: "Automation Solutions",
    description: "Smart farming technology integration including IoT sensors, automated nutrient dosing, and remote monitoring systems.",
    provider: {
      "@id": `${SITE_URL}/#organization`
    },
    areaServed: {
      "@type": "Country",
      name: "India"
    },
    serviceType: "Agricultural Technology"
  },
  {
    "@type": "Service",
    name: "Annual Maintenance Contract (AMC)",
    description: "Ongoing support and maintenance services for hydroponic systems including scheduled visits, troubleshooting, and technical support.",
    provider: {
      "@id": `${SITE_URL}/#organization`
    },
    areaServed: {
      "@type": "Country",
      name: "India"
    },
    serviceType: "Maintenance"
  }
];

export function generateBreadcrumbs(items: { name: string; url: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${SITE_URL}${item.url}`
    }))
  };
}

export function generateProductSchema(product: {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number | null;
  imageUrl?: string | null;
  category?: string | null;
  stockQuantity?: number;
  rating?: number | null;
  reviewCount?: number;
}) {
  const availability = (product.stockQuantity ?? 0) > 0 
    ? "https://schema.org/InStock" 
    : "https://schema.org/OutOfStock";

  return {
    "@type": "Product",
    "@id": `${SITE_URL}/products/${product.id}`,
    name: product.name,
    description: product.description,
    image: product.imageUrl || `${SITE_URL}/attached_assets/bmaafashion.jpeg`,
    brand: {
      "@type": "Brand",
      name: "Bmaa Fashion"
    },
    category: product.category || "Hydroponic Systems",
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/products/${product.id}`,
      priceCurrency: "INR",
      price: product.price,
      priceValidUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      availability,
      seller: {
        "@id": `${SITE_URL}/#organization`
      },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: {
          "@type": "MonetaryAmount",
          value: 0,
          currency: "INR"
        },
        shippingDestination: {
          "@type": "DefinedRegion",
          addressCountry: "IN"
        },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: {
            "@type": "QuantitativeValue",
            minValue: 1,
            maxValue: 3,
            unitCode: "DAY"
          },
          transitTime: {
            "@type": "QuantitativeValue",
            minValue: 3,
            maxValue: 7,
            unitCode: "DAY"
          }
        }
      }
    },
    ...(product.rating && product.reviewCount && product.reviewCount > 0 ? {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: product.rating,
        reviewCount: product.reviewCount,
        bestRating: 5,
        worstRating: 1
      }
    } : {})
  };
}

export function generateFAQSchema(faqs: { question: string; answer: string }[]) {
  return {
    "@type": "FAQPage",
    mainEntity: faqs.map(faq => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer
      }
    }))
  };
}

export function generateContactPageSchema() {
  return {
    "@type": "ContactPage",
    "@id": `${SITE_URL}/contact`,
    name: "Contact Bmaa Fashion",
    description: "Get in touch with Bmaa Fashion for hydroponic system inquiries, technical support, or business partnerships.",
    url: `${SITE_URL}/contact`,
    mainEntity: {
      "@id": `${SITE_URL}/#organization`
    }
  };
}

export function generateItemListSchema(products: { name: string; url: string; position: number }[]) {
  return {
    "@type": "ItemList",
    itemListElement: products.map(product => ({
      "@type": "ListItem",
      position: product.position,
      name: product.name,
      url: product.url.startsWith('http') ? product.url : `${SITE_URL}${product.url}`
    }))
  };
}
