"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Settles its children into place as they scroll into view.
 *
 * Deliberately built on IntersectionObserver rather than a scroll listener or
 * an animation library: it costs nothing per frame, it doesn't ship 30 kB of
 * JavaScript, and it degrades to "everything is simply visible" if the API is
 * missing or the visitor prefers reduced motion.
 *
 * @param {number}  i      stagger index — each step adds 110ms
 * @param {string}  as     element to render (default "div")
 * @param {boolean} wipe   use the ink-spread wipe instead of the rise
 */
export default function Reveal({
  children,
  i = 0,
  as: Tag = "div",
  wipe = false,
  className = "",
  style,
  ...rest
}) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduced = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)"
    )?.matches;
    if (reduced || !("IntersectionObserver" in window)) {
      setShown(true);
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.unobserve(el);
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.12 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const base = wipe ? "reveal-wipe" : "reveal";

  return (
    <Tag
      ref={ref}
      {...rest}
      style={{ "--i": i, ...(style || {}) }}
      className={`${base}${shown ? " is-in" : ""} ${className}`.trim()}
    >
      {children}
    </Tag>
  );
}
