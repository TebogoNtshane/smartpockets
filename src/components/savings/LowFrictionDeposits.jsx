import { useState } from "react";
import { CalendarCheck } from "lucide-react";
import { api } from "@/api/client";
import Panel from "@/components/blocks/Panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatRand, isoDate } from "@/lib/format";

export default function LowFrictionDeposits({ profile, goals, reload }) {
  const [weekly, setWeekly] = useState(String(profile?.weekly_deposit || ""));
  const [monthly, setMonthly] = useState(String(profile?.monthly_deposit || ""));
  const [goalId, setGoalId] = useState(goals?.[0]?.id || "");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  const weeklyValue = Number(weekly || 0);
  const monthlyEquivalent = Math.round(weeklyValue * (52 / 12));
  const chosen = (goals || []).find((goal) => goal.id === goalId) || (goals || [])[0];

  const saveSettings = async () => {
    await api.entities.SavingsProfile.update(profile.id, {
      weekly_deposit: weeklyValue,
      monthly_deposit: Number(monthly || 0),
    });
    await reload();
  };

  const logDeposit = async () => {
    if (!chosen) return;
    setBusy(true);
    setNote("");
    try {
      await api.entities.SavingsGoal.update(chosen.id, {
        saved_amount: Math.round((Number(chosen.saved_amount || 0) + weeklyValue) * 100) / 100,
      });
      setNote(`${formatRand(weeklyValue)} into ${chosen.name} — logged ${isoDate()}.`);
      await reload();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Panel
      title="Small deposits that fit real budgets"
      caption="No lump sums needed. Pick an amount you can actually keep up week after week."
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink/45" htmlFor="weekly">
            Each week (R)
          </label>
          <Input
            id="weekly"
            type="number"
            inputMode="decimal"
            value={weekly}
            onChange={(event) => setWeekly(event.target.value)}
            onBlur={saveSettings}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink/45" htmlFor="monthly">
            Each month (R)
          </label>
          <Input
            id="monthly"
            type="number"
            inputMode="decimal"
            value={monthly}
            onChange={(event) => setMonthly(event.target.value)}
            onBlur={saveSettings}
          />
        </div>
      </div>

      <p className="mt-3 rounded-2xl bg-canvas px-4 py-3 text-[12px] leading-relaxed text-ink/60">
        {formatRand(weeklyValue)} a week is about <span className="tnum font-semibold text-ink">{formatRand(monthlyEquivalent)}</span> a
        month. That is roughly {formatRand(monthlyEquivalent * 12)} a year, tucked away before you miss it.
      </p>

      <div className="mt-3 space-y-1.5">
        <label className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink/45">Where it should go</label>
        <Select value={goalId} onValueChange={setGoalId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Choose a bucket" />
          </SelectTrigger>
          <SelectContent>
            {(goals || []).map((goal) => (
              <SelectItem key={goal.id} value={goal.id}>
                {goal.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button className="mt-4 w-full" onClick={logDeposit} disabled={busy || weeklyValue <= 0 || !chosen}>
        <CalendarCheck className="mr-2 h-4 w-4" />
        {busy ? "Logging…" : `Log this week's ${formatRand(weeklyValue)}`}
      </Button>

      {note && <p className="mt-2.5 text-[12px] font-medium text-protea">{note}</p>}
    </Panel>
  );
}