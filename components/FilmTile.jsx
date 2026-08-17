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
        <span className="tile__play">
          <PlayGlyph />
        </span>
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

  const src =
    item?.streamId && site.video.cloudflareCustomerCode
      ? `https://customer-${site.video.cloudflareCustomerCode}.cloudflarestream.com/${item.streamId}/iframe?autoplay=true&muted=false`
      : null;

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
            className="lightbox__frame"
            onClick={(e) => e.stopPropagation()}
          >
            {src ? (
              <iframe
                src={src}
                allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                allowFullScreen
                title={item.title}
              />
            ) : (
              <div className="placeholder">
                Add this film&rsquo;s Cloudflare Stream ID in site.config.js
              </div>
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
