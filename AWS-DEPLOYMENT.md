# Running this on AWS

A correction, an explanation, and a working AWS path.

---

## First, a correction

In the original guide I wrote that this codebase *"runs on AWS Amplify Hosting
with no changes."* **That was wrong, and you were right to pull on it.**

Amplify Hosting's managed SSR provider currently supports **Next.js 15**.
Next.js 16 is [explicitly not supported](https://github.com/aws-amplify/amplify-js/issues/14600)
— the tracking issue has been open since October 2025. Dropping this project
into Amplify as an SSR app today would not have worked.

I also collapsed two very different AWS options into one sentence, which is the
thing that made the reasoning look inconsistent. Let me separate them properly,
because once separated, **AWS looks better than I made it sound** — just via a
different route than the one I named.

---

## There are four options, not two

| | What it is | Who operates it |
| --- | --- | --- |
| **1. Vercel** | PaaS. Git push → live. | Vercel |
| **2. Amplify Hosting** | PaaS, on AWS. Git push → live. | AWS |
| **3. OpenNext on AWS** | Next.js compiled to Lambda + CloudFront | You (with tooling) |
| **4. Raw S3 + CloudFront + MediaConvert + CodePipeline** | IaaS assembly | You, entirely |

My "$15/month savings isn't worth a weekend of setup" line was about **option
4**, and it stands. But I let it colour **option 2**, which isn't a DIY
assembly at all — Amplify is a managed platform with git-based deploys, PR
previews, managed TLS, a CloudFront-backed CDN, and native Route 53
integration. It is Vercel's category, not CloudFormation's.

And on price, Amplify is the cheaper one:

| | Vercel Pro | Amplify Hosting |
| --- | --- | --- |
| Platform fee | $20/mo per seat | **$0** |
| Data transfer | ~$0.15/GB after 1 TB | $0.15/GB served |
| Build | included | $0.01/build-minute |
| SSR compute | included (4 CPU-hrs) | $0.20/GB-hour |
| **Realistic total, this site** | **$20/mo** | **~$1–3/mo** |
| First 12 months | — | **$0** (free tier) |

So: consolidation *and* roughly $17/month cheaper. Your instinct was sound.

---

## The catch, and the thing that dissolves it

The catch is option 2's version support. Building on a host that trails the
framework by a major version means that every time you want a new Next.js
feature — or simply run `npm update` a year from now — you first have to check
whether your host has caught up. That's a small, recurring tax with an
unpredictable due date, and it's the real reason I steered toward Vercel.

**But that tax only applies if you need a server at all.** And this site barely
does.

Look at what's actually dynamic in it:

- One Instagram fetch, cached for an hour
- One weekly cron to refresh the Instagram token
- One page that read a query string (`/book?service=ceramic`)

That's the entire server-side surface. Everything else — every page, every
service, the gallery, the booking embed — is static content that could have been
generated at build time.

So I've made it exactly that. **The site now builds as a pure static export**,
and I removed the three dependencies above:

| Was | Now |
| --- | --- |
| `/book?service=x` read `searchParams` (needs a server) | `/book/ceramic`, `/book/refresh`, … prerendered via `generateStaticParams` |
| Instagram fetched per-request, revalidated hourly | Fetched at build time; a nightly rebuild refreshes it |
| Token refreshed by a Vercel cron hitting an API route | Refreshed by a GitHub Actions workflow, no server involved |

Two of those three are improvements regardless of host. The per-service booking
URLs are genuinely better than the query string — each one is indexable with
its own title and description, which is exactly the kind of page that ranks for
"ceramic coating Alpharetta."

### Why this changes the calculus completely

A static export is **just files**. No host needs to understand which Next.js
version produced them, so the version-support question stops existing —
permanently, not until the next Amplify release. Deploy the `out/` directory to
Amplify, to an S3 bucket, to Cloudflare Pages, to a Raspberry Pi. It is the
most portable and most durable form this site can take, and for a marketing
site it costs you almost nothing to be in it.

```bash
npm run build:static     # → ./out
```

---

## Recommended: Amplify Hosting, static export

This is now what I'd pick if consolidation matters to you. `amplify.yml` ships
in the repo and is already configured.

**1. Push to GitHub**, then in the Amplify console: **Create app → Deploy from
GitHub → pick the repo**.

**2. Amplify reads `amplify.yml` automatically.** Confirm the build output
directory is `out`. The spec already:
- runs `npm run build:static`
- deletes `app/api/` inside the build checkout (a static export can't contain
  server route handlers, and on this path the GitHub Action does that job)
- sets the cache and security headers that `next.config.mjs` would have set on
  a server

**3. Environment variables** (App settings → Environment variables):

| Key | Value |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `https://primemobiledetails.com` |
| `INSTAGRAM_ACCESS_TOKEN` | your long-lived token |

**4. Domain.** App settings → Domain management → add your domain. Because DNS
is already in Route 53 on the same account, Amplify creates the records and the
ACM certificate for you — no manual record entry, which is the one place this
is genuinely nicer than Vercel.

**5. Keep the feed fresh.** Create an incoming webhook (App settings → Build
settings → Incoming webhooks), save the URL as the repo secret
`AMPLIFY_WEBHOOK_URL`, and `.github/workflows/nightly-rebuild.yml` will poke it
nightly. Set `INSTAGRAM_ACCESS_TOKEN` and `GH_PAT` as repo secrets and
`.github/workflows/instagram-token.yml` keeps the token alive.

**Cost:** $0 for the first 12 months on the free tier, then roughly $1–3/month
at your traffic, plus Cloudflare Stream for the films.

### What you give up versus Vercel

Worth knowing before you commit:

- **Preview deployments are weaker.** Amplify does branch deploys; per-pull-request
  previews need to be enabled and are less polished than Vercel's automatic ones.
- **The feed is as fresh as the last build.** Nightly instead of hourly. For a
  detailing business's Instagram grid, nobody will ever notice.
- **Build logs are worse.** They just are.
- **If you later add something genuinely dynamic** — a customer login, a live
  quote calculator, a database — you're back to needing a server, and the
  Amplify version question returns. At that point either move to Vercel or use
  option 3 below.

None of those are dealbreakers for a marketing site. If they were, I'd have led
with them.

---

## The pure-AWS alternative: S3 + CloudFront directly

If you'd rather not use Amplify at all, the same `out/` directory drops onto
S3 + CloudFront. This is cheaper still (pennies), and it's the option where
your existing AWS footprint does the most work.

```bash
npm run build:static
aws s3 sync ./out s3://primemobiledetails-site --delete
aws cloudfront create-invalidation --distribution-id EXXXXXXXX --paths "/*"
```

You'd need to set up once: the bucket (private, OAC-only), a CloudFront
distribution with an Origin Access Control, an ACM certificate in `us-east-1`,
a response-headers policy for the security headers, and a CloudFront Function
to rewrite directory URLs to `index.html`. Then wrap those three commands in a
GitHub Action.

That's an afternoon of setup, and it is a real afternoon — but it's an
afternoon, not the weekend-plus-ongoing-ops that option 4 implied, because
**the static export removed the encoding pipeline, the SSR layer, and the
Lambda@Edge work** that made the original DIY estimate expensive. Video still
goes to Cloudflare Stream, which is doing the job MediaConvert would have.

Choose this over Amplify if you want everything under CloudFormation/CDK and
don't mind owning the pipeline. Choose Amplify if you want the git-push loop
without building it.

---

## Option 3: OpenNext, if you ever need real SSR on AWS

Worth knowing this exists, because it's the answer if the site outgrows static.

[OpenNext](https://opennext.js.org/) compiles a Next.js build into Lambda
functions plus CloudFront, giving you full SSR, ISR and middleware on AWS
infrastructure you own. It's mature and used in production, typically deployed
with SST or Terraform.

It currently targets Next.js 15, same as Amplify. But the picture here is
improving structurally: **Next.js 16.2 shipped a stable
[Adapter API](https://nextjs.org/blog/nextjs-across-platforms) in March 2026**,
designed jointly with AWS Amplify, OpenNext, Netlify, Cloudflare and Google
Cloud. It gives every host a versioned, tested contract to build against
instead of reverse-engineering Next.js build output, plus a shared test suite
and a standing working group with lead time on breaking changes.

AWS adapters through OpenNext are "in active development, with expected
releases later this year." When they land, the version-lag problem that drove
my original recommendation largely goes away — and at that point Amplify SSR
becomes a straightforwardly good option rather than a compromised one.

**This is worth a look in six months.** Nothing you do now blocks it.

---

## So what should you actually do

| If you want… | Pick |
| --- | --- |
| Everything on AWS, one bill, cheapest sane option | **Amplify + static export** |
| Absolute lowest cost, full infra control | **S3 + CloudFront + static export** |
| Best deploy experience, day-one framework support, $20/mo | **Vercel** |
| Full SSR on AWS today | **OpenNext + SST** (heavier; probably overkill) |

**My revised recommendation: Amplify Hosting with the static export.** You get
consolidation, Route 53 integration that's actually nicer than the Vercel path,
$0 for a year and ~$2/month after, and — because it's static — no exposure to
anyone's framework version support, ever.

The honest caveat: Vercel's deploy experience is better, and if you find
yourself fighting Amplify's build logs at 11pm before a launch, that $20/month
buys back a real amount of irritation. Both paths are in the repo now. Switching
between them is a config change, not a rewrite, which is the point.

---

## What changed in the code

Everything below works identically on **both** targets — nothing here is
AWS-only, and the Vercel path still works exactly as before.

```
site/
├─ amplify.yml                          NEW  Amplify build spec + CDN headers
├─ next.config.mjs                      MOD  STATIC_EXPORT=1 → output: "export"
├─ package.json                         MOD  added `build:static`
├─ app/book/page.jsx                    MOD  no longer reads searchParams
├─ app/book/[service]/page.jsx          NEW  prerendered page per service
├─ app/services/page.jsx                MOD  links to /book/<slug>
├─ app/sitemap.js                       MOD  includes the per-service URLs
├─ components/BookingPanel.jsx          NEW  shared by both booking routes
├─ scripts/refresh-instagram-token.mjs  NEW  serverless token refresh
└─ .github/workflows/
   ├─ instagram-token.yml               NEW  weekly token refresh
   └─ nightly-rebuild.yml               NEW  nightly Amplify rebuild
```

`vercel.json` and `app/api/instagram/refresh/route.js` are untouched and still
drive the Vercel path. You need one set or the other, not both.
