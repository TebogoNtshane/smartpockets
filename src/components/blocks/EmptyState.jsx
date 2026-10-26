export default function EmptyState({ title, body, action }) {
  return (
    <div className="rounded-3xl border border-dashed border-line bg-white/60 px-5 py-8 text-center">
      <p className="font-display text-sm font-semibold text-ink">{title}</p>
      {body && <p className="mx-auto mt-1.5 max-w-xs text-xs leading-relaxed text-ink/55">{body}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}