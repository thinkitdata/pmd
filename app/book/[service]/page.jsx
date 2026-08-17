import { notFound } from "next/navigation";
import { site, services } from "@/site.config";
import BookingPanel from "@/components/BookingPanel";

/**
 * One prerendered booking page per service: /book/ceramic, /book/refresh, …
 *
 * This replaced an earlier `/book?service=ceramic` query-string version. Two
 * reasons, and the second is the one that mattered:
 *  1. Each service gets its own indexable URL, title and description — a real
 *     local-SEO gain over one generic page.
 *  2. Reading searchParams forces the route to render on a server. Prerendering
 *     one page per service keeps the entire site static, which is what lets it
 *     deploy anywhere, including plain S3 + CloudFront.
 */
export function generateStaticParams() {
  return services.map((s) => ({ service: s.slug }));
}

export async function generateMetadata({ params }) {
  const { service: slug } = await params;
  const service = services.find((s) => s.slug === slug);
  if (!service) return {};
  return {
    title: `Reserve ${service.name}`,
    description: `${service.summary} ${service.price}, ${service.duration}. Mobile service across ${site.serviceArea.label}.`,
    alternates: { canonical: `/book/${service.slug}` },
  };
}

// Anything not in generateStaticParams is a 404 rather than a server render —
// required for `output: "export"`, and correct behaviour regardless.
export const dynamicParams = false;

export default async function BookServicePage({ params }) {
  const { service: slug } = await params;
  const service = services.find((s) => s.slug === slug);
  if (!service) notFound();

  return (
    <main>
      <BookingPanel service={service} />
    </main>
  );
}
