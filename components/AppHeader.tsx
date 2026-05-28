import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";
import { CommandPalette } from "@/components/CommandPalette";
import { GlobalHotkeys } from "@/components/GlobalHotkeys";
import { HeaderAccountMenu } from "@/components/HeaderAccountMenu";
import { KeyboardShortcutsHelp } from "@/components/KeyboardShortcutsHelp";
import { NotificationsBell } from "@/components/NotificationsBell";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { UserRole, UserRow } from "@/lib/server/db/schema";
import { unreadInboxCountFor } from "@/lib/server/inboxBadge";

type Tab = {
  key: string;
  href: string;
  label: string;
  visibleTo: UserRole[];
  badge?: number;
};

// Primary navigation — the five things owners hit every day.
const primary: Tab[] = [
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
    key: "payments",
    href: "/payments",
    label: "Payments",
    visibleTo: ["owner", "manager"],
  },
  {
    key: "forecast",
    href: "/forecast",
    label: "Forecast",
    visibleTo: ["owner", "manager"],
  },
];

// Secondary — lives in the account dropdown, grouped by section.
const secondary: (Tab & { section: "Work" | "Insights" | "Recovery" | "Account" })[] = [
  {
    key: "communications",
    href: "/communications",
    label: "Communications",
    visibleTo: ["owner", "manager"],
    section: "Work",
  },
  {
    key: "approvals",
    href: "/approvals",
    label: "AI approval queue",
    visibleTo: ["owner"],
    section: "Work",
  },
  {
    key: "reports",
    href: "/reports",
    label: "Reports",
    visibleTo: ["owner", "manager"],
    section: "Insights",
  },
  {
    key: "leaderboard",
    href: "/leaderboard",
    label: "Team leaderboard",
    visibleTo: ["owner", "manager"],
    section: "Insights",
  },
  {
    key: "recovery",
    href: "/recovery",
    label: "Recovery toolkit",
    visibleTo: ["owner"],
    section: "Recovery",
  },
  {
    key: "liens",
    href: "/liens",
    label: "Mechanics lien tracker",
    visibleTo: ["owner"],
    section: "Recovery",
  },
  {
    key: "cashflow-settings",
    href: "/settings/cashflow",
    label: "Cashflow controls",
    visibleTo: ["owner"],
    section: "Account",
  },
  {
    key: "team",
    href: "/team",
    label: "Team",
    visibleTo: ["owner"],
    section: "Account",
  },
  {
    key: "settings",
    href: "/settings",
    label: "Settings",
    visibleTo: ["owner", "manager"],
    section: "Account",
  },
  {
    key: "billing",
    href: "/billing",
    label: "Billing",
    visibleTo: ["owner"],
    section: "Account",
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
  const primaryVisible = primary
    .filter((t) => t.visibleTo.includes(role))
    .map((t) =>
      t.key === "inbox" && unread > 0 ? { ...t, badge: unread } : t,
    );
  const secondaryVisible = secondary.filter((t) => t.visibleTo.includes(role));

  return (
    <header className="sticky top-0 z-20 border-b border-stone-200/80 bg-white/85 backdrop-blur-md dark:border-stone-200 dark:bg-white/85">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-6 px-5 lg:px-6">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2"
          aria-label="Invoice Chase home"
        >
          <BrandMark size={20} />
          <span className="font-display text-[15px] font-bold tracking-tight text-stone-900 dark:text-stone-900">
            Invoice Chase<span className="text-orange-600">.</span>
          </span>
        </Link>
        <nav className="hidden flex-1 items-center justify-center gap-1 text-sm md:flex">
          {primaryVisible.map((t) => {
            const active = current === t.key;
            return (
              <Link
                key={t.key}
                href={t.href}
                className={`relative inline-flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition ${
                  active
                    ? "text-stone-900 dark:text-stone-900"
                    : "text-stone-500 hover:bg-stone-100/70 hover:text-stone-900 dark:text-stone-600 dark:hover:bg-orange-700 dark:hover:text-stone-900"
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
                    className="absolute inset-x-3 -bottom-[5px] h-0.5 rounded-full bg-orange-600"
                    aria-hidden
                  />
                ) : null}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-1">
          <NotificationsBell />
          <ThemeToggle />
          <HeaderAccountMenu
            email={user.email}
            current={current}
            secondary={secondaryVisible}
          />
        </div>
      </div>
      <CommandPalette />
      <KeyboardShortcutsHelp />
      <GlobalHotkeys />
    </header>
  );
}
