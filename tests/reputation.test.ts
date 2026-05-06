import { describe, expect, it } from "vitest";
import {
  reputationFor,
  scoreFromHistory,
  scoreFromOpenOnly,
} from "@/lib/server/qbo/reputation";

describe("reputation", () => {
  it("scoreFromOpenOnly returns coarse tier bands", () => {
    expect(scoreFromOpenOnly(-5)).toBe(770);
    expect(scoreFromOpenOnly(0)).toBe(770);
    expect(scoreFromOpenOnly(5)).toBe(715);
    expect(scoreFromOpenOnly(20)).toBe(645);
    expect(scoreFromOpenOnly(45)).toBe(555);
    expect(scoreFromOpenOnly(90)).toBe(420);
  });

  it("scoreFromHistory rewards on-time + tenure, punishes late + low rate", () => {
    const allOnTime5 = scoreFromHistory(
      Array.from({ length: 5 }, (_, i) => ({
        customerId: "c",
        daysLate: 0,
      })),
    );
    expect(allOnTime5).toBeGreaterThan(750);

    const allOnTime20 = scoreFromHistory(
      Array.from({ length: 20 }, () => ({
        customerId: "c",
        daysLate: 0,
      })),
    );
    expect(allOnTime20).toBeGreaterThan(allOnTime5);

    const avgFiveDaysLate = scoreFromHistory([
      { customerId: "c", daysLate: 5 },
      { customerId: "c", daysLate: 5 },
      { customerId: "c", daysLate: 5 },
      { customerId: "c", daysLate: 5 },
      { customerId: "c", daysLate: 5 },
    ]);
    expect(avgFiveDaysLate).toBeLessThan(allOnTime5);

    const veryLate = scoreFromHistory([
      { customerId: "c", daysLate: 60 },
      { customerId: "c", daysLate: 60 },
      { customerId: "c", daysLate: 60 },
    ]);
    expect(veryLate).toBeLessThan(550);
  });

  it("clamps scores into the 300-850 range", () => {
    const ridiculous = scoreFromHistory(
      Array.from({ length: 3 }, () => ({
        customerId: "c",
        daysLate: 365,
      })),
    );
    expect(ridiculous).toBeGreaterThanOrEqual(300);
    expect(ridiculous).toBeLessThanOrEqual(850);
  });

  it("reputationFor falls back when fewer than 2 signals", () => {
    expect(reputationFor(undefined, 0)).toBe(770);
    expect(reputationFor([], 45)).toBe(555);
    expect(
      reputationFor([{ customerId: "c", daysLate: 0 }], 0),
    ).toBe(770);
  });

  it("reputationFor uses signals once there are at least 2", () => {
    const signals = [
      { customerId: "c", daysLate: 0 },
      { customerId: "c", daysLate: 0 },
    ];
    const fromSignals = reputationFor(signals, 5);
    const fromOpen = scoreFromOpenOnly(5);
    expect(fromSignals).not.toBe(fromOpen);
  });
});
