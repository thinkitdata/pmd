# Video workflow

Two different jobs, two different treatments. Getting this split right is the
single biggest thing standing between "beautiful site" and "beautiful site that
takes nine seconds to load on a phone."

---

## 1. The hero loop — served from this folder

**What it is:** one 8–14 second silent clip that loops behind the headline.
Slow camera movement across a panel, water beading, a light bar passing over
paint. No cuts, no people talking, nothing that demands attention.

**Why it lives here and not on a streaming service:** it needs to start
*instantly*. A streaming player has to load a script, negotiate a manifest, and
buffer a segment before the first frame appears. A plain MP4 under 3 MB starts
in one request.

**Target:** ≤ 3 MB, 1920×1080, no audio track at all.

```bash
# MP4 (H.264) — the universal fallback
ffmpeg -i raw-hero.mov \
  -t 12 \
  -vf "scale=1920:-2,fps=30" \
  -c:v libx264 -profile:v high -crf 26 -preset slow \
  -pix_fmt yuv420p -movflags +faststart \
  -an \
  hero.mp4

# WebM (VP9) — ~30% smaller, served first to browsers that take it
ffmpeg -i raw-hero.mov \
  -t 12 \
  -vf "scale=1920:-2,fps=30" \
  -c:v libvpx-vp9 -crf 34 -b:v 0 -row-mt 1 \
  -an \
  hero.webm

# The poster frame — this is what paints before the video is ready,
# so pick a frame that looks good frozen.
ffmpeg -i hero.mp4 -ss 00:00:03 -vframes 1 -q:v 2 ../images/hero-poster.jpg
```

Check the result: `ls -lh hero.*`. If the MP4 is over 3 MB, raise `-crf` (28,
then 30) before you shorten the clip — dark, slow footage compresses well and
the quality loss is nearly invisible at these bitrates.

`-movflags +faststart` matters: it moves the index to the front of the file so
playback can begin before the whole thing has downloaded. Without it the
browser waits for the full file.

`-pix_fmt yuv420p` matters too — without it, Safari refuses to play the file
at all, which is a fun bug to find after launch.

---

## 2. Gallery films — Cloudflare Stream

**What they are:** the 1–4 minute before/after films for each vehicle.

**Why not this folder:** a 3-minute film is 40–80 MB. Sitting on a CDN as a
single file, that's a bad experience on cellular and an expensive one for you.
Cloudflare Stream re-encodes to adaptive bitrate HLS, so a customer on a weak
connection gets a lower rung of the ladder instead of a spinner.

**Pricing:** $5 per 1,000 minutes stored, $1 per 1,000 minutes delivered. Fifty
three-minute films is 150 minutes stored — under a dollar a month. Delivery of
1,000 full views of a 3-minute film is about $3.

**Upload:**

```bash
# one-time: install and log in
npm i -g wrangler && wrangler login

wrangler stream upload ./films/993-turbo.mp4 --name "993 Turbo — two-stage"
```

Or drag the file into the Stream dashboard. Either way, copy the **video UID**
into the matching `gallery` entry's `streamId` in `site.config.js`, and put
your **customer code** (the `customer-xxxxx` part of the embed URL) into
`site.video.cloudflareCustomerCode`.

Export a still for each film at 1600×1000 into `public/images/` and point
`poster` at it. The poster is what people actually see — it's worth grading it
properly rather than grabbing a random frame.

---

## Shooting notes

These are the shots that make a detailing site look expensive, in rough order
of value:

1. **Slow lateral track along a panel** with a hard light source overhead. The
   reflection travelling down the paint is the whole product in one shot.
2. **Water beading and sheeting** in raking light, shot at 60–120fps and slowed.
3. **Macro of the polishing head** working, shallow depth of field.
4. **Before/after in identical framing** — same lens, same position, same light.
   Lock the tripod and don't touch it. This is the shot that sells the job, and
   it only works if literally nothing else changed.
5. **The reveal**: a slow pull-back from a detail to the whole car.

Shoot in the shade or on an overcast day. Direct midday sun blows out the
highlights that make paint look deep, and it hides exactly the defects your
before/after is trying to show.

---

## Rebuilding the hero from a vertical source clip (added 27 Aug 2026)

All current footage is vertical 9:16. The hero is pillarboxed with the footage
itself rather than cropped or outpainted — see `public/ASSET-PROVENANCE.md` for
the reasoning. To rebuild from a different clip:

```bash
SRC=path/to/clip.MP4
START=4.5      # seconds
LEN=6          # seconds; palindrome doubles this to the final duration

# 1. feather mask — width must match the scaled strip (source_w * 1080/source_h)
python3 -c "
from PIL import Image
W,H,F=608,1080,110
m=Image.new('L',(W,H),255); px=m.load()
for x in range(W):
    v=255
    if x<F: v=int(255*(x/F)**0.85)
    elif x>W-F-1: v=int(255*((W-1-x)/F)**0.85)
    for y in range(H): px[x,y]=v
m.save('feather.png')"

# 2. composite
ffmpeg -ss $START -t $LEN -i "$SRC" -loop 1 -i feather.png -filter_complex "\
[0:v]split=2[bg][fg];\
[bg]scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,\
gblur=sigma=44,eq=brightness=-0.30:saturation=0.60[bgb];\
[fg]scale=-2:1080:flags=lanczos,format=yuva420p[fgs];\
[1:v]format=gray[mk];[fgs][mk]alphamerge[fga];\
[bgb][fga]overlay=(W-w)/2:0,format=yuv420p[v]" \
 -map "[v]" -an -t $LEN -c:v libx264 -crf 20 -preset slow comp.mp4

# 3. palindrome for a seamless loop
ffmpeg -i comp.mp4 -filter_complex \
 "[0:v]split[a][b];[b]reverse[r];[a][r]concat=n=2:v=1[v]" -map "[v]" -an \
 -c:v libx264 -crf 18 loop.mp4

# 4. ship
ffmpeg -i loop.mp4 -an -c:v libx264 -profile:v high -pix_fmt yuv420p \
 -crf 27 -preset slow -movflags +faststart hero.mp4
ffmpeg -i loop.mp4 -an -c:v libvpx-vp9 -b:v 0 -crf 36 -row-mt 1 \
 -cpu-used 3 -deadline good hero.webm
ffmpeg -ss 3 -i loop.mp4 -frames:v 1 -q:v 3 ../images/hero-poster.jpg
```

`-movflags +faststart` and `-pix_fmt yuv420p` are both load-bearing: without
the first the video won't start until fully buffered, without the second Safari
and several Android browsers refuse to decode it at all.

Keep the result under ~3 MB. Current: 1.8 MB mp4 / 1.2 MB webm at 12s.
