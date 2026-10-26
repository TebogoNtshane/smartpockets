// Plain-English cashflow coaching, generated locally from the forecast.
// This runs offline with no API key. To use a real AI model later, call it from a small server, never from the browser.

const rand = (value) => `R${`${Math.round(Number(value || 0))}`.replace(/\B(?=(\d{3})+(?!\d))/g, " ")}`;

export function buildNarrative(summary) {
  const days = summary.days_to_payday;
  const dayWord = `${days} day${days === 1 ? "" : "s"}`;
  const shortfall = summary.shortfall;
  const fixed = summary.fixed_payments || [];
  const biggest = [...fixed].sort((a, b) => b.amount - a.amount)[0];

  if (shortfall) {
    const headline = "You may run short before payday";
    const explanation =
      `You have ${rand(summary.money_available_now)} now and ${dayWord} until payday on ${summary.next_payday}. ` +
      `Fixed payments of ${rand(summary.fixed_payments_due)} plus everyday spending could leave you about ` +
      `${rand(shortfall.amount)} short around ${shortfall.around}.`;
    const actions = [
      `Keep everyday spending near ${rand(summary.suggested_daily_spend)} a day until payday.`,
      biggest
        ? `Look at ${biggest.what} (${rand(biggest.amount)} on ${biggest.on}). Can it wait or be split?`
        : "Pause any spending that isn't food, transport or electricity.",
      "Tell your pocket group early if you might pay late, so nobody is surprised.",
    ];
    return { headline, explanation, actions };
  }

  const headline = "You look steady until payday";
  const explanation =
    `You have ${rand(summary.money_available_now)} now and ${dayWord} until payday on ${summary.next_payday}. ` +
    `After ${rand(summary.fixed_payments_due)} of fixed payments and everyday spending, you should land near ` +
    `${rand(summary.projected_balance_on_payday)}.`;
  const actions = [
    `Aim to spend about ${rand(summary.suggested_daily_spend)} a day or less.`,
    "Tuck any spare change into your emergency bucket with roundups.",
    biggest
      ? `Set aside money now for ${biggest.what} on ${biggest.on}.`
      : "Check your recurring payments so nothing catches you off guard.",
  ];
  return { headline, explanation, actions };
}
