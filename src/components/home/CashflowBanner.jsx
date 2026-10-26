import { Link } from "react-router-dom";
import { ArrowUpRight, CalendarClock, TriangleAlert } from "lucide-react";
import { formatRand } from "@/lib/format";

export default function CashflowBanner({ forecast }) {
  if (!forecast) {
    return (
      <div className="rounded-3xl border border-line/70 bg-white px-4 py-3.5">
        <p className="text-xs text-ink/50">Working out your runway to payday…</p>
      </div>
    );
  }

  const risky = forecast.shortfall?.will_run_short;

  return (
    <Link
      to="/copilot"
      className={`flex items-start gap-3 rounded-3xl border px-4 py-3.5 transition active:scale-[0.99] ${
        risky ? "border-clay/25 bg-clay/[0.06]" : "border-protea/25 bg-protea/[0.06]"
      }`}
    >
      <span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-2xl ${risky ? "bg-clay/12 text-clay" : "bg-protea/12 text-protea"}`}>
        {risky ? <TriangleAlert className="h-4 w-4" /> : <CalendarClock className="h-4 w-4" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold text-ink">
          {risky
            ? `About ${formatRand(forecast.shortfall.amount)} short around ${forecast.shortfall.label}`
            : `Looks steady to payday on ${forecast.next_payday_label}`}
        </p>
        <p className="mt-0.5 text-[11px] leading-relaxed text-ink/55">
          {risky && forecast.safe_to_spend_per_day > 0
            ? `${forecast.days_to_payday} days to go · keep daily spending near ${formatRand(forecast.safe_to_spend_per_day)}`
            : risky
              ? `${forecast.days_to_payday} days to go · your fixed payments alone are more than your balance`
              : `About ${formatRand(forecast.projected_end_balance)} left after your fixed payments`}
        </p>
      </div>
      <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-ink/35" />
    </Link>
  );
}
