import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/server/auth/session";
import {
  approveFirstWinBatch,
  buildFirstWinPreview,
} from "@/lib/server/onboarding/firstWinBatch";

export const dynamic = "force-dynamic";

/** Owner triggers the preview. Returns the dry-run list + counts. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user?.organizationId || user.role !== "owner") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const preview = await buildFirstWinPreview(user.organizationId);
  return NextResponse.json({ ok: true, ...preview });
}

/** Owner clicks "Start collecting" — this is the explicit approval step.
 *  Optional `exclude: string[]` lets the owner uncheck specific
 *  customers before approving. */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user?.organizationId || user.role !== "owner") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = (await req.json().catch(() => ({}))) as {
    exclude?: string[];
  };
  const result = approveFirstWinBatch(
    user.organizationId,
    user.id,
    Array.isArray(body.exclude) ? body.exclude : [],
  );
  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: 400 });
  }
  return NextResponse.json({
    ok: true,
    batchId: result.batchId,
    queuedCount: result.queuedCount,
  });
}
