import Link from "next/link";
import { site, tenets } from "@/site.config";
import Reveal from "@/components/Reveal";

export const metadata = {
  title: "Philosophy",
  description:
    "Why we take one vehicle a day, and what 'go the extra mile' actually costs us.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <main>
      <section
        className="section surface-ink"
        style={{ paddingTop: "clamp(9rem, 16vw, 13rem)" }}
      >
        <div className="shell shell--wide">
          <Reveal as="p" className="eyebrow">
            Philosophy
          </Reveal>
          <Reveal as="h1" i={1} className="u-mt-md" style={{ maxWidth: "17ch" }}>
            Effortless is <em style={{ color: "var(--brass-300)" }}>earned.</em>
          </Reveal>
          <Reveal as="p" i={2} className="lede u-mt-md">
            A finished car doesn&rsquo;t look worked on. It looks like nothing
            ever happened to it — which is the whole point, and also the reason
            this takes as long as it does.
          </Reveal>
        </div>
      </section>

      <section className="section surface-ink" style={{ paddingTop: 0 }}>
        <div className="shell shell--wide">
          <div className="split split--wide-right">
            <Reveal className="frame">
              {/* Replace with a portrait of you working. People book people. */}
              <div className="placeholder">Portrait · 1200×1500</div>
            </Reveal>

            <Reveal i={1}>
              <div className="stack" style={{ "--gap": "1.5rem" }}>
                <p style={{ color: "var(--fg-muted)" }}>
                  Most detailing businesses grow by taking more cars. We decided
                  early that we&rsquo;d grow by taking better care of fewer
                  ones. It means we turn work away most weeks. It also means the
                  car in front of us gets every hour it needs, and nobody is
                  waiting in a queue behind it.
                </p>
                <p style={{ color: "var(--fg-muted)" }}>
                  &ldquo;Go the extra mile&rdquo; is easy to put on a van.
                  What it costs in practice is the second pass on a panel that
                  already looked finished, the hour spent on door jambs nobody
                  will photograph, and the honest phone call that talks a
                  customer out of a coating their car doesn&rsquo;t need yet.
                </p>
                <p style={{ color: "var(--fg-muted)" }}>
                  We&rsquo;re mobile because the best place to detail a car is
                  usually where it already lives. You keep your keys. You watch
                  if you want to. Nothing gets driven anywhere it doesn&rsquo;t
                  need to go.
                </p>

                <div className="btn-row" style={{ marginTop: "1rem" }}>
                  <Link href="/book" className="btn">
                    Reserve your date
                  </Link>
                  <a href={site.phoneHref} className="btn btn--ghost">
                    {site.phone}
                  </a>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <div className="seam seam--to-light" />

      <section className="section surface-light" style={{ paddingTop: 0 }}>
        <div className="shell shell--wide">
          <Reveal as="p" className="eyebrow">
            Three principles
          </Reveal>
          <div className="tenets">
            {tenets.map((t, i) => (
              <Reveal as="article" key={t.title} i={i} className="tenet">
                {t.han && (
                  <div className="tenet__han han" aria-hidden="true">
                    {t.han}
                  </div>
                )}
                <div className="tenet__romaji">{t.romaji}</div>
                <h3 className="tenet__title">{t.title}</h3>
                <p className="tenet__body">{t.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
