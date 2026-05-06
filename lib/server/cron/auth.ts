import "server-only";
import type { NextRequest } from "next/server";
import { getCronSecret } from "../env";

export function isAuthorizedCron(req: NextRequest): boolean {
  const secret = getCronSecret();
  if (!secret) return false;
  const header = req.headers.get("authorization") ?? "";
  // Vercel Cron sends `Authorization: Bearer ${CRON_SECRET}`.
  return header === `Bearer ${secret}`;
}
