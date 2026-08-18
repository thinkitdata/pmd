import { site, services } from "@/site.config";

// Next compiles sitemap.js into a route handler, and route handlers default to
// dynamic. With `output: export` there is no server to run one, so it has to be
// declared static — then it's written out as a plain sitemap.xml at build time.
export const dynamic = "force-static";

const BASE = process.env.NEXT_PUBLIC_SITE_URL || site.url;

export default function sitemap() {
  const now = new Date();
  return [
    { url: `${BASE}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/services`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/gallery`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/book`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/about`, lastModified: now, changeFrequency: "yearly", priority: 0.6 },
    // one indexable page per service — these are what rank for
    // "ceramic coating <town>" style searches
    ...services.map((s) => ({
      url: `${BASE}/book/${s.slug}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    })),
  ];
}
