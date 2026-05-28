import { redirect } from "next/navigation";
import { Trophy } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { getCurrentUser } from "@/lib/server/auth/session";
import { getLeaderboard } from "@/lib/server/insights/leaderboard";

export const dynamic = "force-dynamic";

function fmt(cents: number) {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export default async function LeaderboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "owner" && user.role !== "manager") redirect("/dashboard");
  const board = getLeaderboard(user.organizationId!);
  const top = board[0];

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader user={user} current="team" />
      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-10 lg:px-6">
        <header className="mb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-orange-700">
            This month
          </p>
          <h1 className="font-display mt-2 text-3xl font-bold text-stone-900">
            Team leaderboard.
          </h1>
          <p className="mt-3 text-sm leading-6 text-stone-600">
            Ranked by dollars actually collected. SMS sends and fast-pays
            shown for context.
          </p>
        </header>

        {top ? (
          <section className="mb-6 rounded-2xl bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 p-6 ring-1 ring-amber-200">
            <div className="flex items-center gap-4">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm">
                <Trophy className="h-6 w-6" aria-hidden />
              </span>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700">
                  Leader
                </p>
                <p className="font-display text-xl font-bold text-stone-900">
                  {top.email}
                </p>
                <p className="text-sm text-stone-700">
                  {fmt(top.paymentsCollectedCents)} collected · {top.sends}{" "}
                  sends · {top.fastPays} fast-pays
                </p>
              </div>
            </div>
          </section>
        ) : null}

        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-stone-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50 text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                <th className="px-5 py-3 text-left">#</th>
                <th className="px-5 py-3 text-left">Member</th>
                <th className="px-5 py-3 text-right">Sends</th>
                <th className="px-5 py-3 text-right">Fast-pays</th>
                <th className="px-5 py-3 text-right">Collected</th>
              </tr>
            </thead>
            <tbody>
              {board.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-sm text-stone-500">
                    No activity this month yet. Send a few reminders and check
                    back.
                  </td>
                </tr>
              ) : null}
              {board.map((r, i) => (
                <tr key={r.userId} className="border-b border-stone-100 last:border-b-0">
                  <td className="px-5 py-3 font-mono text-xs text-stone-500">
                    {i + 1}
                  </td>
                  <td className="px-5 py-3">
                    <p className="font-medium text-stone-900">{r.email}</p>
                    <p className="text-[11px] uppercase tracking-wider text-stone-500">
                      {r.role}
                    </p>
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums text-stone-700">
                    {r.sends}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums text-stone-700">
                    {r.fastPays}
                  </td>
                  <td className="px-5 py-3 text-right font-semibold tabular-nums text-emerald-700">
                    {fmt(r.paymentsCollectedCents)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
