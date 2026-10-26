import { ShieldCheck } from "lucide-react";

export function trustScore(member) {
  const onTime = Number(member?.on_time_payments || 0);
  const missed = Number(member?.missed_payments || 0);
  const total = onTime + missed;
  if (!total) return 100;
  return Math.round((onTime / total) * 100);
}

export function trustLabel(score) {
  if (score >= 90) return "Trusted";
  if (score >= 75) return "Reliable";
  return "Needs a nudge";
}

export default function TrustBadge({ member }) {
  const score = trustScore(member);
  const tone =
    score >= 90 ? "bg-protea/12 text-protea" : score >= 75 ? "bg-gold/20 text-clay" : "bg-clay/12 text-clay";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${tone}`}>
      <ShieldCheck className="h-3 w-3" />
      {score}%
    </span>
  );
}
