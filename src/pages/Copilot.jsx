import { useCallback, useEffect, useState } from "react";
import { RefreshCw, TriangleAlert } from "lucide-react";
import { api } from "@/api/client";
import Panel from "@/components/blocks/Panel";
import LoadingBlock from "@/components/blocks/LoadingBlock";
import ForecastChart from "@/components/copilot/ForecastChart";
import NarrativeCard from "@/components/copilot/NarrativeCard";
import { Button } from "@/components/ui/button";
import { formatRand } from "@/lib/format";

const LEVEL_STYLES = {
  critical: "border-clay/25 bg-clay/[0.06] text-clay",
  watch: "border-gold/30 bg-gold/[0.08] text-clay",
  info: "border-line bg-canvas text-ink/70",
};

export default function Copilot() {
  const [state, setState] = useState({ loading: true, data: null, error: null });

  const run = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const response = await api.functions.invoke("cashflowNarrative", {});
      setState({ loading: false, data: response?.data || null, error: null });
    } catch (error) {
      const message = error?.response?.data?.error || error?.message || "We could not build a forecast right now.";
      setState({ loading: false, data: null, error: message });
    }
  }, []);

  useEffect(() => {
    run();
  }, [run]);

  const forecast = state.data?.forecast;

  return (
    <div className="space-y-4">
      <header className="flex items-start justify-between gap-3 px-1">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Predictive co-pilot</h1>
          <p className="mt-1 text-[13px] leading-relaxed text-ink/55">
            It reads your recurring costs — taxi money, electricity, data — and warns you before the month runs out.
          </p>
        </div>
        <Button variant="outline" size="icon" className="shrink-0 rounded-full" onClick={run} disabled={state.loading}>
          <RefreshCw className={`h-4 w-4 ${state.loading ? "animate-spin" : ""}`} />
        </Button>
      </header>

      {state.loading && <LoadingBlock label="Working out your runway" rows={2} />}

      {!state.loading && state.error && (
        <div className="rounded-3xl border border-clay/25 bg-clay/[0.06] px-4 py-4">
          <p className="flex items-center gap-2 text-[13px] font-semibold text-clay">
            <TriangleAlert className="h-4 w-4" /> {state.error}
          </p>
        </div>
      )}

      {!state.loading && forecast && (
        <>
          <NarrativeCard narrative={state.data?.narrative} forecast={forecast} />

          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-3xl border border-line/70 bg-white px-4 py-3.5">
              <p className="text-[10px] uppercase tracking-[0.14em] text-ink/40">Days to payday</p>
              <p className="tnum mt-1 font-display text-lg font-bold text-ink">{forecast.days_to_payday}</p>
              <p className="mt-0.5 text-[11px] text-ink/45">{forecast.next_payday_label}</p>
            </div>
            <div className="rounded-3xl border border-line/70 bg-white px-4 py-3.5">
              <p className="text-[10px] uppercase tracking-[0.14em] text-ink/40">Safe to spend a day</p>
              <p className="tnum mt-1 font-display text-lg font-bold text-protea">
                {formatRand(forecast.safe_to_spend_per_day)}
              </p>
              <p className="mt-0.5 text-[11px] text-ink/45">while still covering fixed costs</p>
            </div>
          </div>

          <Panel
            title="Balance to payday"
            caption={`Projected to land near ${formatRand(forecast.projected_end_balance)} on ${forecast.next_payday_label}.`}
          >
            <ForecastChart daily={forecast.daily} />
            <div className="mt-3 flex items-center gap-4 text-[11px] text-ink/50">
              <span className="tnum">Everyday spend {formatRand(forecast.daily_burn, { cents: true })}/day</span>
              <span className="tnum">Fixed payments {formatRand(forecast.committed_total)}</span>
            </div>
          </Panel>

          <Panel title="Recurring costs it picked up" caption="Read from your own transaction feed.">
            <ul className="divide-y divide-line/60">
              {forecast.committed.map((item, index) => (
                <li key={`${item.description}-${index}`} className="flex items-center justify-between py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-ink">{item.description}</p>
                    <p className="mt-0.5 text-[11px] text-ink/45">Due {item.label}</p>
                  </div>
                  <p className="tnum shrink-0 text-[13px] font-semibold text-ink">{formatRand(item.amount)}</p>
                </li>
              ))}
              {!forecast.committed.length && (
                <li className="py-3 text-[12px] text-ink/50">No recurring costs found yet.</li>
              )}
            </ul>
          </Panel>

          <Panel title="What to watch" caption="Warnings ranked by how soon they bite.">
            <div className="space-y-2.5">
              {forecast.warnings.map((warning, index) => (
                <div
                  key={`${warning.title}-${index}`}
                  className={`rounded-2xl border px-4 py-3 ${LEVEL_STYLES[warning.level] || LEVEL_STYLES.info}`}
                >
                  <p className="text-[13px] font-semibold">{warning.title}</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed opacity-80">{warning.detail}</p>
                </div>
              ))}
            </div>
          </Panel>
        </>
      )}
    </div>
  );
}