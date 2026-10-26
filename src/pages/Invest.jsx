import AIInvestorChat from "@/components/invest/AIInvestorChat";
import { useCallback, useEffect, useState } from "react";
import { Check, TriangleAlert } from "lucide-react";
import { api } from "@/api/client";
import Panel from "@/components/blocks/Panel";
import LoadingBlock from "@/components/blocks/LoadingBlock";
import OptimizerForm from "@/components/invest/OptimizerForm";
import AllocationBreakdown from "@/components/invest/AllocationBreakdown";
import PlatformLinks from "@/components/invest/PlatformLinks";
import ProjectionChart from "@/components/invest/ProjectionChart";
import SavedPlans from "@/components/invest/SavedPlans";
import { Button } from "@/components/ui/button";
import { formatPercent, formatRand } from "@/lib/format";
import useFinanceData from "@/lib/useFinanceData";

export default function Invest() {
  const { loading, profile } = useFinanceData();
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [plans, setPlans] = useState([]);
  const [savedNote, setSavedNote] = useState("");

  const loadPlans = useCallback(async () => {
    const page = await api.entities.InvestmentPlan.filter({}, { sort: "-created_date", limit: 5 });
    setPlans(page?.items || []);
  }, []);

  useEffect(() => {
    if (!loading) loadPlans();
  }, [loading, loadPlans]);

  const optimise = async (payload) => {
    setBusy(true);
    setError("");
    setSavedNote("");
    try {
      const response = await api.functions.invoke("optimizePortfolio", payload);
      setResult(response?.data || null);
      if (profile) {
        await api.entities.SavingsProfile.update(profile.id, { risk_profile: payload.risk_profile });
      }
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "The optimiser could not run. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const savePlan = async () => {
    await api.entities.InvestmentPlan.create({
      name: `${formatRand(result.amount)} over ${result.horizon_years} years`,
      amount: result.amount,
      horizon_years: result.horizon_years,
      risk_profile: result.profile.key,
      expected_return: result.expected_return,
      volatility: result.volatility,
      projected_value: result.final_value,
      allocation_json: JSON.stringify(result.weights.map((item) => ({ key: item.key, weight: item.weight }))),
    });
    setSavedNote("Saved to your plans.");
    await loadPlans();
  };

  const deletePlan = async (id) => {
    await api.entities.InvestmentPlan.delete(id);
    await loadPlans();
  };

  if (loading) return <LoadingBlock label="Warming up the optimiser" />;

  return (
    <div className="space-y-4">
      <header className="px-1">
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Investment optimizer</h1>
        <p className="mt-1 text-[13px] leading-relaxed text-ink/55">
          Give it an amount, a horizon and how much risk you can stomach. The optimiser solves for the mix that earns
          the most for that exact profile across SA asset classes.
        </p>
      </header>

      <Panel title="Your brief" caption="Assumptions: SA equity and bond returns, money market, global equity and tech, listed property.">
        <OptimizerForm defaultRisk={profile?.risk_profile || "balanced"} onOptimize={optimise} busy={busy} />
      </Panel>

      {error && (
        <p className="flex items-center gap-2 rounded-2xl border border-clay/25 bg-clay/[0.06] px-4 py-3 text-[12px] font-medium text-clay">
          <TriangleAlert className="h-4 w-4" /> {error}
        </p>
      )}

      {result && (
        <>
          <section className="rounded-[28px] bg-ink px-5 py-5 text-canvas">
            <p className="text-[10px] uppercase tracking-[0.2em] text-canvas/55">
              {result.profile.label} profile · {result.profile.note}
            </p>
            <p className="tnum mt-3 font-display text-[31px] font-bold leading-none tracking-tight">
              {formatRand(result.final_value)}
            </p>
            <p className="mt-2 text-[12px] leading-relaxed text-canvas/70">{result.summary}</p>
            <div className="mt-4 grid grid-cols-3 gap-2.5 text-center">
              <div className="rounded-2xl bg-canvas/[0.08] px-2 py-2.5">
                <p className="tnum font-display text-[14px] font-semibold">{formatPercent(result.expected_return)}</p>
                <p className="mt-0.5 text-[10px] uppercase tracking-[0.12em] text-canvas/50">Return</p>
              </div>
              <div className="rounded-2xl bg-canvas/[0.08] px-2 py-2.5">
                <p className="tnum font-display text-[14px] font-semibold">{formatPercent(result.volatility)}</p>
                <p className="mt-0.5 text-[10px] uppercase tracking-[0.12em] text-canvas/50">Swing</p>
              </div>
              <div className="rounded-2xl bg-canvas/[0.08] px-2 py-2.5">
                <p className="tnum font-display text-[14px] font-semibold">{formatRand(result.final_value_real)}</p>
                <p className="mt-0.5 text-[10px] uppercase tracking-[0.12em] text-canvas/50">Today's money</p>
              </div>
            </div>
          </section>

          <Panel title="Optimal asset mix" caption="Weights are solved, not guessed — each rand lands where it earns most for your risk budget.">
            <AllocationBreakdown weights={result.weights} expectedReturn={result.expected_return} />
          </Panel>

          <Panel
            title="Put this mix to work"
            caption="Tap a platform to open its own sign-up page in a new tab."
          >
            <PlatformLinks weights={result.weights} />
          </Panel>

          <Panel title="Projected growth" caption="The band shows a weaker and a stronger market outcome around the expected path.">
            <ProjectionChart points={result.projected} />
          </Panel>

          <Button className="w-full" variant="outline" onClick={savePlan}>
            <Check className="mr-2 h-4 w-4" /> Save this plan
          </Button>
          {savedNote && <p className="text-center text-[12px] font-medium text-protea">{savedNote}</p>}
        </>
      )}

      <Panel title="Saved plans" caption="Your last few optimisation runs.">
        <SavedPlans plans={plans} onDelete={deletePlan} />
        {!plans.length && <p className="py-2 text-[12px] text-ink/50">Nothing saved yet.</p>}
      </Panel>

      <p className="px-1 text-[11px] leading-relaxed text-ink/45">
        Illustrative modelling only — not financial advice. Real returns vary and past performance does not repeat
        itself.
      </p>

      {/* Floating AI Investor - knows your plan */}
      <AIInvestorChat result={result} defaultRisk={profile?.risk_profile} />
    </div>
  );

}
