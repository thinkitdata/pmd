import { site, services } from "@/site.config";

/**
 * Structured data for local search.
 *
 * This is the single highest-leverage SEO thing on the site for a mobile
 * business: it tells Google you are an AutoDetailing service, where you'll
 * travel, what you charge, and when you're open — which is what feeds the
 * map pack and the rich result. Keep it in sync with your Google Business
 * Profile; conflicting information is worse than none.
 */
export default function LocalBusinessJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "AutoDetailing",
    "@id": `${site.url}/#business`,
    name: site.name,
    // The registered entity. Google cross-references this against your
    // Business Profile and state records — keep all three identical.
    legalName: site.legalName || site.name,
    description: site.description,
    url: site.url,
    telephone: site.phone,
    email: site.email,
    image: `${site.url}/images/og.jpg`,
    priceRange: "$$$",
    // A mobile business has no storefront — declare the area, not an address.
    areaServed: {
      "@type": "GeoCircle",
      geoMidpoint: {
        "@type": "GeoCoordinates",
        latitude: site.serviceArea.lat,
        longitude: site.serviceArea.lng,
      },
      geoRadius: site.serviceArea.radiusMiles * 1609,
    },
    serviceArea: site.serviceArea.towns.map((t) => ({
      "@type": "City",
      name: t,
    })),
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
        ],
        opens: "08:00",
        closes: "18:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Saturday"],
        opens: "09:00",
        closes: "16:00",
      },
    ],
    sameAs: Object.values(site.social).filter(
      (v) => typeof v === "string" && v.startsWith("http")
    ),
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Detailing services",
      itemListElement: services.map((s) => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: s.name,
          description: s.summary,
        },
        priceCurrency: "USD",
        price: s.price.replace(/[^0-9.]/g, ""),
      })),
    },
  };

  return (
    <script
      type="application/ld+json"
      // Structured data is generated from our own config, not user input.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
