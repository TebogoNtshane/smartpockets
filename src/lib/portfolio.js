const ASSET_CLASSES = [
  { key: 'sa_equity', name: 'SA Equity ETF', detail: 'JSE Top 40 tracker', expected_return: 0.115, volatility: 0.17, colour: '#0E8F63' },
  { key: 'sa_bonds', name: 'SA Government Bonds', detail: 'R2035 / ALBI tracker', expected_return: 0.096, volatility: 0.085, colour: '#2C6E9B' },
  { key: 'money_market', name: 'Money Market', detail: 'Income fund, same-day access', expected_return: 0.074, volatility: 0.015, colour: '#7C8A3F' },
  { key: 'global_equity', name: 'Global Diversified Equity', detail: 'MSCI World feeder', expected_return: 0.108, volatility: 0.15, colour: '#5B4B8A' },
  { key: 'global_tech', name: 'Global Tech', detail: 'Nasdaq 100 feeder', expected_return: 0.132, volatility: 0.22, colour: '#D9A21B' },
  { key: 'sa_property', name: 'SA Listed Property', detail: 'REIT income portfolio', expected_return: 0.105, volatility: 0.14, colour: '#B4622F' },
];

const RISK_PROFILES = {
  conservative: {
    label: 'Conservative',
    lambda: 3.4,
    note: 'Protect the money first, grow it slowly.',
    bounds: { money_market: [0.25, 0.6], sa_bonds: [0.15, 0.45], sa_equity: [0.02, 0.2], global_equity: [0.02, 0.2], global_tech: [0, 0.05], sa_property: [0, 0.1] },
  },
  balanced: {
    label: 'Balanced',
    lambda: 1.7,
    note: 'Steady growth with a cushion underneath.',
    bounds: { money_market: [0.1, 0.4], sa_bonds: [0.1, 0.35], sa_equity: [0.1, 0.35], global_equity: [0.08, 0.3], global_tech: [0, 0.15], sa_property: [0, 0.15] },
  },
  growth: {
    label: 'Growth',
    lambda: 0.9,
    note: 'Better long-term growth, bumps included.',
    bounds: { money_market: [0.03, 0.2], sa_bonds: [0.03, 0.2], sa_equity: [0.15, 0.45], global_equity: [0.12, 0.4], global_tech: [0.05, 0.25], sa_property: [0, 0.2] },
  },
  aggressive: {
    label: 'Aggressive',
    lambda: 0.4,
    note: 'Maximum long-term growth, swings included.',
    bounds: { money_market: [0, 0.1], sa_bonds: [0, 0.1], sa_equity: [0.2, 0.5], global_equity: [0.15, 0.45], global_tech: [0.1, 0.35], sa_property: [0, 0.2] },
  },
};

const RISK_FREE_RATE = 0.072;
const INFLATION = 0.045;

function optimiseWeights(profile) {
  const weights = {};
  ASSET_CLASSES.forEach((asset) => {
    weights[asset.key] = profile.bounds[asset.key][0];
  });
  let total = ASSET_CLASSES.reduce((sum, asset) => sum + weights[asset.key], 0);

  const STEP = 0.005;
  let guard = 0;
  while (total < 1 - 1e-9 && guard < 4000) {
    let best = null;
    let bestScore = -Infinity;
    ASSET_CLASSES.forEach((asset) => {
      const upper = profile.bounds[asset.key][1];
      if (weights[asset.key] >= upper - 1e-9) return;
      const marginal = asset.expected_return - 2 * profile.lambda * asset.volatility ** 2 * weights[asset.key];
      if (marginal > bestScore) {
        bestScore = marginal;
        best = asset;
      }
    });
    if (!best) break;
    const add = Math.min(STEP, profile.bounds[best.key][1] - weights[best.key], 1 - total);
    weights[best.key] += add;
    total += add;
    guard += 1;
  }

  const sum = ASSET_CLASSES.reduce((acc, asset) => acc + weights[asset.key], 0) || 1;
  const rounded = ASSET_CLASSES.map((asset) => ({
    ...asset,
    weight: Math.round((weights[asset.key] / sum) * 1000) / 1000,
  }));
  const drift = 1 - rounded.reduce((acc, asset) => acc + asset.weight, 0);
  const largest = rounded.reduce((max, asset) => (asset.weight > max.weight ? asset : max), rounded[0]);
  largest.weight = Math.round((largest.weight + drift) * 1000) / 1000;
  return rounded;
}

function buildProjection(amount, horizon, expected, volatility) {
  const months = Math.round(horizon * 12);
  const stepMonths = horizon <= 5 ? 3 : Math.max(3, Math.round(months / 12));
  const lowAnnual = Math.max(expected - volatility, -0.1);
  const highAnnual = expected + volatility;
  const points = [];

  for (let m = 0; m <= months; m += stepMonths) {
    points.push(point(amount, expected, lowAnnual, highAnnual, m));
  }
  if (points[points.length - 1].month !== months) {
    points.push(point(amount, expected, lowAnnual, highAnnual, months));
  }
  return points;
}

function point(amount, expected, lowAnnual, highAnnual, month) {
  return {
    month,
    label: month === 0 ? 'Now' : `${Number((month / 12).toFixed(1))}y`,
    value: Math.round(amount * (1 + expected / 12) ** month),
    low: Math.round(amount * (1 + lowAnnual / 12) ** month),
    high: Math.round(amount * (1 + highAnnual / 12) ** month),
  };
}

function formatRand(value) {
  const rounded = Math.round(Number(value || 0));
  return `R${`${rounded}`.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}`;
}

export function runOptimizer(body) {
  const amount = Number(body && body.amount);
  const horizon = Number(body && body.horizon_years);
  const riskKey = RISK_PROFILES[body && body.risk_profile] ? body.risk_profile : 'balanced';

  if (!Number.isFinite(amount) || amount < 100 || amount > 50000000) {
    throw new Error('Enter an amount between R100 and R50 000 000.');
  }
  if (!Number.isFinite(horizon) || horizon < 1 || horizon > 40) {
    throw new Error('Choose a time horizon between 1 and 40 years.');
  }

  const profile = RISK_PROFILES[riskKey];
  const weights = optimiseWeights(profile);
  const expected = weights.reduce((sum, a) => sum + a.weight * a.expected_return, 0);
  const variance = weights.reduce((sum, a) => sum + a.weight ** 2 * a.volatility ** 2, 0);
  const volatility = Math.sqrt(variance);
  const projected = buildProjection(amount, horizon, expected, volatility);
  const finalValue = projected[projected.length - 1].value;
  const finalReal = Math.round(finalValue / (1 + INFLATION) ** horizon);

  return {
    profile: { key: riskKey, label: profile.label, note: profile.note },
    amount,
    horizon_years: horizon,
    weights: weights.map((a) => ({
      key: a.key,
      name: a.name,
      detail: a.detail,
      colour: a.colour,
      weight: a.weight,
      amount: Math.round(amount * a.weight),
    })),
    expected_return: Math.round(expected * 10000) / 10000,
    volatility: Math.round(volatility * 10000) / 10000,
    sharpe: volatility > 0 ? Math.round(((expected - RISK_FREE_RATE) / volatility) * 100) / 100 : 0,
    projected,
    final_value: finalValue,
    final_value_real: finalReal,
    total_gain: finalValue - amount,
    summary: `A ${profile.label.toLowerCase()} mix over ${horizon} year${horizon === 1 ? '' : 's'} grows ${formatRand(amount)} to about ${formatRand(finalValue)} — roughly ${formatRand(finalReal)} in today's money.`,
  };
}
