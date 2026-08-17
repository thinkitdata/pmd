/**
 * Static export is the default and the only path you need.
 *
 * `next build` produces a plain `out/` directory of HTML, CSS, JS and images.
 * No server, no Lambda, no host that has to understand which Next.js version
 * built it. That's what makes this deployable to Amplify, S3+CloudFront, or
 * anywhere else, forever. See AWS-DEPLOYMENT.md for the reasoning.
 *
 * If you ever need real server rendering (customer login, live pricing, a
 * database), set SERVER_BUILD=1 and deploy somewhere that runs Node.
 */
const SERVER = process.env.SERVER_BUILD === "1";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  ...(!SERVER && {
    output: "export",
    // No server means no image optimiser. The site uses plain <img> for remote
    // media anyway, so this costs nothing.
    images: { unoptimized: true },
    // Emits /book/index.html rather than /book.html — what a bare S3 origin
    // needs to resolve directory-style URLs.
    trailingSlash: true,
  }),

  ...(SERVER && {
    images: {
      remotePatterns: [
        { protocol: "https", hostname: "*.cdninstagram.com" },
        { protocol: "https", hostname: "*.fbcdn.net" },
        { protocol: "https", hostname: "videodelivery.net" },
        { protocol: "https", hostname: "customer-*.cloudflarestream.com" },
      ],
      formats: ["image/avif", "image/webp"],
    },
    async headers() {
      return [
        {
          source: "/video/:path*",
          headers: [
            { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
          ],
        },
        {
          source: "/(.*)",
          headers: [
            { key: "X-Content-Type-Options", value: "nosniff" },
            { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
            {
              key: "Permissions-Policy",
              value: "camera=(), microphone=(), geolocation=()",
            },
          ],
        },
      ];
    },
  }),
};

export default nextConfig;
