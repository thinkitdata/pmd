import Link from "next/link";
import { services, process as steps } from "@/site.config";
import Reveal from "@/components/Reveal";

export const metadata = {
  title: "Services",
  description:
    "The Refresh, The Restoration, The Ceramic and The Keeper — four levels of mobile detailing, from maintenance to multi-stage paint correction and ceramic coating.",
  alternates: { canonical: "/services" },
};

export default function ServicesPage() {
  return (
    <main>
      <section
        className="section surface-ink"
        style={{ paddingTop: "clamp(9rem, 16vw, 13rem)" }}
      >
        <div className="shell shell--wide">
          <Reveal as="p" className="eyebrow">
            Services
          </Reveal>
          <Reveal as="h1" i={1} className="u-mt-md" style={{ maxWidth: "18ch" }}>
            Four ways we take care of a car.
          </Reveal>
          <Reveal as="p" i={2} className="lede u-mt-md">
            Start anywhere. We&rsquo;ll tell you honestly if a car doesn&rsquo;t
            need the tier you asked for — that conversation has cost us money
            plenty of times and we&rsquo;d still rather have it.
          </Reveal>
        </div>
      </section>

      <div className="seam seam--to-light" />

      <section className="section surface-light" style={{ paddingTop: 0 }}>
        <div className="shell shell--wide">
          {services.map((s, i) => (
            <Reveal
              as="article"
              key={s.slug}
              id={s.slug}
              i={0}
              className="split split--wide-right"
              style={{
                paddingBlock: "clamp(3rem, 6vw, 5rem)",
                borderBottom: "1px solid var(--rule)",
                alignItems: "start",
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: "0.68rem",
                    letterSpacing: "0.24em",
                    color: "var(--accent)",
                    fontWeight: 600,
                    marginBottom: "1rem",
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </p>
                <h2 style={{ fontSize: "var(--step-3)" }}>{s.name}</h2>
                <div className="service__meta" style={{ marginTop: "1rem" }}>
                  <span className="service__price">{s.price}</span>
                  <span>· {s.duration}</span>
                </div>

                {s.comingSoon && (
                  <p
                    style={{
                      marginTop: "1rem",
                      fontSize: "var(--step--1)",
                      color: "var(--accent)",
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      fontWeight: 600,
                    }}
                  >
                    Coming soon
                  </p>
                )}

                <div className="btn-row" style={{ marginTop: "2rem" }}>
                  <Link
                    href={`/book/${s.slug}`}
                    className={`btn ${s.comingSoon ? "btn--ghost" : "btn--accent"}`}
                  >
                    {s.comingSoon ? "Join the list" : `Reserve ${s.name}`}
                  </Link>
                </div>
              </div>

              <div>
                <p className="lede" style={{ marginBottom: "1.75rem" }}>
                  {s.summary}
                </p>
                <ul className="service__list" style={{ marginTop: 0 }}>
                  {s.includes.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="section surface-light section--tight" style={{ paddingTop: 0 }}>
        <div className="shell shell--wide">
          <Reveal as="p" className="eyebrow">
            The process
          </Reveal>
          <Reveal as="h2" i={1} className="u-mt-md" style={{ maxWidth: "20ch" }}>
            Five stages. None of them rushed.
          </Reveal>
          <div className="process">
            {steps.map((s, i) => (
              <Reveal as="article" key={s.title} i={i} className="step surface-light">
                <h3 className="step__title">{s.title}</h3>
                <p className="step__body">{s.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
