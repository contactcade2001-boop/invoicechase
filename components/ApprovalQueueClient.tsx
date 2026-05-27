"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Mail, MessageSquare, X } from "lucide-react";

type Item = {
  id: number;
  customerName: string | null;
  channel: string;
  draftBody: string;
  reason: string | null;
  createdAt: number;
};

export function ApprovalQueueClient({ items }: { items: Item[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [list, setList] = useState(items);

  function act(id: number, action: "approve" | "decline") {
    start(async () => {
      const res = await fetch("/api/approvals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      if (res.ok) {
        setList(list.filter((i) => i.id !== id));
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-3">
      {list.map((i) => {
        const Icon = i.channel === "email" ? Mail : MessageSquare;
        return (
          <article
            key={i.id}
            className="rounded-2xl bg-stone-900/70 p-5 shadow-sm ring-1 ring-stone-800"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ring-1 ring-inset ${
                    i.channel === "email"
                      ? "bg-sky-50 text-sky-700 ring-sky-200"
                      : "bg-emerald-50 text-emerald-700 ring-emerald-200"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="font-semibold text-stone-100">
                    {i.customerName ?? "Customer"}
                  </p>
                  <p className="text-[11px] uppercase tracking-wider text-stone-500">
                    {i.channel.toUpperCase()} · {new Date(i.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => act(i.id, "approve")}
                  disabled={pending}
                  className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
                >
                  <Check className="h-3 w-3" />
                  Approve & send
                </button>
                <button
                  type="button"
                  onClick={() => act(i.id, "decline")}
                  disabled={pending}
                  className="inline-flex items-center gap-1.5 rounded-md bg-stone-900/70 px-3 py-1.5 text-xs font-medium text-stone-300 shadow-sm ring-1 ring-stone-700 transition hover:bg-stone-950 hover:ring-stone-600 disabled:opacity-50"
                >
                  <X className="h-3 w-3" />
                  Decline
                </button>
              </div>
            </div>
            <pre className="mt-4 whitespace-pre-wrap rounded-md bg-stone-950 px-4 py-3 font-sans text-sm leading-6 text-stone-300 ring-1 ring-inset ring-stone-800">
              {i.draftBody}
            </pre>
            {i.reason ? (
              <p className="mt-2 text-[11px] text-stone-500">
                Reason: {i.reason}
              </p>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
