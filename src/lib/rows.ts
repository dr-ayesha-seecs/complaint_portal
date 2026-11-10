export type SqlRow = Record<string, unknown>;

export function text(row: SqlRow, key: string): string | null {
  const value = row[key];
  if (value == null) return null;
  return String(value);
}

export function requiredText(row: SqlRow, key: string): string {
  return text(row, key) ?? "";
}

export function flag(row: SqlRow, key: string): boolean {
  return Number(row[key]) === 1;
}

export function integer(row: SqlRow, key: string): number {
  return Number(row[key] ?? 0);
}
