import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const AMOUNT_CHIPS = [5000, 20000, 50000, 100000];

const RISKS = [
  { value: "conservative", label: "Conservative", hint: "Protect it first" },
  { value: "balanced", label: "Balanced", hint: "Steady growth" },
  { value: "growth", label: "Growth", hint: "Longer game" },
  { value: "aggressive", label: "Aggressive", hint: "Bigger swings" },
];

export default function OptimizerForm({ defaultRisk = "balanced", onOptimize, busy }) {
  const [amount, setAmount] = useState("20000");
  const [years, setYears] = useState(5);
  const [risk, setRisk] = useState(defaultRisk);

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="optimizer-amount">Once-off amount (R)</Label>
        <Input
          id="optimizer-amount"
          type="number"
          inputMode="decimal"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
        />
        <div className="flex flex-wrap gap-1.5 pt-1">
          {AMOUNT_CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => setAmount(String(chip))}
              className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition ${
                String(chip) === amount ? "border-ink bg-ink text-canvas" : "border-line bg-white text-ink/60"
              }`}
            >
              R{chip.toLocaleString("en-ZA")}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between">
          <Label htmlFor="optimizer-years">Time horizon</Label>
          <span className="tnum font-display text-sm font-semibold text-ink">
            {years} {years === 1 ? "year" : "years"}
          </span>
        </div>
        <input
          id="optimizer-years"
          type="range"
          min="1"
          max="20"
          value={years}
          onChange={(event) => setYears(Number(event.target.value))}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-line accent-protea"
        />
      </div>

      <div className="space-y-1.5">
        <Label>Risk tolerance</Label>
        <div className="grid grid-cols-2 gap-2">
          {RISKS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setRisk(option.value)}
              className={`rounded-2xl border px-3 py-2.5 text-left transition ${
                risk === option.value ? "border-ink bg-ink/[0.04]" : "border-line bg-white"
              }`}
            >
              <span className="block text-[12px] font-semibold text-ink">{option.label}</span>
              <span className="mt-0.5 block text-[10px] uppercase tracking-[0.12em] text-ink/40">{option.hint}</span>
            </button>
          ))}
        </div>
      </div>

      <Button
        className="w-full"
        onClick={() => onOptimize({ amount: Number(amount || 0), horizon_years: years, risk_profile: risk })}
        disabled={busy || Number(amount || 0) < 100}
      >
        <Sparkles className="mr-2 h-4 w-4" />
        {busy ? "Optimising…" : "Optimise my mix"}
      </Button>
    </div>
  );
}