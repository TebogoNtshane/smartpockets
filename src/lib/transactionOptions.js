import { CATEGORY_LABELS } from "@/lib/theme";

export { isoDate } from "@/lib/format";

export function categoryOptions() {
  return Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label }));
}

export function cadenceOptions() {
  return [
    { value: "weekly", label: "Every week" },
    { value: "fortnightly", label: "Every second week" },
    { value: "monthly", label: "Once a month" },
  ];
}

export const POCKET_EMOJIS = ["🤝", "🛒", "🎓", "🏠", "🚕", "🎉", "✈️", "👶🏾", "💼", "🐖"];

export function cadenceLabel(cadence) {
  return cadenceOptions().find((option) => option.value === cadence)?.label || "Once a month";
}