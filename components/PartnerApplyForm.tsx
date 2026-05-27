"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { applyAsPartner } from "@/app/actions/partner";

const messages: Record<string, string> = {
  not_signed_in: "Please sign in again.",
  rate_limited: "Slow down — try again in a minute.",
  missing_name: "Please enter your name.",
  invalid_payout_email: "That payout email doesn't look right.",
};

export function PartnerApplyForm({ defaultEmail }: { defaultEmail: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [payout, setPayout] = useState(defaultEmail);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const r = await applyAsPartner({
        displayName: name,
        companyName: company,
        payoutEmail: payout,
      });
      if (!r.ok) {
        setError(messages[r.error] ?? "Couldn't apply. Please try again.");
        return;
      }
      router.push("/partner");
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <label className="block">
        <span className="text-sm font-medium text-stone-300">Your name</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={120}
          autoComplete="name"
          className="mt-1 block w-full rounded-md border-0 px-3 py-2 text-stone-100 shadow-sm ring-1 ring-inset ring-stone-700 focus:ring-2 focus:ring-inset focus:ring-slate-900 sm:text-sm"
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium text-stone-300">
          Firm or company (optional)
        </span>
        <input
          type="text"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          maxLength={160}
          autoComplete="organization"
          className="mt-1 block w-full rounded-md border-0 px-3 py-2 text-stone-100 shadow-sm ring-1 ring-inset ring-stone-700 focus:ring-2 focus:ring-inset focus:ring-slate-900 sm:text-sm"
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium text-stone-300">
          Payout email
        </span>
        <input
          type="email"
          value={payout}
          onChange={(e) => setPayout(e.target.value)}
          required
          maxLength={200}
          autoComplete="email"
          className="mt-1 block w-full rounded-md border-0 px-3 py-2 text-stone-100 shadow-sm ring-1 ring-inset ring-stone-700 focus:ring-2 focus:ring-inset focus:ring-slate-900 sm:text-sm"
        />
        <span className="mt-1 block text-xs text-stone-500">
          We send monthly commission statements here.
        </span>
      </label>
      {error ? (
        <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-inset ring-red-200">
          {error}
        </div>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {pending ? "Setting up…" : "Create my partner account"}
      </button>
      <p className="text-xs text-stone-500">
        You stay signed in to your Invoice Chase account; the partner account
        is separate from any QuickBooks customer org you might already have.
      </p>
    </form>
  );
}
