"use client";

import { useEffect, useRef } from "react";
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
  }, [slug, calLink]);

  return (
    <div
      id="cal-inline"
      className="cal-embed"
      style={{ overflow: "scroll" }}
      aria-label="Booking calendar"
    />
  );
}
