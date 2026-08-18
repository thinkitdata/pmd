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
    // Driven from site.config so the structured data can never drift from the
    // hours shown in the footer. These were previously hardcoded here, which
    // meant changing the visible hours silently left Google with the old ones.
    openingHoursSpecification: (site.openingHours || []).map((h) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: h.days,
      opens: h.opens,
      closes: h.closes,
    })),
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
        // Don't tell Google you sell something you can't deliver yet.
        // PreOrder is the honest term for "announced, not yet available".
        availability: s.comingSoon
          ? "https://schema.org/PreOrder"
          : "https://schema.org/InStock",
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
