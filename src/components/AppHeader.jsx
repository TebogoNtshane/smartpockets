import { Link } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { initialsOf } from "@/lib/format";

export default function AppHeader() {
  const { user, logout } = useAuth();
  return (
    <header className="sticky top-0 z-30 border-b border-line/60 bg-canvas/85 px-5 py-3 backdrop-blur-xl md:px-8">
      <div className="flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-ink font-display text-[15px] font-bold text-canvas">
            S
          </span>
          <span className="font-display text-[17px] font-bold tracking-tight text-ink">
            Smart<span className="text-protea">Pockets</span>
          </span>
        </Link>
        <div className="flex items-center gap-1.5">
          <span className="grid h-8 w-8 place-items-center rounded-full border border-line bg-white text-[11px] font-semibold text-ink/70">
            {initialsOf(user?.full_name || user?.email)}
          </span>
          <button
            type="button"
            onClick={() => logout()}
            aria-label="Sign out"
            className="grid h-8 w-8 place-items-center rounded-full text-ink/40 transition hover:bg-ink/[0.06] hover:text-ink"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}