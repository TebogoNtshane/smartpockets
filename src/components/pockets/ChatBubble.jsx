import { initialsOf, shortDate } from "@/lib/format";

function stamp(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const time = date.toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" });
  return date.toDateString() === new Date().toDateString() ? time : `${shortDate(value)} ${time}`;
}

export default function ChatBubble({ message, mine }) {
  return (
    <div className={`flex items-start gap-2.5 ${mine ? "flex-row-reverse" : ""}`}>
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ink/[0.08] text-[10px] font-semibold text-ink/70">
        {initialsOf(message.user_name)}
      </span>
      <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 ${mine ? "bg-protea" : "bg-white"}`}>
        <div className="flex items-center gap-2">
          <p className={`text-[11px] font-semibold ${mine ? "text-canvas" : "text-ink"}`}>
            {mine ? "You" : message.user_name || "Member"}
          </p>
          <p className={`text-[10px] ${mine ? "text-canvas/60" : "text-ink/40"}`}>{stamp(message.created_date)}</p>
        </div>
        <p className={`mt-1 text-[12.5px] leading-relaxed ${mine ? "text-canvas/95" : "text-ink/75"}`}>{message.body}</p>
      </div>
    </div>
  );
}