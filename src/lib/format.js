export function formatRand(value, { cents = false } = {}) {
  const n = Number(value || 0);
  const [whole, frac] = Math.abs(n).toFixed(cents ? 2 : 0).split(".");
  const spaced = whole.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${n < 0 ? "-" : ""}R${spaced}${frac ? `,${frac}` : ""}`;
}

export function formatRandCompact(value) {
  const n = Number(value || 0);
  const abs = Math.abs(n);
  if (abs >= 1000000) return `${n < 0 ? "-" : ""}R${(abs / 1000000).toFixed(1).replace(".", ",")}m`;
  if (abs >= 100000) return `${n < 0 ? "-" : ""}R${Math.round(abs / 1000)}k`;
  return `${n < 0 ? "-" : ""}R${abs.toLocaleString("en-ZA", { maximumFractionDigits: 0 })}`;
}

export function formatPercent(value, decimals = 1) {
  return `${(Number(value || 0) * 100).toFixed(decimals)}%`;
}

export function isoDate(date = new Date()) {
  const d = new Date(date);
  const month = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

export function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function shortDate(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-ZA", { day: "numeric", month: "short" });
}

export function roundupFor(amount, multiplier = 1) {
  const n = Number(amount || 0);
  const spare = Math.ceil(n / 10) * 10 - n;
  return Math.round(spare * multiplier * 100) / 100;
}

export function initialsOf(value) {
  const text = String(value || "").trim();
  if (!text) return "S";
  return text
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}