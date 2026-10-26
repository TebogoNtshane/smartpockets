// Local backend for SmartPockets.
//
// Everything the app used to ask the hosted backend for now lives in this one
// file and is stored in the browser (localStorage). To move to a real backend
// later (Supabase, Firebase, your own API), keep the same exported `api` shape
// and swap the internals — no page needs to change.

import { buildForecast, forecastSummary } from "../lib/cashflow.js";
import { runOptimizer } from "../lib/portfolio.js";
import { buildNarrative } from "../lib/narrative.js";
import { STARTER_LESSONS } from "../lib/lessons.js";

const PREFIX = "smartpockets:";

/* ------------------------------ storage ------------------------------ */

const memory = new Map();
const hasStorage = () => {
  try {
    return typeof localStorage !== "undefined";
  } catch {
    return false;
  }
};

function read(key, fallback) {
  try {
    const raw = hasStorage() ? localStorage.getItem(PREFIX + key) : memory.get(PREFIX + key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  const raw = JSON.stringify(value);
  if (hasStorage()) localStorage.setItem(PREFIX + key, raw);
  else memory.set(PREFIX + key, raw);
}

function remove(key) {
  if (hasStorage()) localStorage.removeItem(PREFIX + key);
  else memory.delete(PREFIX + key);
}

// crypto.randomUUID only exists on secure origins (https / localhost), so a
// phone opening the dev server over the LAN needs a fallback.
function makeId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}${Math.random().toString(36).slice(2, 6)}`;
}

function apiError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  error.response = { status, data: { error: message } };
  return error;
}

/* ------------------------------- auth -------------------------------- */

async function hashPassword(password, salt) {
  const text = `${salt}:${password}`;
  try {
    if (typeof crypto !== "undefined" && crypto.subtle) {
      const bytes = new TextEncoder().encode(text);
      const digest = await crypto.subtle.digest("SHA-256", bytes);
      return Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    }
  } catch {
    // fall through to the simple hash
  }
  let h = 5381;
  for (let i = 0; i < text.length; i += 1) h = ((h << 5) + h + text.charCodeAt(i)) | 0;
  return `fallback-${h >>> 0}`;
}

const publicUser = ({ salt, password_hash, ...rest }) => rest;
const normaliseEmail = (email) => String(email || "").trim().toLowerCase();

function currentUserRecord() {
  const id = read("session", null);
  if (!id) return null;
  return read("users", []).find((u) => u.id === id) || null;
}

function requireUser() {
  const user = currentUserRecord();
  if (!user) throw apiError("You need to log in first.", 401);
  return publicUser(user);
}

const auth = {
  async me() {
    return requireUser();
  },

  async isAuthenticated() {
    return Boolean(currentUserRecord());
  },

  async register({ email, password, full_name, preferred_language }) {
    const cleanEmail = normaliseEmail(email);
    if (!cleanEmail || !cleanEmail.includes("@")) throw apiError("Enter a valid email address.");
    if (String(password || "").length < 6) throw apiError("Use a password with at least 6 characters.");

    const users = read("users", []);
    if (users.some((u) => u.email === cleanEmail)) throw apiError("An account with that email already exists.", 409);

    const salt = makeId();
    const savedLang = hasStorage() ? localStorage.getItem(PREFIX + "lang") : null;

    const user = {
      id: makeId(),
      email: cleanEmail,
      full_name: String(full_name || "").trim() || cleanEmail.split("@")[0],
      role: users.length === 0 ? "admin" : "user",
      preferred_language: preferred_language || savedLang || "en",
      salt,
      password_hash: await hashPassword(password, salt),
      created_date: new Date().toISOString(),
    };
    write("users", [...users, user]);
    write("session", user.id);
    if (hasStorage()) {
      localStorage.setItem(PREFIX + "lang", user.preferred_language);
    }
    return publicUser(user);
  },

  async loginViaEmailPassword(email, password) {
    const cleanEmail = normaliseEmail(email);
    const user = read("users", []).find((u) => u.email === cleanEmail);
    if (!user || (await hashPassword(password, user.salt)) !== user.password_hash) {
      throw apiError("Invalid email or password.", 401);
    }
    write("session", user.id);
    // restore language on login
    if (hasStorage() && user.preferred_language) {
      localStorage.setItem(PREFIX + "lang", user.preferred_language);
    }
    return publicUser(user);
  },

  // There is no email server in local mode, so password reset happens on the
  // device: you give the account email and a new password.
  async resetPassword({ email, newPassword }) {
    const cleanEmail = normaliseEmail(email);
    if (String(newPassword || "").length < 6) throw apiError("Use a password with at least 6 characters.");
    const users = read("users", []);
    const index = users.findIndex((u) => u.email === cleanEmail);
    if (index === -1) throw apiError("We couldn't find an account with that email on this device.", 404);
    const salt = makeId();
    users[index] = { ...users[index], salt, password_hash: await hashPassword(newPassword, salt) };
    write("users", users);
    return { success: true };
  },

  logout(redirectTo) {
    remove("session");
    if (typeof window !== "undefined") window.location.href = redirectTo || "/login";
  },

  redirectToLogin(returnTo) {
    if (typeof window === "undefined") return;
    const target = returnTo ? `/login?returnTo=${encodeURIComponent(returnTo)}` : "/login";
    window.location.href = target;
  },
};

/* ----------------------------- entities ------------------------------ */

// Defaults copied from the original entity schemas.
const DEFAULTS = {
  Contribution: { status: "on_time" },
  InvestmentPlan: {},
  Lesson: { category: "saving", read_minutes: 2, order: 0 },
  LessonProgress: {},
  Pocket: { cadence: "monthly", status: "active" },
  PocketMember: { role: "member", on_time_payments: 0, missed_payments: 0, is_sample: false },
  PocketMessage: {},
  SavingsEvent: { kind: "split" },
  SavingsGoal: { category: "custom", saved_amount: 0, allocation_percent: 0, colour: "protea", priority: 1 },
  SavingsProfile: {
    roundup_enabled: true,
    roundup_multiplier: 1,
    roundup_total: 0,
    auto_allocate_enabled: true,
    income_frequency: "monthly",
    available_balance: 0,
    payday_day: 25,
    risk_profile: "balanced",
  },
  Transaction: { category: "other", roundup_amount: 0, roundup_applied: false, is_recurring: false, recurrence: "none" },
};

// Entities only their creator can see or change (the old row-level security).
const PRIVATE_ENTITIES = new Set([
  "InvestmentPlan",
  "LessonProgress",
  "SavingsEvent",
  "SavingsGoal",
  "SavingsProfile",
  "Transaction",
]);

function matches(row, query) {
  return Object.entries(query || {}).every(([key, condition]) => {
    const value = row[key];
    if (condition && typeof condition === "object" && !Array.isArray(condition)) {
      return Object.entries(condition).every(([op, arg]) => {
        switch (op) {
          case "$in":
            return Array.isArray(arg) && arg.includes(value);
          case "$nin":
            return Array.isArray(arg) && !arg.includes(value);
          case "$ne":
            return value !== arg;
          case "$gt":
            return value != null && value > arg;
          case "$gte":
            return value != null && value >= arg;
          case "$lt":
            return value != null && value < arg;
          case "$lte":
            return value != null && value <= arg;
          case "$exists":
            return arg ? value !== undefined : value === undefined;
          default:
            return true;
        }
      });
    }
    return value === condition;
  });
}

function sortRows(rows, sort) {
  if (!sort) return rows;
  const desc = sort.startsWith("-");
  const field = desc ? sort.slice(1) : sort;
  return [...rows].sort((a, b) => {
    const x = a[field];
    const y = b[field];
    if (x === y) return 0;
    if (x == null) return 1;
    if (y == null) return -1;
    return (x > y ? 1 : -1) * (desc ? -1 : 1);
  });
}

// filter() results behave as an array *and* expose `.items`, because the pages
// were written to read either shape.
function asList(rows) {
  const list = [...rows];
  Object.defineProperty(list, "items", { value: list, enumerable: false });
  return list;
}

function makeEntity(name) {
  const storeKey = `entity:${name}`;
  const isPrivate = PRIVATE_ENTITIES.has(name);
  const defaults = DEFAULTS[name] || {};

  const all = () => read(storeKey, []);
  const save = (rows) => write(storeKey, rows);

  const visible = () => {
    const rows = all();
    if (!isPrivate) return rows;
    const user = currentUserRecord();
    return user ? rows.filter((row) => row.created_by_id === user.id) : [];
  };

  const build = (data) => {
    const user = currentUserRecord();
    const now = new Date().toISOString();
    return {
      ...defaults,
      ...data,
      id: makeId(),
      created_date: now,
      updated_date: now,
      created_by_id: user ? user.id : null,
      created_by: user ? user.email : null,
    };
  };

  const patchRow = (rows, id, patch) => {
    const index = rows.findIndex((row) => row.id === id);
    if (index === -1) throw apiError(`${name} not found.`, 404);
    const current = rows[index];
    if (isPrivate) {
      const user = currentUserRecord();
      if (!user || current.created_by_id !== user.id) throw apiError("You can't change that record.", 403);
    }
    const { id: _ignoreId, ...fields } = patch;
    rows[index] = { ...current, ...fields, updated_date: new Date().toISOString() };
    return rows[index];
  };

  return {
    async list(sort, limit) {
      const rows = sortRows(visible(), sort);
      return asList(limit ? rows.slice(0, limit) : rows);
    },

    async filter(query = {}, options = {}) {
      const opts = typeof options === "string" ? { sort: options } : options || {};
      const rows = sortRows(visible().filter((row) => matches(row, query)), opts.sort);
      const skipped = opts.skip ? rows.slice(opts.skip) : rows;
      return asList(opts.limit ? skipped.slice(0, opts.limit) : skipped);
    },

    async get(id) {
      const row = visible().find((item) => item.id === id);
      if (!row) throw apiError(`${name} not found.`, 404);
      return row;
    },

    async create(data) {
      const row = build(data);
      save([...all(), row]);
      return row;
    },

    async bulkCreate(items) {
      const rows = (items || []).map(build);
      save([...all(), ...rows]);
      return rows;
    },

    async update(id, patch) {
      const rows = all();
      const updated = patchRow(rows, id, patch);
      save(rows);
      return updated;
    },

    // Accepts [{ id, ...fields }] or [{ id, data: {...} }].
    async bulkUpdate(updates) {
      const rows = all();
      const result = (updates || []).map((item) => patchRow(rows, item.id, item.data || item));
      save(rows);
      return result;
    },

    async delete(id) {
      const rows = all();
      const target = rows.find((row) => row.id === id);
      if (!target) return { success: true };
      if (isPrivate) {
        const user = currentUserRecord();
        if (!user || target.created_by_id !== user.id) throw apiError("You can't delete that record.", 403);
      }
      save(rows.filter((row) => row.id !== id));
      return { success: true };
    },

    // aggregate({ query, groupBy, sum: ["amount"] }) -> { rows: [{ [groupBy], count, sum_amount }] }
    async aggregate({ query = {}, groupBy, sum = [] } = {}) {
      const rows = visible().filter((row) => matches(row, query));
      const groups = new Map();
      rows.forEach((row) => {
        const key = groupBy ? row[groupBy] : "__all__";
        if (!groups.has(key)) {
          const seed = { count: 0 };
          if (groupBy) seed[groupBy] = row[groupBy];
          sum.forEach((field) => {
            seed[`sum_${field}`] = 0;
          });
          groups.set(key, seed);
        }
        const group = groups.get(key);
        group.count += 1;
        sum.forEach((field) => {
          group[`sum_${field}`] += Number(row[field] || 0);
        });
      });
      if (!groups.size && !groupBy) {
        const empty = { count: 0 };
        sum.forEach((field) => {
          empty[`sum_${field}`] = 0;
        });
        return { rows: [empty] };
      }
      return { rows: [...groups.values()] };
    },
  };
}

const ENTITY_NAMES = Object.keys(DEFAULTS);
const entities = Object.fromEntries(ENTITY_NAMES.map((name) => [name, makeEntity(name)]));

// Lessons are shared content, so they're copied in once.
function ensureLessons() {
  if (read("entity:Lesson", []).length) return;
  const now = new Date().toISOString();
  write(
    "entity:Lesson",
    STARTER_LESSONS.map((lesson) => ({
      ...DEFAULTS.Lesson,
      ...lesson,
      id: makeId(),
      created_date: now,
      updated_date: now,
      created_by_id: null,
      created_by: null,
    })),
  );
}
ensureLessons();

/* ----------------------------- functions ----------------------------- */

async function loadForecastInputs() {
  const user = requireUser();
  const profiles = await entities.SavingsProfile.filter({ created_by_id: user.id });
  const profile = profiles[0];
  if (!profile) {
    throw apiError("We need your income details before we can forecast. Set them up first.");
  }
  const transactions = await entities.Transaction.filter(
    { created_by_id: user.id },
    { sort: "-transaction_date", limit: 200 },
  );
  return { profile, transactions: [...transactions] };
}

const FUNCTIONS = {
  async cashflowForecast() {
    const { profile, transactions } = await loadForecastInputs();
    return { forecast: buildForecast(transactions, profile) };
  },

  async cashflowNarrative() {
    const { profile, transactions } = await loadForecastInputs();
    const forecast = buildForecast(transactions, profile);
    const narrative = buildNarrative(forecastSummary(forecast, profile));
    return { forecast, narrative };
  },

  async optimizePortfolio(payload) {
    requireUser();
    try {
      return runOptimizer(payload || {});
    } catch (error) {
      throw apiError(error.message);
    }
  },
};

const functions = {
  async invoke(name, payload) {
    const handler = FUNCTIONS[name];
    if (!handler) throw apiError(`Unknown function: ${name}`, 404);
    const data = await handler(payload);
    return { data };
  },
};

/* ------------------------------ export ------------------------------- */

export const api = { auth, entities, functions };

// Handy for development: run `window.smartpocketsReset()` in the browser
// console to wipe all local data and start fresh.
if (typeof window !== "undefined") {
  window.smartpocketsReset = () => {
    Object.keys(localStorage)
      .filter((key) => key.startsWith(PREFIX))
      .forEach((key) => localStorage.removeItem(key));
    window.location.href = "/login";
  };
}
// --- AI Investor - answers everything, leans finance, speaks 11 langs ---
export async function askInvestorAI(message, history = [], lang = "en", portfolio = null) {
  const GROQ_KEY = "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"

  console.log("GROQ KEY CHECK:", GROQ_KEY ? `Found ${GROQ_KEY.slice(0,10)}...` : "NOT FOUND - .env not loaded")

  if (!GROQ_KEY || GROQ_KEY.includes("paste") || GROQ_KEY.length < 20) {
    throw new Error("VITE_GROQ_KEY missing! Your .env must have VITE_GROQ_KEY=gsk_... and you must restart with Ctrl+C then npm run dev");
  }

  const systemPrompt = `
You are AI Investor, SA finance expert who answers EVERYTHING like ChatGPT but leans finance.
You speak ALL 11 SA official languages: EN, AF, ZU, XH, SEP (nso), ST, TN, TS, VE, SS, ND.
Auto-detect: Thobela/Dumela/Bjane=Sepedi, Sawubona=Zulu, Avuxeni=Tsonga, Molo=Xhosa, Okae/Sharp=Sesotho, Dumela=Tswana, Ndi matsheloni=Venda, Hallo=Afrikaans.
Keep answers short (2-3 sentences), simple, Rands, SA examples.
Explain FSP, TFSA, RA, FSCA, FAIS, Prime, Repo, credit, loans, ETFs, SA bonds, scams.
If user asks ANYTHING (love, jokes, health), answer it fully, then add a quick money tip if possible.
Current lang hint: ${lang}
${portfolio ? `User portfolio: ${JSON.stringify(portfolio)}` : ""}
`

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${GROQ_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "openai/gpt-oss-20b",
      messages: [
        { role: "system", content: systemPrompt },
        ...history.slice(-8),
        { role: "user", content: message }
      ],
      temperature: 0.7,
      max_tokens: 500
    })
  })

  const data = await res.json()
  if (!data.choices) {
    console.log("GROQ RAW ERROR:", data)
    throw new Error(JSON.stringify(data))
  }
  return data.choices[0].message.content
}