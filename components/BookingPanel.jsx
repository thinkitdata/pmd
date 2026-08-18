import Link from "next/link";
import { site } from "@/site.config";
import BookingEmbed from "@/components/BookingEmbed";
import Reveal from "@/components/Reveal";

/**
 * The booking page body, shared by /book and /book/[service].
 *
 * Kept as a plain server component with no searchParams and no dynamic data,
 * so both routes prerender to static HTML. That's what lets this whole site
 * deploy as a static export — see AWS-DEPLOYMENT.md.
 *
 * @param {object|null} service a `services` entry, or null for the generic page
 */
export default function BookingPanel({ service = null }) {
  const event = service?.calEvent || site.booking.defaultEvent;
  const soon = Boolean(service?.comingSoon);

  return (
    <section
      className="section surface-ink"
      style={{ paddingTop: "clamp(9rem, 16vw, 13rem)" }}
    >
      <div className="shell shell--wide">
        <div className="book-layout">
          <div>
            <Reveal as="p" className="eyebrow">
              Reserve
            </Reveal>
            <Reveal
              as="h1"
              i={1}
              className="u-mt-md"
              style={{ fontSize: "var(--step-4)" }}
            >
              {service ? service.name : "Let's find a date."}
            </Reveal>
            <Reveal as="p" i={2} className="lede u-mt-md">
              {soon
                ? `${service.summary} We're not offering this yet — our lead detailer is in training for it now.`
                : service
                  ? service.summary
                  : "Pick a time that works. We'll confirm the details, the price, and where we're coming to — usually the same day."}
            </Reveal>

            {service && (
              <Reveal i={3} className="u-mt-md">
                <div className="service__meta">
                  <span className="service__price">{service.price}</span>
                  <span>· {service.duration}</span>
                </div>
              </Reveal>
            )}

            <Reveal i={4} className="u-mt-lg">
              <h2
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "0.7rem",
                  letterSpacing: "0.24em",
                  textTransform: "uppercase",
                  color: "var(--accent)",
                  fontWeight: 600,
                  marginBottom: "1.25rem",
                }}
              >
                {soon ? "What it will include" : "What we’ll need from you"}
              </h2>
              <ul className="service__list" style={{ marginTop: 0 }}>
                {soon ? (
                  service.includes.map((line) => <li key={line}>{line}</li>)
                ) : (
                  <>
                    <li>Year, make and model</li>
                    <li>Where the vehicle will be — driveway, garage, office</li>
                    <li>Access to water and power, if you have it</li>
                    <li>Anything specific that&rsquo;s bothering you about it</li>
                  </>
                )}
              </ul>
            </Reveal>

            <Reveal i={5} className="u-mt-lg">
              <p
                style={{
                  color: "var(--fg-muted)",
                  fontSize: "var(--step--1)",
                }}
              >
                Prefer to talk it through first?{" "}
                <a href={site.phoneHref} className="link-quiet">
                  {site.phone}
                </a>
              </p>
            </Reveal>
          </div>

          <div>
            {soon ? (
              /* No calendar for a service we can't deliver yet. Taking a
                 booking you have to cancel costs more trust than the booking
                 was ever worth. */
              <Reveal className="soon-panel">
                <p className="soon-panel__mark">In training</p>
                <h2 style={{ fontSize: "var(--step-2)", marginBottom: "1.25rem" }}>
                  We&rsquo;d rather wait until we&rsquo;re good at it.
                </h2>
                <p style={{ color: "var(--fg-muted)", marginBottom: "1.25rem" }}>
                  {service.name} takes skill we&rsquo;re still building. Our lead
                  detailer is training on it now, and we won&rsquo;t put it on the
                  calendar until the result would meet the standard we hold
                  everything else to.
                </p>
                <p style={{ color: "var(--fg-muted)", marginBottom: "2rem" }}>
                  Tell us about your car and we&rsquo;ll come to you first when
                  it opens up — no deposit, no obligation.
                </p>

                <div className="btn-row">
                  <a href={site.phoneHref} className="btn">
                    {site.phone}
                  </a>
                  <a
                    href={`mailto:${site.email}?subject=${encodeURIComponent(
                      `Interest in ${service.name}`
                    )}&body=${encodeURIComponent(
                      `Hi — I'd like to hear when ${service.name} is available.\n\nVehicle:\nWhere it lives:\nWhat's bothering me about it:\n`
                    )}`}
                    className="btn btn--ghost"
                  >
                    Email us
                  </a>
                </div>

                <p
                  style={{
                    marginTop: "2rem",
                    paddingTop: "1.5rem",
                    borderTop: "1px solid var(--rule)",
                    fontSize: "var(--step--1)",
                    color: "var(--fg-faint)",
                  }}
                >
                  Booking today?{" "}
                  <Link href="/book/refresh" className="link-quiet">
                    The Refresh
                  </Link>{" "}
                  is available now.
                </p>
              </Reveal>
            ) : (
              <BookingEmbed event={event} />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
