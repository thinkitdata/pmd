import Link from "next/link";
import { site, tenets, services, process as steps, testimonials, gallery } from "@/site.config";
import HeroVideo from "@/components/HeroVideo";
import Reveal from "@/components/Reveal";
import FilmGrid from "@/components/FilmTile";
import InstagramGrid from "@/components/InstagramGrid";

export default function Home() {
  return (
    <main>
      {/* ============================================================ HERO */}
      <section className="hero">
        <HeroVideo />
        <div className="hero__scrim" />

        <div className="hero__inner">
          <div className="shell shell--wide">
            <Reveal as="p" className="eyebrow">
              Mobile Detailing ·{" "}
              {site.serviceArea.shortLabel || site.serviceArea.label}
            </Reveal>
            <Reveal as="h1" i={1} className="hero__title">
              The finest work
              <br />
              leaves <em>no trace.</em>
            </Reveal>
            <Reveal as="p" i={2} className="lede hero__lede">
              Paint correction, ceramic coating and concours-level care —
              brought to your driveway. One vehicle at a time, because quality
              was never a volume business.
            </Reveal>
            <Reveal i={3} className="btn-row hero__actions">
              <Link href="/book" className="btn">
                Reserve your date
              </Link>
              <Link href="#work" className="btn btn--ghost">
                See the work
              </Link>
            </Reveal>
          </div>
        </div>

        <div className="hero__scroll" aria-hidden="true">
          <span>Scroll</span>
          <i />
        </div>
      </section>

      {/* ====================================================== PHILOSOPHY */}
      <section className="section surface-ink-soft" id="philosophy">
        <div className="shell shell--wide">
          <Reveal as="p" className="eyebrow">
            Our way of working
          </Reveal>
          <Reveal as="h2" i={1} className="u-mt-md" style={{ maxWidth: "24ch" }}>
            Water wears down stone
            <br />
            by never being in a hurry.
          </Reveal>
          <Reveal as="p" i={2} className="lede u-mt-md">
            Three principles decide every job we take, and every job we turn
            down.
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

      {/* ============================================================ WORK */}
      <section className="section surface-ink" id="work">
        <div className="shell shell--wide">
          <Reveal as="p" className="eyebrow">
            Recent work
          </Reveal>
          <Reveal as="h2" i={1} className="u-mt-md" style={{ maxWidth: "16ch" }}>
            Vehicles we were trusted with.
          </Reveal>

          <FilmGrid items={gallery} />

          <Reveal className="u-mt-lg">
            <Link href="/gallery" className="link-quiet">
              See every film
            </Link>
          </Reveal>
        </div>
      </section>

      <div className="seam seam--to-light" />

      {/* ======================================================== SERVICES */}
      <section className="section surface-light" id="services">
        <div className="shell shell--wide">
          <Reveal as="p" className="eyebrow">
            Services
          </Reveal>
          <Reveal as="h2" i={1} className="u-mt-md" style={{ maxWidth: "18ch" }}>
            Four ways we take care of a car.
          </Reveal>
          <Reveal as="p" i={2} className="lede u-mt-md">
            Every quote is confirmed in person once we&rsquo;ve seen the
            vehicle. The prices below are honest starting points, not bait.
          </Reveal>

          <div className="services">
            {services.map((s, i) => (
              <Reveal
                as="article"
                key={s.slug}
                id={s.slug}
                i={i}
                className={`service${s.featured ? " service--featured" : ""}`}
              >
                {s.flag && <span className="service__flag">{s.flag}</span>}
                <h3 className="service__name">{s.name}</h3>
                <div className="service__meta">
                  <span className="service__price">{s.price}</span>
                  <span>· {s.duration}</span>
                </div>
                <p
                  style={{
                    fontSize: "var(--step--1)",
                    color: s.featured
                      ? "rgba(244,241,234,.7)"
                      : "var(--fg-muted)",
                  }}
                >
                  {s.summary}
                </p>
                <ul className="service__list">
                  {s.includes.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================= PROCESS */}
      <section
        className="section surface-light section--tight"
        id="process"
        style={{ paddingTop: 0 }}
      >
        <div className="shell shell--wide">
          <Reveal as="p" className="eyebrow">
            The process
          </Reveal>
          <Reveal as="h2" i={1} className="u-mt-md" style={{ maxWidth: "20ch" }}>
            Five stages. None of them rushed.
          </Reveal>

          <div className="process">
            {steps.map((s, i) => (
              <Reveal
                as="article"
                key={s.title}
                i={i}
                className="step surface-light"
              >
                <h3 className="step__title">{s.title}</h3>
                <p className="step__body">{s.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <div className="seam seam--to-ink" />

      {/* =========================================================== VERSE */}
      <section className="section surface-ink section--tight">
        <div className="shell shell--wide">
          <Reveal as="blockquote" className="quote">
            <span className="quote__mark han" aria-hidden="true">
              水
            </span>
            <p className="verse">
              &ldquo;Nothing in the world is softer than water,
              <br />
              yet nothing is better at wearing down the hard.&rdquo;
            </p>
            <footer className="quote__attr">Tao Te Ching · 78</footer>
          </Reveal>
        </div>
      </section>

      {/* ======================================================= TESTIMONY */}
      <section className="section surface-ink" style={{ paddingTop: 0 }}>
        <div className="shell shell--wide">
          <Reveal as="p" className="eyebrow">
            In their words
          </Reveal>
          <div className="says">
            {testimonials.map((t, i) => (
              <Reveal as="figure" key={t.who} i={i} className="say">
                <div className="say__stars" aria-label="Five out of five">
                  ★★★★★
                </div>
                <blockquote className="say__text">{t.text}</blockquote>
                <figcaption className="say__who">{t.who}</figcaption>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ======================================================= INSTAGRAM */}
      <section className="section surface-ink" style={{ paddingTop: 0 }}>
        <InstagramGrid limit={6} />
      </section>

      {/* ========================================================= RESERVE */}
      <section className="section cta" id="reserve">
        <div className="shell shell--wide">
          <Reveal as="p" className="eyebrow eyebrow--center">
            Reserve
          </Reveal>
          <Reveal
            as="h2"
            i={1}
            className="u-mt-md center"
            style={{ maxWidth: "18ch" }}
          >
            We take one vehicle a day.
          </Reveal>
          <Reveal
            as="p"
            i={2}
            className="lede u-mt-md center"
            style={{ maxWidth: "52ch" }}
          >
            Tell us about the car and where it lives. We&rsquo;ll confirm a
            date, a price, and a plan — and we&rsquo;ll tell you honestly if it
            doesn&rsquo;t need what you&rsquo;re asking for.
          </Reveal>
          <Reveal
            i={3}
            className="btn-row u-mt-lg"
            style={{ justifyContent: "center" }}
          >
            <Link href="/book" className="btn">
              Check availability
            </Link>
            <a href={site.phoneHref} className="btn btn--ghost">
              {site.phone}
            </a>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
