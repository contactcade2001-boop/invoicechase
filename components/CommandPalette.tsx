"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Bell,
  Building2,
  CalendarClock,
  CreditCard,
  FileText,
  Gauge,
  LineChart,
  MessageSquare,
  Plug,
  Search,
  Sparkles,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

type Command = {
  id: string;
  label: string;
  hint?: string;
  group: "Navigate" | "Actions";
  icon: LucideIcon;
  perform: () => void;
  keywords?: string;
};

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Global Cmd+K / Ctrl+K to open
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
        return;
      }
      // Press "/" anywhere except inputs to focus search
      if (
        e.key === "/" &&
        !open &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement) &&
        !(e.target as HTMLElement | null)?.isContentEditable
      ) {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Focus input on open
  useEffect(() => {
    if (open) {
      setQ("");
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  const commands: Command[] = useMemo(() => {
    const go = (href: string) => () => {
      setOpen(false);
      router.push(href);
    };
    return [
      { id: "go-dashboard", label: "Go to Dashboard", group: "Navigate", icon: Gauge, perform: go("/dashboard") },
      { id: "go-customers", label: "Go to Customers", group: "Navigate", icon: Building2, perform: go("/customers") },
      { id: "go-inbox", label: "Go to Inbox", group: "Navigate", icon: MessageSquare, perform: go("/inbox") },
      { id: "go-comms", label: "Go to Communications", group: "Navigate", icon: Sparkles, perform: go("/communications") },
      { id: "go-payments", label: "Go to Payments", group: "Navigate", icon: Wallet, perform: go("/payments") },
      { id: "go-forecast", label: "Go to Forecast", group: "Navigate", icon: LineChart, perform: go("/forecast") },
      { id: "go-reports", label: "Go to Reports", group: "Navigate", icon: FileText, perform: go("/reports") },
      { id: "go-payment-plans", label: "Payment plans", group: "Navigate", icon: CalendarClock, perform: go("/payment-plans") },
      { id: "go-team", label: "Team", group: "Navigate", icon: Users, perform: go("/team") },
      { id: "go-settings", label: "Settings", group: "Navigate", icon: Plug, perform: go("/settings") },
      { id: "go-billing", label: "Billing", group: "Navigate", icon: CreditCard, perform: go("/billing") },
      {
        id: "refresh",
        label: "Refresh dashboard data",
        hint: "Press R",
        group: "Actions",
        icon: Bell,
        perform: () => {
          setOpen(false);
          router.refresh();
        },
      },
    ];
  }, [router]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return commands;
    return commands.filter((c) =>
      `${c.label} ${c.keywords ?? ""} ${c.group}`.toLowerCase().includes(needle),
    );
  }, [q, commands]);

  // Reset selection when filter changes
  useEffect(() => {
    setActive(0);
  }, [q]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!open) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive((i) => Math.min(filtered.length - 1, i + 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive((i) => Math.max(0, i - 1));
      }
      if (e.key === "Enter") {
        e.preventDefault();
        filtered[active]?.perform();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, filtered, active]);

  if (!open) return null;

  const groups: Record<Command["group"], Command[]> = {
    Navigate: [],
    Actions: [],
  };
  for (const c of filtered) groups[c.group].push(c);

  let runningIdx = -1;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center bg-stone-950/60 px-4 pt-[12vh] backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl overflow-hidden rounded-2xl bg-stone-900/70 shadow-2xl ring-1 ring-stone-800"
      >
        <div className="flex items-center gap-3 border-b border-stone-800/60 px-4 py-3">
          <Search className="h-4 w-4 text-stone-400" aria-hidden />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search pages, customers, actions…"
            className="flex-1 bg-transparent text-sm text-stone-100 placeholder:text-stone-400 focus:outline-none"
          />
          <kbd className="rounded border border-stone-800 bg-stone-950 px-1.5 py-0.5 font-mono text-[10px] text-stone-500">
            ESC
          </kbd>
        </div>
        <div className="max-h-96 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-stone-500">
              No matches for &ldquo;{q}&rdquo;.
            </p>
          ) : (
            (["Navigate", "Actions"] as const).map((g) => {
              if (groups[g].length === 0) return null;
              return (
                <div key={g} className="mb-1">
                  <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-400">
                    {g}
                  </p>
                  {groups[g].map((c) => {
                    runningIdx += 1;
                    const isActive = runningIdx === active;
                    const idx = runningIdx;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onMouseEnter={() => setActive(idx)}
                        onClick={c.perform}
                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm ${
                          isActive
                            ? "bg-stone-800 text-stone-100"
                            : "text-stone-300"
                        }`}
                      >
                        <c.icon className="h-3.5 w-3.5 text-stone-500" aria-hidden />
                        <span className="flex-1">{c.label}</span>
                        {c.hint ? (
                          <span className="text-[10px] text-stone-400">{c.hint}</span>
                        ) : null}
                        {isActive ? (
                          <ArrowRight className="h-3 w-3 text-stone-400" aria-hidden />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>
        <div className="flex items-center justify-between border-t border-stone-800/60 px-4 py-2 text-[10px] text-stone-400">
          <span className="inline-flex items-center gap-1.5">
            <kbd className="rounded border border-stone-800 bg-stone-950 px-1 font-mono">↑↓</kbd>
            navigate
            <kbd className="rounded border border-stone-800 bg-stone-950 px-1 font-mono">↵</kbd>
            select
          </span>
          <span className="inline-flex items-center gap-1">
            <kbd className="rounded border border-stone-800 bg-stone-950 px-1 font-mono">⌘K</kbd>
            anywhere
          </span>
        </div>
      </div>
    </div>
  );
}
