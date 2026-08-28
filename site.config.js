/**
 * ============================================================================
 * PRIME MOBILE AUTO DETAILING — Single source of truth for site content.
 * ============================================================================
 * Nearly everything you'll want to change week-to-week lives in this one file:
 * services, prices, gallery films, testimonials, contact details, social links.
 *
 * Edit → save → `git push`. The site rebuilds and deploys itself.
 *
 * Anything marked TODO is a placeholder you should replace before launch.
 */

export const site = {
  // --- identity ------------------------------------------------- CONFIRMED
  /**
   * Three name variants are in play, so here's the rule this file follows:
   *   legalName  — the LLC. Goes in structured data. Match this exactly on
   *                your Google Business Profile and every directory listing;
   *                inconsistent naming actively suppresses local ranking.
   *   name       — the trading name used in page titles and copy.
   *   wordmark   — the visual lockup in the nav. "PRIME" is the one word
   *                that's dominant in the logo AND present in every variant,
   *                so it anchors the mark and the rest reads as description.
   */
  legalName: "Prime Mobile Auto Detailing LLC",
  name: "Prime Mobile Auto Detailing",
  shortName: "Prime",
  wordmark: { name: "PRIME", sub: "Mobile Auto Detailing" },

  /**
   * Your logo file. Drop the artwork in public/images/ and point at it here.
   *
   * Where it's used: the footer, at real size. The nav deliberately keeps the
   * typographic wordmark instead — your logo has the phone number baked into
   * it, which turns to mush at nav height, and a 40px-tall version of a
   * detailed mark reads as noise. Set `logo: null` to use the wordmark in the
   * footer too.
   *
   * Ideally export a version WITHOUT the phone bar for web use — the phone
   * number is already in the footer as a tappable link, which is more useful
   * on a phone than a picture of a number.
   */
  logo: {
    // Phone bar cropped off, black keyed to transparency so it sits cleanly
    // on the footer's ink. The number is a tappable link below it instead.
    src: "/images/logo.png",
    alt: "Prime Mobile Auto Detailing",
    maxWidth: 280,
  },
  tagline: "The finest work leaves no trace.",
  description:
    "Mobile detailing for vehicles that deserve the extra mile. Paint correction, ceramic coating and concours-level care in Alpharetta, Johns Creek and the surrounding areas — one vehicle at a time.",

  url: "https://primemobiledetails.com",

  // --- contact -------------------------------------------------------------
  phone: "(678) 275-6431", // CONFIRMED — from the business card
  phoneHref: "tel:+16782756431", // CONFIRMED
  email: "hello@primemobiledetails.com", // TODO — set this up with the domain

  // Mobile business: you serve an area, you don't have a storefront.
  // This shape maps directly onto LocalBusiness structured data.
  serviceArea: {
    // CONFIRMED — 30 miles from Johns Creek, GA
    label: "Alpharetta, Johns Creek & surrounding areas",
    // A short form for tight spaces like the hero eyebrow, where the full
    // label would wrap awkwardly.
    shortLabel: "Alpharetta · Johns Creek",
    radiusMiles: 30,

    // Johns Creek, GA — the centre of the GeoCircle in your structured data.
    lat: 34.0289,
    lng: -84.1986,

    // A real local-search signal: people search "ceramic coating Alpharetta",
    // not "ceramic coating Georgia". These all fall inside 30 miles of Johns
    // Creek and skew toward the neighbourhoods where the cars you want live.
    towns: [
      "Johns Creek",
      "Alpharetta",
      "Milton",
      "Roswell",
      "Duluth",
      "Suwanee",
      "Cumming",
      "Peachtree Corners",
      "Sandy Springs",
      "Dunwoody",
    ],
  },

  /**
   * Two representations of the same thing, deliberately.
   *
   * `hours` is what humans read in the footer.
   * `openingHours` is what Google reads in the structured data.
   *
   * KEEP THEM IN SYNC, and keep both in sync with your Cal.com availability.
   * A site that advertises Saturday while the calendar refuses Saturday
   * generates a support call every single time.
   */
  hours: [
    { days: "Monday – Friday", time: "7:00 – 16:00" },
    { days: "Saturday – Sunday", time: "Closed" },
  ],

  // Machine-readable, 24-hour. Only list days you actually work — omitting a
  // day means closed, which is what Google expects.
  openingHours: [
    {
      days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "07:00",
      closes: "16:00",
    },
  ],

  // --- social -------------------------------------------------------------
  // Any entry left as an empty string is hidden from the site automatically,
  // so it's safe to leave these blank until the accounts exist.
  social: {
    // CONFIRMED by Greg 27 Aug 2026: the leading "h_" is intentional and
    // correct. It is not a typo — do not "fix" it.
    instagram: "https://instagram.com/h_primemobileautodetailing",
    instagramHandle: "@h_primemobileautodetailing",
    facebook: "", // TODO — blank entries hide themselves
    youtube: "", // TODO
    tiktok: "",
    google: "", // Google Business Profile review link
  },

  // --- build credit -------------------------------------------------------
  // The "site created by" line in the footer colophon.
  //
  // Config-driven rather than hardcoded because this codebase is the template
  // for Greg's other client sites — the component stays generic and each site
  // sets its own credit, or `builtBy: null` to hide the line entirely.
  //
  // SEO note, and it matters because this link will appear across a portfolio
  // of client sites: keep the anchor text the AGENCY NAME. A plain brand credit
  // is normal and Google treats it as such. The same link repeated site-to-site
  // with keyword-stuffed anchor text ("Atlanta web design", "detailing SEO") is
  // the textbook signature of a link scheme and can earn a manual action for
  // both ends. Brand name only. No keywords. Ever.
  builtBy: {
    name: "Think IT Data Solutions",
    url: "https://thinkitdata.com",
  },

  // --- booking ------------------------------------------------------------
  // Your Cal.com link is "username/event-slug".
  //
  // NOTE: Cal.com requires event slugs of at least 10 characters, lowercase
  // letters, numbers and dashes only — hence the "the-" prefixes.
  //
  // `the-refresh` could NOT be used: Cal rejects it with a silent 400, meaning
  // the slug is reserved by something invisible in the account (probably a
  // soft-deleted record). Hence `the-refresh-detail`. If you ever free that
  // slug up, both this file and the Cal event URL must change together.
  //
  // Each calEvent MUST match its Cal.com event URL exactly.
  booking: {
    calUsername: "primemobiledetails",
    defaultEvent: "consultation", // a 15-min intro call
    // Cal.com theme tokens so the widget matches the site, not Cal's defaults.
    // These are --gold-600 and --gold-400 from globals.css — keep them in sync
    // if you ever change the accent.
    brandColor: "#856418",
    darkBrandColor: "#d9b56d",
  },

  // --- video --------------------------------------------------------------
  video: {
    /**
     * The hero clip. Keep it SHORT (8–14s), silent, and under ~3 MB.
     * These are served as plain files from /public — no streaming service
     * needed for a loop this size, and it starts instantly.
     * See public/video/README.md for the exact ffmpeg commands.
     */
    hero: {
      poster: "/images/hero-poster.jpg",
      mp4: "/video/hero.mp4",
      webm: "/video/hero.webm",
    },
    /**
     * Longer gallery films live on Cloudflare Stream (adaptive bitrate, so a
     * customer on cellular still gets a smooth watch). Paste the video UID
     * from the Stream dashboard into each gallery item below.
     * Set `provider: "file"` instead if you'd rather self-host a short clip.
     */
    provider: "cloudflare-stream",
    // Intentionally blank. The six gallery films are self-hosted in
    // /public/video (see the `clip` field on each gallery entry), so no
    // Cloudflare account is needed. Only fill this in if you later add a film
    // long enough to want adaptive streaming, and give that entry a streamId.
    cloudflareCustomerCode: "",
  },
};

// ---------------------------------------------------------------- tenets --
// The philosophy strip. Three principles, each anchored to a character.
// If you'd rather not use the Chinese characters, set `han: null` — the
// layout is designed to hold up either way.
export const tenets = [
  {
    han: "水",
    romaji: "Shuǐ · Water",
    title: "Adapts to every surface",
    body: "Single-stage lacquer, ceramic-coated carbon, 40-year-old leather — each one asks for a different hand. We read the vehicle before we touch it.",
  },
  {
    han: "慢",
    romaji: "Màn · Unhurried",
    title: "Quality over quantity",
    body: "One vehicle a day. Sometimes one vehicle over two days. We would rather turn work away than rush the car in front of us.",
  },
  {
    han: "誠",
    romaji: "Chéng · Sincerity",
    title: "Go the extra mile",
    body: "The door jambs, the underside of the hood, the seat rails — the panels you'll never show anyone get the same hours as the ones you will.",
  },
];

// -------------------------------------------------------------- services --
// Add, remove, or reorder freely. `featured: true` gives one card the dark
// treatment. `calEvent` should match a Cal.com event-type slug.
export const services = [
  {
    slug: "refresh",
    name: "The Refresh",
    duration: "4–5 hours",
    price: "from $275",
    calEvent: "the-refresh-detail",
    featured: true,
    flag: "Available now",
    summary:
      "A full reset for a car that's already cared for. Keeps a good finish good.",
    includes: [
      "pH-neutral hand wash & decontamination",
      "Iron & tar removal, clay treatment",
      "Interior deep vacuum and steam",
      "Sealant, 4–6 month protection",
      "Glass, trim, and wheel faces dressed",
    ],
  },
  {
    slug: "restoration",
    name: "The Restoration",
    duration: "1–2 days",
    price: "from $850",
    calEvent: "the-restoration",
    // Set to false the day your detailer is trained and you're taking these.
    // That one word turns the card, the booking page and the structured data
    // from "coming soon" to "bookable" — nothing else to change.
    comingSoon: true,
    summary:
      "Multi-stage paint correction. Swirls, holograms, and etching taken out — not filled in.",
    includes: [
      "Everything in The Refresh",
      "Paint depth measured, panel by panel",
      "Two- to three-stage machine correction",
      "Leather cleaned, fed, and conditioned",
      "Engine bay detail",
      "Before / after film delivered to you",
    ],
  },
  {
    slug: "ceramic",
    name: "The Ceramic",
    duration: "2–3 days",
    price: "from $1,650",
    calEvent: "the-ceramic",
    comingSoon: true,
    summary:
      "Correction followed by a professional-grade coating. Years of protection, measurable gloss.",
    includes: [
      "Everything in The Restoration",
      "9H ceramic coating, 3–5 year system",
      "Wheels, glass, and trim coated",
      "Interior fabric & leather sealed",
      "Written care plan and maintenance kit",
      "Annual inspection included",
    ],
  },
  {
    slug: "keeper",
    name: "The Keeper",
    duration: "per visit",
    price: "from $180",
    calEvent: "the-keeper",
    summary:
      "A standing appointment for the car you intend to keep. We come to you on a rhythm.",
    includes: [
      "Scheduled maintenance details",
      "Coating decontamination & top-up",
      "Priority calendar access",
      "Pre-event and pre-show preparation",
      "Photographic condition record",
    ],
  },
];

// --------------------------------------------------------------- process --
export const process = [
  {
    title: "Assessment",
    body: "We walk the vehicle with you and a paint gauge. You'll know what's correctable and what isn't before any money changes hands.",
  },
  {
    title: "Decontamination",
    body: "Touchless pre-wash, pH-neutral hand wash, iron dissolve, tar, and clay. Nothing abrasive touches dirty paint.",
  },
  {
    title: "Correction",
    body: "Machine polishing under inspection lighting, measured and checked panel by panel. The slow part, and the part that matters.",
  },
  {
    title: "Protection",
    body: "Sealant or ceramic, applied in a controlled space, cured properly. Wheels, glass, and trim included as standard.",
  },
  {
    title: "The Reveal",
    body: "Final inspection together, in daylight. You get the film, the care plan, and a vehicle that looks the way you remember it.",
  },
];

// --------------------------------------------------------------- gallery --
// Each entry becomes a film tile.
//
// `clip` is a short self-hosted film in /public/video. Keep them 8–10s, silent,
// and under ~1.2 MB — they are only fetched when a visitor actually opens one,
// so six of them cost nothing on first paint. `poster` is a still from that
// same film (1600×1000), and it IS loaded up front, so it carries the tile.
//
// `streamId` is still honoured if you ever move to Cloudflare Stream for
// longer films: set `cloudflareCustomerCode` above and give an entry a
// streamId, and the lightbox will use Stream for that one instead.
//
// LABELS AND TITLES ARE DESCRIPTIVE ONLY — they say what is visibly in the
// frame and never name a service. That is deliberate. Two of the services on
// this site are still flagged `comingSoon`, so a tile captioned "ceramic
// coating" would contradict its own service page. If you want service-level
// captions, confirm what was actually sold for each vehicle first.
export const gallery = [
  {
    id: "huracan-foam",
    label: "Foam",
    title: "Lamborghini Huracán",
    poster: "/images/work-01.jpg",
    clip: "/video/work-01.mp4",
    portrait: true,
  },
  {
    id: "ghost",
    label: "Exterior",
    title: "Rolls-Royce Ghost",
    poster: "/images/work-02.jpg",
    clip: "/video/work-02.mp4",
    portrait: true,
  },
  {
    id: "urus-cabin",
    label: "Interior",
    title: "Lamborghini Urus",
    poster: "/images/work-03.jpg",
    clip: "/video/work-03.mp4",
    portrait: true,
  },
  {
    id: "aston",
    label: "Exterior",
    title: "Aston Martin",
    poster: "/images/work-04.jpg",
    clip: "/video/work-04.mp4",
    portrait: true,
  },
  {
    id: "by-hand",
    label: "By hand",
    title: "Wheels, brush and foam",
    poster: "/images/work-05.jpg",
    clip: "/video/work-05.mp4",
    portrait: true,
  },
  {
    id: "huracan-garage",
    label: "Collected",
    title: "Lamborghini Huracán",
    poster: "/images/work-06.jpg",
    clip: "/video/work-06.mp4",
    portrait: true,
  },
];

// ------------------------------------------------- instagram fallback --
// THIS IS THE LIVE PATH, NOT A FALLBACK. Read this before "fixing" it.
//
// Decided 27 Aug 2026: this site does NOT call the Instagram API. No token is
// set, so `getInstagramPosts()` returns [] and the grid below is what renders.
// That is the intended behaviour, not a broken integration.
//
// Why: the site is a static export, so server components run once at BUILD
// time. There is no server to revalidate on, which means an API-backed feed
// would only be as fresh as the last Amplify build anyway — and long-lived
// Instagram tokens expire every 60 days, silently dropping the section back to
// these images the moment one lapses. For six tiles that changes rarely, a
// curated set has no token, no expiry, no extra infrastructure and no failure
// mode. Swapping an image is a one-line commit.
//
// If you ever DO want the live feed, the code is intact — set
// INSTAGRAM_ACCESS_TOKEN and add a scheduled Amplify rebuild plus something
// that refreshes and stores the rotating token. See ASSET-PROVENANCE.md.
//
// Keep these six square (they render at aspect-ratio 1) and keep them current.
export const instagramFallback = [
  "/images/ig-01.jpg",
  "/images/ig-02.jpg",
  "/images/ig-03.jpg",
  "/images/ig-04.jpg",
  "/images/ig-05.jpg",
  "/images/ig-06.jpg",
];

// ---------------------------------------------------------- testimonials --
export const testimonials = [
  {
    text: "He spent forty minutes on the door jambs alone. I've paid more for less at a shop with a lobby.",
    who: "M. Delgado · 993 Turbo",
  },
  {
    text: "They turned down my Tuesday because they were already booked on another car. That told me everything.",
    who: "S. Whitfield · Continental GT",
  },
  {
    text: "Came to my driveway, left it better than the day I picked it up from the dealer. Third year in a row now.",
    who: "R. Ahn · Taycan Turbo S",
  },
];

// ------------------------------------------------------------------ nav --
export const nav = [
  { href: "/services", label: "Services" },
  { href: "/gallery", label: "The Work" },
  { href: "/about", label: "Philosophy" },
  { href: "/book", label: "Reserve" },
];

export default site;
