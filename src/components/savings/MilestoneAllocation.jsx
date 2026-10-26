import { useEffect, useState } from "react";
import { api } from "@/api/client";
import Panel from "@/components/blocks/Panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { formatRand, isoDate } from "@/lib/format";

export default function MilestoneAllocation({ profile, goals, reload }) {
  const [income, setIncome] = useState(String(profile?.income_amount || ""));
  const [percents, setPercents] = useState({});
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    const next = {};
    (goals || []).forEach((goal) => {
      next[goal.id] = String(goal.allocation_percent ?? 0);
    });
    setPercents(next);
  }, [goals]);

  const totalPercent = (goals || []).reduce((sum, goal) => sum + Number(percents[goal.id] || 0), 0);
  const incomeValue = Number(income || 0);

  const allocate = async () => {
    setBusy(true);
    setNote("");
    try {
      const updates = (goals || []).map((goal) => ({
        id: goal.id,
        allocation_percent: Number(percents[goal.id] || 0),
        saved_amount:
          Math.round((Number(goal.saved_amount || 0) + incomeValue * (Number(percents[goal.id] || 0) / 100)) * 100) / 100,
      }));
      if (updates.length) await api.entities.SavingsGoal.bulkUpdate(updates);
      await api.entities.SavingsProfile.update(profile.id, { income_amount: incomeValue });
      await api.entities.SavingsEvent.create({
        kind: "split",
        amount: incomeValue,
        label: `Payday split across ${updates.length} bucket${updates.length === 1 ? "" : "s"}`,
        event_date: isoDate(),
      });
      setNote(`${formatRand(incomeValue)} split across your buckets.`);
      await reload();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Panel
      title="Milestone allocation"
      caption="Money in gets split the moment it lands, before it disappears into the month."
    >
      <div className="space-y-1.5">
        <label className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink/45" htmlFor="income">
          Money coming in
        </label>
        <Input
          id="income"
          type="number"
          inputMode="decimal"
          value={income}
          onChange={(event) => setIncome(event.target.value)}
          placeholder="0"
        />
      </div>

      <div className="mt-4 space-y-3">
        {(goals || []).map((goal) => (
          <div key={goal.id} className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-ink">{goal.name}</p>
              <p className="tnum mt-0.5 text-[11px] text-ink/50">
                {formatRand(incomeValue * (Number(percents[goal.id] || 0) / 100))} of each deposit
              </p>
            </div>
            <div className="flex w-24 shrink-0 items-center gap-1.5">
              <Input
                type="number"
                inputMode="numeric"
                className="h-9 text-right"
                value={percents[goal.id] ?? ""}
                onChange={(event) => setPercents((prev) => ({ ...prev, [goal.id]: event.target.value }))}
              />
              <span className="text-xs text-ink/45">%</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px]">
        <span className={totalPercent === 100 ? "text-ink/50" : "font-medium text-clay"}>
          {totalPercent === 100 ? "Splits perfectly across your buckets" : `Your splits add up to ${totalPercent}% — aim for 100%`}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between rounded-2xl bg-canvas px-4 py-3">
        <div>
          <p className="text-[13px] font-medium text-ink">Allocate automatically</p>
          <p className="mt-0.5 text-[11px] text-ink/50">Runs the split on every payday</p>
        </div>
        <Switch
          checked={profile?.auto_allocate_enabled !== false}
          onCheckedChange={async (checked) => {
            await api.entities.SavingsProfile.update(profile.id, { auto_allocate_enabled: checked });
            await reload();
          }}
        />
      </div>

      <Button className="mt-4 w-full" onClick={allocate} disabled={busy || incomeValue <= 0}>
        {busy ? "Splitting…" : `Split ${formatRand(incomeValue)} now`}
      </Button>

      {note && <p className="mt-2.5 text-[12px] font-medium text-protea">{note}</p>}
    </Panel>
  );
}