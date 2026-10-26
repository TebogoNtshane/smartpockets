export default function ProgressBar({ value, target, tone = "protea", className = "" }) {
  const pct = Number(target) > 0 ? Math.min(100, Math.max(0, Math.round((Number(value || 0) / Number(target)) * 100))) : 0;
  const tones = {
    protea: "bg-protea",
    gold: "bg-gold",
    lagoon: "bg-lagoon",
    clay: "bg-clay",
    plum: "bg-plum",
  };
  return (
    <div className={`h-1.5 w-full overflow-hidden rounded-full bg-ink/[0.08] ${className}`}>
      <div
        className={`h-full rounded-full transition-all duration-700 ease-out ${tones[tone] || tones.protea}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}