import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const TITLE = "Invoice Chase — AI-powered AR collections for QuickBooks SMBs";
const DESCRIPTION =
  "Stop chasing invoices. Connect QuickBooks (or Xero or Jobber), and let Claude AI handle customer replies in your voice. Get paid 15–30 days faster.";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.APP_BASE_URL ?? "https://invoicechase.com",
  ),
  title: {
    default: TITLE,
    template: "%s · Invoice Chase",
  },
  description: DESCRIPTION,
  applicationName: "Invoice Chase",
  authors: [{ name: "Invoice Chase" }],
  keywords: [
    "QuickBooks AR",
    "invoice collections",
    "accounts receivable automation",
    "SMS payment reminders",
    "AI collections",
    "Xero collections",
    "Jobber payments",
  ],
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/",
    siteName: "Invoice Chase",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-slate-50 font-sans text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
