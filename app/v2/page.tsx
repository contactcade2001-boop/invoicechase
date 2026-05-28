import { Footer } from "@/components/marketing/Footer";
import { Hero } from "@/components/marketing/Hero";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { Nav } from "@/components/marketing/Nav";
import { Pricing } from "@/components/marketing/Pricing";
import { Proof } from "@/components/marketing/Proof";

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
      <main id="main" tabIndex={-1}>
        <Hero />
        <HowItWorks />
        <Proof />
        <Pricing />
      </main>
      <Footer />
    </div>
  );
}
