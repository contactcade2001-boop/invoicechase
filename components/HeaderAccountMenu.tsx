"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, LogOut, Menu } from "lucide-react";

type Section = "Work" | "Insights" | "Recovery" | "Account";

type Tab = {
  key: string;
  href: string;
  label: string;
  section: Section;
};

const SECTION_ORDER: Section[] = ["Work", "Insights", "Recovery", "Account"];

export function HeaderAccountMenu({
  email,
  current,
  secondary,
}: {
  email: string;
  current: string;
  secondary: Tab[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const initials =
    email
      ?.split("@")[0]
      ?.split(/[._-]/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "?";

  const grouped: Record<Section, Tab[]> = {
    Work: [],
    Insights: [],
    Recovery: [],
    Account: [],
  };
  for (const t of secondary) grouped[t.section].push(t);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-stone-300 transition hover:bg-orange-700 dark:text-stone-200 dark:hover:bg-orange-700"
        aria-label="More menu"
      >
        <Menu className="h-3.5 w-3.5 text-stone-500" aria-hidden />
        <span className="hidden text-xs font-medium text-stone-400 sm:inline">
          More
        </span>
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-600 text-[10px] font-bold text-white dark:bg-stone-700">
          {initials}
        </span>
        <ChevronDown
          className={`h-3 w-3 text-stone-400 transition ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      {open ? (
        <div className="absolute right-0 top-full z-30 mt-2 w-64 overflow-hidden rounded-xl bg-stone-900/70 shadow-2xl ring-1 ring-stone-800 dark:bg-orange-600 dark:ring-stone-800">
          <div className="border-b border-stone-800/60 px-4 py-3 dark:border-stone-800">
            <p className="truncate text-xs font-semibold text-stone-100 dark:text-stone-100">
              {email}
            </p>
            <p className="text-[10px] uppercase tracking-wider text-stone-400">
              Signed in
            </p>
          </div>
          <div className="max-h-[60vh] overflow-y-auto py-1.5">
            {SECTION_ORDER.map((section) => {
              const items = grouped[section];
              if (items.length === 0) return null;
              return (
                <div key={section} className="mb-1">
                  <p className="px-4 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-400">
                    {section}
                  </p>
                  {items.map((t) => {
                    const active = current === t.key;
                    return (
                      <Link
                        key={t.key}
                        href={t.href}
                        onClick={() => setOpen(false)}
                        className={`flex items-center justify-between px-4 py-1.5 text-sm transition ${
                          active
                            ? "bg-orange-50 font-semibold text-orange-700 dark:bg-orange-950/20"
                            : "text-stone-300 hover:bg-stone-950 dark:text-stone-300 dark:hover:bg-orange-700"
                        }`}
                      >
                        {t.label}
                      </Link>
                    );
                  })}
                </div>
              );
            })}
          </div>
          <div className="border-t border-stone-800/60 dark:border-stone-800">
            <form action="/api/auth/logout" method="post">
              <button
                type="submit"
                className="inline-flex w-full items-center gap-2 px-4 py-2 text-sm text-stone-400 transition hover:bg-stone-950 hover:text-stone-100 dark:text-stone-400 dark:hover:bg-orange-700"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden />
                Sign out
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
