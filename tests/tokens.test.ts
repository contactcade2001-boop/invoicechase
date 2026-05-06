import { describe, expect, it } from "vitest";
import {
  generateToken,
  hashToken,
  safeEqual,
} from "@/lib/server/auth/tokens";

describe("auth tokens", () => {
  it("generates 64-char hex tokens by default (32 bytes)", () => {
    const t = generateToken();
    expect(t).toMatch(/^[0-9a-f]{64}$/);
  });

  it("generates unique tokens across calls", () => {
    const a = generateToken();
    const b = generateToken();
    expect(a).not.toBe(b);
  });

  it("hashToken is deterministic", () => {
    expect(hashToken("hello")).toBe(hashToken("hello"));
    expect(hashToken("hello")).not.toBe(hashToken("world"));
  });

  it("safeEqual is true only for matching strings of equal length", () => {
    expect(safeEqual("abc", "abc")).toBe(true);
    expect(safeEqual("abc", "abd")).toBe(false);
    expect(safeEqual("abc", "abcd")).toBe(false);
  });
});
