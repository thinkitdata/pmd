"use client";

import { useCallback, useEffect, useState } from "react";
import { site } from "@/site.config";

function PlayGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

/**
 * A film tile plus its lightbox.
 *
 * The Cloudflare Stream iframe is only mounted once the visitor actually opens
 * a film — six embedded players on a page would each pull their own script and
 * make the page crawl. The poster image is all that loads up front.
 */
export function FilmTile({ item, i = 0, onOpen }) {
  return (
    <button
      className="tile reveal is-in"
      style={{ "--i": i }}
      onClick={() => onOpen(item)}
      aria-label={`Play film: ${item.title}`}
    >
      <span className="tile__media">
        {item.poster ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.poster} alt="" loading="lazy" />
        ) : (
          <span className="placeholder">{item.title}</span>
        )}
      </span>
      <span className="tile__scrim" />
      <span className="tile__body">
        <span>
          <span className="tile__label">{item.label}</span>
          <span className="tile__title">{item.title}</span>
        </span>
        {(item.clip || item.streamId) && (
          <span className="tile__play">
            <PlayGlyph />
          </span>
        )}
      </span>
    </button>
  );
}

export function FilmLightbox({ item, onClose }) {
  const open = Boolean(item);

  const handleKey = useCallback(
    (e) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (!open) return;
    window.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [open, handleKey]);

  // Three ways a film can play, in order of preference:
  //  1. a self-hosted clip in /public/video — the default, no third party
  //  2. a Cloudflare Stream ID, if this one film is long enough to warrant it
  //  3. nothing, in which case we say so to *us*, never to a visitor
  const streamSrc =
    item?.streamId && site.video.cloudflareCustomerCode
      ? `https://customer-${site.video.cloudflareCustomerCode}.cloudflarestream.com/${item.streamId}/iframe?autoplay=true&muted=false`
      : null;
  const clipSrc = item?.clip || null;

  return (
    <div
      className={`lightbox${open ? " is-open" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label={item ? item.title : "Film"}
      onClick={onClose}
    >
      {open && (
        <>
          <button className="lightbox__close" onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth="1.4"
              />
            </svg>
          </button>
          <div
            className={`lightbox__frame${
              item.portrait ? " lightbox__frame--portrait" : ""
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {clipSrc ? (
              <video
                key={clipSrc}
                src={clipSrc}
                poster={item.poster}
                autoPlay
                loop
                muted
                playsInline
                controls
                controlsList="nodownload"
                aria-label={item.title}
              />
            ) : streamSrc ? (
              <iframe
                src={streamSrc}
                allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                allowFullScreen
                title={item.title}
              />
            ) : (
              // No film for this entry. Show the still rather than a build
              // error — a visitor should never be told to edit site.config.js.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.poster} alt={item.title} />
            )}
          </div>
        </>
      )}
    </div>
  );
}

/** Convenience wrapper: a grid of tiles that share one lightbox. */
export default function FilmGrid({ items }) {
  const [active, setActive] = useState(null);
  return (
    <>
      <div className="work-grid">
        {items.map((item, i) => (
          <FilmTile key={item.id} item={item} i={i % 2} onOpen={setActive} />
        ))}
      </div>
      <FilmLightbox item={active} onClose={() => setActive(null)} />
    </>
  );
}
