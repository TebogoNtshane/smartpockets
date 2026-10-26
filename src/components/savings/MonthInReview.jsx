import { useEffect, useState } from "react";
import { api } from "@/api/client";
import Panel from "@/components/blocks/Panel";
import EmptyState from "@/components/blocks/EmptyState";
import ProgressBar from "@/components/blocks/ProgressBar";
import ReviewRow from "@/components/savings/ReviewRow";
import { formatRand } from "@/lib/format";
import { monthWindow, sumInMonth, roundRand } from "@/lib/monthReview";

const SOURCES = [
  {
    key: "roundups",
    label: "Spare change rounded up",
    tone: "protea",
    detail: (count) => `${count} purchase${count === 1 ? "" : "s"} rounded up to the next R10`,
  },
  {
    key: "splits",
    label: "Payday splits",
    tone: "lagoon",
    detail: (count) => `${count} income split${count === 1 ? "" : "s"} into your buckets`,
  },
  {
    key: "stokvel",
    label: "Stokvel contributions",
    tone: "gold",
    detail: (count) => `${count} community payment${count === 1 ? "" : "s"} paid`,
  },
];

export default function MonthInReview({ user, signal }) {
  const [state, setState] = useState({ loading: true, month: null, prior: null, current: null, previous: null });

  useEffect(() => {
    if (!user?.id) return undefined;
    let active = true;
    const month = monthWindow(0);
    const prior = monthWindow(-1);

    const load = async () => {
      const [transactionPage, eventPage, contributionPage] = await Promise.all([
        api.entities.Transaction.filter(
          { created_by_id: user.id, roundup_applied: true, transaction_date: { $gte: prior.start, $lt: month.end } },
          { limit: 300 },
        ),
        api.entities.SavingsEvent.filter(
          { created_by_id: user.id, kind: "split", event_date: { $gte: prior.start, $lt: month.end } },
          { limit: 100 },
        ),
        api.entities.Contribution.filter(
          { user_email: user.email, contribution_date: { $gte: prior.start, $lt: month.end } },
          { limit: 200 },
        ),
      ]);

      const transactions = transactionPage?.items || [];
      const events = eventPage?.items || [];
      const contributions = contributionPage?.items || [];

      const summarise = (window) => {
        const roundups = sumInMonth(transactions, { field: "roundup_amount", dateField: "transaction_date", month: window });
        const splits = sumInMonth(events, { field: "amount", dateField: "event_date", month: window });
        const stokvel = sumInMonth(contributions, { field: "amount", dateField: "contribution_date", month: window });
        return {
          roundups,
          splits,
          stokvel,
          total: roundRand(roundups.amount + splits.amount + stokvel.amount),
          moves: roundups.count + splits.count + stokvel.count,
        };
      };

      if (active) setState({ loading: false, month, prior, current: summarise(month), previous: summarise(prior) });
    };

    load();
    return () => {
      active = false;
    };
  }, [user?.id, user?.email, signal]);

  if (state.loading) {
    return (
      <Panel title="Month in review" caption="Adding up your roundups, splits and stokvel payments.">
        <p className="py-4 text-center text-[12px] text-ink/50">Adding it up…</p>
      </Panel>
    );
  }

  const { month, prior, current, previous } = state;
  const peak = Math.max(current.total, previous.total, 1);
  const delta = roundRand(current.total - previous.total);

  const comparison =
    previous.total <= 0
      ? `${current.moves} saving move${current.moves === 1 ? "" : "s"} this month — the first on record.`
      : delta > 0
        ? `${formatRand(delta, { cents: true })} more than ${prior.label}.`
        : delta < 0
          ? `${formatRand(Math.abs(delta), { cents: true })} less than ${prior.label}.`
          : `Level with ${prior.label}.`;

  const bars = [
    { label: month.label, value: current.total, tone: "protea" },
    { label: prior.label, value: previous.total, tone: "lagoon" },
  ];

  return (
    <Panel title="Month in review" caption={`What your money put away by itself in ${month.label}.`}>
      {current.total <= 0 ? (
        <EmptyState
          title={`Nothing banked in ${month.label} yet`}
          body="Tuck away your spare change, split a payday or pay a stokvel round and it all adds up here."
        />
      ) : (
        <>
          <div className="rounded-2xl bg-canvas px-4 py-3.5">
            <p className="text-[10px] uppercase tracking-[0.16em] text-ink/45">Saved in {month.label}</p>
            <p className="tnum mt-1.5 font-display text-[28px] font-bold leading-none tracking-tight text-ink">
              {formatRand(current.total, { cents: true })}
            </p>
            {comparison && <p className="mt-2 text-[11px] text-ink/55">{comparison}</p>}
          </div>

          <ul className="mt-2 divide-y divide-line/60">
            {SOURCES.map((source) => {
              const bucket = current[source.key];
              return (
                <ReviewRow
                  key={source.key}
                  label={source.label}
                  detail={bucket.count ? source.detail(bucket.count) : `Nothing in ${month.label} yet`}
                  amount={bucket.amount}
                  share={bucket.amount / current.total}
                  tone={source.tone}
                />
              );
            })}
          </ul>

          <div className="mt-4 space-y-2.5">
            {bars.map((bar) => (
              <div key={bar.label}>
                <div className="flex items-center justify-between text-[11px] text-ink/55">
                  <span>{bar.label}</span>
                  <span className="tnum font-medium text-ink">{formatRand(bar.value, { cents: true })}</span>
                </div>
                <ProgressBar className="mt-1" value={bar.value} target={peak} tone={bar.tone} />
              </div>
            ))}
          </div>
        </>
      )}
    </Panel>
  );
}