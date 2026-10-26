import { Sparkles } from "lucide-react";

export default function NarrativeCard({ narrative, forecast }) {
  const headline = narrative?.headline || (forecast?.shortfall?.will_run_short ? "Tight until payday" : "On track to payday");
  const explanation =
    narrative?.explanation ||
    `With ${forecast?.days_to_payday} days to payday, your fixed payments and everyday spending decide whether you finish the month comfortably.`;
  const actions = narrative?.actions || [];

  return (
    <section className="relative overflow-hidden rounded-[28px] bg-ink px-5 py-5 text-canvas">
      <div className="pointer-events-none absolute -right-14 -top-16 h-44 w-44 rounded-full bg-lagoon/30 blur-3xl" />
      <div className="relative">
        <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-canvas/55">
          <Sparkles className="h-3 w-3" /> AI co-pilot
        </p>
        <h2 className="mt-2.5 font-display text-lg font-bold leading-snug tracking-tight">{headline}</h2>
        <p className="mt-2 text-[13px] leading-relaxed text-canvas/75">{explanation}</p>

        {actions.length > 0 && (
          <ul className="mt-4 space-y-2">
            {actions.map((action, index) => (
              <li key={index} className="flex items-start gap-2.5 rounded-2xl bg-canvas/[0.08] px-3.5 py-2.5">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-canvas/15 text-[10px] font-bold">
                  {index + 1}
                </span>
                <span className="text-[12px] leading-relaxed text-canvas/85">{action}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}