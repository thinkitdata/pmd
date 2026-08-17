import { site, services } from "@/site.config";

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
