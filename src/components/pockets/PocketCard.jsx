import { Link, useNavigate } from "react-router-dom";
import { MessagesSquare, Users } from "lucide-react";
import { formatRand } from "@/lib/format";
import ProgressBar from "@/components/blocks/ProgressBar";

export default function PocketCard({ pocket, total, memberCount, myShare, messageCount }) {
  const navigate = useNavigate();

  return (
    <div className="rounded-3xl border border-line/70 bg-white p-4">
      <Link to={`/pockets/${pocket.id}`} className="block transition active:scale-[0.99]">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-canvas text-xl">
            {pocket.emoji || "🤝"}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-sm font-semibold text-ink">{pocket.name}</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-ink/45">
              <Users className="h-3 w-3" />
              {memberCount || 0} members · {pocket.cadence}
            </p>
          </div>
          <p className="tnum shrink-0 font-display text-[15px] font-bold text-ink">{formatRand(total)}</p>
        </div>

        <div className="mt-3.5">
          <ProgressBar value={total} target={pocket.target_amount} />
          <div className="mt-2 flex items-center justify-between text-[11px] text-ink/50">
            <span className="tnum">
              You put in {formatRand(myShare)} of {formatRand(pocket.contribution_amount)} {pocket.cadence}
            </span>
            <span className="tnum">Target {formatRand(pocket.target_amount)}</span>
          </div>
        </div>
      </Link>

      <button
        type="button"
        onClick={() => navigate(`/pockets/${pocket.id}?chat=1`)}
        className="mt-3 flex w-full items-center justify-between border-t border-line/60 pt-2.5 text-left"
      >
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-protea">
          <MessagesSquare className="h-3.5 w-3.5" /> Table talk
        </span>
        <span className="text-[11px] text-ink/45">
          {messageCount ? `${messageCount} message${messageCount === 1 ? "" : "s"}` : "Start the conversation"}
        </span>
      </button>
    </div>
  );
}