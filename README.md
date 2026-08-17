# Prime Mobile Detailing — website

A Next.js marketing site with a video hero, film gallery, Cal.com booking, and a
live Instagram feed.

```bash
npm install
cp .env.example .env.local
npm run dev          # http://localhost:3000
```

It runs out of the box — placeholder art ships in `public/images` and a
placeholder hero loop in `public/video`, so you can see the real layout before
you have any footage.

---

## Where things live

| I want to change…                    | Edit                              |
| ------------------------------------ | --------------------------------- |
| Prices, services, hours, phone, socials | `site.config.js`               |
| Colours, type, spacing, motion        | `:root` in `app/globals.css`      |
| Homepage section order                | `app/page.jsx`                    |
| Gallery films                         | `gallery` in `site.config.js`     |
| Hero clip                             | `public/video/` — see its README  |

**`site.config.js` is the file you'll touch 90% of the time.** Everything
marked `TODO` in it needs replacing before launch.

## Architecture, briefly

Three runtime dependencies: `next`, `react`, `react-dom`. No CSS framework, no
animation library, no component kit. That's a deliberate choice — this site
needs to still build cleanly in three years with minimal babysitting, and every
dependency is a future migration.

- **Styling** — one hand-written stylesheet driven by CSS custom properties.
  Re-skin the whole site from the `:root` block.
- **Motion** — CSS transitions triggered by an `IntersectionObserver`
  (`components/Reveal.jsx`). Costs nothing per frame; respects
  `prefers-reduced-motion`.
- **Booking** — Cal.com inline embed. Real availability, timezones, buffers and
  reminders are a genuinely hard problem, and not one worth rebuilding.
- **Instagram** — fetched server-side and cached for an hour, so the token never
  reaches the browser. Falls back to a curated grid if the API is unreachable.
- **Video** — short hero loop served as a static file for instant start; long
  gallery films on Cloudflare Stream for adaptive bitrate.

## Scripts

```bash
npm run dev          # dev server → localhost:3000
npm run dev:lan      # same, reachable from other devices on your network
npm run build        # static export → ./out
npm run preview      # serve ./out exactly as Amplify will
npm run preview:lan  # same, reachable from your phone — use this to test mobile
npm run doctor       # check everything that commonly goes wrong
```

The `:lan` variants bind to `0.0.0.0` instead of loopback, so you can hit the
site from your phone at `http://<machine-ip>:3000`. That's the only honest way
to check a mobile-first site — a narrow desktop window is not a phone.

**`npm run doctor` is the one to remember.** Run it whenever something feels
off or before a deploy — it checks your Node version, missing files, leftover
TODOs, oversized video, unset tokens, and whether `.env.local` is safely
gitignored.

**This builds to a static site.** No server, no Lambda — `out/` is plain HTML,
CSS, JS and images. That's why it deploys to Amplify (or any bucket behind a
CDN) and why no host ever has to support a particular Next.js version.
`AWS-DEPLOYMENT.md` has the reasoning.

## Environment

Copy `.env.example` → `.env.local`. The site runs fine with everything blank —
Instagram just falls back to the curated grid.

See `BUILD-GUIDE.md` for the full setup, deployment, and launch checklist.
