import { describe, expect, it } from "vitest";
import { bucketize } from "@/lib/server/reports/aging";

describe("agingBucket.bucketize", () => {
  it("treats not-yet-due and exactly-due as current", () => {
    expect(bucketize(-30)).toBe("current");
    expect(bucketize(0)).toBe("current");
  });

  it("matches inclusive upper bounds for each named bucket", () => {
    expect(bucketize(1)).toBe("1-30");
    expect(bucketize(30)).toBe("1-30");
    expect(bucketize(31)).toBe("31-60");
    expect(bucketize(60)).toBe("31-60");
    expect(bucketize(61)).toBe("61-90");
    expect(bucketize(90)).toBe("61-90");
  });

  it("falls into 90+ once strictly past 90 days", () => {
    expect(bucketize(91)).toBe("90+");
    expect(bucketize(365)).toBe("90+");
  });
});
