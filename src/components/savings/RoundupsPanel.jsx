import { useState } from "react";
import { Sparkles, Wand2 } from "lucide-react";
import { api } from "@/api/client";
import Panel from "@/components/blocks/Panel";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatRand, roundupFor } from "@/lib/format";
import LogTransactionDialog from "@/components/savings/LogTransactionDialog";

const MULTIPLIERS = [
  { value: "1", label: "Spare change (x1)" },
  { value: "2", label: "Double (x2)" },
  { value: "5", label: "Five times (x5)" },
];

export default function RoundupsPanel({ profile, goals, transactions, reload }) {
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  const multiplier = Number(profile?.roundup_multiplier || 1);
  const pending = (transactions || [])
    .filter((item) => !item.roundup_applied)
    .filter((item) => roundupFor(item.amount, multiplier) > 0);
  const waiting = pending.reduce((sum, item) => sum + roundupFor(item.amount, multiplier), 0);
  const emergency = (goals || []).find((goal) => goal.category === "emergency") || (goals || [])[0];

  const saveProfile = async (patch) => {
    await api.entities.SavingsProfile.update(profile.id, patch);
    await reload();
  };

  const tuckAway = async () => {
    setBusy(true);
    setNote("");
    try {
      const updates = pending
        .filter((item) => roundupFor(item.amount, multiplier) > 0)
        .map((item) => ({ id: item.id, roundup_amount: roundupFor(item.amount, multiplier), roundup_applied: true }));
      if (updates.length) await api.entities.Transaction.bulkUpdate(updates);

      await api.entities.SavingsProfile.update(profile.id, {
        roundup_total: Math.round((Number(profile.roundup_total || 0) + waiting) * 100) / 100,
      });
      if (emergency) {
        await api.entities.SavingsGoal.update(emergency.id, {
          saved_amount: Math.round((Number(emergency.saved_amount || 0) + waiting) * 100) / 100,
        });
      }
      setNote(`${formatRand(waiting, { cents: true })} tucked into ${emergency ? emergency.name : "your savings"}.`);
      await reload();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Panel
      title="Auto-roundups"
      caption="Every purchase rounds up to the next R10. The spare change slips into savings."
      action={<LogTransactionDialog onSaved={reload} />}
    >
      <div className="flex items-center justify-between rounded-2xl bg-canvas px-4 py-3">
        <div>
          <p className="text-[13px] font-medium text-ink">Round up automatically</p>
          <p className="mt-0.5 text-[11px] text-ink/50">Works quietly in the background</p>
        </div>
        <Switch
          checked={profile?.roundup_enabled !== false}
          onCheckedChange={(checked) => saveProfile({ roundup_enabled: checked })}
        />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2.5">
        <div className="rounded-2xl border border-line/70 px-3.5 py-3">
          <p className="text-[10px] uppercase tracking-[0.14em] text-ink/40">Tucked away</p>
          <p className="tnum mt-1 font-display text-[15px] font-semibold text-ink">
            {formatRand(profile?.roundup_total, { cents: true })}
          </p>
        </div>
        <div className="rounded-2xl border border-line/70 px-3.5 py-3">
          <p className="text-[10px] uppercase tracking-[0.14em] text-ink/40">Waiting to move</p>
          <p className="tnum mt-1 font-display text-[15px] font-semibold text-protea">
            {formatRand(waiting, { cents: true })}
          </p>
        </div>
      </div>

      <div className="mt-3">
        <Select value={String(multiplier)} onValueChange={(value) => saveProfile({ roundup_multiplier: Number(value) })}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MULTIPLIERS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ul className="mt-4 divide-y divide-line/60">
        {pending.slice(0, 4).map((item) => (
          <li key={item.id} className="flex items-center justify-between py-2.5 text-[12px]">
            <span className="min-w-0 flex-1 truncate text-ink/70">
              {item.description} · {formatRand(item.amount, { cents: true })}
            </span>
            <span className="tnum shrink-0 font-semibold text-protea">
              +{formatRand(roundupFor(item.amount, multiplier), { cents: true })}
            </span>
          </li>
        ))}
        {!pending.length && (
          <li className="py-3 text-[12px] text-ink/50">No spare change waiting — your roundups are all tucked in.</li>
        )}
      </ul>

      <Button className="mt-4 w-full" onClick={tuckAway} disabled={busy || waiting <= 0}>
        <Wand2 className="mr-2 h-4 w-4" />
        {busy ? "Tucking it away…" : `Tuck ${formatRand(waiting, { cents: true })} away`}
      </Button>

      {note && (
        <p className="mt-2.5 flex items-center gap-1.5 text-[12px] font-medium text-protea">
          <Sparkles className="h-3.5 w-3.5" /> {note}
        </p>
      )}
    </Panel>
  );
}