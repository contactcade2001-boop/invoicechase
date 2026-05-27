import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/server/auth/session";
import { saveJobPhoto } from "@/lib/server/jobPhotos/store";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user?.organizationId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const formData = await req.formData();
  const file = formData.get("file");
  const customerId = formData.get("customerId");
  const caption = formData.get("caption");
  const invoiceId = formData.get("invoiceId");

  if (!(file instanceof File) || typeof customerId !== "string") {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }
  const buf = Buffer.from(await file.arrayBuffer());
  const result = await saveJobPhoto({
    organizationId: user.organizationId,
    customerId,
    invoiceId: typeof invoiceId === "string" ? invoiceId : null,
    caption: typeof caption === "string" ? caption : null,
    uploadedByUserId: user.id,
    data: buf,
    mimeType: file.type,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true, id: result.id });
}
