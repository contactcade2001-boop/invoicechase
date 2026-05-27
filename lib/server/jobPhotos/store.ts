import "server-only";
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { randomBytes } from "crypto";
import { and, eq } from "drizzle-orm";
import { getDb } from "../db/client";
import { jobPhotos } from "../db/schema";

const UPLOAD_ROOT =
  process.env.JOB_PHOTOS_DIR ?? "/data/uploads/job-photos";
const MAX_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
]);

export type JobPhoto = {
  id: number;
  organizationId: number;
  customerId: string;
  invoiceId: string | null;
  filePath: string;
  mimeType: string;
  sizeBytes: number;
  caption: string | null;
  uploadedByUserId: number | null;
  createdAt: number;
};

export async function saveJobPhoto(input: {
  organizationId: number;
  customerId: string;
  invoiceId?: string | null;
  caption?: string | null;
  uploadedByUserId: number;
  data: Buffer;
  mimeType: string;
}): Promise<{ ok: true; id: number } | { ok: false; error: string }> {
  if (!ALLOWED_MIME.has(input.mimeType)) {
    return { ok: false, error: "unsupported_mime" };
  }
  if (input.data.byteLength > MAX_SIZE_BYTES) {
    return { ok: false, error: "too_large" };
  }
  const dir = join(UPLOAD_ROOT, String(input.organizationId), input.customerId);
  await mkdir(dir, { recursive: true });
  const ext = input.mimeType.split("/")[1] === "jpeg" ? "jpg" : input.mimeType.split("/")[1];
  const filename = `${randomBytes(8).toString("hex")}.${ext}`;
  const filePath = join(dir, filename);
  await writeFile(filePath, input.data);
  const db = getDb();
  const row = db
    .insert(jobPhotos)
    .values({
      organizationId: input.organizationId,
      customerId: input.customerId,
      invoiceId: input.invoiceId ?? null,
      filePath,
      mimeType: input.mimeType,
      sizeBytes: input.data.byteLength,
      caption: input.caption ?? null,
      uploadedByUserId: input.uploadedByUserId,
      createdAt: Date.now(),
    })
    .returning({ id: jobPhotos.id })
    .get();
  return { ok: true, id: row.id };
}

export function listJobPhotos(
  orgId: number,
  customerId: string,
): JobPhoto[] {
  const db = getDb();
  return db
    .select()
    .from(jobPhotos)
    .where(
      and(
        eq(jobPhotos.organizationId, orgId),
        eq(jobPhotos.customerId, customerId),
      ),
    )
    .all() as unknown as JobPhoto[];
}

export function getJobPhoto(
  orgId: number,
  id: number,
): JobPhoto | null {
  const db = getDb();
  return (
    (db
      .select()
      .from(jobPhotos)
      .where(
        and(eq(jobPhotos.organizationId, orgId), eq(jobPhotos.id, id)),
      )
      .get() ?? null) as JobPhoto | null
  );
}
