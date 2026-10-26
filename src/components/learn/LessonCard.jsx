import { Check, ChevronDown, Wallet, PiggyBank, Lightbulb, AlertCircle, Heart, Calculator } from "lucide-react";

const CATEGORY_TAGS = {
  budgeting: "Budgeting",
  debt: "Debt",
  saving: "Saving",
  investing: "Investing",
  stokvels: "Stokvels",
  credit: "Credit score",
  loans: "Loans",
};

const CATEGORY_COLOR = {
  budgeting: "bg-[#D4FF57] text-black",
  debt: "bg-[#FF6B6B] text-white",
  saving: "bg-[#4ECDC4] text-black",
  investing: "bg-black text-white",
  stokvels: "bg-[#FFE66D] text-black",
  credit: "bg-[#A8E6CF] text-black",
  loans: "bg-[#FF8E53] text-white",
};

// Makes **bold** work
function parseBold(text) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**")) {
      return <strong key={i} className="font-bold text-ink">{p.slice(2, -2)}</strong>;
    }
    return p;
  });
}

function BudgetVisual() {
  return (
    <div className="my-4 rounded-[20px] bg-[#F6F3EE] p-4">
      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-ink/60">
        <Calculator className="h-3.5 w-3.5" /> SA Example: R5 000 take-home
      </div>
      <div className="mt-3 flex h-3 w-full overflow-hidden rounded-full">
        <div className="bg-black w-[50%]" />
        <div className="bg-[#D4FF57] w-[30%]" />
        <div className="bg-[#4ECDC4] w-[20%]" />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
        <div><div className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-black"></span><span className="font-bold">50% Needs</span></div><p className="mt-1 text-ink/60">R2 500<br/>Rent, taxi, Shoprite, prepaid electricity, data</p></div>
        <div><div className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#D4FF57]"></span><span className="font-bold">30% Wants</span></div><p className="mt-1 text-ink/60">R1 500<br/>Takealot, DSTV, Kota Friday</p></div>
        <div><div className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#4ECDC4]"></span><span className="font-bold">20% Future</span></div><p className="mt-1 text-ink/60">R1 000<br/>Stokvel / TFSA / debt</p></div>
      </div>
    </div>
  );
}

export default function LessonCard({ lesson, expanded, read, onToggle, onMarkRead }) {
  const paragraphs = (lesson.body || "").split("\n\n").filter(Boolean);
  
  return (
    <article className={`rounded-[28px] border bg-white px-5 py-4 shadow-sm transition-all ${expanded ? "border-black/15 shadow-md" : "border-line/70"}`}>
      <button type="button" onClick={onToggle} className="flex w-full items-start gap-3 text-left">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.14em]">
            <span className={`rounded-full px-2.5 py-1 font-bold ${CATEGORY_COLOR[lesson.category] || "bg-line text-ink/60"}`}>{CATEGORY_TAGS[lesson.category] || "Money"}</span>
            <span className="text-ink/40">{lesson.read_minutes || 5} min read</span>
            {read && <span className="inline-flex items-center gap-1 rounded-full bg-black px-2 py-1 text-[9px] font-semibold text-white"><Check className="h-3 w-3" /> read</span>}
          </div>
          <h3 className="mt-3 font-display text-[16px] font-bold leading-tight text-ink">{lesson.title}</h3>
          {!expanded && <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-ink/60">{lesson.summary}</p>}
        </div>
        <div className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-all ${expanded ? "rotate-180 bg-black text-white" : "bg-[#F6F3EE] text-ink/40"}`}>
          <ChevronDown className="h-4 w-4" />
        </div>
      </button>

      {expanded && (
        <div className="mt-5 animate-in">
          {/* SA Reality Banner */}
          {lesson.category === "budgeting" && <BudgetVisual />}

          <div className="space-y-4">
            {paragraphs.map((paragraph, index) => {
              const isList = paragraph.trim().startsWith("- ") || paragraph.trim().startsWith("•");
              const isTip = paragraph.toLowerCase().startsWith("tip:") || paragraph.toLowerCase().startsWith("pro tip");
              const isWarning = paragraph.toLowerCase().startsWith("watch out") || paragraph.toLowerCase().startsWith("mashonisa") || paragraph.toLowerCase().startsWith("scam");
              const isProverb = paragraph.toLowerCase().includes("proverb") || paragraph.includes("“");

              if (isList) {
                return (
                  <ul key={index} className="space-y-2">
                    {paragraph.split("\n").map((line, li) => (
                      <li key={li} className="flex gap-2 text-[13.5px] leading-relaxed text-ink/75">
                        <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-black" />
                        <span>{parseBold(line.replace(/^[-•]\s*/, ""))}</span>
                      </li>
                    ))}
                  </ul>
                );
              }

              if (isTip) {
                return (
                  <div key={index} className="flex gap-3 rounded-2xl bg-[#D4FF57]/30 px-4 py-3">
                    <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" />
                    <p className="text-[13px] leading-relaxed text-ink/80">{parseBold(paragraph)}</p>
                  </div>
                );
              }

              if (isWarning) {
                return (
                  <div key={index} className="flex gap-3 rounded-2xl bg-red-50 border border-red-100 px-4 py-3">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                    <p className="text-[13px] leading-relaxed text-ink/80">{parseBold(paragraph)}</p>
                  </div>
                );
              }

              if (isProverb) {
                return (
                  <div key={index} className="flex gap-3 rounded-2xl bg-[#F6F3EE] px-4 py-3 italic">
                    <Heart className="mt-0.5 h-4 w-4 shrink-0 text-ink/40" />
                    <p className="text-[13px] leading-relaxed text-ink/70">{parseBold(paragraph)}</p>
                  </div>
                );
              }

              return (
                <p key={index} className="text-[14px] leading-[1.7] text-ink/75">
                  {parseBold(paragraph)}
                </p>
              );
            })}
          </div>

          {/* Example SA Case Study Box */}
          <div className="mt-5 grid grid-cols-2 gap-2">
            <div className="rounded-2xl bg-black px-4 py-3 text-white">
              <p className="text-[10px] uppercase tracking-wide opacity-60 flex items-center gap-1"><Wallet className="h-3 w-3" /> When Needs are 80%</p>
              <p className="mt-1 text-[12px] leading-relaxed">Normal in SA. Start with **5% savings** on payday. Capitec auto-transfer R250 before you spend.</p>
            </div>
            <div className="rounded-2xl bg-white border px-4 py-3">
              <p className="text-[10px] uppercase tracking-wide text-ink/40 flex items-center gap-1"><PiggyBank className="h-3 w-3" /> Pay Yourself First</p>
              <p className="mt-1 text-[12px] leading-relaxed text-ink/70">Move savings **before** airtime and takeaways. Even R100 counts.</p>
            </div>
          </div>

          {lesson.takeaway && (
            <div className="mt-5 rounded-[18px] bg-[#111] px-5 py-4 text-white">
              <p className="text-[12px] leading-relaxed"><span className="font-bold text-[#D4FF57]">Take it with you: </span>{lesson.takeaway}</p>
            </div>
          )}

          <div className="mt-5 flex items-center justify-between">
            <button
              type="button"
              onClick={() => onMarkRead(lesson, !read)}
              className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[12px] font-bold transition ${read ? "bg-[#F6F3EE] text-ink/50" : "bg-black text-white shadow"}`}
            >
              <Check className="h-4 w-4" />
              {read ? "Mark as unread" : "Mark as read • +10 XP"}
            </button>
            <span className="text-[10px] text-ink/30">Made for Mzansi 🇿🇦</span>
          </div>
        </div>
      )}
    </article>
  );
}