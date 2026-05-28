import Link from "next/link";
import { Container } from "./Container";
import { Wordmark } from "./Wordmark";

type Group = { title: string; links: { href: string; label: string }[] };

const GROUPS: Group[] = [
  {
    title: "Product",
    links: [
      { href: "#product", label: "Product" },
      { href: "#pricing", label: "Pricing" },
      { href: "/demo", label: "Live demo" },
      { href: "/changelog", label: "Changelog" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/help", label: "Help" },
      { href: "/partners", label: "Partners" },
      { href: "/status", label: "Status" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-mk-ink-300/60 bg-mk-ink-50">
      <Container>
        <div className="grid grid-cols-2 gap-10 py-14 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <Wordmark />
            <p className="mt-4 max-w-[18ch] text-sm leading-6 text-mk-ink-500">
              Get overdue invoices paid faster — without lifting a phone.
            </p>
          </div>
          {GROUPS.map((g) => (
            <div key={g.title}>
              <p className="mk-display text-[11px] font-semibold uppercase tracking-[0.16em] text-mk-ink-500">
                {g.title}
              </p>
              <ul className="mt-4 space-y-2.5 text-sm">
                {g.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="rounded-mk-sm text-mk-ink-700 transition-colors hover:text-mk-ink-950 focus-visible:shadow-mk-focus focus-visible:outline-none"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-mk-ink-300/60 py-6 text-xs text-mk-ink-500">
          <span>&copy; {new Date().getFullYear()} Invoice Chase, Inc.</span>
          <span>$49/month + 1.9% per collected payment</span>
        </div>
      </Container>
    </footer>
  );
}
