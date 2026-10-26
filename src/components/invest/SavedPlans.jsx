import { formatPercent, formatRand, shortDate } from "@/lib/format";

export default function SavedPlans({ plans, onDelete }) {
  if (!plans.length) return null;
  return (
    <ul className="divide-y divide-line/60">
      {plans.map((plan) => (
        <li key={plan.id} className="flex items-center gap-3 py-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium text-ink">
              {formatRand(plan.amount)} · {plan.horizon_years} {plan.horizon_years === 1 ? "year" : "years"} ·{" "}
              {plan.risk_profile}
            </p>
            <p className="mt-0.5 text-[11px] text-ink/45">
              {formatPercent(plan.expected_return)} a year · {shortDate(plan.created_date)}
            </p>
          </div>
          <p className="tnum shrink-0 text-[13px] font-semibold text-protea">{formatRand(plan.projected_value)}</p>
          <button
            type="button"
            onClick={() => onDelete(plan.id)}
            className="shrink-0 text-[11px] font-medium text-ink/35 transition hover:text-clay"
          >
            Remove
          </button>
        </li>
      ))}
    </ul>
  );
}