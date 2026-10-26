const DAY_MS = 86400000;

export function startOfDay(value) {
  const d = new Date(value);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(value, days) {
  const d = new Date(value);
  d.setDate(d.getDate() + days);
  return d;
}

export function isoDate(value) {
  const d = new Date(value);
  const month = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

export function shortLabel(value) {
  const d = new Date(value);
  return d.toLocaleDateString("en-ZA", { day: "numeric", month: "short" });
}

function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function round2(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

export function nextPayday(paydayDay, from) {
  const anchor = startOfDay(from || new Date());
  const day = Math.min(Math.max(Number(paydayDay) || 25, 1), 28);
  const thisMonth = new Date(anchor.getFullYear(), anchor.getMonth(), Math.min(day, daysInMonth(anchor.getFullYear(), anchor.getMonth())));
  if (thisMonth.getTime() >= anchor.getTime()) return thisMonth;
  const nextMonth = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 1);
  return new Date(nextMonth.getFullYear(), nextMonth.getMonth(), Math.min(day, daysInMonth(nextMonth.getFullYear(), nextMonth.getMonth())));
}

export function recurringDue(transactions, payday, today) {
  const anchor = startOfDay(today || new Date());
  const end = startOfDay(payday);
  const out = [];

  (transactions || [])
    .filter((t) => t && t.is_recurring && t.recurrence && t.recurrence !== "none")
    .forEach((t) => {
      const start = startOfDay(t.transaction_date || anchor);
      const amount = Number(t.amount || 0);
      if (!amount) return;
      if (t.recurrence === "weekly") {
        const cursor = new Date(start);
        let guard = 0;
        while (cursor.getTime() <= end.getTime() && guard < 400) {
          if (cursor.getTime() > anchor.getTime()) {
            out.push({ description: t.description, amount, date: isoDate(cursor), label: shortLabel(cursor) });
          }
          cursor.setDate(cursor.getDate() + 7);
          guard += 1;
        }
        return;
      }
      const dayOfMonth = Math.min(start.getDate(), 28);
      [0, 1].forEach((offset) => {
        const d = new Date(anchor.getFullYear(), anchor.getMonth() + offset, dayOfMonth);
        if (d.getTime() > anchor.getTime() && d.getTime() <= end.getTime()) {
          out.push({ description: t.description, amount, date: isoDate(d), label: shortLabel(d) });
        }
      });
    });

  return out.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

function dailyBurn(transactions, today, profile) {
  const cutoff = addDays(today, -30);
  const recent = (transactions || []).filter(
    (t) => t && !t.is_recurring && t.transaction_date && new Date(t.transaction_date).getTime() >= cutoff.getTime(),
  );
  const spent = recent.reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const fallback = (Number(profile?.monthly_expenses || 2500) * 0.35) / 30;
  const burn = recent.length ? spent / 30 : fallback;
  return round2(Math.min(burn, Math.max(fallback * 1.8, 150)));
}

export function buildForecast(transactions, profile, now) {
  const today = startOfDay(now || new Date());
  const payday = nextPayday(profile?.payday_day, today);
  const days = Math.max(1, Math.round((payday.getTime() - today.getTime()) / DAY_MS));
  const committed = recurringDue(transactions, payday, today);
  const committedTotal = round2(committed.reduce((sum, c) => sum + c.amount, 0));
  const burn = dailyBurn(transactions, today, profile);
  const start = round2(Number(profile?.available_balance || 0));

  const daily = [{ date: isoDate(today), label: "Today", balance: start, debits: 0 }];
  let balance = start;
  let lowest = start;
  let shortfallDate = null;

  for (let i = 1; i <= days; i += 1) {
    const day = addDays(today, i);
    const key = isoDate(day);
    const debits = round2(committed.filter((c) => c.date === key).reduce((sum, c) => sum + c.amount, 0) + burn);
    balance = round2(balance - debits);
    if (balance < lowest) lowest = balance;
    if (balance < 0 && !shortfallDate) shortfallDate = key;
    daily.push({ date: key, label: shortLabel(day), balance, debits });
  }

  const buffer = Math.min(300, start * 0.1);
  const safeToSpend = Math.max(0, Math.round((start - committedTotal - buffer) / days / 5) * 5);
  const shortfallAmount = lowest < 0 ? round2(Math.abs(lowest)) : 0;

  const warnings = [];
  if (shortfallAmount > 0) {
    warnings.push({
      level: "critical",
      title: "You may run short before payday",
      detail: `About R${Math.round(shortfallAmount)} short around ${shortLabel(shortfallDate)} if nothing changes.`,
    });
  }
  const bigDebits = committed.filter((c) => c.amount >= 400).slice(0, 4);
  bigDebits.forEach((c) => {
    warnings.push({
      level: "watch",
      title: `${c.description} on ${c.label}`,
      detail: `R${Math.round(c.amount)} is due before your next payday.`,
    });
  });
  if (committedTotal > start && shortfallAmount === 0) {
    warnings.push({
      level: "watch",
      title: "Most of your balance is already committed",
      detail: `R${Math.round(committedTotal)} of fixed payments are still coming this period.`,
    });
  }
  if (profile?.roundup_enabled === false) {
    warnings.push({
      level: "info",
      title: "Auto-roundups are switched off",
      detail: "Tucking away spare change each week builds a buffer without you noticing.",
    });
  }
  if (shortfallAmount === 0) {
    warnings.push({
      level: "info",
      title: "You look steady until payday",
      detail: `Your balance should land near R${Math.round(balance)} on ${shortLabel(payday)}.`,
    });
  }

  return {
    today: isoDate(today),
    next_payday: isoDate(payday),
    next_payday_label: shortLabel(payday),
    days_to_payday: days,
    starting_balance: start,
    daily_burn: burn,
    daily,
    committed,
    committed_total: committedTotal,
    projected_end_balance: round2(balance),
    lowest_balance: round2(lowest),
    shortfall: {
      will_run_short: shortfallAmount > 0,
      amount: shortfallAmount,
      date: shortfallDate,
      label: shortfallDate ? shortLabel(shortfallDate) : null,
    },
    safe_to_spend_per_day: safeToSpend,
    warnings,
  };
}

export function forecastSummary(forecast, profile) {
  return {
    days_to_payday: forecast.days_to_payday,
    next_payday: forecast.next_payday_label,
    money_available_now: forecast.starting_balance,
    fixed_payments_due: forecast.committed_total,
    fixed_payments: forecast.committed.map((c) => ({ what: c.description, amount: c.amount, on: c.label })),
    daily_everyday_spend: forecast.daily_burn,
    projected_balance_on_payday: forecast.projected_end_balance,
    shortfall: forecast.shortfall.will_run_short
      ? { amount: forecast.shortfall.amount, around: forecast.shortfall.label }
      : null,
    suggested_daily_spend: forecast.safe_to_spend_per_day,
    monthly_income: Number(profile?.income_amount || 0),
  };
}