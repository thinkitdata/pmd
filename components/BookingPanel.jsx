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
              {service
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
                What we&rsquo;ll need from you
              </h2>
              <ul className="service__list" style={{ marginTop: 0 }}>
                <li>Year, make and model</li>
                <li>Where the vehicle will be — driveway, garage, office</li>
                <li>Access to water and power, if you have it</li>
                <li>Anything specific that&rsquo;s bothering you about it</li>
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
            <BookingEmbed event={event} />
          </div>
        </div>
      </div>
    </section>
  );
}
