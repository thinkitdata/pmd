"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { site, nav } from "@/site.config";

export default function Nav() {
  const [stuck, setStuck] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close on Escape — a drawer you can't dismiss with the keyboard is a trap.
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Don't let the page scroll behind an open drawer.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={`nav${stuck ? " is-stuck" : ""}${open ? " is-open" : ""}`}
      id="nav"
    >
      <div className="shell shell--wide nav__inner">
        <Link href="/" className="wordmark" aria-label={`${site.name} — home`}>
          <span className="wordmark__name">{site.wordmark.name}</span>
          <span className="wordmark__sub">{site.wordmark.sub}</span>
        </Link>

        <nav aria-label="Primary">
          <ul className="nav__links">
            {nav.map((item) => (
              <li key={item.href}>
                <Link
                  className="nav__link"
                  href={item.href}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <Link href="/book" className="btn btn--ghost btn--sm nav__cta">
          Reserve
        </Link>

        <button
          className="nav__toggle"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>
    </header>
  );
}
