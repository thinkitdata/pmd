# Prime Mobile Detailing — Build Guide

Everything from a clean machine to a live, indexed, bookable site.
Written for someone comfortable with a terminal and git.

**Time to first deploy:** about 90 minutes.
**Time to a fully launched site with your footage:** a weekend.

---

## Part 0 — The recommendation, and why

You asked whether to self-host on AWS or use a platform. Here's the honest
answer, including where AWS still earns its keep.

### Recommended stack

| Layer | Choice | Cost | Why |
| --- | --- | --- | --- |
| Framework | **Next.js 16** (App Router) | free | Static-fast pages with the option of server code where you need it (the Instagram token). Enormous hiring pool if you ever hand this off. |
| Hosting | **Vercel Pro** | $20/mo | `git push` → live in ~40 seconds, with a preview URL for every branch. This is the "updated frequently" answer. *(AWS Amplify is a strong cheaper alternative — see AWS-DEPLOYMENT.md.)* |
| Long video | **Cloudflare Stream** | ~$1–5/mo | Adaptive bitrate encoding you don't operate. $5 per 1,000 min stored, $1 per 1,000 min delivered. |
| Hero loop | static file on Vercel's CDN | free | Instant first frame. No player to boot. |
| Booking | **Cal.com** | free tier | Availability, timezones, buffers, reminders, reschedule links. |
| DNS | **AWS Route 53** | ~$0.50/mo | You already have AWS. Keep DNS there. |
| Video masters | **AWS S3 Glacier IR** | ~$1/mo/TB | Your raw footage archive. Real work for your existing AWS account. |
| Analytics | **Plausible** or Vercel Analytics | $9/mo or free | No cookie banner needed with Plausible. |

**Realistic monthly total: $20–35.**

### Hosting it on AWS instead — see AWS-DEPLOYMENT.md

There is a genuinely good AWS path, and it's cheaper than Vercel: **Amplify
Hosting serving a static export**, at $0 for the first year and ~$1–3/month
after, with Route 53 integration that's actually nicer than the Vercel setup.

`npm run build:static` produces a fully static `out/` directory that deploys to
Amplify, to S3 + CloudFront, or anywhere else. **AWS-DEPLOYMENT.md** covers it
in full, including the trade-offs and the two things you give up.

What *isn't* worth doing is assembling it yourself from S3 + CloudFront +
MediaConvert + CodePipeline: you'd own the CI/CD pipeline, invalidations, IAM,
certificates and an encoding pipeline to save maybe $15/month over Vercel.
That's a bad trade when your scarce resource is time you'd rather spend on cars.

Either way, **keep AWS for DNS and for archiving your video masters** — those
are jobs it's genuinely best at.

### The one thing that would change this recommendation

If you ever want a non-technical person editing copy without touching git, add
**Sanity** or **Payload** as a CMS. Don't do it now. `site.config.js` is faster
for you than any admin panel, and an unnecessary CMS is a database to back up
and a schema to migrate.

---

## Part 1 — Local setup

### 1.1 Prerequisites

```bash
node --version    # need 20.9+, ideally 22 LTS
git --version
```

If Node is missing or old, install it via [nvm](https://github.com/nvm-sh/nvm):

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
nvm install --lts && nvm use --lts
```

### 1.2 Get the project running

Unzip the starter, then:

```bash
cd prime-mobile-detailing
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000. You should see the full site with placeholder art —
dark lacquer washes standing in for your footage.

> **If `npm install` fails on a version conflict:** run
> `npx create-next-app@latest scratch --js --app --no-tailwind --no-eslint`,
> copy the `next`/`react`/`react-dom` versions out of `scratch/package.json`
> into ours, delete `scratch`, and re-run `npm install`. This pins you to
> whatever combination is current rather than what was current when this was
> written.

### 1.3 Put it in git

```bash
git init
git add -A
git commit -m "Prime Mobile Detailing — initial site"
gh repo create prime-mobile-detailing --private --source=. --push
```

(Or create the repo in the GitHub UI and `git remote add origin …` if you don't
have the `gh` CLI.)

---

## Part 2 — Make it yours

### 2.1 `site.config.js` — the one file that matters

Open it and work top to bottom. Every `// TODO` is something only you know:

- **identity** — name, tagline, description, production URL
- **contact** — phone (twice: display + `tel:` href), email
- **serviceArea** — label, radius, lat/lng, and the town list
- **hours**
- **social** — full URLs; leave a platform blank to hide its icon
- **services** — names, prices, durations, what's included
- **gallery** — one entry per film
- **testimonials** — real ones, with the vehicle named

**On the town list:** those names appear in the footer and in your structured
data, and they're a genuine local-search signal. Someone types "ceramic coating
Alpharetta," not "ceramic coating Georgia." List the towns you actually serve —
padding it with places you won't drive to gets you calls you have to turn down.

**On the lat/lng:** get them by right-clicking your shop or home base in Google
Maps and choosing the coordinates at the top of the menu.

### 2.2 Rename the services if these don't fit

The four tiers shipped here — Refresh, Restoration, Ceramic, Keeper — are named
as *journeys* rather than packages, on purpose. "The Restoration" reads like
something you commission; "Package B" reads like something you buy. If your
actual offering is different, change it; just keep the naming register.

### 2.3 The Tao motif — an honest note

The three characters (水 water, 慢 unhurried, 誠 sincerity) and the Tao Te Ching
quotation carry the theme without turning the site into a costume. They're used
as principles that genuinely describe how you work, which is the difference
between homage and appropriation.

If you'd rather not use them, set `han: null` on each tenet in
`site.config.js`. The layout is built to hold up either way — the romanised
label and the principle carry it alone.

### 2.4 Colour and type

Everything is in the `:root` block at the top of `app/globals.css`:

```css
--jade-500: #6f9e8f;   /* the accent — celadon glaze */
--brass-400: #cbab72;  /* the warm "prized vehicle" note */
--ink-900:  #08090b;   /* lacquer black */
--rice-100: #f4f1ea;   /* rice paper */
```

Change those four and the whole site re-skins. The type pairing is Cormorant
Garamond (headlines) and Inter (everything else), self-hosted at build time via
`next/font` — no external request, no layout shift.

---

## Part 3 — Video

This is the part that makes or breaks the site, and the part most detailing
sites get wrong. Full commands are in `public/video/README.md`; here's the
shape of it.

### 3.1 The hero loop

One 8–14 second **silent** clip. Slow lateral movement along a panel with a hard
light overhead — the reflection travelling down the paint is your entire product
in a single shot.

Encode it under 3 MB and drop `hero.mp4`, `hero.webm`, and a poster frame into
place. The `ffmpeg` recipes are in `public/video/README.md`.

Two flags in there that look cosmetic but aren't: `-movflags +faststart` lets
playback begin before the file finishes downloading, and `-pix_fmt yuv420p` is
the difference between "plays in Safari" and "doesn't."

**What the component already handles for you:** the poster paints first and the
video cross-fades in only when it can actually play; autoplay is skipped
entirely on metered connections, Data Saver, or `prefers-reduced-motion`. A 3 MB
autoplay loop on someone's cellular plan is not premium.

### 3.2 The gallery films

Sign up at [Cloudflare Stream](https://dash.cloudflare.com) → Stream → buy a
$5 storage block.

```bash
npm i -g wrangler && wrangler login
wrangler stream upload ./films/993-turbo.mp4 --name "993 Turbo — two-stage"
```

Copy the **video UID** into that gallery entry's `streamId`, and your
**customer code** (the `customer-xxxxx` part of the embed URL) into
`site.video.cloudflareCustomerCode`.

Export a still at 1600×1000 for each film into `public/images/` and point
`poster` at it. **Grade the posters properly.** They're what visitors actually
see — the film is what they see if they're already interested.

### 3.3 The shot that sells the job

Before/after in *identical* framing. Same lens, same tripod position, same
light, nothing else changed. Lock it down and don't touch it. It's the only
image that proves what you did, and it stops working the instant anything else
in the frame moves.

---

## Part 4 — Booking

### 4.1 Set up Cal.com

1. Sign up at [cal.com](https://cal.com) and claim a username — this becomes
   `booking.calUsername` in `site.config.js`.
2. Connect your Google or Apple calendar so your real commitments block
   availability automatically.
3. Create **one event type per service**, with slugs matching `calEvent`:

   | Slug | Duration | Buffer after |
   | --- | --- | --- |
   | `consultation` | 15 min | 0 |
   | `refresh` | 5 hours | 30 min |
   | `restoration` | 8 hours (or a 2-day range) | 60 min |
   | `ceramic` | 8 hours | 60 min |
   | `keeper` | 3 hours | 30 min |

4. On each event type, set:
   - **Minimum notice:** 48 hours. You need time to plan the route.
   - **Daily limit:** 1 booking. This enforces "one vehicle a day" in software,
     which is worth more than saying it on the homepage.
   - **Booking questions:** vehicle year/make/model, address, "anything
     specific bothering you about it?", and a photo upload.
   - **Confirmation:** require confirmation, so nothing books without you
     seeing the vehicle details first.

5. Set your working hours to match `site.hours`, and add travel buffers.

### 4.2 How it's wired

`/book` renders the Cal inline embed, themed with your brand colours. Each
service also gets its own prerendered page — `/book/ceramic`, `/book/refresh`
and so on — which opens that service's calendar directly. That's where the
"Reserve" button on each service card points, so nobody has to pick twice, and
each one is an indexable page in its own right.

### 4.3 Deposits, when you're ready

You didn't ask for payments at launch, which is the right call — a deposit gate
costs you inbound calls early on. When no-shows start costing more than the
friction would, Cal.com Pro ($15/mo) connects Stripe and takes a deposit at
booking. It's a toggle on the event type; no code change.

---

## Part 5 — Instagram

Meta retired the Basic Display API. The current path for showing your own posts
is the **Instagram API with Instagram Login**, and it does not require a
Facebook Page.

### 5.1 Get a token

1. Convert the account to **Business** or **Creator** (Instagram → Settings →
   Account type). Personal accounts can't use the API.
2. Go to [developers.facebook.com](https://developers.facebook.com) → **My Apps**
   → **Create App** → use case **Other** → type **Business**.
3. Add the **Instagram** product → **API setup with Instagram login**.
4. Add your Instagram account under **Generate access tokens**.
5. Request the scope **`instagram_business_basic`**. Reading your *own* media
   doesn't need app review.
6. Generate the token, then click **Generate token** to get the long-lived
   version. It's valid **60 days**.
7. Put it in `.env.local` as `INSTAGRAM_ACCESS_TOKEN`.

### 5.2 Keeping it alive

The 60-day expiry is the thing that silently breaks Instagram feeds on small
business sites six months after launch. Three defences are already built in:

1. **`vercel.json` runs `/api/instagram/refresh` every Monday at 06:00.** Each
   refresh resets the clock to a full 60 days, so it can never lapse. Set
   `CRON_SECRET` (`openssl rand -hex 32`) so only Vercel can call it.
2. **Optional auto-persist.** Set `VERCEL_TOKEN` and `VERCEL_PROJECT_ID` and the
   route writes the new token straight back into your environment variables.
   Without them it just returns the new token for you to paste in.
3. **A curated fallback grid.** If the API fails for any reason, the section
   renders `instagramFallback` from `site.config.js` instead. **Put six good
   square crops in `public/images/ig-01…06.jpg` and leave them there
   permanently.** This is what protects you on the day something changes at
   Meta's end — and something eventually will.

> **The zero-maintenance alternative:** services like Behold or EmbedSocial
> ($6–10/mo) own the token dance forever. If you'd rather never think about
> this again, that's a legitimate use of $8. Swap `getInstagramPosts()` in
> `lib/instagram.js` for their JSON endpoint and everything else stays put.

### 5.3 Other platforms

- **YouTube / Facebook / TikTok** — links only, in `site.social`. Leave one
  blank to hide its icon. Embedding a YouTube feed would import Google's
  tracking and a heavy player for very little gain.
- **Google reviews** — don't scrape them and don't fake them. Put your real
  reviews in `testimonials` and link your Google Business Profile. The Places
  API costs money per load and returns a maximum of five reviews.

---

## Part 6 — Deploy

### 6.1 Vercel

1. [vercel.com](https://vercel.com) → **Add New** → **Project** → import the
   GitHub repo. Framework detection handles the rest; don't override anything.
2. Add environment variables under **Settings → Environment Variables**:

   | Key | Value |
   | --- | --- |
   | `NEXT_PUBLIC_SITE_URL` | `https://primemobiledetails.com` |
   | `INSTAGRAM_ACCESS_TOKEN` | your long-lived token |
   | `CRON_SECRET` | `openssl rand -hex 32` |
   | `VERCEL_TOKEN` | *(optional — for token auto-persist)* |
   | `VERCEL_PROJECT_ID` | *(optional — from Settings → General)* |

3. **Deploy.**

**Use the Pro plan ($20/mo).** Hobby is free but its terms are personal,
non-commercial use only — a business site belongs on Pro.

### 6.2 Point the domain (DNS stays in Route 53)

In Vercel → **Settings → Domains**, add `primemobiledetails.com` and
`www.primemobiledetails.com`. Vercel shows you the records. In Route 53:

| Type | Name | Value |
| --- | --- | --- |
| A | `primemobiledetails.com` | `76.76.21.21` |
| CNAME | `www` | `cname.vercel-dns.com` |

*(Use whatever values Vercel actually displays — they change.)*

Certificates are issued automatically once DNS propagates, usually within
minutes. Set the apex as primary so `www` redirects to it.

### 6.3 The update loop, from here on

```bash
git checkout -b new-prices
# edit site.config.js
git commit -am "Update ceramic pricing"
git push -u origin new-prices
```

Vercel comments a preview URL on the branch. Look at it on your phone. Merge to
`main` when it's right, and it's live in about 40 seconds. Every deploy is
individually revertible from the Vercel dashboard with one click.

---

## Part 7 — Launch checklist

### Content
- [ ] Every `TODO` in `site.config.js` replaced
- [ ] Real phone number in both `phone` and `phoneHref`
- [ ] Hero loop under 3 MB, poster frame graded
- [ ] At least 4 gallery films uploaded with real posters
- [ ] Six permanent Instagram fallback crops in `public/images/`
- [ ] `og.jpg` replaced with a real 1200×630 image (this is your link preview
      in every text message someone sends about you)
- [ ] Portrait photo on `/about` — people book people

### Technical
- [ ] `npm run build` passes with no errors
- [ ] Tested on a real phone, not just a narrow browser window
- [ ] Booking flow completed end-to-end, including the confirmation email
- [ ] `/sitemap.xml` and `/robots.txt` load
- [ ] Structured data passes [validator.schema.org](https://validator.schema.org)
- [ ] Lighthouse ≥ 90 on Performance and 100 on Accessibility
      (`npx unlighthouse --site https://yourdomain.com`)

### Local search — do this the week you launch
- [ ] Claim and complete your **Google Business Profile**. For a mobile
      business, hide your address and set a service area. This matters more for
      inbound calls than everything else on this list combined.
- [ ] Submit the sitemap in **Google Search Console**
- [ ] Same name, address format and phone number everywhere — Google, Apple
      Business Connect, Bing Places, Yelp. Inconsistent NAP data actively
      suppresses local ranking.
- [ ] Ask your last five happy customers for a Google review, by name, with a
      direct link

### Analytics
- [ ] Plausible or Vercel Analytics installed
- [ ] Track the two events that matter: **booking started** and **phone tapped**

---

## Part 8 — Living with it

**Weekly (10 minutes).** Add the week's best film to `gallery`. Push.

**Monthly (30 minutes).** `npm outdated`, then `npm update` for minor versions.
Run `npm run build` before pushing. Check the Cloudflare Stream bill.

**Quarterly.** Re-shoot the hero loop with your best recent work. Refresh
testimonials. Check the Instagram feed is still live — the cron should keep it
that way, but glance at it.

**When Next.js ships a major version.** Read the upgrade guide, run
`npx @next/codemod@canary upgrade latest` on a branch, check the preview
deployment. The dependency surface here is deliberately tiny — three packages —
so this stays a coffee-length job rather than a project.

---

## Appendix — What's in the box

```
prime-mobile-detailing/
├─ site.config.js          ← 90% of your edits live here
├─ vercel.json             ← Instagram token cron (Vercel path)
├─ amplify.yml             ← build spec + CDN headers (AWS path)
├─ app/
│  ├─ globals.css          ← the entire design system, tokens at the top
│  ├─ layout.jsx           ← fonts, metadata, nav + footer
│  ├─ page.jsx             ← homepage
│  ├─ services|gallery|about/page.jsx
│  ├─ book/page.jsx · book/[service]/page.jsx
│  ├─ sitemap.js · robots.js · not-found.jsx
│  └─ api/instagram/refresh/route.js   (Vercel path only)
├─ components/
│  ├─ Nav.jsx              ← frosts on scroll, mobile drawer
│  ├─ HeroVideo.jsx        ← poster-first, connection-aware autoplay
│  ├─ FilmTile.jsx         ← tiles + lazy-mounted lightbox
│  ├─ InstagramGrid.jsx    ← server-side fetch, graceful fallback
│  ├─ BookingEmbed.jsx     ← themed Cal.com embed
│  ├─ BookingPanel.jsx     ← shared by both booking routes
│  ├─ Reveal.jsx           ← IntersectionObserver scroll animation
│  ├─ Footer.jsx · LocalBusinessJsonLd.jsx
├─ lib/instagram.js
├─ scripts/refresh-instagram-token.mjs  ← serverless token refresh
├─ .github/workflows/      ← token refresh + nightly rebuild (AWS path)
└─ public/
   ├─ video/README.md      ← ffmpeg recipes + shooting notes
   ├─ video/hero.mp4|webm  ← placeholder loop
   └─ images/*.jpg         ← placeholder art
```

**Two deploy targets, one codebase.** `npm run build` produces a server build
for Vercel; `npm run build:static` produces a static export for Amplify, S3 or
anywhere else. AWS-DEPLOYMENT.md explains which to pick.

### Design decisions worth knowing about

**One easing curve, everywhere.** `cubic-bezier(0.16, 1, 0.3, 1)` — fast start,
long settle. Nothing on the site snaps. It's the single most effective thing
making the site feel expensive, and it's one line.

**The light sweep.** Buttons and film tiles have a soft diagonal highlight that
travels across on hover. It's simultaneously the "flow" of the theme and an
inspection lamp passing over paint — the motif and the craft turn out to be the
same gesture.

**Seams, not rules.** Light and dark sections dissolve into each other through
multi-stop gradients. A plain two-colour gradient leaves a muddy grey band
through the middle; the extra stops approximate an ease curve.

**Film grain.** A fixed, 3.5%-opacity noise layer over the whole page. Large
flat dark areas band badly on cheap panels, and the grain hides it. Costs
nothing, and it's why the blacks look like lacquer rather than #000.

**Negative space is the luxury signal.** Sections have 5.5–11rem of vertical
padding. The instinct to fill that space is the instinct to make the site look
cheaper.
