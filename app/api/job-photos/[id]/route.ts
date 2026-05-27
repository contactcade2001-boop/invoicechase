import { readFile } from "fs/promises";
import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/server/auth/session";
import { getJobPhoto } from "@/lib/server/jobPhotos/store";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export async function GET(req: NextRequest, { params }: { params: Params }) {
  const user = await getCurrentUser();
  if (!user?.organizationId) {
    return new NextResponse("unauthorized", { status: 401 });
  }
  const { id: idRaw } = await params;
  const id = Number(idRaw);
  if (!Number.isFinite(id)) {
    return new NextResponse("bad_id", { status: 400 });
  }
  const photo = getJobPhoto(user.organizationId, id);
  if (!photo) return new NextResponse("not_found", { status: 404 });
  try {
    const data = await readFile(photo.filePath);
    return new NextResponse(data, {
      status: 200,
      headers: {
        "Content-Type": photo.mimeType,
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch {
    return new NextResponse("missing_file", { status: 404 });
  }
}
