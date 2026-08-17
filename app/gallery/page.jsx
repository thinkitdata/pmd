import { gallery } from "@/site.config";
import FilmGrid from "@/components/FilmTile";
import InstagramGrid from "@/components/InstagramGrid";
import Reveal from "@/components/Reveal";

export const metadata = {
  title: "The Work",
  description:
    "Films from recent details — paint correction, ceramic coating, interior restoration and concours preparation.",
  alternates: { canonical: "/gallery" },
};

export default function GalleryPage() {
  return (
    <main>
      <section
        className="section surface-ink"
        style={{ paddingTop: "clamp(9rem, 16vw, 13rem)" }}
      >
        <div className="shell shell--wide">
          <Reveal as="p" className="eyebrow">
            The work
          </Reveal>
          <Reveal as="h1" i={1} className="u-mt-md" style={{ maxWidth: "16ch" }}>
            Every car has a film.
          </Reveal>
          <Reveal as="p" i={2} className="lede u-mt-md">
            We film the process on every vehicle we take. Not for marketing —
            because a written invoice can&rsquo;t show you what changed.
          </Reveal>

          <div className="u-mt-lg">
            <FilmGrid items={gallery} />
          </div>
        </div>
      </section>

      <section className="section surface-ink" style={{ paddingTop: 0 }}>
        <InstagramGrid limit={12} />
      </section>
    </main>
  );
}
