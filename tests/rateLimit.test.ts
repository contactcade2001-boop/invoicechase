import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

const tmpDir = mkdtempSync(join(tmpdir(), "ic-ratelimit-"));
process.env.DB_PATH = join(tmpDir, "app.db");

// Import after DB_PATH is set.
const { _resetRateLimit, checkRateLimit } = await import(
  "@/lib/server/rateLimit"
);

beforeAll(() => {
  _resetRateLimit();
});

afterEach(() => {
  _resetRateLimit();
});

afterAll(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

describe("checkRateLimit", () => {
  it("allows up to max within the window", () => {
    expect(checkRateLimit("k", 3, 1000, 0).allowed).toBe(true);
    expect(checkRateLimit("k", 3, 1000, 0).allowed).toBe(true);
    expect(checkRateLimit("k", 3, 1000, 0).allowed).toBe(true);
    expect(checkRateLimit("k", 3, 1000, 0).allowed).toBe(false);
  });

  it("recovers after the window passes", () => {
    checkRateLimit("k", 2, 1000, 0);
    checkRateLimit("k", 2, 1000, 0);
    expect(checkRateLimit("k", 2, 1000, 0).allowed).toBe(false);
    expect(checkRateLimit("k", 2, 1000, 1500).allowed).toBe(true);
  });

  it("isolates buckets by key", () => {
    checkRateLimit("a", 1, 1000, 0);
    expect(checkRateLimit("a", 1, 1000, 0).allowed).toBe(false);
    expect(checkRateLimit("b", 1, 1000, 0).allowed).toBe(true);
  });

  it("reports retryAfterMs when blocked", () => {
    checkRateLimit("k", 1, 1000, 0);
    const blocked = checkRateLimit("k", 1, 1000, 200);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterMs).toBe(800);
  });
});
