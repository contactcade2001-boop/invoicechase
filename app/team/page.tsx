import { redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { TeamManagement } from "@/components/TeamManagement";
import { getCurrentUser } from "@/lib/server/auth/session";
import {
  listInvitesForOrg,
  listOrgMembers,
} from "@/lib/server/db/organizations";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "owner") redirect("/dashboard");

  const orgId = user.organizationId!;
  const members = listOrgMembers(orgId);
  const invites = listInvitesForOrg(orgId);

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader user={user} current="team" />
      <main className="mx-auto w-full max-w-3xl flex-1 space-y-6 px-4 py-8 sm:py-10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team</h1>
          <p className="mt-1 text-sm text-slate-600">
            Invite owners, managers, and technicians. Roles control what each
            teammate can do.
          </p>
        </div>
        <TeamManagement
          currentUserId={user.id}
          members={members}
          invites={invites}
        />
      </main>
    </div>
  );
}
