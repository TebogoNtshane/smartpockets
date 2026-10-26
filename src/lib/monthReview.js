import { isoDate } from "@/lib/format";

export function monthWindow(offset = 0, today = new Date()) {
  const start = new Date(today.getFullYear(), today.getMonth() + offset, 1);
  const end = new Date(today.getFullYear(), today.getMonth() + offset + 1, 1);
  return {
    key: isoDate(start).slice(0, 7),
    start: isoDate(start),
    end: isoDate(end),
    label: start.toLocaleDateString("en-ZA", { month: "long" }),
  };
}

export function sumInMonth(records, { field, dateField, month }) {
  return (records || []).reduce(
    (acc, record) => {
      if (String(record[dateField] || "").slice(0, 7) !== month.key) return acc;
      acc.amount += Number(record[field] || 0);
      acc.count += 1;
      return acc;
    },
    { amount: 0, count: 0 },
  );
}

export function roundRand(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}