"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/server/auth/session";
import {
  deleteInvite,
  removeUserFromOrg,
  requestOrgInvite,
  setUserRole,
} from "@/lib/server/auth/invites";
import {
  getOrgForUser,
  listOrgMembers,
} from "@/lib/server/db/organizations";
import type { UserRole } from "@/lib/server/db/schema";

export type TeamActionResult =
  | { ok: true }
  | { ok: false; error: string };

const ALLOWED_ROLES: UserRole[] = ["owner", "manager", "technician"];

export async function inviteMember(input: {
  email: string;
  role: string;
}): Promise<TeamActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "not_signed_in" };
  if (user.role !== "owner") return { ok: false, error: "forbidden" };
  const role = (
    ALLOWED_ROLES.includes(input.role as UserRole)
      ? input.role
      : "technician"
  ) as UserRole;
  const org = getOrgForUser(user);
  if (!org) return { ok: false, error: "no_organization" };
  const result = await requestOrgInvite({
    organizationId: org.id,
    organizationName: org.name,
    inviterEmail: user.email,
    email: input.email,
    role,
  });
  if (!result.ok) return result;
  revalidatePath("/team");
  return { ok: true };
}

export async function changeMemberRole(input: {
  userId: number;
  role: string;
}): Promise<TeamActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "not_signed_in" };
  if (user.role !== "owner") return { ok: false, error: "forbidden" };
  if (input.userId === user.id) {
    return { ok: false, error: "cant_demote_self" };
  }
  const role = (
    ALLOWED_ROLES.includes(input.role as UserRole)
      ? input.role
      : "technician"
  ) as UserRole;
  const members = listOrgMembers(user.organizationId!);
  const target = members.find((m) => m.id === input.userId);
  if (!target) return { ok: false, error: "not_in_org" };
  setUserRole(input.userId, role);
  revalidatePath("/team");
  return { ok: true };
}

export async function removeMember(
  userId: number,
): Promise<TeamActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "not_signed_in" };
  if (user.role !== "owner") return { ok: false, error: "forbidden" };
  if (userId === user.id) {
    return { ok: false, error: "cant_remove_self" };
  }
  const members = listOrgMembers(user.organizationId!);
  if (!members.some((m) => m.id === userId)) {
    return { ok: false, error: "not_in_org" };
  }
  removeUserFromOrg(userId);
  revalidatePath("/team");
  return { ok: true };
}

export async function revokeInvite(
  inviteId: number,
): Promise<TeamActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "not_signed_in" };
  if (user.role !== "owner") return { ok: false, error: "forbidden" };
  deleteInvite(inviteId, user.organizationId!);
  revalidatePath("/team");
  return { ok: true };
}
