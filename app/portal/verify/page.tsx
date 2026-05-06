import { redirect } from "next/navigation";
import {
  createPortalSession,
  verifyPortalMagicLink,
} from "@/lib/server/portal/auth";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ token?: string }>;

export default async function PortalVerifyPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const result = verifyPortalMagicLink(sp.token ?? "");
  if (!result.ok) {
    const code =
      result.error === "expired"
        ? "expired_link"
        : result.error === "invalid_or_used"
          ? "invalid_or_used"
          : "missing_email";
    redirect(`/portal?error=${code}`);
  }
  await createPortalSession(result.email);
  redirect("/portal/account");
}
