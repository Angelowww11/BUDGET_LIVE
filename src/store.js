import { initialAccounts, accountTypes } from "./accounts.js";
import { colorMode } from "./appearance.js";
import { dayKey, validateSalary } from "./budget.js";
export const STORAGE_KEY = "daylight-budget-v1";
export const RECOVERY_KEY = `${STORAGE_KEY}-recovery`;
let lastRead = null;

const defaultSalary = () => ({
  enabled: false,
  day1: 15,
  day2: 30,
  amount1: 0,
  amount2: 0,
});
const previousMonth = () => {
  const now = new Date();
  const previous = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return `${previous.getFullYear()}-${String(previous.getMonth() + 1).padStart(2, "0")}`;
};

function normalizeSalary(value) {
  if (value === undefined) return defaultSalary();
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("The salary payday section is invalid.");
  const salary = {
    enabled: Boolean(value.enabled),
    day1: value.day1 === undefined ? 15 : Number(value.day1),
    day2: value.day2 === undefined ? 30 : Number(value.day2),
    amount1: value.amount1 === undefined ? 0 : Number(value.amount1),
    amount2: value.amount2 === undefined ? 0 : Number(value.amount2),
  };
  if (salary.enabled) validateSalary(salary);
  else if (
    !Number.isInteger(salary.day1) ||
    salary.day1 < 1 ||
    salary.day1 > 31 ||
    !Number.isInteger(salary.day2) ||
    salary.day2 < 1 ||
    salary.day2 > 31 ||
    salary.day1 === salary.day2 ||
    ![salary.amount1, salary.amount2].every(
      (amount) => Number.isFinite(amount) && amount >= 0,
    )
  )
    throw new Error("The salary payday section is invalid.");
  return salary;
}

export function emptyState() {
  return {
    version: 1,
    settings: {
      budget: 0,
      budgetSource: "manual",
      currency: "PHP",
      cycle: "monthly",
      rollover: true,
      dailyRebalanceVersion: 1,
      carryover: true,
      carryoverFrom: dayKey(new Date()).slice(0, 7),
      carryoverOpening: 0,
      theme: "green",
      colorMode: "light",
      salary: defaultSalary(),
    },
    transactions: [],
    categories: [],
    categoryDetails: {},
    hiddenCategories: [],
    templates: [],
    goals: [],
    bills: [],
    categoryBudgets: {},
    accounts: initialAccounts(),
    transfers: [],
  };
}

function array(value, label) {
  if (value === undefined) return [];
  if (!Array.isArray(value))
    throw new Error(`The ${label} section is damaged. Restore a valid backup.`);
  return value;
}

export function normalize(value) {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("This file does not contain budget data.");
  if (!value.settings || typeof value.settings !== "object")
    throw new Error("Budget settings are missing.");
  if (value.version && value.version > 1)
    throw new Error("This backup needs a newer version of Daylight.");
  const base = emptyState();
  const next = {
    ...base,
    ...value,
    settings: { ...base.settings, ...value.settings },
  };
  if (!value.settings.carryoverFrom)
    next.settings.carryoverFrom = previousMonth();
  if (value.settings.dailyRebalanceVersion !== 1) {
    next.settings.rollover = true;
    next.settings.dailyRebalanceVersion = 1;
  }
  next.settings.colorMode = colorMode(value.settings);
  next.settings.salary = normalizeSalary(value.settings.salary);
  if (next.settings.cycle === "salary" && !next.settings.salary.enabled)
    throw new Error(
      "The spending plan needs two enabled salary paydays. Set them up first.",
    );
  for (const key of [
    "transactions",
    "categories",
    "templates",
    "goals",
    "bills",
    "hiddenCategories",
    "transfers",
  ])
    next[key] = array(value[key], key);
  next.accounts = (
    value.accounts === undefined
      ? initialAccounts(value)
      : array(value.accounts, "accounts")
  ).map(
    (a) =>
      a && {
        ...a,
        includeInSpending:
          a.includeInSpending === undefined
            ? a.type !== "savings"
            : Boolean(a.includeInSpending),
        configured: Boolean(a.configured),
      },
  );
  const accountIds = new Set();
  for (const account of next.accounts) {
    if (
      !account ||
      typeof account.id !== "string" ||
      accountIds.has(account.id) ||
      typeof account.name !== "string" ||
      !account.name.trim() ||
      !Object.hasOwn(accountTypes, account.type) ||
      !Number.isFinite(Number(account.openingBalance))
    )
      throw new Error("An account is invalid.");
    accountIds.add(account.id);
  }
  if (!accountIds.size) throw new Error("Keep at least one account.");
  for (const t of next.transfers) {
    if (
      !t ||
      !t.id ||
      !accountIds.has(t.fromId) ||
      !accountIds.has(t.toId) ||
      t.fromId === t.toId ||
      !Number.isFinite(Number(t.amount)) ||
      Number(t.amount) <= 0 ||
      !Number.isFinite(new Date(t.date).getTime())
    )
      throw new Error("An account transfer is invalid.");
  }
  if (
    !Number.isFinite(Number(next.settings.budget)) ||
    Number(next.settings.budget) < 0
  )
    throw new Error("The budget amount is invalid.");
  next.settings.budget = Number(next.settings.budget);
  if (!["manual", "accounts"].includes(next.settings.budgetSource))
    next.settings.budgetSource = "manual";
  try {
    new Intl.NumberFormat("en", {
      style: "currency",
      currency: next.settings.currency,
    });
  } catch {
    throw new Error("The backup currency is invalid.");
  }
  const ids = new Set();
  for (const t of next.transactions) {
    if (
      !t ||
      !t.id ||
      ids.has(t.id) ||
      !["income", "expense"].includes(t.type) ||
      !Number.isFinite(Number(t.amount)) ||
      Number(t.amount) <= 0 ||
      !Number.isFinite(new Date(t.date).getTime()) ||
      typeof t.category !== "string"
    )
      throw new Error(
        "One or more transactions are invalid. Your current records have not been replaced.",
      );
    ids.add(t.id);
    if (t.accountId && !accountIds.has(t.accountId))
      throw new Error("A transaction refers to an unknown account.");
    if (t.tags !== undefined && !Array.isArray(t.tags))
      throw new Error("Transaction tags are invalid.");
  }
  for (const g of next.goals) {
    if (
      !g ||
      !g.id ||
      typeof g.name !== "string" ||
      !Number.isFinite(Number(g.target)) ||
      Number(g.target) <= 0 ||
      !Number.isFinite(Number(g.saved)) ||
      Number(g.saved) < 0
    )
      throw new Error("A savings goal is invalid.");
  }
  for (const t of next.templates) {
    if (
      !t ||
      !t.id ||
      typeof t.category !== "string" ||
      !Number.isFinite(Number(t.amount)) ||
      Number(t.amount) <= 0
    )
      throw new Error("A quick-add shortcut is invalid.");
    if (t.accountId && !accountIds.has(t.accountId))
      throw new Error("A shortcut refers to an unknown account.");
  }
  for (const b of next.bills) {
    if (
      !b ||
      !b.id ||
      typeof b.name !== "string" ||
      !Number.isFinite(Number(b.amount)) ||
      Number(b.amount) <= 0 ||
      !/^\d{4}-\d{2}-\d{2}$/.test(b.dueDate)
    )
      throw new Error("A scheduled payment is invalid.");
    if (b.accountId && !accountIds.has(b.accountId))
      throw new Error("A recurring entry refers to an unknown account.");
    if (
      !Number.isFinite(new Date(`${b.dueDate}T12:00:00`).getTime()) ||
      !["once", "weekly", "biweekly", "monthly", "yearly"].includes(b.frequency)
    )
      throw new Error("A recurring schedule is invalid.");
  }
  for (const key of ["categoryBudgets", "categoryDetails"]) {
    if (!next[key] || typeof next[key] !== "object" || Array.isArray(next[key]))
      throw new Error(`The ${key} section is invalid.`);
  }
  if (
    next.categories.some((name) => typeof name !== "string") ||
    next.hiddenCategories.some((name) => typeof name !== "string")
  )
    throw new Error("Category names are invalid.");
  for (const amount of Object.values(next.categoryBudgets))
    if (!Number.isFinite(Number(amount)) || Number(amount) < 0)
      throw new Error("A category limit is invalid.");
  for (const meta of Object.values(next.categoryDetails))
    if (
      !meta ||
      typeof meta !== "object" ||
      !["income", "expense"].includes(meta.type)
    )
      throw new Error("A custom category is invalid.");
  return next;
}

export function load() {
  const raw = localStorage.getItem(STORAGE_KEY);
  lastRead = raw;
  if (!raw) return emptyState();
  try {
    return normalize(JSON.parse(raw));
  } catch (error) {
    throw new Error(`Your saved data could not be opened. ${error.message}`);
  }
}

export function save(value, { replace = false } = {}) {
  const next = normalize(value);
  const current = localStorage.getItem(STORAGE_KEY);
  if (!replace && current !== lastRead)
    throw new Error(
      "This budget changed in another window. Refresh to load the latest records before saving.",
    );
  const text = JSON.stringify(next);
  // Keep a previous copy on the device. Never clear user storage on updates.
  if (current && current !== text) localStorage.setItem(RECOVERY_KEY, current);
  localStorage.setItem(STORAGE_KEY, text);
  lastRead = text;
  return next;
}

export function backup(data) {
  return JSON.stringify(
    { app: "daylight-budget", exportedAt: new Date().toISOString(), data },
    null,
    2,
  );
}

export function restore(text) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Choose a valid Daylight JSON backup.");
  }
  if (
    parsed.app !== "daylight-budget" ||
    !Array.isArray(parsed.data?.transactions)
  )
    throw new Error("This is not a Daylight Budget backup.");
  return normalize(parsed.data);
}
