"use client";

import { useState, useTransition } from "react";
import { Trash2, UserPlus } from "lucide-react";
import {
  changeMemberRole,
  inviteMember,
  removeMember,
  revokeInvite,
} from "@/app/actions/team";
import type {
  OrganizationInviteRow,
  UserRole,
  UserRow,
} from "@/lib/server/db/schema";

const ROLES: UserRole[] = ["owner", "manager", "technician"];

const roleDescription: Record<UserRole, string> = {
  owner: "Full access — billing, settings, team",
  manager: "Send texts, view payments. No billing or team management.",
  technician: "Mobile fast-pay only. No payments or settings access.",
};

export function TeamManagement({
  currentUserId,
  members,
  invites,
}: {
  currentUserId: number;
  members: UserRow[];
  invites: OrganizationInviteRow[];
}) {
  const [pending, start] = useTransition();
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<UserRole>("technician");
  const [error, setError] = useState<string | null>(null);
  const [okMessage, setOkMessage] = useState<string | null>(null);

  function handleInvite() {
    setError(null);
    setOkMessage(null);
    start(async () => {
      const r = await inviteMember({ email: inviteEmail, role: inviteRole });
      if (r.ok) {
        setInviteEmail("");
        setOkMessage(`Invite sent to ${inviteEmail}.`);
        // Auto-clear the success banner after 5s so the form feels alive.
        setTimeout(() => setOkMessage(null), 5000);
      } else {
        setError(r.error);
      }
    });
  }

  function handleRoleChange(userId: number, role: string) {
    setError(null);
    start(async () => {
      const r = await changeMemberRole({ userId, role });
      if (!r.ok) setError(r.error);
    });
  }

  function handleRemove(userId: number, email: string) {
    if (
      !window.confirm(
        `Remove ${email} from this team? They'll keep their account but lose access.`,
      )
    ) {
      return;
    }
    setError(null);
    start(async () => {
      const r = await removeMember(userId);
      if (!r.ok) setError(r.error);
    });
  }

  function handleRevoke(inviteId: number, email: string) {
    if (!window.confirm(`Revoke the pending invite to ${email}?`)) return;
    setError(null);
    start(async () => {
      const r = await revokeInvite(inviteId);
      if (!r.ok) setError(r.error);
    });
  }

  return (
    <div className="space-y-8">
      {/* Invite */}
      <section className="rounded-2xl bg-stone-900/70 p-6 shadow-sm ring-1 ring-stone-800">
        <h2 className="text-lg font-semibold">Invite teammate</h2>
        <p className="mt-1 text-sm text-stone-400">
          They&apos;ll get an email with a sign-in link. The role determines
          what they can see and do.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="teammate@business.com"
            className="flex-1 rounded-md border-0 px-3 py-2 text-sm shadow-sm ring-1 ring-inset ring-stone-700 focus:ring-2 focus:ring-inset focus:ring-slate-900"
          />
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as UserRole)}
            className="rounded-md border-0 px-3 py-2 text-sm shadow-sm ring-1 ring-inset ring-stone-700 focus:ring-2 focus:ring-inset focus:ring-slate-900"
          >
            <option value="technician">Technician</option>
            <option value="manager">Manager</option>
            <option value="owner">Owner</option>
          </select>
          <button
            type="button"
            onClick={handleInvite}
            disabled={pending || !inviteEmail.includes("@")}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            <UserPlus className="h-4 w-4" aria-hidden />
            {pending ? "Sending…" : "Send invite"}
          </button>
        </div>
        <p className="mt-2 text-xs text-stone-500">
          {roleDescription[inviteRole]}
        </p>
        {error ? (
          <div className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-inset ring-red-200">
            {error}
          </div>
        ) : null}
        {okMessage ? (
          <div className="mt-3 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700 ring-1 ring-inset ring-emerald-200">
            {okMessage}
          </div>
        ) : null}
      </section>

      {/* Members */}
      <section className="rounded-2xl bg-stone-900/70 shadow-sm ring-1 ring-stone-800">
        <div className="border-b border-stone-800 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-stone-500">
          Members
        </div>
        <div className="divide-y divide-stone-800">
          {members.map((m) => {
            const isSelf = m.id === currentUserId;
            return (
              <div
                key={m.id}
                className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="text-sm font-medium text-stone-100">
                    {m.email}
                    {isSelf ? (
                      <span className="ml-2 text-xs font-normal text-stone-500">
                        (you)
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={m.role}
                    onChange={(e) => handleRoleChange(m.id, e.target.value)}
                    disabled={pending || isSelf}
                    className="rounded-md border-0 px-3 py-1.5 text-sm shadow-sm ring-1 ring-inset ring-stone-700 focus:ring-2 focus:ring-inset focus:ring-slate-900 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-stone-500"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                  {!isSelf ? (
                    <button
                      type="button"
                      onClick={() => handleRemove(m.id, m.email)}
                      disabled={pending}
                      className="rounded-md p-1.5 text-stone-500 transition hover:bg-red-50 hover:text-red-600"
                      title="Remove from team"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Pending invites */}
      {invites.length > 0 ? (
        <section className="rounded-2xl bg-stone-900/70 shadow-sm ring-1 ring-stone-800">
          <div className="border-b border-stone-800 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-stone-500">
            Pending invites
          </div>
          <div className="divide-y divide-stone-800">
            {invites.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between px-6 py-3"
              >
                <div className="text-sm text-stone-300">
                  {inv.email}{" "}
                  <span className="text-stone-500">— {inv.role}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRevoke(inv.id, inv.email)}
                  disabled={pending}
                  className="text-xs text-stone-500 underline-offset-2 hover:text-stone-100 hover:underline"
                >
                  Revoke
                </button>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
