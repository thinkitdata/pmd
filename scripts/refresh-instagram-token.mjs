#!/usr/bin/env node
/**
 * ============================================================================
 * Refresh the Instagram long-lived access token.
 * ============================================================================
 *
 * Instagram long-lived tokens expire after 60 days. Refreshing resets the clock
 * to a full 60 days, so a weekly run means it can never lapse.
 *
 * This is the host-independent version of app/api/instagram/refresh/route.js.
 * Run it from GitHub Actions (see .github/workflows/instagram-token.yml) and
 * you don't need a server, a cron platform, or that API route at all — which
 * is what makes the static-export build possible.
 *
 *   INSTAGRAM_ACCESS_TOKEN=... node scripts/refresh-instagram-token.mjs
 *
 * Optional, to persist the new token back to the GitHub repo secret:
 *   GH_REPO=owner/name  GH_TOKEN=<PAT with secrets:write>
 */

const token = process.env.INSTAGRAM_ACCESS_TOKEN;

if (!token) {
  console.error("INSTAGRAM_ACCESS_TOKEN is not set — nothing to refresh.");
  process.exit(1);
}

const res = await fetch(
  `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${token}`
);

if (!res.ok) {
  console.error(`Refresh failed: ${res.status} ${await res.text()}`);
  // Exit non-zero so the workflow goes red and you get an email. A token that
  // silently fails to refresh is exactly the failure mode this exists to stop.
  process.exit(1);
}

const { access_token: fresh, expires_in: expires } = await res.json();
const days = Math.round((expires || 0) / 86400);
console.log(`Refreshed. New token valid for ~${days} days.`);

// GitHub Actions: expose it to later steps without printing it to the log.
if (process.env.GITHUB_OUTPUT) {
  const { appendFileSync } = await import("node:fs");
  appendFileSync(process.env.GITHUB_OUTPUT, `token=${fresh}\n`);
  console.log("::add-mask::" + fresh);
}

if (!process.env.GH_REPO || !process.env.GH_TOKEN) {
  console.log(
    "GH_REPO / GH_TOKEN not set — not persisting. Update the " +
      "INSTAGRAM_ACCESS_TOKEN secret manually, or let the workflow do it."
  );
}
