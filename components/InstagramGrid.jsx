import Link from "next/link";
import { site, instagramFallback } from "@/site.config";
import { getInstagramPosts } from "@/lib/instagram";
import Reveal from "@/components/Reveal";

function VideoGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M4 6h11a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2zm14 4l4-2.5v9L18 14v-4z" />
    </svg>
  );
}

/**
 * Server component. The access token is read on the server and never shipped
 * to the browser. If the API is unreachable — or you haven't set a token yet —
 * this quietly renders the curated grid from site.config instead, so the
 * section always looks finished.
 */
export default async function InstagramGrid({ limit = 6 }) {
  const live = await getInstagramPosts(limit);
  const posts =
    live.length > 0
      ? live
      : instagramFallback.slice(0, limit).map((src, i) => ({
          id: `fallback-${i}`,
          url: src,
          permalink: site.social.instagram,
          caption: "",
          isVideo: false,
        }));

  return (
    <div className="shell shell--wide">
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "1.5rem",
          alignItems: "flex-end",
          justifyContent: "space-between",
        }}
      >
        <div>
          <Reveal as="p" className="eyebrow">
            Latest from the driveway
          </Reveal>
          <Reveal
            as="h2"
            i={1}
            className="u-mt-md"
            style={{ fontSize: "var(--step-3)" }}
          >
            {site.social.instagramHandle}
          </Reveal>
        </div>
        <Reveal i={2}>
          <Link
            className="link-quiet"
            href={site.social.instagram}
            target="_blank"
            rel="noopener noreferrer"
          >
            Follow on Instagram
          </Link>
        </Reveal>
      </div>

      <div className="ig-grid">
        {posts.map((post, i) => (
          <Reveal
            key={post.id}
            i={i}
            as="a"
            className="ig-tile"
            href={post.permalink}
            target="_blank"
            rel="noopener noreferrer"
          >
            {/* Instagram CDN URLs are signed and expire; a plain img keeps this
                simple and avoids caching a URL that will 403 next week. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.url}
              alt={post.caption || "Instagram post"}
              loading="lazy"
            />
            {post.isVideo && (
              <span className="ig-tile__badge">
                <VideoGlyph />
              </span>
            )}
          </Reveal>
        ))}
      </div>

      {live.length === 0 && process.env.NODE_ENV === "development" && (
        <p
          style={{
            marginTop: "1rem",
            fontSize: "0.75rem",
            color: "var(--fg-faint)",
          }}
        >
          Showing the curated fallback grid — set INSTAGRAM_ACCESS_TOKEN in
          .env.local to pull live posts. (This note only appears in dev.)
        </p>
      )}
    </div>
  );
}
