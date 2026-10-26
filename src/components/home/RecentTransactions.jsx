import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { formatRand, shortDate } from "@/lib/format";
import { CATEGORY_ICONS, CATEGORY_LABELS } from "@/lib/theme";

export default function RecentTransactions({ transactions }) {
  const recent = (transactions || []).slice(0, 5);

  return (
    <div className="divide-y divide-line/60">
      {recent.map((item) => (
        <div key={item.id} className="flex items-center gap-3 py-2.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-canvas text-sm">
            {CATEGORY_ICONS[item.category] || CATEGORY_ICONS.other}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium leading-tight text-ink">{item.description}</p>
            <p className="mt-0.5 text-[11px] text-ink/45">
              {shortDate(item.transaction_date)} · {CATEGORY_LABELS[item.category] || "Other"}
              {item.is_recurring ? " · recurring" : ""}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="tnum text-[13px] font-semibold text-ink">{formatRand(item.amount, { cents: true })}</p>
            {Number(item.roundup_amount) > 0 && item.roundup_applied && (
              <p className="tnum text-[10px] font-medium text-protea">
                +{formatRand(item.roundup_amount, { cents: true })} spare
              </p>
            )}
          </div>
        </div>
      ))}
      {!recent.length && <p className="py-4 text-xs text-ink/50">No transactions yet.</p>}
      <Link
        to="/savings"
        className="flex items-center justify-between py-3 text-[12px] font-semibold text-protea"
      >
        Open the savings engine
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}