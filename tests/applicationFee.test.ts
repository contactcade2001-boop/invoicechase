import { describe, expect, it } from "vitest";
import {
  APPLICATION_FEE_BPS,
  applicationFeeCents,
} from "@/lib/server/stripe/connect";

describe("applicationFeeCents", () => {
  it("uses 1.9% (190 bps)", () => {
    expect(APPLICATION_FEE_BPS).toBe(190);
  });

  it("computes the fee with floor rounding", () => {
    // 420000 * 0.019 = 7980 exactly
    expect(applicationFeeCents(420000)).toBe(7980);
    // 99 * 0.019 = 1.881 → floor = 1
    expect(applicationFeeCents(99)).toBe(1);
    // 100 * 0.019 = 1.9 → floor = 1
    expect(applicationFeeCents(100)).toBe(1);
    // 1000 * 0.019 = 19
    expect(applicationFeeCents(1000)).toBe(19);
  });

  it("returns 0 for zero amounts", () => {
    expect(applicationFeeCents(0)).toBe(0);
  });
});
