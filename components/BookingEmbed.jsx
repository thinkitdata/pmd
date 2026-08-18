"use client";

import { useEffect, useRef, useState } from "react";
import { site } from "@/site.config";

/**
 * Cal.com inline booking widget.
 *
 * Why Cal.com rather than a custom form + database: you need real availability,
 * timezone handling, buffers between jobs, reminder emails, calendar sync and
 * reschedule links. That is a genuinely hard problem and not one worth
 * rebuilding for a detailing business. Cal handles it, and the free tier covers
 * a single-operator calendar.
 *
 * The embed is themed to match the site rather than left on Cal's defaults —
 * a booking widget that looks bolted on undoes the rest of the page.
 *
 * @param {string} event Cal event-type slug, e.g. "restoration"
 */
export default function BookingEmbed({ event }) {
  const mounted = useRef(false);
  // "loading" → "ready" once Cal injects its iframe, or "failed" on timeout.
  const [state, setState] = useState("loading");
  const slug = event || site.booking.defaultEvent;
  const calLink = `${site.booking.calUsername}/${slug}`;

  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;

    // Official Cal.com loader snippet, transcribed so we don't depend on an
    // npm package that would pull React peer-dep constraints with it.
    (function (C, A, L) {
      let p = function (a, ar) {
        a.q.push(ar);
      };
      let d = C.document;
      C.Cal =
        C.Cal ||
        function () {
          let cal = C.Cal;
          let ar = arguments;
          if (!cal.loaded) {
            cal.ns = {};
            cal.q = cal.q || [];
            d.head.appendChild(d.createElement("script")).src = A;
            cal.loaded = true;
          }
          if (ar[0] === L) {
            const api = function () {
              p(api, arguments);
            };
            const namespace = ar[1];
            api.q = api.q || [];
            if (typeof namespace === "string") {
              cal.ns[namespace] = cal.ns[namespace] || api;
              p(cal.ns[namespace], ar);
              p(cal, ["initNamespace", namespace]);
            } else p(cal, ar);
            return;
          }
          p(cal, ar);
        };
    })(window, "https://app.cal.com/embed/embed.js", "init");

    window.Cal("init", slug, { origin: "https://cal.com" });

    window.Cal.ns[slug]("inline", {
      elementOrSelector: "#cal-inline",
      calLink,
      layout: "month_view",
      config: { theme: "light" },
    });

    window.Cal.ns[slug]("ui", {
      theme: "light",
      cssVarsPerTheme: {
        light: { "cal-brand": site.booking.brandColor },
        dark: { "cal-brand": site.booking.darkBrandColor },
      },
      hideEventTypeDetails: false,
      layout: "month_view",
    });
    // Watch for Cal actually injecting its iframe. If nothing appears within
    // the timeout the widget has failed — wrong slug, blocked script, Cal
    // outage — and we show a way to reach a human instead of a blank box.
    const target = document.getElementById("cal-inline");
    if (!target) return;

    const observer = new MutationObserver(() => {
      if (target.querySelector("iframe")) {
        setState("ready");
        observer.disconnect();
      }
    });
    observer.observe(target, { childList: true, subtree: true });

    const timer = setTimeout(() => {
      if (!target.querySelector("iframe")) setState("failed");
    }, 8000);

    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, [slug, calLink]);

  return (
    <div className="cal-wrap">
      <div
        id="cal-inline"
        className="cal-embed"
        style={{ overflow: "scroll" }}
        aria-label="Booking calendar"
      />

      {state !== "ready" && (
        <div className="cal-status" role="status">
          {state === "loading" ? (
            <p className="cal-status__text">Loading the calendar…</p>
          ) : (
            <div className="cal-status__fail">
              <p className="soon-panel__mark">Calendar unavailable</p>
              <p style={{ color: "var(--fg-muted)", marginBottom: "1.75rem" }}>
                The booking calendar isn&rsquo;t loading right now. Don&rsquo;t
                let that stop you — call or email and we&rsquo;ll get you on the
                schedule the same day.
              </p>
              <div className="btn-row">
                <a href={site.phoneHref} className="btn">
                  {site.phone}
                </a>
                <a href={`mailto:${site.email}`} className="btn btn--ghost">
                  Email us
                </a>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
