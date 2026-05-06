import Link from "next/link";
import type { UserRole, UserRow } from "@/lib/server/db/schema";

type Tab = {
  key: string;
  href: string;
  label: string;
  visibleTo: UserRole[];
};

const tabs: Tab[] = [
  {
    key: "dashboard",
    href: "/dashboard",
    label: "Dashboard",
    visibleTo: ["owner", "manager", "technician"],
  },
  {
    key: "inbox",
    href: "/inbox",
    label: "Inbox",
    visibleTo: ["owner", "manager"],
  },
  {
    key: "payments",
    href: "/payments",
    label: "Payments",
    visibleTo: ["owner", "manager"],
  },
  {
    key: "team",
    href: "/team",
    label: "Team",
    visibleTo: ["owner"],
  },
  {
    key: "settings",
    href: "/settings",
    label: "Settings",
    visibleTo: ["owner", "manager"],
  },
  {
    key: "billing",
    href: "/billing",
    label: "Billing",
    visibleTo: ["owner"],
  },
];

export type AppHeaderTab =
  | "dashboard"
  | "inbox"
  | "payments"
  | "team"
  | "settings"
  | "billing";

export function AppHeader({
  user,
  current,
}: {
  user: UserRow;
  current: AppHeaderTab;
}) {
  const role = user.role as UserRole;
  const visibleTabs = tabs.filter((t) => t.visibleTo.includes(role));
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-bold tracking-tight">
          Invoice Chase
        </Link>
        <div className="flex items-center gap-4 text-sm">
          {visibleTabs.map((t) => (
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
