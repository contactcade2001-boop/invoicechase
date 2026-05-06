import Link from "next/link";
import type { UserRole, UserRow } from "@/lib/server/db/schema";
import { unreadInboxCountFor } from "@/lib/server/inboxBadge";

type Tab = {
  key: string;
  href: string;
  label: string;
  visibleTo: UserRole[];
  badge?: number;
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
    key: "reports",
    href: "/reports",
    label: "Reports",
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
  | "reports"
  | "team"
  | "settings"
  | "billing";

export async function AppHeader({
  user,
  current,
}: {
  user: UserRow;
  current: AppHeaderTab;
}) {
  const role = user.role as UserRole;
  const unread = unreadInboxCountFor(user);
  const visibleTabs = tabs
    .filter((t) => t.visibleTo.includes(role))
    .map((t) =>
      t.key === "inbox" && unread > 0 ? { ...t, badge: unread } : t,
    );
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
                  ? "inline-flex items-center gap-1.5 font-semibold text-slate-900"
                  : "inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-900"
              }
            >
              {t.label}
              {t.badge ? (
                <span className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-emerald-600 px-1.5 text-[10px] font-semibold text-white">
                  {t.badge}
                </span>
              ) : null}
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
