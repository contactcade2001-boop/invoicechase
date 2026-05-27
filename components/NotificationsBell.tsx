"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, Check, CreditCard, MessageSquare, UserPlus } from "lucide-react";

type Notif = {
  id: number;
  icon: typeof Bell;
  color: string;
  title: string;
  body: string;
  when: string;
  unread: boolean;
};

// In real life this comes from an API/SSE. For now we surface a realistic
// sample that gives the bell a heartbeat without backend work.
const SEED_NOTIFS: Notif[] = [
  {
    id: 1,
    icon: CreditCard,
    color: "text-emerald-600 bg-emerald-50 ring-emerald-200",
    title: "Payment received — $4,200",
    body: "Riverside Diner paid via SMS Pay Now link.",
    when: "2m ago",
    unread: true,
  },
  {
    id: 2,
    icon: MessageSquare,
    color: "text-orange-600 bg-orange-50 ring-orange-200",
    title: "AI replied for you",
    body: "Brown & Co Construction asked about a 4-week plan.",
    when: "18m ago",
    unread: true,
  },
  {
    id: 3,
    icon: UserPlus,
    color: "text-sky-600 bg-sky-50 ring-sky-200",
    title: "New customer synced",
    body: "Cedar Park Schools added from QuickBooks.",
    when: "1h ago",
    unread: false,
  },
];

export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notif[]>(SEED_NOTIFS);
  const ref = useRef<HTMLDivElement | null>(null);

  // Close on outside click
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const unread = notifs.filter((n) => n.unread).length;

  function markAll() {
    setNotifs((prev) => prev.map((n) => ({ ...n, unread: false })));
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label="Notifications"
        onClick={() => setOpen((v) => !v)}
        className="relative inline-flex h-8 w-8 items-center justify-center rounded-md text-stone-500 transition hover:bg-stone-100 hover:text-stone-900"
      >
        <Bell className="h-4 w-4" aria-hidden />
        {unread > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 inline-flex h-3.5 min-w-[0.875rem] items-center justify-center rounded-full bg-orange-600 px-1 text-[9px] font-bold text-white ring-2 ring-white">
            {unread}
          </span>
        ) : null}
      </button>
      {open ? (
        <div className="absolute right-0 top-full z-30 mt-2 w-80 overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-stone-200">
          <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3">
            <p className="font-display text-sm font-semibold text-stone-900">
              Activity
            </p>
            {unread > 0 ? (
              <button
                type="button"
                onClick={markAll}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-orange-700 hover:underline"
              >
                <Check className="h-3 w-3" /> Mark all read
              </button>
            ) : null}
          </div>
          <ul className="max-h-96 divide-y divide-stone-100 overflow-y-auto">
            {notifs.map((n) => (
              <li
                key={n.id}
                className={`flex items-start gap-3 px-4 py-3 transition hover:bg-stone-50 ${
                  n.unread ? "bg-orange-50/30" : ""
                }`}
              >
                <span
                  className={`mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset ${n.color}`}
                >
                  <n.icon className="h-3.5 w-3.5" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-stone-900">
                    {n.title}
                  </p>
                  <p className="mt-0.5 text-xs leading-5 text-stone-600">
                    {n.body}
                  </p>
                  <p className="mt-1 text-[10px] uppercase tracking-wider text-stone-400">
                    {n.when}
                  </p>
                </div>
                {n.unread ? (
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" />
                ) : null}
              </li>
            ))}
          </ul>
          <div className="border-t border-stone-100 bg-stone-50/60 px-4 py-2 text-center">
            <a
              href="/inbox"
              className="text-[11px] font-semibold text-stone-600 hover:text-stone-900"
            >
              Open inbox →
            </a>
          </div>
        </div>
      ) : null}
    </div>
  );
}
