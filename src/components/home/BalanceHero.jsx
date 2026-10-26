import { formatRand } from "@/lib/format";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function firstNameOf(name) {
  const first = String(name || "").split(" ")[0];
  return /^[A-Za-z][A-Za-z'-]{1,}$/.test(first) ? first : null;
}

export default function BalanceHero({ name, profile, goalsTotal, pocketTotal }) {
  const saved = Number(goalsTotal || 0) + Number(pocketTotal || 0);
  const firstName = firstNameOf(name);

  return (
    <section className="relative overflow-hidden rounded-[28px] bg-ink px-5 py-6 text-canvas">
      <div className="pointer-events-none absolute -right-16 -top-24 h-56 w-56 rounded-full bg-protea/35 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-12 h-48 w-48 rounded-full bg-gold/25 blur-3xl" />
      <div className="relative">
        <p className="text-[11px] uppercase tracking-[0.2em] text-canvas/55">
          {firstName ? `${greeting()}, ${firstName}` : greeting()}
        </p>
        <p className="tnum mt-3 font-display text-[38px] font-bold leading-none tracking-tight">
          {formatRand(saved)}
        </p>
        <p className="mt-2 text-xs text-canvas/60">put away in pockets, goals and roundups</p>

        <div className="mt-6 grid grid-cols-2 gap-2.5">
          <div className="rounded-2xl bg-canvas/[0.08] px-3.5 py-3">
            <p className="text-[10px] uppercase tracking-[0.16em] text-canvas/50">Available now</p>
            <p className="tnum mt-1 font-display text-[15px] font-semibold">
              {formatRand(profile?.available_balance)}
            </p>
          </div>
          <div className="rounded-2xl bg-canvas/[0.08] px-3.5 py-3">
            <p className="text-[10px] uppercase tracking-[0.16em] text-canvas/50">Roundups tucked</p>
            <p className="tnum mt-1 font-display text-[15px] font-semibold">
              {formatRand(profile?.roundup_total, { cents: true })}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}