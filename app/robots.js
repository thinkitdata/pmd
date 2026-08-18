import { site } from "@/site.config";

// Same as sitemap.js — a route handler under the hood, so it must be declared
// static for `output: export` to emit it as a plain robots.txt.
export const dynamic = "force-static";

const BASE = process.env.NEXT_PUBLIC_SITE_URL || site.url;

export default function robots() {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/"] }],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
