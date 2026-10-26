export default function Panel({ title, caption, action, children, className = "", tone = "card" }) {
  const surface = tone === "ink" ? "border-transparent bg-ink text-canvas" : "border-line/70 bg-white text-ink";
  return (
    <section className={`rounded-3xl border p-5 shadow-[0_1px_2px_rgba(14,31,26,0.04),0_18px_36px_-30px_rgba(14,31,26,0.5)] ${surface} ${className}`}>
      {(title || action) && (
        <header className="mb-4 flex items-start justify-between gap-3">
          <div>
            {title && <h2 className="font-display text-[15px] font-semibold tracking-tight">{title}</h2>}
            {caption && <p className={`mt-1 text-xs leading-relaxed ${tone === "ink" ? "text-canvas/60" : "text-ink/50"}`}>{caption}</p>}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}