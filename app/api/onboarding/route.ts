import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/server/auth/session";
import { upsertOnboarding } from "@/lib/server/db/onboarding";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user?.organizationId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = (await req.json().catch(() => ({}))) as {
    businessName?: string;
    industry?: string;
    accentColor?: string;
    preferredIntegration?: string;
    completed?: boolean;
  };
  const result = upsertOnboarding({
    organizationId: user.organizationId,
    businessName: body.businessName ?? null,
    industry: body.industry ?? null,
    accentColor: body.accentColor ?? null,
    preferredIntegration: body.preferredIntegration ?? null,
    completed: body.completed === true,
  });
  return NextResponse.json({ ok: true, state: result });
}
