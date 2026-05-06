import Link from "next/link";
import type { UserRow } from "@/lib/server/db/schema";

const tabs = [
  { key: "dashboard", href: "/dashboard", label: "Dashboard" },
  { key: "payments", href: "/payments", label: "Payments" },
  { key: "billing", href: "/billing", label: "Billing" },
] as const;

export type AppHeaderTab = (typeof tabs)[number]["key"];

export function AppHeader({
  user,
  current,
}: {
  user: UserRow;
  current: AppHeaderTab;
}) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-bold tracking-tight">
          Invoice Chase
        </Link>
        <div className="flex items-center gap-4 text-sm">
          {tabs.map((t) => (
            <Link
              key={t.key}
              href={t.href}
              className={
                current === t.key
                  ? "font-semibold text-slate-900"
                  : "text-slate-600 hover:text-slate-900"
              }
            >
              {t.label}
            </Link>
          ))}
          <span className="text-slate-400">·</span>
          <span className="hidden text-slate-600 sm:inline">{user.email}</span>
          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              className="text-slate-500 underline-offset-2 hover:text-slate-900 hover:underline"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
