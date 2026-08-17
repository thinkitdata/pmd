/**
 * ============================================================================
 * Instagram feed — server side only.
 * ============================================================================
 *
 * Uses the "Instagram API with Instagram Login" (graph.instagram.com), which is
 * what replaced the retired Basic Display API. You need an Instagram
 * Business or Creator account; a Facebook Page is NOT required.
 *
 * Scope needed to read your own posts: `instagram_business_basic`.
 *
 * Design notes:
 *  - The token never reaches the browser. This module only ever runs on the
 *    server, and the client gets plain image URLs.
 *  - Results are cached for an hour via Next's fetch cache, so a busy day
 *    costs one API call per hour, not one per visitor.
 *  - Every failure path returns an empty array rather than throwing. A lapsed
 *    token should degrade the page to a curated grid, never break it.
 */

const GRAPH = "https://graph.instagram.com";

const FIELDS = [
  "id",
  "caption",
  "media_type",
  "media_url",
  "permalink",
  "thumbnail_url",
  "timestamp",
].join(",");

/**
 * @param {number} limit how many posts to return
 * @returns {Promise<Array<{id:string,url:string,permalink:string,caption:string,isVideo:boolean}>>}
 */
export async function getInstagramPosts(limit = 6) {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!token) return [];

  try {
    const res = await fetch(
      `${GRAPH}/me/media?fields=${FIELDS}&limit=${limit}&access_token=${token}`,
      {
        // revalidate hourly; Next dedupes and caches this across all visitors
        next: { revalidate: 3600, tags: ["instagram"] },
      }
    );

    if (!res.ok) {
      console.warn(
        `[instagram] ${res.status} ${res.statusText} — falling back to the curated grid`
      );
      return [];
    }

    const json = await res.json();
    if (!Array.isArray(json?.data)) return [];

    return json.data
      .map((post) => {
        const isVideo = post.media_type === "VIDEO";
        // Videos expose a still at thumbnail_url; images use media_url.
        const url = isVideo ? post.thumbnail_url : post.media_url;
        if (!url) return null;
        return {
          id: post.id,
          url,
          permalink: post.permalink,
          caption: (post.caption || "").slice(0, 140),
          isVideo,
          timestamp: post.timestamp,
        };
      })
      .filter(Boolean)
      .slice(0, limit);
  } catch (err) {
    console.warn("[instagram] fetch failed:", err?.message);
    return [];
  }
}

/**
 * Exchange a long-lived token for a fresh one. Long-lived tokens last 60 days
 * and can be refreshed any time after they are 24 hours old.
 * Called by the cron route — see app/api/instagram/refresh/route.js.
 */
export async function refreshInstagramToken(token) {
  const res = await fetch(
    `${GRAPH}/refresh_access_token?grant_type=ig_refresh_token&access_token=${token}`,
    { cache: "no-store" }
  );
  if (!res.ok) {
    throw new Error(`refresh failed: ${res.status} ${await res.text()}`);
  }
  // { access_token, token_type, expires_in }
  return res.json();
}
