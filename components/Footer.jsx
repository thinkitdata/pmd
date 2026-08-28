import Link from "next/link";
import { site, services } from "@/site.config";

const GLYPHS = {
  instagram:
    "M12 2.16c3.2 0 3.58.01 4.85.07 3.25.15 4.77 1.69 4.92 4.92.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.15 3.23-1.66 4.77-4.92 4.92-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-3.26-.15-4.77-1.7-4.92-4.92-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85C2.38 3.92 3.89 2.38 7.15 2.23 8.42 2.17 8.8 2.16 12 2.16zm0 5.68a4.16 4.16 0 100 8.32 4.16 4.16 0 000-8.32zm0 6.86a2.7 2.7 0 110-5.4 2.7 2.7 0 010 5.4zm5.29-7.03a.97.97 0 11-1.94 0 .97.97 0 011.94 0z",
  youtube:
    "M23 12s0-3.4-.43-5.03a2.6 2.6 0 00-1.83-1.84C19.11 4.7 12 4.7 12 4.7s-7.11 0-8.74.43a2.6 2.6 0 00-1.83 1.84C1 8.6 1 12 1 12s0 3.4.43 5.03c.24.9.94 1.6 1.83 1.84 1.63.43 8.74.43 8.74.43s7.11 0 8.74-.43a2.6 2.6 0 001.83-1.84C23 15.4 23 12 23 12zM9.75 15.02V8.98L15.5 12l-5.75 3.02z",
  facebook:
    "M22 12a10 10 0 10-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.77-3.89 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.45 2.89h-2.33v6.99A10 10 0 0022 12z",
  tiktok:
    "M16.6 5.82A4.28 4.28 0 0115.54 3h-3.09v12.4a2.59 2.59 0 01-2.59 2.5 2.59 2.59 0 110-5.18c.27 0 .53.04.78.12v-3.2a5.9 5.9 0 00-.78-.05 5.79 5.79 0 105.79 5.79V9.01a7.35 7.35 0 004.28 1.37V7.3a4.28 4.28 0 01-3.33-1.48z",
};

function Social({ href, label, glyph }) {
  if (!href) return null;
  return (
    <a href={href} aria-label={label} target="_blank" rel="noopener noreferrer">
      <svg viewBox="0 0 24 24">
        <path d={GLYPHS[glyph]} />
      </svg>
    </a>
  );
}

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="shell shell--wide">
        <div className="footer__grid">
          <div>
            {/* The logo gets room to breathe here in a way it can't in the
                nav. Falls back to the typographic wordmark if none is set,
                so the footer is never broken while you're sourcing artwork. */}
            <Link href="/" className="wordmark" aria-label={site.name}>
              {site.logo?.src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={site.logo.src}
                  alt={site.logo.alt || site.name}
                  style={{ maxWidth: site.logo.maxWidth || 260, width: "100%" }}
                />
              ) : (
                <>
                  <span className="wordmark__name">{site.wordmark.name}</span>
                  <span className="wordmark__sub">{site.wordmark.sub}</span>
                </>
              )}
            </Link>
            <p
              style={{
                color: "var(--fg-muted)",
                fontSize: "var(--step--1)",
                marginTop: "1.5rem",
                maxWidth: "32ch",
              }}
            >
              Mobile detailing for vehicles that deserve the extra mile. We come
              to you.
            </p>
            {/* Rendered only once at least one account exists — an empty row
                of icons leaves a hole in the layout. */}
            <div
              className="socials"
              style={
                Object.values(site.social).some(Boolean) ? undefined : { display: "none" }
              }
            >
              <Social
                href={site.social.instagram}
                label="Instagram"
                glyph="instagram"
              />
              <Social
                href={site.social.youtube}
                label="YouTube"
                glyph="youtube"
              />
              <Social
                href={site.social.facebook}
                label="Facebook"
                glyph="facebook"
              />
              <Social href={site.social.tiktok} label="TikTok" glyph="tiktok" />
            </div>
          </div>

          <div>
            <h4>Services</h4>
            <ul>
              {services.map((s) => (
                <li key={s.slug}>
                  <Link href={`/services#${s.slug}`}>{s.name}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4>Hours</h4>
            <ul>
              {site.hours.map((h) => (
                <li key={h.days}>
                  <span
                    style={{
                      color: "var(--fg-muted)",
                      fontSize: "var(--step--1)",
                    }}
                  >
                    {h.days} · {h.time}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4>We come to you</h4>
            <ul>
              <li>
                <a href={site.phoneHref}>{site.phone}</a>
              </li>
              <li>
                <a href={`mailto:${site.email}`}>{site.email}</a>
              </li>
              <li>
                <span
                  style={{
                    color: "var(--fg-muted)",
                    fontSize: "var(--step--1)",
                  }}
                >
                  {site.serviceArea.label} · {site.serviceArea.radiusMiles}-mile
                  radius
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="colophon">
          <span>
            {/* The copyright notice names the RIGHTS HOLDER, which is the
                legal entity — "Prime Mobile Auto Detailing LLC" — not the
                trading name. Everywhere else on the site (titles, copy,
                Google Business Profile, directories) uses site.name
                WITHOUT the LLC suffix, because Google's guidance is to
                list the real-world name and an "LLC" in a Business
                Profile name is a common cause of a forced name edit.
                This one line is the exception, and it's deliberate. */}
            © {year} {site.legalName || site.name}
            {site.builtBy?.name && site.builtBy?.url && (
              <>
                {" · "}
                {/* rel="noopener" but deliberately NOT "noreferrer": we want
                    the referrer header to survive, so the agency's analytics
                    can attribute traffic arriving from client sites. Adding
                    noreferrer here would strip exactly the data that makes
                    this link worth having. */}
                <a
                  className="colophon__credit"
                  href={site.builtBy.url}
                  target="_blank"
                  rel="noopener"
                >
                  Site created by {site.builtBy.name}
                </a>
              </>
            )}
          </span>
          {/* These town names are a real local-SEO signal for a mobile
              business — they are the phrases people actually search. */}
          <span>{site.serviceArea.towns.join(" · ")}</span>
        </div>
      </div>
    </footer>
  );
}
