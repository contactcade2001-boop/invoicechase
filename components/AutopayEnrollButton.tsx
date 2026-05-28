"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  CreditCard,
  Loader2,
  Pause,
  Play,
  Trash2,
} from "lucide-react";

declare global {
  interface Window {
    Stripe?: (
      key: string,
      opts?: { stripeAccount?: string },
    ) => StripeJs;
  }
}

type StripeJs = {
  elements: (opts: { clientSecret: string }) => StripeElements;
  confirmSetup: (opts: {
    elements: StripeElements;
    confirmParams: { return_url: string };
    redirect?: "if_required";
  }) => Promise<{
    setupIntent?: { id: string; status: string };
    error?: { message?: string };
  }>;
};

type StripeElements = {
  create: (type: string) => { mount: (selector: string) => void };
  submit: () => Promise<{ error?: { message?: string } }>;
};

const STRIPE_SCRIPT = "https://js.stripe.com/v3/";

function loadStripeScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Stripe) return resolve();
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${STRIPE_SCRIPT}"]`,
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error("stripe_script_failed")),
      );
      return;
    }
    const s = document.createElement("script");
    s.src = STRIPE_SCRIPT;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("stripe_script_failed"));
    document.head.appendChild(s);
  });
}

type Props = {
  customerId: string;
  customerEmail: string;
  customerName?: string;
  enrolled: boolean;
  paused?: boolean;
  brand?: string | null;
  last4?: string | null;
};

export function AutopayEnrollButton({
  customerId,
  customerEmail,
  customerName,
  enrolled,
  paused,
  brand,
  last4,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const elementsRef = useRef<StripeElements | null>(null);
  const stripeRef = useRef<StripeJs | null>(null);

  useEffect(() => {
    if (!open || elementsRef.current) return;
    let cancelled = false;
    (async () => {
      try {
        setErr(null);
        await loadStripeScript();
        const tokenRes = await fetch("/api/autopay/setup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ customerId, customerEmail, customerName }),
        });
        if (!tokenRes.ok) throw new Error("setup_failed");
        const { clientSecret, stripeAccountId, publishableKey } =
          (await tokenRes.json()) as {
            clientSecret: string;
            stripeAccountId: string;
            publishableKey: string;
          };
        if (cancelled) return;
        const stripe = window.Stripe!(publishableKey, {
          stripeAccount: stripeAccountId,
        });
        stripeRef.current = stripe;
        const elements = stripe.elements({ clientSecret });
        elementsRef.current = elements;
        const paymentEl = elements.create("payment");
        paymentEl.mount("#autopay-payment-element");
      } catch (e) {
        console.error(e);
        setErr("Could not load Stripe. Try again.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, customerId, customerEmail, customerName]);

  async function submit() {
    setErr(null);
    if (!stripeRef.current || !elementsRef.current) return;
    setBusy(true);
    const result = await stripeRef.current.confirmSetup({
      elements: elementsRef.current,
      confirmParams: { return_url: window.location.href },
      redirect: "if_required",
    });
    if (result.error) {
      setErr(result.error.message ?? "Setup failed.");
      setBusy(false);
      return;
    }
    if (result.setupIntent && result.setupIntent.status === "succeeded") {
      const confirm = await fetch("/api/autopay/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          customerEmail,
          setupIntentId: result.setupIntent.id,
        }),
      });
      if (confirm.ok) {
        setSuccess(true);
        setOpen(false);
        elementsRef.current = null;
        router.refresh();
      } else {
        setErr("Could not save the saved card. Try again.");
      }
    } else {
      setErr("Unexpected state — try again.");
    }
    setBusy(false);
  }

  async function update(action: "pause" | "resume" | "remove") {
    if (action === "remove" && !confirm("Remove the saved payment method?"))
      return;
    setBusy(true);
    await fetch("/api/autopay/pause", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerId, action }),
    });
    router.refresh();
    setBusy(false);
  }

  if (enrolled) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-1.5 text-sm font-semibold text-emerald-900">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Autopay enrolled
              {paused ? (
                <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800 ring-1 ring-inset ring-amber-300">
                  Paused
                </span>
              ) : null}
            </p>
            <p className="mt-1 text-xs text-emerald-800/70">
              {brand} •••• {last4 ?? "????"}
            </p>
          </div>
          <div className="flex gap-1.5">
            {paused ? (
              <button
                type="button"
                onClick={() => update("resume")}
                disabled={busy}
                className="inline-flex items-center gap-1 rounded-md bg-white px-2.5 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-300 transition hover:bg-emerald-50 disabled:opacity-50"
              >
                <Play className="h-3 w-3" /> Resume
              </button>
            ) : (
              <button
                type="button"
                onClick={() => update("pause")}
                disabled={busy}
                className="inline-flex items-center gap-1 rounded-md bg-white px-2.5 py-1 text-[11px] font-semibold text-stone-700 ring-1 ring-stone-300 transition hover:bg-white disabled:opacity-50"
              >
                <Pause className="h-3 w-3" /> Pause
              </button>
            )}
            <button
              type="button"
              onClick={() => update("remove")}
              disabled={busy}
              className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-50"
            >
              <Trash2 className="h-3 w-3" /> Remove
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-900">
        <CheckCircle2 className="mr-1.5 inline-block h-4 w-4 align-middle" />
        Autopay enrolled. Refreshing…
      </div>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group inline-flex items-center gap-2 rounded-md bg-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700"
      >
        <CreditCard className="h-3.5 w-3.5 transition group-hover:scale-110" />
        Enroll in autopay
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4">
      <p className="font-display text-sm font-semibold text-stone-900">
        Save a payment method
      </p>
      <p className="mt-1 text-xs text-stone-600">
        The customer&apos;s card or bank will be charged automatically when an
        invoice is issued. You can pause anytime.
      </p>
      <div
        id="autopay-payment-element"
        ref={containerRef}
        className="mt-4 min-h-[120px]"
      />
      {err ? <p className="mt-2 text-xs text-red-700">{err}</p> : null}
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={submit}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-md bg-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700 disabled:opacity-50"
        >
          {busy ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <CreditCard className="h-3.5 w-3.5" />
          )}
          {busy ? "Saving…" : "Save & enroll"}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            elementsRef.current = null;
            stripeRef.current = null;
          }}
          className="rounded-md px-3 py-2 text-xs font-medium text-stone-500 transition hover:bg-orange-700 hover:text-stone-900"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
