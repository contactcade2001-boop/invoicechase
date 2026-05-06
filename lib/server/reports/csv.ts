import "server-only";

// CSV escaper matching the RFC 4180 spec well enough for Excel + Google Sheets.
export function csvCell(value: string | number | null | undefined): string {
  if (value == null) return "";
  const s = String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replaceAll('"', '""')}"`;
  }
  return s;
}

export function csvLine(cells: Array<string | number | null | undefined>): string {
  return cells.map(csvCell).join(",");
}

export function csvDocument(rows: string[][]): string {
  return rows.map((row) => row.map(csvCell).join(",")).join("\r\n") + "\r\n";
}
