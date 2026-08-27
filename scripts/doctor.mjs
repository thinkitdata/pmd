#!/usr/bin/env node
/**
 * ============================================================================
 * npm run doctor — checks everything that commonly goes wrong, in one pass.
 * ============================================================================
 * Run it any time something feels off, or before a deploy. It never changes
 * anything; it just tells you what it found.
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Anchor to the project root, not wherever you happened to run this from.
process.chdir(resolve(dirname(fileURLToPath(import.meta.url)), ".."));

const ok = (m) => console.log(`  \x1b[32m✓\x1b[0m ${m}`);
const warn = (m) => console.log(`  \x1b[33m!\x1b[0m ${m}`);
const bad = (m) => console.log(`  \x1b[31m✗\x1b[0m ${m}`);
const head = (m) => console.log(`\n\x1b[1m${m}\x1b[0m`);

let problems = 0;
let warnings = 0;
const fail = (m) => (problems++, bad(m));
const nag = (m) => (warnings++, warn(m));

// ---------------------------------------------------------------- runtime --
head("Runtime");
const major = Number(process.versions.node.split(".")[0]);
if (major >= 20) ok(`Node ${process.versions.node}`);
else fail(`Node ${process.versions.node} — Next.js needs 20.9 or newer. Install the current LTS.`);

if (existsSync("node_modules")) ok("Dependencies installed");
else fail("node_modules missing — run `npm install`");

// ------------------------------------------------------------------ files --
head("Project files");
for (const f of [
  "site.config.js",
  "next.config.mjs",
  "amplify.yml",
  "app/layout.jsx",
  "app/page.jsx",
  "app/globals.css",
]) {
  existsSync(f) ? ok(f) : fail(`${f} is missing`);
}

if (existsSync("app/api")) {
  fail("app/api/ exists — a static export can't contain server route handlers. Delete it.");
}

// `immutable` promises the browser this URL's bytes will never change, so it
// won't revalidate even on a refresh. That is only true when the filename
// carries a content hash. We shipped it on /images/* and /video/*, then spent a
// day replacing assets at those same paths — which locked every device that had
// already loaded them to the old files for a year. Guard against a repeat.
if (existsSync("customHttp.yml")) {
  // Strip comment lines FIRST. Splitting the raw file on "- pattern:" pulls the
  // comment that introduces the *next* block into the *current* one — and the
  // comment above /_next/static explains when `immutable` is honest, so it made
  // every preceding block look guilty. Cheap parsing, expensive false positive.
  const http = readFileSync("customHttp.yml", "utf8")
    .split("\n")
    .filter((l) => !/^\s*#/.test(l))
    .join("\n");
  const blocks = http.split(/^\s*-\s*pattern:/m).slice(1);
  for (const b of blocks) {
    const pattern = (b.match(/^\s*"([^"]+)"/) || [])[1] || "?";
    if (/immutable/.test(b) && !/_next/.test(pattern)) {
      fail(
        `customHttp.yml marks "${pattern}" immutable, but those filenames aren't ` +
          `content-hashed. Replacing a file in place there is invisible to anyone ` +
          `who already loaded it. Use max-age + stale-while-revalidate instead.`
      );
    }
  }
} else {
  nag("customHttp.yml missing — no cache or security headers will be set");
}

// ----------------------------------------------------------------- config --
head("Business details (site.config.js)");
if (existsSync("site.config.js")) {
  const src = readFileSync("site.config.js", "utf8");
  const todos = (src.match(/\/\/\s*TODO/g) || []).length;
  if (todos === 0) ok("No TODOs left");
  else nag(`${todos} TODO${todos === 1 ? "" : "s"} still in site.config.js — search for "TODO"`);

  if (/555\) 555-0134/.test(src)) nag("Still using the placeholder phone number");
  if (/logo:\s*\{[^}]*src:\s*""/.test(src)) nag("No logo set — the footer falls back to the wordmark");
  if (/calUsername:\s*"prime-detailing"/.test(src)) nag("Cal.com username not set yet");
  // Only relevant if a gallery entry actually asks for Stream. The films are
  // self-hosted now, so a blank customer code is the expected state, not a
  // fault — nagging about it trains people to ignore the doctor.
  if (/streamId:\s*"\S/.test(src) && /cloudflareCustomerCode:\s*""/.test(src)) {
    nag("A gallery entry has a streamId but cloudflareCustomerCode is blank — that film won't play");
  }
}

// ------------------------------------------------------------------ media --
head("Media");
const hero = "public/video/hero.mp4";
if (existsSync(hero)) {
  const mb = statSync(hero).size / 1024 / 1024;
  if (mb <= 3.2) ok(`hero.mp4 is ${mb.toFixed(1)} MB`);
  else nag(`hero.mp4 is ${mb.toFixed(1)} MB — aim for under 3 MB. Raise -crf in the ffmpeg command.`);
} else fail("public/video/hero.mp4 is missing");

if (!existsSync("public/video/hero.webm")) nag("hero.webm missing — you'll serve ~30% more bytes than needed");

const imgs = existsSync("public/images") ? readdirSync("public/images") : [];
const missing = ["hero-poster.jpg", "og.jpg", ...Array.from({ length: 6 }, (_, i) => `ig-0${i + 1}.jpg`)]
  .filter((f) => !imgs.includes(f));
if (missing.length === 0) ok("All expected images present");
else nag(`Missing images: ${missing.join(", ")}`);

// The generated placeholders are flat gradients, so they compress to almost
// nothing. Real photographs of cars essentially never land under 40 KB at the
// sizes this site uses.
//
// This used to only warn above six, which meant the last one to six fakes went
// unreported — a clean bill of health at exactly the moment it mattered most.
// Warn on any, and name them, so "0 problems" actually means something.
const placeholderish = imgs.filter((f) => {
  const p = join("public/images", f);
  return statSync(p).size < 40 * 1024;
});
if (placeholderish.length === 0) {
  ok("No placeholder images left");
} else {
  nag(
    `${placeholderish.length} ${
      placeholderish.length === 1
        ? "image still looks like a generated placeholder"
        : "images still look like generated placeholders"
    } — ` +
      `swap before launch: ${placeholderish.join(", ")}`
  );
}

// ---------------------------------------------------------------- secrets --
head("Environment");
const env = existsSync(".env.local") ? readFileSync(".env.local", "utf8") : "";
if (!env) nag("No .env.local — copy .env.example. The site still runs; Instagram falls back to the curated grid.");
else {
  /INSTAGRAM_ACCESS_TOKEN=\S/.test(env)
    ? ok("Instagram token set locally")
    : nag("INSTAGRAM_ACCESS_TOKEN empty — the feed will use the curated fallback");
  /NEXT_PUBLIC_SITE_URL=https?:\/\/\S/.test(env)
    ? ok("NEXT_PUBLIC_SITE_URL set")
    : nag("NEXT_PUBLIC_SITE_URL not set — canonical URLs and the sitemap will use the config default");
}
if (existsSync(".env.local") && existsSync(".gitignore")) {
  readFileSync(".gitignore", "utf8").includes(".env.local")
    ? ok(".env.local is gitignored")
    : fail(".env.local is NOT gitignored — your token would be committed");
}

// ------------------------------------------------------------------- build --
head("Build output");
if (existsSync("out/index.html")) {
  ok("out/ exists — run `npm run preview` to serve it locally");
  if (!existsSync("out/book/ceramic/index.html")) nag("out/book/ceramic/ missing — per-service pages may not have generated");
} else warn("No out/ yet — run `npm run build`");

// ----------------------------------------------------------------- verdict --
console.log("");
if (problems) {
  console.log(`\x1b[31m${problems} problem${problems === 1 ? "" : "s"}\x1b[0m to fix${warnings ? `, ${warnings} warning${warnings === 1 ? "" : "s"}` : ""}.`);
  process.exit(1);
}
if (warnings) {
  console.log(`\x1b[33mNo blockers, ${warnings} thing${warnings === 1 ? "" : "s"} to tidy before launch.\x1b[0m`);
} else {
  console.log("\x1b[32mAll clear.\x1b[0m");
}
