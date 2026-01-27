import type { BaseRow, ExplanationRow, JoinedRow } from "./types";

const keyFor = (row: { cardholder_name: string; year: number; month: number }) =>
  `${row.cardholder_name}::${row.year}-${row.month}`;

export const joinRows = (base: BaseRow[], explanation: ExplanationRow[]): JoinedRow[] => {
  const map = new Map<string, ExplanationRow>();
  explanation.forEach((row) => map.set(keyFor(row), row));
  return base.map((row) => ({
    ...row,
    ...(map.get(keyFor(row)) ?? {}),
  })) as JoinedRow[];
};

export const toMonthKey = (year: number, month: number) =>
  `${year}-${String(month).padStart(2, "0")}`;

export const listMonthKeys = (rows: BaseRow[]) => {
  const set = new Set<string>();
  rows.forEach((row) => set.add(toMonthKey(row.year, row.month)));
  return Array.from(set).sort((a, b) => (a < b ? 1 : -1));
};

export const getJoinedRow = (
  rows: JoinedRow[],
  cardholderName: string | null,
  monthKey: string,
) => {
  if (!cardholderName) return null;
  return rows.find(
    (row) => row.cardholder_name === cardholderName && toMonthKey(row.year, row.month) === monthKey,
  ) ?? null;
};
