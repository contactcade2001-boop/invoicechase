"use client";

import { useState, useTransition } from "react";
import { saveWorkizConnection } from "@/app/actions/org";

const messages: Record<string, string> = {
  not_signed_in: "Please sign in again.",
  forbidden: "Only the owner can connect FSM accounts.",
  invalid_api_token: "API token looks too short.",
};

export function WorkizConnectForm({
  initialAccountName,
}: {
  initialAccountName: string | null;
}) {
  const [accountName, setAccountName] = useState(initialAccountName ?? "");
  const [apiToken, setApiToken] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const r = await saveWorkizConnection({ apiToken, apiSecret, accountName });
      if (r.ok) {
        setSavedAt(Date.now());
        setApiToken("");
        setApiSecret("");
      } else {
        setError(messages[r.error] ?? "Couldn't save. Try again.");
      }
    });
  }

  const showSaved = savedAt && Date.now() - savedAt < 4000;

  return (
    <form onSubmit={onSubmit} className="mt-3 space-y-2">
      <input
        type="text"
        value={accountName}
        onChange={(e) => setAccountName(e.target.value)}
        placeholder="Account name"
        maxLength={120}
        className="block w-full rounded-md border-0 px-2.5 py-1.5 text-xs shadow-sm ring-1 ring-inset ring-stone-700 focus:ring-2 focus:ring-inset focus:ring-slate-900"
      />
      <input
        type="password"
        value={apiToken}
        onChange={(e) => setApiToken(e.target.value)}
        placeholder="API token"
        autoComplete="off"
        className="block w-full rounded-md border-0 px-2.5 py-1.5 font-mono text-xs shadow-sm ring-1 ring-inset ring-stone-700 focus:ring-2 focus:ring-inset focus:ring-slate-900"
      />
      <input
        type="password"
        value={apiSecret}
        onChange={(e) => setApiSecret(e.target.value)}
        placeholder="API secret (optional)"
        autoComplete="off"
        className="block w-full rounded-md border-0 px-2.5 py-1.5 font-mono text-xs shadow-sm ring-1 ring-inset ring-stone-700 focus:ring-2 focus:ring-inset focus:ring-slate-900"
      />
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={pending || apiToken.length < 8}
          className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {pending ? "Saving…" : "Connect Workiz"}
        </button>
        {showSaved ? (
          <span className="text-xs text-emerald-700">Saved</span>
        ) : null}
      </div>
      {error ? <p className="text-xs text-red-700">{error}</p> : null}
    </form>
  );
}
