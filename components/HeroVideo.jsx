"use client";

import { useEffect, useRef, useState } from "react";
import { site } from "@/site.config";

/**
 * The hero loop.
 *
 * Rules this follows, all of which matter more than they look:
 *  - The poster image paints first. The video fades in only once it can
 *    actually play, so a visitor never sees a black rectangle.
 *  - Muted + playsInline, or iOS refuses to autoplay at all.
 *  - We skip the video entirely on a metered connection, when the visitor has
 *    asked for reduced data, or when they prefer reduced motion. A 3 MB
 *    autoplay loop on someone's cellular plan is not "premium".
 *  - preload="none" until we've decided — the poster is enough to hold the
 *    layout, and this keeps the largest-contentful-paint honest.
 */
export default function HeroVideo() {
  const videoRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)"
    )?.matches;

    const conn =
      navigator.connection ||
      navigator.mozConnection ||
      navigator.webkitConnection;
    const stingy =
      conn?.saveData === true ||
      ["slow-2g", "2g", "3g"].includes(conn?.effectiveType);

    if (reduced || stingy) return;
    setAllowed(true);
  }, []);

  useEffect(() => {
    if (!allowed) return;
    const el = videoRef.current;
    if (!el) return;
    el.load();
    // Autoplay can still be refused (low power mode, for example).
    // If it is, we simply keep the poster. Nothing breaks.
    el.play().catch(() => {});
  }, [allowed]);

  return (
    <div className="hero__media">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={site.video.hero.poster}
        alt=""
        aria-hidden="true"
        fetchPriority="high"
      />
      {allowed && (
        <video
          ref={videoRef}
          className={ready ? "is-ready" : ""}
          poster={site.video.hero.poster}
          muted
          loop
          playsInline
          preload="none"
          aria-hidden="true"
          tabIndex={-1}
          onCanPlay={() => setReady(true)}
          style={{ position: "absolute", inset: 0 }}
        >
          <source src={site.video.hero.webm} type="video/webm" />
          <source src={site.video.hero.mp4} type="video/mp4" />
        </video>
      )}
    </div>
  );
}
