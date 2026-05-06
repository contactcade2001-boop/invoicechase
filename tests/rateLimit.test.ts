import { afterEach, describe, expect, it } from "vitest";
import {
  _resetRateLimit,
  checkRateLimit,
} from "@/lib/server/rateLimit";

afterEach(() => {
  _resetRateLimit();
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
