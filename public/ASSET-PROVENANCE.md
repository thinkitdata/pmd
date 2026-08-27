# Asset provenance

Every image and video shipped in `public/` is listed here with where it came
from. The point is that nobody — us, a future contractor, or Greg in eighteen
months — has to guess whether a given asset is real work or decoration.

**The rule for this site:** anything that could be read by a visitor as
"a vehicle Prime Mobile Auto Detailing worked on" must be real footage of a
real job. Generated imagery is permitted only for atmosphere that makes no
factual claim — water, light, surface texture, ink-wash motifs. No generated
vehicles, no generated before/afters, no generated testimonials.

Decided 27 Aug 2026 with Greg. If that ever changes, change it here first.

---

## Real footage

Source library: `PMD_Video_Clips/` in the OneDrive project folder (29 clips).
All supplied clips are vertical 9:16, recompressed to 576x1024 or 480x848 at
1.3–1.7 Mbps — they are social/messaging downloads, not camera originals.
Camera originals are still being chased; see the note at the bottom.

| Asset | Source clip | Notes |
| --- | --- | --- |
| `video/hero.mp4` | `KIZV8747.MP4` @ 4.5–10.5s | Orange Lamborghini Huracán, garage. Pillarboxed to 16:9 (see below), palindromed to 12s for a seamless loop. |
| `video/hero.webm` | same | VP9, CRF 36 |
| `images/hero-poster.jpg` | same, t=3s | |
| `video/work-01.mp4` · `images/work-01.jpg` | `PMZV8195.MP4` @ 1.5–10.5s | Orange Huracán under foam. Detailer in branded Prime kit is visible — the best "shows the work" clip in the library. |
| `video/work-02.mp4` · `images/work-02.jpg` | `UMMA8586.MP4` @ 40–49s | Black Rolls-Royce Ghost on the drive. |
| `video/work-03.mp4` · `images/work-03.jpg` | `LNDT1766.MP4` @ 8–17s | Lamborghini Urus cabin — wheel, carbon, red stitching. |
| `video/work-04.mp4` · `images/work-04.jpg` | `JZJV2586.MP4` @ 13–21s | Aston Martin, white. Identified from the winged badge on the headrest; model deliberately not named. |
| `video/work-05.mp4` · `images/work-05.jpg` | `RIPJ0130.MP4` @ 8–17s | Hand, brush and foam on a wheel. |
| `video/work-06.mp4` · `images/work-06.jpg` | `LLCD7276.MP4` @ 14–23s | Orange Huracán outside a Lamborghini-crested garage. |

### The six gallery films

Self-hosted rather than on Cloudflare Stream. Each is 8–9s, silent, vertical,
H.264 CRF 31 capped at 1200 kbps, 244 KB–1.2 MB, ~4.5 MB for all six. They are
fetched **only when a visitor opens one**, so they cost nothing on first paint;
the posters are what load up front. Stream is built for long-form adaptive
delivery and would have meant a whole account and integration for six ten-second
loops. `streamId` is still honoured per-entry if a longer film ever needs it.

Audio is stripped from all six deliberately — the source clips carry incidental
background noise and we have no rights position on anything audible in them.

**Captions are descriptive only and name no service.** Two services on this site
are still flagged `comingSoon`, so a tile captioned "ceramic coating" would
contradict its own service page. The previous placeholder captions did exactly
that — they named six vehicles Prime has never touched, two of them under
services not yet offered. If you want service-level captions, confirm what was
actually sold per vehicle first, then rewrite them here.

### How the hero was composed

The source is vertical and the hero is a full-bleed `100svh` panel using
`object-fit: cover`. Rather than crop the car away, outpaint fake margins, or
redesign the layout, the master is **pillarboxed with the footage itself**:

- background — the same clip scaled to cover 1920x1080, `gblur sigma=44`,
  brightness −0.30, saturation 0.60
- foreground — the same clip at native aspect, scaled to 1080 height (608px
  wide), centred, with a 110px feathered alpha edge either side

Every pixel is real. The blur reads as depth of field because it *is* the same
frame, so colour and grain match exactly. The darkened sides also improve
contrast for the headline, which sits bottom-left over the blurred region.

A useful side effect: on a phone the hero box is portrait, so `object-fit:
cover` crops to roughly the central 500px — entirely inside the 608px sharp
strip. **Mobile visitors see only sharp native footage and no blur at all.**

Rebuild command is in `public/video/README.md`.

---

## Generated (atmosphere only)

| Asset | Status |
| --- | --- |
| — | none currently shipped |

Eight candidate atmosphere stills (water sheeting and water beading on dark
clearcoat, warm gold key light, no vehicles) were generated on Higgsfield on
27 Aug 2026 and remain in that account's library. They were not used because
real footage arrived the same day and is better. Cost: 4 credits.

Note for whoever picks this up: **this sandbox has no network route to
Higgsfield or its CDN**, and neither does the local device VM — both were
tested and fail to connect. Anything generated there has to be downloaded
through the Higgsfield web UI and dropped into the OneDrive project folder by
hand. Plan for that round trip; do not assume assets can be fetched by URL.

---

## Still placeholder

`images/work-01..06.jpg`, `images/ig-01..06.jpg`, `images/portrait.jpg` are
synthetic gradient placeholders generated locally with ffmpeg. They are not
photographs of anything and several carry visible "REPLACE ME" text. They must
be replaced with real stills before launch. `npm run doctor` flags them.

---

## Two open questions for Greg

1. **Customer permission.** The hero is an identifiable customer vehicle in an
   identifiable garage. Worth confirming the owner is happy to appear on the
   site, particularly for a car like this one. Same applies to any clip used in
   the gallery, and to `orangeAwesomeHellinson.MP4`, which shows a person's
   face.

2. **Camera originals.** The supplied clips are recompressed and soft at hero
   size. Originals off the source phone would be 1080x1920 or 4K — three to six
   times the pixels — and would let us drop the upscaling question entirely.
   This is the single biggest available quality improvement to the site.
