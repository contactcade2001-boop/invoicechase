import Link from "next/link";
import type { UserRow } from "@/lib/server/db/schema";

export function AppHeader({
  user,
  current,
}: {
  user: UserRow;
  current: "dashboard" | "billing";
}) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-bold tracking-tight">
          Invoice Chase
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <Link
            href="/dashboard"
            className={
              current === "dashboard"
                ? "font-semibold text-slate-900"
                : "text-slate-600 hover:text-slate-900"
            }
          >
            Dashboard
          </Link>
          <Link
            href="/billing"
            className={
              current === "billing"
                ? "font-semibold text-slate-900"
                : "text-slate-600 hover:text-slate-900"
            }
          >
            Billing
          </Link>
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
