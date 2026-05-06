import { describe, expect, it } from "vitest";
import { csvCell, csvLine } from "@/lib/server/reports/csv";

describe("csv.csvCell", () => {
  it("returns plain text untouched when there are no special chars", () => {
    expect(csvCell("hello")).toBe("hello");
    expect(csvCell(42)).toBe("42");
  });

  it("returns empty string for null/undefined", () => {
    expect(csvCell(null)).toBe("");
    expect(csvCell(undefined)).toBe("");
  });

  it("quotes and escapes when the value has commas, quotes, or newlines", () => {
    expect(csvCell('a,b')).toBe('"a,b"');
    expect(csvCell('he said "hi"')).toBe('"he said ""hi"""');
    expect(csvCell("line1\nline2")).toBe('"line1\nline2"');
  });
});

describe("csv.csvLine", () => {
  it("joins cells with commas, quoting per-cell as needed", () => {
    expect(csvLine(["a", "b,c", null, 7])).toBe('a,"b,c",,7');
  });
});
