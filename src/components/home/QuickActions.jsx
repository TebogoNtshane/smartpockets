import { Link } from "react-router-dom";
import { PiggyBank, Sparkles, TrendingUp, Users } from "lucide-react";

const ACTIONS = [
  { to: "/pockets", label: "Pockets", hint: "Stokvels", icon: Users, tone: "bg-protea/10 text-protea" },
  { to: "/savings", label: "Save more", hint: "Roundups", icon: PiggyBank, tone: "bg-gold/15 text-clay" },
  { to: "/copilot", label: "AI check", hint: "To payday", icon: Sparkles, tone: "bg-lagoon/10 text-lagoon" },
  { to: "/invest", label: "Optimize", hint: "R20 000", icon: TrendingUp, tone: "bg-plum/10 text-plum" },
];

export default function QuickActions() {
  return (
    <div className="grid grid-cols-4 gap-2.5">
      {ACTIONS.map(({ to, label, hint, icon: Icon, tone }) => (
        <Link
          key={to}
          to={to}
          className="flex flex-col items-center gap-1.5 rounded-3xl border border-line/70 bg-white px-1.5 py-3 transition active:scale-[0.97]"
        >
          <span className={`grid h-9 w-9 place-items-center rounded-2xl ${tone}`}>
            <Icon className="h-4 w-4" />
          </span>
          <span className="text-[11px] font-semibold leading-none text-ink">{label}</span>
          <span className="text-[9px] uppercase tracking-[0.12em] text-ink/40">{hint}</span>
        </Link>
      ))}
    </div>
  );
}