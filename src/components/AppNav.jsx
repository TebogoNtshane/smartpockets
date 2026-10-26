import { NavLink } from "react-router-dom";
import { BookOpen, Home, PiggyBank, Sparkles, TrendingUp, Users, Settings } from "lucide-react";

const ITEMS = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/pockets", label: "Pockets", icon: Users },
  { to: "/savings", label: "Save", icon: PiggyBank },
  { to: "/copilot", label: "AI", icon: Sparkles },
  { to: "/invest", label: "Invest", icon: TrendingUp },
  { to: "/learn", label: "Learn", icon: BookOpen },
  { to: "/settings", label: "Settings", icon: Settings },
];

export default function AppNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-center pb-[env(safe-area-inset-bottom)]">
      <div className="mx-3 mb-3 w-full max-w-lg rounded-[26px] border border-line/70 bg-white/90 px-1.5 py-1.5 shadow-[0_20px_45px_-25px_rgba(14,31,26,0.55)] backdrop-blur-xl">
        <ul className="flex items-stretch justify-between">
          {ITEMS.map(({ to, label, icon: Icon, end }) => (
            <li key={to} className="flex-1">
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-1 rounded-2xl px-1 py-2 text-[10px] font-semibold tracking-wide transition ${
                    isActive ? "bg-ink text-canvas" : "text-ink/45 hover:text-ink"
                  }`
                }
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}