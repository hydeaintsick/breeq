"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";

const links = [
  { href: "/whitepaper", label: "Whitepaper" },
  { href: "/terms", label: "Terms" },
  { href: "/contact", label: "Contact" },
] as const;

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuId = useId();
  const close = () => setOpen(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 12);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header
      className="site-header pointer-events-none fixed inset-x-0 top-0 z-50"
      data-scrolled={scrolled}
    >
      <nav
        className="site-nav pointer-events-auto relative mx-auto flex h-14 max-w-6xl items-center justify-between rounded-full px-4 backdrop-blur-[28px] backdrop-saturate-150 sm:px-5"
        aria-label="Primary"
      >
        <Link
          href="/"
          aria-label="King of Thieves"
          className="relative z-10 flex items-center gap-2.5 text-sm font-semibold tracking-tight text-ink"
          onClick={close}
        >
          <LogoMark />
          <span className="hidden sm:inline" aria-hidden="true">
            King of Thieves
          </span>
          <span className="sm:hidden" aria-hidden="true">
            KOT
          </span>
        </Link>

        <div className="relative z-10 hidden items-center gap-7 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="nav-link"
              data-active={pathname === link.href}
            >
              {link.label}
            </Link>
          ))}
          <Link href="/play" className="btn-play play-shimmer">
            Play
          </Link>
        </div>

        <button
          type="button"
          className="relative z-10 inline-flex h-11 w-11 items-center justify-center rounded-full border border-hairline bg-white/70 text-ink md:hidden"
          aria-expanded={open}
          aria-controls={menuId}
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((current) => !current)}
        >
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          <MenuIcon open={open} />
        </button>
      </nav>

      {open ? (
        <div
          id={menuId}
          className="glass-sheet pointer-events-auto mx-auto mt-2 flex max-w-6xl flex-col gap-1 p-3 md:hidden"
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="nav-link rounded-xl px-3 py-2.5"
              data-active={pathname === link.href}
              onClick={close}
            >
              {link.label}
            </Link>
          ))}
          <Link href="/play" className="btn-play play-shimmer mt-1 w-full" onClick={close}>
            Play
          </Link>
        </div>
      ) : null}
    </header>
  );
}

/** Three neon bricks and a ball — the game in 22px. */
function LogoMark() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
      <rect x="2" y="3" width="5.4" height="3.2" rx="1" fill="var(--neon-pink)" />
      <rect x="8.3" y="3" width="5.4" height="3.2" rx="1" fill="var(--neon-violet)" />
      <rect x="14.6" y="3" width="5.4" height="3.2" rx="1" fill="var(--neon-blue)" />
      <rect x="5.15" y="7.4" width="5.4" height="3.2" rx="1" fill="var(--neon-cyan)" />
      <rect x="11.45" y="7.4" width="5.4" height="3.2" rx="1" fill="var(--neon-lime)" />
      <circle cx="11" cy="14.6" r="1.7" fill="var(--ink)" />
      <rect x="7" y="18" width="8" height="2" rx="1" fill="var(--ink)" />
    </svg>
  );
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      {open ? (
        <path
          d="M3.5 3.5l9 9M12.5 3.5l-9 9"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      ) : (
        <path
          d="M3 5h10M3 8h10M3 11h10"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}
