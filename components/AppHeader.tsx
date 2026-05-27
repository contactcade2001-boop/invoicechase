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
    key: "customers",
    href: "/customers",
    label: "Customers",
    visibleTo: ["owner", "manager"],
  },
  {
    key: "inbox",
    href: "/inbox",
    label: "Inbox",
    visibleTo: ["owner", "manager"],
  },
  {
    key: "communications",
    href: "/communications",
    label: "Communications",
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
    key: "forecast",
    href: "/forecast",
    label: "Forecast",
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
  | "customers"
  | "inbox"
  | "communications"
  | "payments"
  | "reports"
  | "forecast"
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
    <header className="sticky top-0 z-20 border-b border-stone-200/80 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-6 px-5 lg:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-orange-700 shadow-sm ring-1 ring-orange-900/20">
            <span className="text-xs font-black text-white">ic</span>
          </span>
          <span className="font-display text-[15px] font-bold tracking-tight text-stone-900">
            Invoice Chase
          </span>
        </Link>
        <nav className="flex flex-1 items-center gap-1 overflow-x-auto text-sm">
          {visibleTabs.map((t) => {
            const active = current === t.key;
            return (
              <Link
                key={t.key}
                href={t.href}
                className={`relative inline-flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition ${
                  active
                    ? "text-stone-900"
                    : "text-stone-500 hover:bg-stone-100/70 hover:text-stone-900"
                }`}
              >
                {t.label}
                {t.badge ? (
                  <span className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-orange-600 px-1.5 text-[10px] font-semibold text-white">
                    {t.badge}
                  </span>
                ) : null}
                {active ? (
                  <span
                    className="absolute inset-x-2 -bottom-[5px] h-0.5 rounded-full bg-orange-600"
                    aria-hidden
                  />
                ) : null}
              </Link>
            );
          })}
        </nav>
        <div className="hidden items-center gap-3 text-xs text-stone-500 sm:flex">
          <span className="hidden lg:inline">{user.email}</span>
          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              className="rounded-md px-2.5 py-1.5 text-xs font-medium text-stone-500 transition hover:bg-stone-100 hover:text-stone-900"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
