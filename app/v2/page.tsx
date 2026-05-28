import type { Metadata } from "next";
import { FinalCta } from "@/components/marketing/FinalCta";
import { Footer } from "@/components/marketing/Footer";
import { Hero } from "@/components/marketing/Hero";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { Nav } from "@/components/marketing/Nav";
import { Pricing } from "@/components/marketing/Pricing";
import { Proof } from "@/components/marketing/Proof";
import { Trust } from "@/components/marketing/Trust";

const TITLE = "Invoice Chase · Get overdue invoices paid faster";
const DESCRIPTION =
  "AI-powered AR collections for service-based SMBs. Connect QuickBooks, watch days-to-payment drop. $49/month + 1.9% per collected payment.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "AR collections",
    "QuickBooks collections",
    "invoice reminders",
    "field service collections",
    "contractor invoicing",
    "Stripe pay links",
  ],
  alternates: { canonical: "/v2" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    siteName: "Invoice Chase",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

/**
 * Marketing landing page. Composed entirely from primitives in
 * components/marketing/. Each section owns its own background tone so
 * the rhythm reads top-to-bottom without ad-hoc spacing tweaks.
 */
export default function MarketingPage() {
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
        <Trust />
        <Pricing />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
