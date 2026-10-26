import { api } from "@/api/client";
import { addDays, isoDate } from "@/lib/format";

const SAMPLE_MEMBERS = [
  { email: "nomsa@smartpockets.sample", name: "Nomsa D.", onTime: 4, missed: 0 },
  { email: "sipho@smartpockets.sample", name: "Sipho M.", onTime: 3, missed: 1 },
  { email: "thandi@smartpockets.sample", name: "Gogo Thandi", onTime: 4, missed: 0 },
];

const RECURRING = [
  { description: "Weekly taxi bundle", merchant: "Taxi rank", amount: 345, category: "transport", everyDays: 7, daysAgo: 2 },
  { description: "Eskom prepaid electricity", merchant: "Eskom", amount: 650, category: "utilities", daysAgo: 20 },
  { description: "Vodacom data bundle", merchant: "Vodacom", amount: 249, category: "airtime", daysAgo: 24 },
  { description: "Monthly grocery shop", merchant: "Shoprite", amount: 1250, category: "groceries", daysAgo: 22 },
  { description: "Showmax subscription", merchant: "Showmax", amount: 99, category: "other", daysAgo: 27 },
  { description: "Funeral cover", merchant: "Debit order", amount: 120, category: "other", daysAgo: 19 },
];

const ONCE_OFF = [
  { description: "Kota King takeaway", merchant: "Kota King", amount: 45, category: "food", daysAgo: 3 },
  { description: "Checkers basket", merchant: "Checkers", amount: 187.4, category: "groceries", daysAgo: 5 },
  { description: "Airtime top-up", merchant: "Vodacom", amount: 29, category: "airtime", daysAgo: 6 },
  { description: "Petrol (GoGo)", merchant: "Petrol station", amount: 250, category: "transport", daysAgo: 8 },
  { description: "Clicks pharmacy", merchant: "Clicks", amount: 134.9, category: "other", daysAgo: 11 },
  { description: "SuperSpar bread and milk", merchant: "SuperSpar", amount: 62.5, category: "groceries", daysAgo: 13 },
  { description: "Chicken Licken", merchant: "Chicken Licken", amount: 89.9, category: "food", daysAgo: 16 },
  { description: "Taxi fare (cash)", merchant: "Taxi rank", amount: 69, category: "transport", daysAgo: 18 },
  { description: "Spar weekly shop", merchant: "Spar", amount: 213.7, category: "groceries", daysAgo: 21 },
  { description: "Airtime top-up", merchant: "MTN", amount: 55, category: "airtime", daysAgo: 24 },
  { description: "Takealot delivery", merchant: "Takealot", amount: 319, category: "other", daysAgo: 27 },
];

const GOALS = [
  { name: "Emergency Fund", category: "emergency", target_amount: 15000, saved_amount: 2450, allocation_percent: 40, colour: "protea", priority: 1 },
  { name: "Back-to-School", category: "school", target_amount: 6000, saved_amount: 1180, allocation_percent: 30, colour: "gold", priority: 2 },
  { name: "Investment/Growth", category: "investment", target_amount: 25000, saved_amount: 3100, allocation_percent: 30, colour: "lagoon", priority: 3 },
];

const POCKETS = [
  {
    pocket: {
      name: "Family Stokvel",
      purpose: "December groceries and school shoes for the family",
      emoji: "🤝",
      cadence: "monthly",
      contribution_amount: 500,
      target_amount: 12000,
      join_code: "FAM500",
      payout_date: "2026-12-15",
      status: "active",
    },
    members: SAMPLE_MEMBERS,
    rounds: [
      { daysAgo: 115, lateFor: null },
      { daysAgo: 85, lateFor: null },
      { daysAgo: 55, lateFor: null },
      { daysAgo: 25, lateFor: "sipho@smartpockets.sample" },
    ],
    myRounds: 4,
    chat: [
      { from: "Nomsa D.", body: "Paid my R500 this morning. Two rounds left before the December payout 🤝" },
      { from: "Sipho M.", body: "Sorry about last month — I've set a reminder for payday now." },
      { from: "Gogo Thandi", body: "Can we keep the target at R12 000? The shoes are cheaper at Bara in November." },
    ],
  },
  {
    pocket: {
      name: "Ubuntu Grocery Club",
      purpose: "Monthly bulk groceries split between three households",
      emoji: "🛒",
      cadence: "weekly",
      contribution_amount: 150,
      target_amount: 2400,
      join_code: "UBU150",
      payout_date: "2026-11-28",
      status: "active",
    },
    members: SAMPLE_MEMBERS.slice(0, 2),
    rounds: [{ daysAgo: 21, lateFor: null }, { daysAgo: 14, lateFor: null }, { daysAgo: 7, lateFor: null }],
    myRounds: 3,
    chat: [
      { from: "Nomsa D.", body: "Bulk maize and oil at Makro this week — R150 each covers it." },
      { from: "Sipho M.", body: "I'm in. Sending mine Friday when the grant lands." },
    ],
  },
];

async function seedPocket(user, today, config) {
  const created = await api.entities.Pocket.create(config.pocket);
  const joined = isoDate(addDays(today, -130));

  const members = [
    {
      pocket_id: created.id,
      user_email: user.email,
      user_name: user.full_name || "You",
      role: "admin",
      is_sample: false,
      on_time_payments: config.myRounds,
      missed_payments: 0,
      joined_date: joined,
    },
    ...config.members.map((member, index) => ({
      pocket_id: created.id,
      user_email: member.email,
      user_name: member.name,
      role: "member",
      is_sample: true,
      on_time_payments: member.onTime,
      missed_payments: member.missed,
      joined_date: isoDate(addDays(today, -120 + index)),
    })),
  ];

  await api.entities.PocketMember.bulkCreate(members);

  const amount = Number(config.pocket.contribution_amount || 0);
  const contributions = [];

  config.rounds.forEach((round) => {
    const date = isoDate(addDays(today, -round.daysAgo));
    if (config.myRounds > 0 || round.lateFor !== "me") {
      contributions.push({
        pocket_id: created.id,
        user_email: user.email,
        user_name: user.full_name || "You",
        amount,
        contribution_date: date,
        status: round.lateFor === user.email ? "late" : "on_time",
      });
    }
    config.members.forEach((member) => {
      contributions.push({
        pocket_id: created.id,
        user_email: member.email,
        user_name: member.name,
        amount,
        contribution_date: date,
        status: round.lateFor === member.email ? "late" : "on_time",
      });
    });
  });

  await api.entities.Contribution.bulkCreate(contributions);

  await api.entities.PocketMessage.bulkCreate(
    (config.chat || []).map((message) => ({
      pocket_id: created.id,
      user_name: message.from,
      body: message.body,
    })),
  );
}

export async function ensureStarterData(user) {
  const existing = await api.entities.SavingsProfile.filter({ created_by_id: user.id });
  if (existing && existing.length) return existing[0];

  const today = new Date();
  const payday = addDays(today, 12);

  await api.entities.SavingsProfile.create({
    roundup_enabled: true,
    roundup_multiplier: 1,
    roundup_total: 0,
    auto_allocate_enabled: true,
    income_amount: 12500,
    income_frequency: "monthly",
    weekly_deposit: 50,
    monthly_deposit: 200,
    available_balance: 2800,
    monthly_expenses: 8400,
    payday_day: payday.getDate(),
    risk_profile: "balanced",
  });

  await api.entities.Transaction.bulkCreate([
    ...RECURRING.map((item) => ({
      description: item.description,
      merchant: item.merchant,
      amount: item.amount,
      category: item.category,
      transaction_date: isoDate(addDays(today, -item.daysAgo)),
      is_recurring: true,
      recurrence: item.everyDays ? "weekly" : "monthly",
      roundup_amount: 0,
      roundup_applied: false,
    })),
    ...ONCE_OFF.map((item) => ({
      description: item.description,
      merchant: item.merchant,
      amount: item.amount,
      category: item.category,
      transaction_date: isoDate(addDays(today, -item.daysAgo)),
      is_recurring: false,
      recurrence: "none",
      roundup_amount: 0,
      roundup_applied: false,
    })),
  ]);

  await api.entities.SavingsGoal.bulkCreate(GOALS);

  for (const config of POCKETS) {
    await seedPocket(user, today, config);
  }

  const created = await api.entities.SavingsProfile.filter({ created_by_id: user.id });
  return created[0];
}

export function makeJoinCode(name) {
  const prefix = String(name || "POCKET").replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase() || "PKT";
  const suffix = Math.floor(100 + Math.random() * 900);
  return `${prefix}${suffix}`;
}