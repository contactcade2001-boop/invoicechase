"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

const SHORTCUTS: { keys: string[]; label: string }[] = [
  { keys: ["⌘", "K"], label: "Open command palette" },
  { keys: ["/"], label: "Focus global search" },
  { keys: ["?"], label: "Show this help" },
  { keys: ["G", "D"], label: "Go to Dashboard" },
  { keys: ["G", "C"], label: "Go to Customers" },
  { keys: ["G", "I"], label: "Go to Inbox" },
  { keys: ["G", "P"], label: "Go to Payments" },
  { keys: ["R"], label: "Refresh data" },
  { keys: ["ESC"], label: "Close any overlay" },
];

export function KeyboardShortcutsHelp() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (
        e.key === "?" &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement) &&
        !(e.target as HTMLElement | null)?.isContentEditable
      ) {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-white/40 px-4 backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-stone-200"
      >
        <div className="flex items-center justify-between border-b border-stone-100 px-5 py-3">
          <div>
            <p className="font-display text-sm font-semibold text-stone-900">
              Keyboard shortcuts
            </p>
            <p className="text-xs text-stone-500">Power-user moves only</p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close"
            className="rounded-md p-1.5 text-stone-600 hover:bg-orange-700 hover:text-stone-700"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
        <ul className="divide-y divide-stone-100">
          {SHORTCUTS.map((s) => (
            <li
              key={s.label}
              className="flex items-center justify-between px-5 py-3 text-sm"
            >
              <span className="text-stone-700">{s.label}</span>
              <span className="flex items-center gap-1">
                {s.keys.map((k, i) => (
                  <kbd
                    key={i}
                    className="rounded border border-stone-200 bg-white px-1.5 py-0.5 font-mono text-[10px] font-semibold text-stone-700"
                  >
                    {k}
                  </kbd>
                ))}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
