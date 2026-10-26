import { formatRand } from "@/lib/format";

const TONES = {
  protea: "bg-protea",
  gold: "bg-gold",
  lagoon: "bg-lagoon",
  clay: "bg-clay",
  plum: "bg-plum",
};

export default function ReviewRow({ label, detail, amount, share = 0, tone = "protea" }) {
  const fill = TONES[tone] || TONES.protea;
  const width = share > 0 ? Math.min(100, Math.max(4, Math.round(share * 100))) : 0;

  return (
    <li className="py-3">
      <div className="flex items-baseline justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-[13px] font-medium text-ink">
            <span className={`h-2 w-2 shrink-0 rounded-full ${fill}`} />
            {label}
          </p>
          {detail && <p className="mt-0.5 pl-4 text-[11px] text-ink/50">{detail}</p>}
        </div>
        <p className="tnum shrink-0 font-display text-[14px] font-semibold text-ink">
          {formatRand(amount, { cents: true })}
        </p>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-ink/[0.08]">
        <div className={`h-full rounded-full transition-all duration-700 ease-out ${fill}`} style={{ width: `${width}%` }} />
      </div>
    </li>
  );
}
