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
film gallery, an embedded booking calendar, and an Instagram strip.

(That last one is deliberately *not* live — see Part 4.6.8. It's a good early
example of this document's habit: the interesting part of a feature is usually
the constraint that shaped it.)

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

**`immutable` is a promise about the URL, not the file.** This one shipped and
stayed hidden for ten days, so it's worth reading slowly.

`customHttp.yml` marked `/images/*` and `/video/*`:

```yaml
Cache-Control: public, max-age=31536000, immutable
```

`immutable` means: *do not revalidate this URL — not on refresh, not on reload —
for the whole max-age.* It's a strong promise, and it's only true when the
filename contains a content hash, so that changing the bytes changes the URL.
That's why it's correct for `/_next/static/**/*`, which Next fingerprints.

The config's own comment stated the assumption — *"if you re-encode it, the
filename should change too"* — and then we spent a day replacing `hero.mp4`,
`hero-poster.jpg`, `work-0*.jpg` and `ig-0*.jpg` **in place at the same paths**,
which is the natural workflow for a hand-managed site.

Every device that had loaded the old files was pinned to them for a year.

How it presented: *"the Instagram tiles are dark gradients on my phone but fine
on my desktop."* That reads like a rendering bug and invites you to go poking at
CSS and image formats. It was neither — the phone had visited before the swap,
the desktop hadn't. The tell was that "dark gradient" described the **old
placeholder images** exactly, not the tile's flat background colour. A stale
asset and a broken asset look different if you look carefully: broken shows alt
text or the container's background; stale shows *the previous content*.

Two things follow, and the second is the one people miss:

1. **Fix the header.** Stable filenames get `max-age` plus
   `stale-while-revalidate` and are allowed to revalidate. A conditional GET
   returning 304 costs a few hundred bytes; a deploy nobody can see costs more.
2. **Fixing the header does not rescue already-affected clients.** They won't
   re-request the file, so they never learn the header changed. The only
   reliable remedy for a device already holding an `immutable` entry is to
   **change the URL** — rename the asset — or clear site data on that device.

> **Be suspicious of any cache directive that removes the browser's ability to
> ask.** `immutable` and long `max-age` are not the same promise. Getting the
> second wrong wastes bandwidth; getting the first wrong means you cannot fix
> your own mistake remotely.

`npm run doctor` now fails the build check if `immutable` appears on a pattern
whose filenames aren't content-hashed.

*(Writing that check produced a small lesson of its own: splitting the YAML on
`- pattern:` dragged the comment introducing the next block into the current one
— and the comment above `/_next/static` explains when `immutable` is honest, so
every block looked guilty. Strip comments before parsing. Cheap parsing, expensive
false positive.)*

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

## Part 4.5 — Integrating a third-party service (Cal.com)

Booking is Cal.com, embedded. Rebuilding real availability, timezones, buffers,
reminders and reschedule links is a genuinely hard problem and not one worth
solving for a detailing business. But integrating someone else's service has
its own failure modes, and this one taught us four.

### The site→service contract is a string, and strings drift

`site.config.js` holds `calEvent` per service. The site builds a URL from it:

```
cal.com/<calUsername>/<calEvent>
```

If that slug doesn't exist on Cal, the embed loads nothing. **There is no error
— just an empty container.** Two systems, one shared identifier, no schema
enforcing it. Any time you integrate this way, ask: what happens when the two
sides disagree, and how would I find out?

### Failure mode 1 — the empty container

Our first symptom was a white box where the calendar should be. That's the
worst possible failure for the thing that takes your money: no error, no
explanation, no path forward for the customer.

`components/BookingEmbed.jsx` now has three states. A `MutationObserver`
watches for Cal injecting its iframe; if none appears within 8 seconds it shows
the phone number and an email button. The container is ink rather than white,
so a failure reads as part of the page rather than a broken site.

> Every third-party embed will fail eventually — bad slug, outage, ad-blocker,
> corporate firewall. **Decide what the customer sees when it does**, and build
> that path deliberately.

### Failure mode 2 — undocumented constraints

Cal requires event slugs of **at least 10 characters**. Our natural choices —
`refresh` (7), `keeper` (6) — were rejected. We prefixed with `the-`, which
clears the minimum and matches the service names.

You cannot know these limits in advance. Discover them, then **write them down
in a comment at the point of use** so the next person doesn't rediscover them.

### Failure mode 3 — the UI moved

Cal's own documentation described nine tabs — Basics, Availability, Limits,
Advanced. The live product had none of them; settings had moved to a left
sidebar, and "Event Types" was renamed "Links". Two rounds of guidance based on
that documentation sent the client hunting for menus that no longer existed.

**Vendor documentation lags vendor UI.** When someone says "I can't find it,"
believe them and go look, rather than describing the interface again more
firmly.

There was also a naming trap in the redesign: Cal now has both **Links**
(repeatable booking links — what you want) and **Events** (one-off happenings
with a fixed date). "Events" is the more natural-sounding word, so it's an easy
wrong turn, and the settings you're looking for don't exist on that side.

### Failure mode 4 — the silent 400

Creating `the-refresh` failed four times with no visible message. The dialog
just sat there. Reading the console showed `eventTypesHeavy.create` mutations
firing and erroring; the network panel showed **HTTP 400**. Appending `-x` to
the slug made it save instantly — the slug was reserved by something invisible
in the account, probably a soft-deleted record.

The debugging sequence is the transferable part:

1. **Is the request even being sent?** Console showed the mutation firing — so
   the clicks worked and it wasn't a dead button.
2. **What does the server say?** Network showed 400 — a validation rejection,
   not an auth or server problem.
3. **Which field?** Change one variable at a time. Duration 300→60: still
   failed. Slug + `-x`: succeeded. That isolates it.

Without steps 1 and 2 we'd have kept re-clicking a button that was working
fine. **Distinguish "nothing happened" from "something happened and failed
silently" before you start changing things.**

### And a real API's rules are not yours to negotiate

`the-refresh` was unavailable and we couldn't free it without deleting data of
unknown importance. So the site changed instead: `calEvent: "the-refresh-detail"`.

That's usually the right call. **When an external system won't bend, bend your
own config** — it's a one-line change you control, versus fighting a black box
you don't.

---

## Part 4.6 — Media, and working with what you actually have

Added 27 Aug 2026, when the site got its real photography and video. Almost
everything in this section is a lesson about *verifying* rather than *assuming*,
which is why it earns its own part.

The starting position: the hero was a grey gradient with **HERO POSTER · REPLACE
ME** burned into it, the six gallery tiles were synthetic, and the client had
just dropped 29 real clips into the project folder.

### 4.6.1 Measure the artefact, not its label

`ffprobe` reported every clip as `1024x576` — landscape. Every clip was actually
**portrait**. Decode one frame and measure it and you get `576x1024`.

Container metadata records *stored* dimensions. A phone writes the sensor's
native orientation plus a rotation flag, and players apply the rotation at
display time. Read the width and height field and you learn how the bytes are
arranged, not what a human sees.

```bash
# what the container claims
ffprobe -v error -select_streams v:0 -show_entries stream=width,height \
  -of csv=p=0:s=x clip.MP4          # -> 1024x576

# what actually comes out
ffmpeg -v error -ss 1 -i clip.MP4 -frames:v 1 -y /tmp/f.png
python3 -c "from PIL import Image; print(Image.open('/tmp/f.png').size)"
                                     # -> (576, 1024)
```

Had this gone unchecked, the hero would have been built to the wrong aspect and
the error would only have shown up in a browser, late, with everything else
already built on top of it.

> **Verify the property you're about to depend on, by the same route the
> consumer will get it.** Metadata is a claim. A decoded frame is evidence.

The same discipline caught two misidentifications. Reading a contact sheet, a
dark saloon looked like a Maybach and a white coupé looked like a Corvette. Both
went into a written summary. Pulling higher-resolution frames showed a
Rolls-Royce Ghost badge and an Aston Martin winged badge on the headrest. Those
names were about to be published on a live site as claims about specific
customers' cars.

And a smaller one, twice: `montage a*.png b*.png` sorts **alphabetically**, so
`t=12` sorts before `t=8`, and a timestamp read off the wrong panel produces the
wrong frame. Label your samples or sort them numerically.

### 4.6.2 Bitrate and resolution together tell you a file's history

The clips were 576×1024 at **1.3–1.7 Mbps**. No phone made in the last decade
records that. That combination means the file has been through a social platform
or a messaging app, which re-encodes to save bandwidth.

This mattered enormously. At hero size the paint went soft and started banding —
on a site whose entire claim is *flawless surfaces*, the hero image argued
against the business. The fix wasn't technical; it was **asking whether the
originals still existed**, because 1080×1920 or 4K source is three to six times
the pixels and no amount of upscaling recovers detail that was thrown away.

> **When output quality is disappointing, check the input's provenance before
> reaching for a tool.** "Can we enhance it?" is a much worse question than
> "is this actually the original?"

Show the evidence rather than assert it. A 100% crop of the intended final size
settles an argument about quality in about two seconds.

### 4.6.3 The pillarbox — dissolving a constraint instead of fighting it

Vertical 9:16 footage. A full-bleed `100svh` hero. Three obvious options, all
bad:

| Option | Cost |
| --- | --- |
| Centre-crop to 16:9 | Throws away most of the car |
| AI outpaint the edges | Invents ~⅔ of the frame — see 4.6.4 |
| Redesign the hero around vertical | Rebuilds the most finished part of the site |

The fourth option used the material against itself. Put the clip at native
aspect over a **blurred, darkened copy of the same clip**, with a feathered
alpha edge:

```bash
ffmpeg -ss $START -t $LEN -i "$SRC" -loop 1 -i feather.png -filter_complex "\
[0:v]split=2[bg][fg];\
[bg]scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,\
gblur=sigma=44,eq=brightness=-0.30:saturation=0.60[bgb];\
[fg]scale=-2:1080:flags=lanczos,format=yuva420p[fgs];\
[1:v]format=gray[mk];[fgs][mk]alphamerge[fga];\
[bgb][fga]overlay=(W-w)/2:0,format=yuv420p[v]" -map "[v]" -an ...
```

Every pixel is real. Colour and grain match exactly *because it's the same
frame*, so the blur reads as depth of field rather than padding. The darkened
sides improve headline contrast for free.

Then the part worth internalising — **a good structural choice tends to pay a
dividend you didn't design for.** On a phone the hero box is portrait, so
`object-fit: cover` crops to roughly the central 500px, which sits entirely
inside the 608px sharp strip. Mobile visitors see only sharp native footage and
no blur at all. Nobody planned that; it fell out of choosing to keep the real
material at native aspect.

Two encoding details that are load-bearing, not stylistic:

- `-movflags +faststart` moves the index to the front of the file, so playback
  starts before the whole thing has buffered
- `-pix_fmt yuv420p` — without it Safari and several Android browsers refuse to
  decode at all

The loop is a **palindrome** (forward, then reversed, concatenated). For a slow
camera move that reads as a gentle drift and the loop point is mathematically
seamless, which beats hunting for two matching frames.

### 4.6.4 Generated imagery, and the side door

The policy agreed with the client: generated imagery may only be used for things
that **make no factual claim** — water, light, surface texture. No generated
vehicles, before/afters or testimonials.

The reasoning is commercial before it is ethical. The audience for "trusted with
the most prized vehicles" is precisely the audience that spots wrong badges,
impossible reflections and brake calipers that don't exist. Get caught once and
you don't lose a visitor, you lose the premise.

The subtle part came later. Outpainting the vertical hero to 16:9 sounds like a
framing operation, but at that ratio you are generating two-thirds of the frame
*around an identifiable customer's car* — including, at the edges, its own
bodywork. **A policy you agreed in the morning can be defeated by a technique
that doesn't sound like it's in scope.** Restate the policy in terms of the
output, not the tool: *would a visitor read this as a vehicle we worked on?*

### 4.6.5 A real image under a false caption is worse than a placeholder

The gallery shipped with captions naming six vehicles the business had never
touched — a 993 Turbo, a Defender, a Continental GT. Two of them claimed
*ceramic coating* and *paint correction*, both of which are flagged
`comingSoon: true` elsewhere in the same config. **The site contradicted itself**
and had done since launch.

A placeholder is obviously nothing. A real photograph under an invented caption
is a specific claim, and it's the images arriving that makes it dangerous —
until then, nobody believes the tile.

We settled on descriptive-only captions: name the vehicle and what is visibly
happening, claim no service. That's publishable without checking any records.

> **When you make one half of something real, re-read the other half.** Content
> and its labelling are a single artefact, and upgrading one can quietly turn
> the other from decoration into a lie.

### 4.6.6 Never show a developer message to a user

Every gallery tile was a button opening a lightbox, and with no Cloudflare
Stream ID configured the lightbox rendered:

> Add this film's Cloudflare Stream ID in site.config.js

to **visitors**, in production, since launch. It's a natural thing to write while
building and a catastrophic thing to ship.

The fix is structural, not a string change: if a film is missing, fall back to
the still and hide the play affordance. **Unconfigured states should degrade to
something a user can accept, and report the problem to developers through a
channel users never see** — `npm run doctor`, a dev-only note, a build warning.

### 4.6.7 Right-size the dependency

Cloudflare Stream was in the design for the gallery films. Stream solves
long-form adaptive delivery across variable connections. Our films are six
silent 8–10 second loops.

Self-hosting them in `/public/video` is ~4.5 MB total, fetched **only on click**,
so first paint is untouched. That removed an entire account, integration and
`TODO` from the project.

> **Match the tool to the problem you have, not the problem the tool is famous
> for solving.** A dependency that solves a problem you don't have is pure
> cost — and cost that arrives later, as maintenance.

The escape hatch stays open: each gallery entry still honours a `streamId`, so a
single genuinely long film can use Stream without reversing the decision.

### 4.6.8 "Live" needs defining on a static export

`InstagramGrid` is an async server component that calls the Instagram API. On a
static export, **server components run once, at build time.** Consequences:

- `next: { revalidate: 3600 }` does nothing. There is no server to revalidate on.
- The feed is a snapshot of whatever the last Amplify build fetched.
- `.env.example` still referenced an `/api/instagram/refresh` route and a
  `CRON_SECRET`. That route never existed here, and route handlers like it
  **cannot** exist in a static export. Stale docs from the pre-export design.

Genuinely live would need a scheduled rebuild *and* something that refreshes the
60-day token and writes the new value back into Amplify's environment variables,
because a refresh mints a **new** token that must be stored.

For six tiles that change rarely, we curated them instead — no token, no expiry,
no infrastructure, no failure mode. What matters is that the *decision is written
down where someone would otherwise "fix" it*:

```js
// THIS IS THE LIVE PATH, NOT A FALLBACK. Read this before "fixing" it.
```

> **An empty config value looks identical whether it's an oversight or a
> decision.** If it's a decision, say so in the file, or someone will helpfully
> undo it.

### 4.6.9 Alarms must be loudest near the finish

`doctor` flagged undersized images — its proxy for "still a generated
placeholder" — like this:

```js
if (placeholderish.length > 6) { nag(...) }
```

Six real images later it went silent, with `portrait.jpg` still fake. **The check
was quietest exactly when it mattered most**, and reported a clean bill of health
that wasn't true. It now warns on any and names them.

That threshold was almost certainly added to reduce noise early on, which is a
real problem — but it was solved by suppressing the signal rather than
sharpening it.

> **Ask what a check does as you approach done.** A warning that fades out near
> the finish line is worse than no warning, because it converts silence into
> false assurance.

While there, a second nag insisted the missing Cloudflare code meant "gallery
films won't play" — untrue once they were self-hosted. **Warnings that are wrong
train people to ignore the ones that aren't.**

### 4.6.10 Believe error messages only as far as you can verify them

A generation tool reported *"ran out of credits"*. The account balance was 2,200.
The real cause was that no **workspace** was selected, so the work had nothing to
bill against. The tool even offered a purchase flow.

Checking the balance took one call and cost nothing. Following the error's
suggestion would have spent the client's money on a problem that didn't exist.

> **Before an error message costs someone money or data, verify its claim
> independently.** Errors describe symptoms; they are frequently wrong about
> causes, and are written by people who couldn't see your situation.

### 4.6.11 Move the work to the data

29 clips, ~200 MB, on the client's machine; the build sandbox elsewhere with no
route to it. The naive move is to copy everything across.

Both machines had `ffmpeg` and ImageMagick. So contact sheets were built **on the
machine holding the files**, and only ~4 MB of JPEG summaries were transferred.

Likewise, discovering the sandbox had no egress to the media CDN wasn't a
blocker to *note* — it was a fact to design around, and to write into the runbook
so the next person doesn't rediscover it.

> **Look at what's installed where before designing the data flow.** Moving
> computation to data is usually cheaper than moving data to computation.

### 4.6.12 Media has privacy in it

A Sea-Doo tile carried a fully legible registration. Normal on the business's own
Instagram; different on a commercial website where it's a *customer's* plate on a
page they didn't publish. It got blurred, and the provenance doc now carries a
standing instruction to check new media for plates, house numbers and faces.

One clip showing a person's face was excluded entirely, pending permission.

> **Real photography carries real people's data.** Fake stock imagery never
> raised this question, so it's easy to forget the moment you start using the
> real thing.

### 4.6.13 Write down where every asset came from

`public/ASSET-PROVENANCE.md` records, for each shipped asset: its source clip and
timestamps, how it was processed, and whether it's real or generated. It also
carries the atmosphere-only policy and the open questions — customer permission,
missing originals.

Without it, "is this a photo of our work or a placeholder?" becomes
unanswerable within about a month, and any generated asset silently graduates
into being treated as portfolio.

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

### 6.1 When even the harness isn't available

A later session picked the project up in a fresh sandbox: `node_modules` gone,
still no registry, so **esbuild wasn't there either**. The verification story had
to degrade again, and the useful lesson is that it degrades in *layers* rather
than collapsing:

1. **`node --check`** on a copy of `site.config.js` renamed to `.mjs` — Node
   refuses ESM syntax in a `.js` file it assumes is CommonJS, so the rename is
   the whole trick. Catches syntax errors with zero dependencies.
2. **Import it and assert on the data** — count gallery entries, check for
   duplicate `id`s, confirm every `poster` and `clip` path exists on disk. Most
   config mistakes are missing files and typos in paths, and `fs.existsSync`
   finds those without a framework.
3. **Render the real CSS** — a small hand-written HTML file that links
   `app/globals.css` and reproduces the component's class names, screenshotted
   with Playwright at desktop and mobile widths. Not the real components, but it
   exercises the real stylesheet, which is where layout bugs live.

That third step caught a genuinely bad tile: a poster frame landing on a
motion-blurred interior under a caption reading "Exterior". No amount of syntax
checking finds that. **Looking at the output is a test.**

One caution learned the hard way in the same session: a crude regex that strips
`//` comments before strings will eat the `//` in `https://…` inside a template
literal and report bogus brace mismatches. When a quick check disagrees with you,
suspect the check.

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

6. **The hard one.** The Instagram section renders from a curated array, and
   `INSTAGRAM_ACCESS_TOKEN` is deliberately blank. Explain why simply setting a
   token would *not* produce a live feed on this deployment. Then describe two
   architectures that would, and argue for one — including what each costs to
   run and to maintain.

7. **Trust nothing.** Pick any clip in `PMD_Video_Clips/`. Predict its
   orientation from `ffprobe`'s width and height, then decode a frame and
   measure it. Explain the discrepancy. Now find a clip where they agree and say
   why.

8. **Break the doctor.** Restore the old `if (placeholderish.length > 6)` check,
   swap one placeholder for a real image, and run `npm run doctor`. Explain what
   it now tells you and why that's worse than saying nothing. Generalise the
   failure — where else in this codebase could a threshold hide a problem as you
   approach done?

9. **Read a file's history.** Given a video at 576×1024 and 1.4 Mbps, argue from
   the numbers alone that it is not a camera original. What would you expect a
   modern phone to produce, and roughly what bitrate?

10. **The caption trap.** Set a gallery tile's `label` to `"Ceramic coating"`.
    Nothing breaks and nothing warns. Explain what is now wrong with the site,
    which other file it contradicts, and design a check that would catch it.

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
decision in full, `docs/BUILD-GUIDE.md` for the original nine-stage build, the
Amplify runbook for every trap in condensed form, and
`site/public/ASSET-PROVENANCE.md` for where every shipped image and film came
from, plus the rule about what may and may not be generated.

**Rebuilding media:** `site/public/video/README.md` carries the exact ffmpeg
recipes for the hero pillarbox, the gallery films and the poster crops. Read
Part 4.6 first for why they're shaped that way.

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
