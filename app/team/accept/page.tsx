import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { acceptOrgInvite } from "@/lib/server/auth/invites";
import { getCurrentUser, createSession } from "@/lib/server/auth/session";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ token?: string }>;

export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const token = sp.token ?? "";
  const result = acceptOrgInvite(token);

  if (!result.ok) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4 py-12">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-stone-200">
          <h1 className="text-2xl font-bold">Invite invalid</h1>
          <p className="mt-2 text-sm text-stone-600">
            {result.error === "expired"
              ? "This invite has expired. Ask the owner to send a new one."
              : "This invite is invalid or has already been used."}
          </p>
          <Link
            href="/login"
            className="mt-6 inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            Go to sign-in
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    );
  }

  // Sign the invitee in (they already proved control of the email by clicking
  // a link sent to it). New session cookie + redirect to dashboard.
  const existing = await getCurrentUser();
  if (!existing || existing.id !== result.userId) {
    await createSession(result.userId);
  }
  redirect("/dashboard");
}
