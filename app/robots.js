import { site } from "@/site.config";

const BASE = process.env.NEXT_PUBLIC_SITE_URL || site.url;

export default function robots() {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/"] }],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
