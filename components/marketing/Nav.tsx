import Link from "next/link";
import { Button } from "./Button";
import { Container } from "./Container";
import { Wordmark } from "./Wordmark";

const LINKS: { href: string; label: string }[] = [
  { href: "#product", label: "Product" },
  { href: "#pricing", label: "Pricing" },
  { href: "#customers", label: "Customers" },
];

/**
 * Sticky nav. Backdrop blur kicks in over scrolled content. Logo lockup
 * + minimal links + single primary CTA. Mobile collapses to logo + CTA.
 */
export function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-mk-ink-300/60 bg-mk-ink-50/80 backdrop-blur-md">
      <Container>
        <div className="flex h-16 items-center justify-between gap-6">
          <Link
            href="/"
            className="rounded-mk-sm focus-visible:shadow-mk-focus focus-visible:outline-none"
            aria-label="Invoice Chase home"
          >
            <Wordmark />
          </Link>
          <nav
            aria-label="Primary"
            className="hidden flex-1 items-center justify-center gap-8 md:flex"
          >
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="rounded-mk-sm px-1 py-1 text-sm font-medium text-mk-ink-700 transition-colors hover:text-mk-ink-950 focus-visible:shadow-mk-focus focus-visible:outline-none"
              >
                {l.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="hidden rounded-mk-sm px-1 py-1 text-sm font-medium text-mk-ink-700 transition-colors hover:text-mk-ink-950 focus-visible:shadow-mk-focus focus-visible:outline-none sm:inline"
            >
              Sign in
            </Link>
            <Button href="/login" size="md" variant="primary">
              Start free
            </Button>
          </div>
        </div>
      </Container>
    </header>
  );
}
