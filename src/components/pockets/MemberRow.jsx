import TrustBadge, { trustLabel, trustScore } from "@/components/blocks/TrustBadge";
import { formatRand, initialsOf, shortDate } from "@/lib/format";

export default function MemberRow({ member, contributed }) {
  const score = trustScore(member);
  return (
    <div className="flex items-center gap-3 py-2.5">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-canvas text-[11px] font-semibold text-ink/60">
        {initialsOf(member.user_name || member.user_email)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium leading-tight text-ink">
          {member.user_name || member.user_email}
          {member.role === "admin" && <span className="ml-1.5 text-[10px] font-semibold text-protea">organiser</span>}
        </p>
        <p className="mt-0.5 text-[11px] text-ink/45">
          {trustLabel(score)} · joined {shortDate(member.joined_date)}
          {member.is_sample ? " · sample member" : ""}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="tnum text-[13px] font-semibold text-ink">{formatRand(contributed)}</p>
        <div className="mt-1 flex justify-end">
          <TrustBadge member={member} />
        </div>
      </div>
    </div>
  );
}