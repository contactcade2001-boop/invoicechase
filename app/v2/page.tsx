import { Footer } from "@/components/marketing/Footer";
import { Nav } from "@/components/marketing/Nav";

export const metadata = {
  title: "Invoice Chase — Get overdue invoices paid faster",
  description:
    "Cashflow tool for service-based SMBs. Watch days-to-payment drop.",
};

/**
 * Marketing landing shell. Sections will be filled in in subsequent
 * tasks — intentionally blank here so we can verify the system in
 * isolation (Nav + empty <main> + Footer).
 */
export default function MarketingShell() {
  return (
    <div className="min-h-screen bg-mk-ink-50 text-mk-ink-700 antialiased">
      <a href="#main" className="mk-skip-link">
        Skip to content
      </a>
      <Nav />
      <main id="main" tabIndex={-1} className="min-h-[60vh]">
        {/* Section content lands here in the next task. */}
      </main>
      <Footer />
    </div>
  );
}
