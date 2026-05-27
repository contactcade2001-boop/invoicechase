import "server-only";
import type { NextRequest } from "next/server";

/**
 * Build a redirect URL that prefers APP_BASE_URL over Fly's internal
 * `req.url` (which appears as 0.0.0.0:3000 behind the proxy).
 *
 * Use this anywhere we previously did `new URL("/path", req.url)`.
 */
export function redirectUrl(req: NextRequest, path: string): URL {
  const base = (process.env.APP_BASE_URL ?? req.url).replace(/\/$/, "");
  return new URL(path, base);
}
