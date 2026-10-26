export default function LoadingBlock({ label = "Loading your money picture", rows = 3 }) {
  return (
    <div className="space-y-3" aria-busy="true">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-ink/35">{label}</p>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="h-20 animate-pulse rounded-3xl border border-line/60 bg-white/70" />
      ))}
    </div>
  );
}