import { notFound, redirect } from "next/navigation";
import { findOrgByPortalSlug } from "@/lib/server/db/organizations";
import {
  createPortalSession,
  verifyPortalMagicLink,
} from "@/lib/server/portal/auth";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;
type SearchParams = Promise<{ token?: string }>;

export default async function BrandedPortalVerifyPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  if (!findOrgByPortalSlug(slug)) notFound();
  const result = verifyPortalMagicLink(sp.token ?? "");
  if (!result.ok) {
    const code =
      result.error === "expired"
        ? "expired_link"
        : result.error === "invalid_or_used"
          ? "invalid_or_used"
          : "missing_email";
    redirect(`/p/${slug}?error=${code}`);
  }
  await createPortalSession(result.email);
  redirect(`/p/${slug}/account`);
}
