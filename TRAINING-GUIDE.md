# Building and Shipping primemobiledetails.com

### An engineering training guide

**Audience:** junior engineers joining Think IT Data Solutions.
**Goal:** by the end you should be able to make a change to this site, verify
it, ship it to production, and explain why every part of it is shaped the way
it is.

This is a real system serving a real business, and every decision in it was
made under real constraints. Where we got something wrong the first time, this
document says so — the mistakes are more instructive than the successes.

---

## Part 1 — What we built

A marketing site for a mobile detailing business: five pages, a video hero, a
film gallery, an embedded booking calendar, and a live Instagram feed.

**Stack:** Next.js 16 (App Router) exported as static HTML, hosted on AWS
Amplify, deployed by pushing to GitHub.

That sentence contains three decisions worth understanding before you touch
anything.

### 1.1 Three dependencies. On purpose.

```json
"dependencies": {
  "next": "^16.3.0",
  "react": "^19.0.0",
  "react-dom": "^19.0.0"
}
```

No CSS framework. No animation library. No component kit. No date library.

The instinct on a project like this is to reach for Tailwind, Framer Motion,
and a UI library, and you'd ship the first version faster. But this site has to
keep building cleanly in three years with almost no attention paid to it. Every
dependency is a future migration, a future breaking change, a future security
advisory you have to read at 11pm.

The styling is one hand-written stylesheet driven by CSS custom properties.
The animation is CSS transitions triggered by an `IntersectionObserver` in about
forty lines. Both are things you can read, understand, and fix without
consulting anyone's documentation.

**The lesson isn't "never use libraries."** It's that dependency count is a
cost you pay later, and you should choose it deliberately rather than by habit.
For a five-page marketing site the calculus favours writing it yourself. For a
complex application it usually doesn't.

### 1.2 Static export, and why it was the whole ballgame

Next.js can build two ways:

- **Server build** — produces a Node.js server. Supports server-side rendering,
  incremental regeneration, API routes.
- **Static export** (`output: "export"`) — produces a directory of plain HTML,
  CSS, JS and images. No server anywhere.

We use static export. Here's the reasoning, because it's the most transferable
thing in this document.

AWS Amplify's managed SSR provider **does not support Next.js 16** — at time of
writing it tops out at 15, and the tracking issue had been open for ten months.
So the obvious path (deploy the Next.js app to Amplify) simply doesn't work.

The tempting fixes are both bad:

- **Downgrade to Next.js 15** — pin your framework to what your host supports,
  and inherit that constraint forever.
- **Use a different host** — solves it today, but the same class of problem
  recurs every time a host lags a framework release.

Instead we asked: *does this site actually need a server?* We looked at what was
genuinely dynamic:

1. One Instagram fetch, cached for an hour
2. One weekly cron to refresh an API token
3. One page that read a query string (`/book?service=ceramic`)

That was the entire server-side surface of the application. All three could move:

| Was | Became |
| --- | --- |
| `/book?service=x` reading `searchParams` | `/book/ceramic`, `/book/refresh`… prerendered via `generateStaticParams` |
| Instagram fetched per request | Fetched at build time; a nightly rebuild refreshes it |
| Token refreshed by a hosted cron | A GitHub Actions workflow — no server involved |

Two of those three are improvements regardless of hosting. The per-service
booking URLs are indexable pages with their own titles and descriptions, which
is exactly what ranks for "ceramic coating Alpharetta."

**And then the original problem stops existing.** A static export is *just
files*. No host needs to understand which Next.js version produced them. The
version-support question is not solved, it is dissolved — permanently, not
until the next Amplify release.

> **The generalisable move:** when a constraint blocks you, check whether the
> requirement creating the constraint is actually load-bearing. We didn't beat
> Amplify's Next.js support. We removed our need for it.

### 1.3 Why Amplify rather than Vercel

Vercel is the first-party Next.js host and has a better deploy experience. We
chose Amplify anyway:

| | Vercel Pro | Amplify |
| --- | --- | --- |
| Platform fee | $20/mo per seat | $0 |
| Realistic monthly cost | $20 | ~$1–3 |
| First 12 months | — | $0 (free tier) |

Plus consolidation: the client already had AWS, the domain was already in
Route 53, and Amplify wires up ACM certificates and DNS records automatically
because it's the same account. One bill, one IAM boundary.

The trade-off is real and you should know it: Amplify's preview deployments are
weaker and its build logs are worse. For a site that changes weekly, that's
worth $17/month. For a team shipping ten times a day, it might not be.

---

## Part 2 — The CI/CD pipeline

### 2.1 The whole thing, end to end

```
  Developer (NUC, Ubuntu)
        │  git push
        ▼
  GitHub  thinkitdata/pmd
        │  webhook
        ▼
  AWS Amplify build container
        │  1. clone repo
        │  2. nvm install 22 && npm ci
        │  3. npm run build   →  ./out
        │  4. package ./out
        ▼
  S3 + CloudFront
        │  automatic cache invalidation
        ▼
  https://primemobiledetails.com
```

**Push to deployed: about two and a half minutes.** No manual step anywhere.

### 2.2 The build spec — `amplify.yml`

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - nvm install 22
        - nvm use 22
        - node --version
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: out
    files:
      - "**/*"
  cache:
    paths:
      - node_modules/**/*
      - .next/cache/**/*
```

Four details worth understanding rather than copying:

**`nvm install`, not `nvm use`.** `use` assumes the version is already present
in the build image. `install` is idempotent and works either way. Don't assume
someone else's environment contains what you need.

**`node --version` is deliberate.** It costs nothing and puts the actual runtime
version in the build log. When something breaks in six months, that line will
be the first thing you want to see.

**`npm ci`, not `npm install`.** `ci` installs exactly what `package-lock.json`
specifies and fails if the lockfile is missing or out of sync. `install` will
happily resolve slightly different versions than you tested with. **CI should
never resolve dependencies — it should install known ones.**

*(A missing `package-lock.json` is the single most common first-build failure.
It must be committed.)*

**`baseDirectory: out`.** This is what tells Amplify the build produced static
files rather than a server. It matters more than it looks — see §2.4.

### 2.3 Headers — `customHttp.yml`

Response headers live in **their own file at the repository root**:

```yaml
customHeaders:
  - pattern: "/video/*"
    headers:
      - key: "Cache-Control"
        value: "public, max-age=31536000, immutable"
  - pattern: "/_next/static/**/*"
    headers:
      - key: "Cache-Control"
        value: "public, max-age=31536000, immutable"
  - pattern: "**/*"
    headers:
      - key: "X-Content-Type-Options"
        value: "nosniff"
      - key: "Referrer-Policy"
        value: "strict-origin-when-cross-origin"
      - key: "Strict-Transport-Security"
        value: "max-age=63072000; includeSubDomains"
```

**We got this wrong first.** The headers were originally in a `customHeaders:`
block inside `amplify.yml` — a deprecated location that Amplify **silently
ignores**. No warning, no error, no log line. The build succeeded, the deploy
succeeded, and the headers simply weren't there. We only found it because we
checked with `curl` instead of assuming.

> **Silent failure is the most expensive kind.** A build that fails loudly
> costs you ten minutes. A build that succeeds while doing the wrong thing can
> cost you months. Verify configuration took effect; don't infer it from a
> green checkmark.

**On the cache strategy** — note what does *not* get a long cache. HTML keeps
Amplify's revalidating default. Only fingerprinted assets and never-changing
media get `immutable`. If you cached HTML for a year, your next deploy would be
invisible to every returning visitor, and you'd have no way to fix it. Cache
aggressively only what has a content hash in its filename.

### 2.4 The traps we actually hit

Each of these cost real time. They're in this document so they cost you none.

**Amplify defaults the platform to SSR.** It sees Next.js in `package.json` and
sets platform `WEB_COMPUTE` without reading `next.config.mjs` to notice
`output: "export"`. The build succeeds, then packaging fails with:

```
CustomerError: Can't find required-server-files.json in build output directory
```

That file only exists in server builds. Fix:

```bash
aws amplify update-app --app-id <ID> --platform WEB
```

Then redeploy — a settings change alone doesn't trigger a build.

*Lesson: auto-detection is a guess. When a tool infers your intent, verify what
it inferred.*

**`sitemap.js` and `robots.js` break static export.** Next compiles both into
route handlers, which default to dynamic. Under `output: export` there's no
server to run them:

```
export const dynamic = "force-static" not configured on route "/sitemap.xml"
```

Add `export const dynamic = "force-static"` to each. *Lesson: framework
conveniences have machinery behind them. When something behaves oddly, ask what
it actually compiles to.*

**Rule updates replace the whole set.** `aws amplify update-app --custom-rules`
does not merge. Always read first:

```bash
aws amplify get-app --app-id <ID> --query "app.customRules"
```

**CDN caching hides your changes.** Console-only changes (rules, headers) don't
invalidate CloudFront; only deploys do. If a change seems not to have applied,
test with a cache-buster before you start debugging something that isn't broken:

```bash
curl -sI "https://example.com/?cb=$RANDOM"
```

An empty commit is a perfectly good flush button:

```bash
git commit --allow-empty -m "Flush CDN" && git push
```

### 2.5 Scheduled work — GitHub Actions

Two workflows do what a server would otherwise do:

**`instagram-token.yml`** — weekly. Instagram long-lived tokens expire after 60
days; each refresh resets the clock to a full 60, so a weekly run means it can
never lapse. It writes the new token back into the repo secret.

**`nightly-rebuild.yml`** — nightly. Pokes an Amplify webhook so the build-time
Instagram fetch picks up new posts.

The interesting design decision is in the fallback. If the Instagram API is
unreachable for any reason, `getInstagramPosts()` returns `[]` and the component
renders a curated static grid instead. The section always looks finished.

> **Design for the failure mode, not just the happy path.** A third-party API
> you don't control *will* fail eventually. The question isn't whether, it's
> what your site looks like when it does.

---

## Part 3 — How the code is organised

```
site.config.js          ← 90% of routine changes happen here
next.config.mjs         ← static export configuration
amplify.yml             ← build spec
customHttp.yml          ← response headers
app/
  globals.css           ← the entire design system
  layout.jsx            ← fonts, metadata, nav + footer
  page.jsx              ← homepage
  services|gallery|about/page.jsx
  book/page.jsx
  book/[service]/page.jsx   ← one prerendered page per service
  sitemap.js · robots.js · not-found.jsx
components/             ← Nav, HeroVideo, FilmTile, InstagramGrid,
                          BookingEmbed, BookingPanel, Reveal, Footer,
                          LocalBusinessJsonLd
lib/instagram.js
scripts/doctor.mjs      ← pre-flight checks
```

### 3.1 One config file

Prices, services, hours, contact details, service area, gallery items,
testimonials and social links all live in `site.config.js`. Components read from
it; none of them hardcode business data.

This is why a price change is a one-line edit rather than a hunt through JSX.
It's also why the "coming soon" feature took minutes rather than an afternoon
— see §3.4.

### 3.2 The design system is CSS custom properties

Everything routes through tokens at the top of `globals.css`:

```css
--ink-900:  #08090b;   /* lacquer black */
--rice-100: #f4f1ea;   /* rice paper */
--gold-400: #d9b56d;   /* accent on dark */
--gold-600: #856418;   /* accent on light — contrast */

--accent-bright: var(--gold-300);
--accent:        var(--gold-400);
--accent-deep:   var(--gold-500);
--accent-rgb:    217, 181, 109;
```

**No rule in the stylesheet references a colour name directly.** They all go
through `--accent-*`. That's what made changing the site's entire accent from
jade to gold a three-line edit when the client's logo arrived.

Two other principles worth internalising:

**One easing curve for the whole site.** `cubic-bezier(0.16, 1, 0.3, 1)` —
fast start, long settle. Nothing snaps anywhere. This single line does more for
how expensive the site feels than any other decision in the design.

**Contrast is measured, not eyeballed.** The client's logo red is `#d8232a`.
Against the site's near-black it measures 3.98:1, which passes WCAG AA for large
text only — it would fail on the small-caps labels that carry much of the
design. So red stays in the logo and never becomes a UI colour. That's a
defensible engineering decision rather than a matter of taste, and you can
defend it with a number.

### 3.3 Progressive enhancement in the hero

`components/HeroVideo.jsx` is worth reading closely. It:

- Paints the poster image first, and cross-fades the video in only when it can
  actually play
- Skips the video entirely on a metered connection, with Data Saver on, or when
  `prefers-reduced-motion` is set
- Uses `muted` + `playsInline`, without which iOS refuses to autoplay at all
- Catches the `play()` rejection, because autoplay can still be refused

A 3 MB autoplaying video on someone's cellular plan is not a premium
experience. **Ask what your feature costs the user in the worst case, not the
best.**

### 3.4 Feature flags via config

When the client said Restoration and Ceramic weren't ready yet, the change was
one property per service:

```js
comingSoon: true,
```

That single boolean drives: the card's flag and styling, an "In training" panel
*instead of a booking calendar* on that service's page, the page title and
description, and `PreOrder` rather than `InStock` in the structured data.

The important part is the calendar suppression. **A site that accepts bookings
for work you can't deliver is worse than a site with no booking at all.** The
flag exists so that state is impossible to get into by accident.

---

## Part 4 — Working on it

### 4.1 Local setup

```bash
git clone git@github.com:thinkitdata/pmd.git
cd pmd
npm install
npm run doctor      # checks Node version, missing files, TODOs, oversized video
npm run dev:lan     # → http://<your-ip>:3000
```

`dev:lan` binds to `0.0.0.0` so you can open it on your phone. **Test a
mobile-first site on a phone.** A narrow desktop window is not a phone — it has
different fonts, different scroll physics, and no thumb.

### 4.2 Making a change

```bash
git checkout -b update-pricing
# edit site.config.js
npm run doctor
npm run build       # must pass before you push
git commit -am "Update ceramic pricing"
git push -u origin update-pricing
```

Push a branch and Amplify builds it at its own preview URL. Check it, then
merge to `main` to go live. Every deploy is revertible from the Amplify console
in one click.

### 4.3 Verifying like an engineer

Learn these. They are most of production debugging.

```bash
# follow redirects — %{http_code} then reports the FINAL status
curl -sL -o /dev/null -w '%{http_code}\n' https://example.com/

# see the whole redirect chain — this is the one that actually diagnoses things
curl -sIL https://example.com/page | grep -iE '^HTTP|^location'

# check a specific header
curl -sI https://example.com/video/hero.mp4 | grep -i cache-control

# bypass CDN cache
curl -sI "https://example.com/?cb=$RANDOM"
```

**Two traps that cost us time:**

`curl` doesn't follow redirects without `-L`. We spent a round trip convinced
the site was broken because a `301` looked like a failure. It wasn't — the
browser was following it and we weren't.

Don't put a trailing slash in a URL variable. `URL=https://example.com/` makes
`$URL/` into `https://example.com//`, and CloudFront 404s the lot. Every check
fails and none of them are real.

> When a tool and a browser disagree, the browser is usually right and your
> tool is usually misconfigured. Find out which before you change any code.

### 4.4 Environment hygiene

Real failure from this build: `gh auth login` and `git config --global` were run
as `root`, then work continued as `thinkitdata`. Result:

```
remote: Invalid username or token. Password authentication is not supported
```

That reads like an auth problem. It's a **path** problem — the credentials were
in `/root`, and the new user had none. Re-running the setup as the working user
fixed it in thirty seconds.

*Lesson: when an error message names a subsystem, check whether the subsystem
is even the thing that changed. What changed here was the user.*

Also: Ubuntu 22.04's apt `nodejs` is **v12**. Next.js 16 needs ≥20.9. Use nvm.

---

## Part 5 — SEO, since it's most of why the site exists

The client is a local business. Being found in "detailing near me" searches is
worth more than everything else on the site combined.

**Structured data** (`components/LocalBusinessJsonLd.jsx`) declares an
`AutoDetailing` business with a `GeoCircle` service area — a radius around a
point, because a mobile business has no storefront. It carries the legal entity
name, which must match the Google Business Profile *exactly*; inconsistent
naming across sources actively suppresses local ranking.

**One canonical host.** `www` 301-redirects to the apex, and every page carries
a `rel=canonical`. Two hostnames serving identical content splits your ranking
signals between them.

**Soft 404s.** A page that says "not found" while returning HTTP 200 tells
crawlers every junk URL is a real page. Amplify's static hosting can't serve a
custom page *with* a 404 status, so we also set `robots: { index: false }` on
the not-found page — belt and braces, and `noindex` is a stronger signal than a
status code anyway.

**Per-service pages.** `/book/ceramic` exists as its own indexable page with its
own title and description. Query strings don't rank; paths do.

---

## Part 6 — Testing without a full environment

The site was built in a sandbox with **no npm registry access**, so `next build`
could not run there. That's a genuine constraint worth studying, because you'll
meet its cousins.

What we did instead:

1. **esbuild syntax check** on every source file — catches typos and malformed
   JSX in milliseconds
2. **A React 19 streaming-renderer harness** that server-renders every page with
   `next/link` and `next/font` stubbed, verifying props, config shape and the
   component tree actually execute
3. **Playwright screenshots** of that rendered output at desktop and mobile
   widths, reviewed for layout bugs

This caught several real defects — a grid whose tiles didn't align, a price that
wrapped badly, an accent with insufficient contrast.

**It also missed one**, and that's the more useful half. The `sitemap.js`
static-export failure was invisible to the harness, because the harness calls
`sitemap()` directly rather than going through Next's route-handler machinery.
It only surfaced on a real `next build`.

> **Know what your test approach cannot see.** A harness that verifies your
> components does not verify your framework's build behaviour. Partial
> verification is enormously valuable *and* it is partial — the danger is
> forgetting the second half.

---

## Part 7 — Exercises

Work through these to confirm you've actually got it.

1. **Change a price** in `site.config.js`, run `npm run doctor` and
   `npm run build`, push a branch, find the Amplify preview URL, and verify the
   change on your phone. Then merge.

2. **Find every place** the accent colour is applied. Change the site from gold
   to something else by editing only the three `--accent-*` lines. Change it
   back.

3. **Break something deliberately.** Remove `export const dynamic =
   "force-static"` from `app/sitemap.js` and run `npm run build`. Read the error
   carefully. Now explain in your own words why static export cares.

4. **Trace a request.** Run `curl -sIL https://primemobiledetails.com/nonsense-page`
   and explain every hop — why there's a 301 before the 404, and what config
   causes it.

5. **Add a service.** Add a fifth entry to the `services` array with
   `comingSoon: true`. Verify without being told where to look that it appears
   on the homepage, on `/services`, in the sitemap, in structured data, and that
   its booking page shows no calendar.

6. **The hard one.** The Instagram feed is fetched at build time. A visitor on
   Tuesday afternoon sees posts from the last nightly build. Describe two ways
   to make it fresher, and argue for one — including what each costs.

---

## Appendix — Reference

| | |
| --- | --- |
| Live site | https://primemobiledetails.com |
| Repo | `github.com/thinkitdata/pmd` |
| Amplify app ID | `d3u2w3z7zonaeq` |
| Dev machine | Ubuntu NUC, `~/prime-mobile-auto-detailing` |
| Node | 22 (via nvm — **not** apt) |

```bash
npm run dev          # dev server
npm run dev:lan      # dev server, reachable on your network
npm run build        # static export → ./out
npm run preview      # serve ./out as Amplify will
npm run preview:lan  # same, reachable from your phone
npm run doctor       # pre-flight checks
```

**Further reading in this project:** `docs/AWS-DEPLOYMENT.md` for the hosting
decision in full, `docs/BUILD-GUIDE.md` for the original nine-stage build, and
the Amplify runbook for every trap in condensed form.

---

### One closing thought

Almost every decision in this document was a trade-off rather than a right
answer. Three dependencies instead of thirty trades development speed for
maintenance cost. Amplify instead of Vercel trades developer experience for
consolidation and money. Static export instead of SSR trades feature ceiling for
independence from anyone's roadmap.

None of those are universally correct. They're correct *here*, for a five-page
marketing site owned by a business whose scarce resource is attention.

**The skill worth building isn't knowing the answers. It's noticing that a
question was asked at all** — and being able to say out loud what you traded and
why. Do that consistently and you'll be more useful than someone who has
memorised twice as much.
