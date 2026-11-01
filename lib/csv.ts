export function escapeCsvValue(value: unknown) {
  const text = value == null ? "" : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function buildCsv(rows: unknown[][]) {
  return rows.map((row) => row.map(escapeCsvValue).join(",")).join("\r\n");
}
