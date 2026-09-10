import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-hairline px-6 py-8 text-sm text-ink-muted">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <p>Breeq. Build the wall. Break the wall.</p>
        <div className="flex gap-5">
          <Link href="/whitepaper" className="hover:text-ink">
            Whitepaper
          </Link>
          <Link href="/terms" className="hover:text-ink">
            Terms
          </Link>
          <Link href="/contact" className="hover:text-ink">
            Contact
          </Link>
        </div>
      </div>
    </footer>
  );
}
