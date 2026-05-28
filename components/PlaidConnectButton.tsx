"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  CheckCircle2,
  Loader2,
  Plug,
  RefreshCcw,
} from "lucide-react";

declare global {
  interface Window {
    Plaid?: {
      create: (config: {
        token: string;
        onSuccess: (publicToken: string) => void;
        onExit?: (err: unknown) => void;
      }) => { open: () => void };
    };
  }
}

const PLAID_SCRIPT = "https://cdn.plaid.com/link/v2/stable/link-initialize.js";

function loadPlaidScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Plaid) return resolve();
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${PLAID_SCRIPT}"]`,
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("plaid_script_failed")));
      return;
    }
    const s = document.createElement("script");
    s.src = PLAID_SCRIPT;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("plaid_script_failed"));
    document.head.appendChild(s);
  });
}

type Props = {
  connected: boolean;
  institutionName: string | null;
  balanceCents: number | null;
  refreshedAt: number | null;
  configured: boolean;
};

export function PlaidConnectButton({
  connected,
  institutionName,
  balanceCents,
  refreshedAt,
  configured,
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function connect() {
    if (!configured) {
      setErr("Plaid isn't configured yet — see setup instructions below.");
      return;
    }
    setErr(null);
    setBusy(true);
    try {
      await loadPlaidScript();
      const tokenRes = await fetch("/api/plaid/link-token", { method: "POST" });
      if (!tokenRes.ok) throw new Error("link_token_failed");
      const { linkToken } = (await tokenRes.json()) as { linkToken: string };
      if (!window.Plaid) throw new Error("plaid_not_loaded");
      const handler = window.Plaid.create({
        token: linkToken,
        onSuccess: async (publicToken: string) => {
          const res = await fetch("/api/plaid/exchange", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ publicToken }),
          });
          if (res.ok) router.refresh();
          else setErr("Exchange failed — try again.");
          setBusy(false);
        },
        onExit: () => setBusy(false),
      });
      handler.open();
    } catch (e) {
      console.error(e);
      setErr("Couldn't open Plaid. Check the setup instructions.");
      setBusy(false);
    }
  }

  async function refresh() {
    setBusy(true);
    setErr(null);
    const res = await fetch("/api/plaid/refresh", { method: "POST" });
    if (!res.ok) setErr("Refresh failed.");
    router.refresh();
    setBusy(false);
  }

  async function disconnect() {
    if (!confirm("Disconnect bank? You can reconnect anytime.")) return;
    setBusy(true);
    await fetch("/api/plaid/disconnect", { method: "POST" });
    router.refresh();
    setBusy(false);
  }

  const fmtBalance =
    balanceCents != null
      ? (balanceCents / 100).toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
          maximumFractionDigits: 0,
        })
      : null;

  if (connected) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white ring-1 ring-emerald-200">
              <Building2 className="h-4 w-4 text-emerald-700" />
            </span>
            <div>
              <p className="flex items-center gap-1.5 text-sm font-semibold text-emerald-900">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {institutionName ?? "Bank connected"}
              </p>
              {fmtBalance ? (
                <p className="font-display mt-0.5 text-2xl font-bold tabular-nums text-stone-900">
                  {fmtBalance}
                </p>
              ) : null}
              <p className="mt-0.5 text-[11px] text-emerald-800/70">
                Refreshed{" "}
                {refreshedAt
                  ? new Date(refreshedAt).toLocaleString()
                  : "just now"}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={refresh}
              disabled={busy}
              className="group inline-flex items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 ring-1 ring-stone-300 transition hover:ring-stone-400 disabled:opacity-50"
            >
              <RefreshCcw
                className={`h-3 w-3 transition group-hover:rotate-180 ${busy ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
            <button
              type="button"
              onClick={disconnect}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-stone-500 transition hover:bg-white hover:text-stone-900 disabled:opacity-50"
            >
              Disconnect
            </button>
          </div>
        </div>
        {err ? <p className="mt-2 text-xs text-red-700">{err}</p> : null}
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={connect}
        disabled={busy}
        className="group inline-flex items-center gap-2 rounded-full bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700 hover:shadow-md disabled:opacity-50"
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Plug className="h-4 w-4 transition group-hover:scale-110" />
        )}
        {busy ? "Opening Plaid…" : "Connect bank via Plaid"}
      </button>
      {!configured ? (
        <p className="mt-2 text-[11px] text-amber-700">
          Plaid credentials not set. Add{" "}
          <code className="font-mono">PLAID_CLIENT_ID</code> and{" "}
          <code className="font-mono">PLAID_SECRET</code> to Fly secrets to
          enable.
        </p>
      ) : null}
      {err ? <p className="mt-2 text-xs text-red-700">{err}</p> : null}
    </div>
  );
}
