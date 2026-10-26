import { formatRand, shortDate } from "@/lib/format";
import { downloadReceipt } from "@/lib/receipt";

export default function ContributionRow({ contribution, isMine, pocket }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium text-ink truncate">
          {contribution.user_name} {isMine ? <span className="text-ink/40">(You)</span> : null}
        </p>
        <p className="text-[11px] text-ink/45 mt-0.5">
          {shortDate(contribution.contribution_date)} • {contribution.type}
          {contribution.is_late ? " • LATE" : ""}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-[13px] font-bold text-ink">
          {formatRand(contribution.amount)}
        </span>
        <button 
          onClick={()=>downloadReceipt(contribution, pocket)} 
          className="text-[10px] font-bold underline"
        >
          PDF
        </button>
      </div>
    </div>
  );
}