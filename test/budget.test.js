import test from "node:test";
import assert from "node:assert/strict";
import { budgetSummary, periodBounds } from "../src/budget.js";
const settings = { budget: 3100, cycle: "monthly", rollover: true };
test("8000 split over 31 days shows a 258.06 base daily budget", () => {
  const s = budgetSummary(
    { budget: 8000, cycle: "monthly", rollover: false },
    [],
    new Date(2026, 9, 31, 12),
  );
  assert.equal(s.days, 31);
  assert.equal(s.baseDaily.toFixed(2), "258.06");
  assert.equal(s.safePerDay.toFixed(2), "258.06");
  assert.equal(s.remaining, 8000);
});
test("a fixed allowance cannot exceed the last money left in the period", () => {
  const date = new Date(2026, 9, 31, 12);
  const s = budgetSummary(
    { budget: 8000, cycle: "monthly", rollover: false },
    [
      {
        type: "expense",
        amount: 7990,
        date: new Date(2026, 9, 30, 12).toISOString(),
      },
    ],
    date,
  );
  assert.equal(s.leftToday, 10);
  assert.equal(s.remaining, 10);
});
test("month boundaries and daily allowance", () => {
  const d = new Date(2026, 0, 1, 12);
  const p = periodBounds(d);
  assert.equal(p.days, 31);
  assert.equal(budgetSummary(settings, [], d).safePerDay, 100);
});
test("unspent balance rolls into remaining days", () => {
  const d = new Date(2026, 0, 2, 12);
  const s = budgetSummary(settings, [], d);
  assert.ok(s.safePerDay > 100);
  assert.equal(s.remainingDays, 30);
});
test("overspending reduces future safe amount", () => {
  const d = new Date(2026, 0, 2, 12);
  const tx = [
    {
      type: "expense",
      amount: 200,
      date: new Date(2026, 0, 1, 12).toISOString(),
    },
  ];
  assert.ok(budgetSummary(settings, tx, d).safePerDay < 100);
});
test("rollover disabled keeps fixed allowance", () => {
  const d = new Date(2026, 0, 2, 12);
  assert.equal(
    budgetSummary({ ...settings, rollover: false }, [], d).safePerDay,
    100,
  );
});
test("weekly period has seven days", () => {
  assert.equal(periodBounds(new Date(2026, 9, 31, 12), "weekly").days, 7);
});
test("future-dated expenses do not reduce today’s available budget", () => {
  const today = new Date(2026, 0, 2, 12);
  const future = [
    {
      type: "expense",
      amount: 1000,
      date: new Date(2026, 0, 20, 12).toISOString(),
    },
  ];
  assert.equal(budgetSummary(settings, future, today).spent, 0);
});
test("daily overspending never produces a negative available amount", () => {
  const today = new Date(2026, 0, 2, 12);
  const tx = [{ type: "expense", amount: 5000, date: today.toISOString() }];
  assert.equal(budgetSummary(settings, tx, today).leftToday, 0);
});
test("unused monthly spending money carries through multiple months", () => {
  const plan = {
    budget: 8000,
    cycle: "monthly",
    rollover: false,
    carryover: true,
    carryoverFrom: "2026-10",
    carryoverOpening: 0,
  };
  const entries = [
    { type: "expense", amount: 3000, date: "2026-10-10T12:00:00" },
    { type: "expense", amount: 2000, date: "2026-11-10T12:00:00" },
  ];
  const november = budgetSummary(plan, entries, new Date(2026, 10, 1, 12));
  assert.equal(november.carryover, 5000);
  assert.equal(november.total, 13000);
  assert.equal(november.baseDaily.toFixed(2), "433.33");
  const december = budgetSummary(plan, entries, new Date(2026, 11, 1, 12));
  assert.equal(december.carryover, 11000);
  assert.equal(december.remaining, 19000);
  const changedPlan = {
    ...plan,
    budget: 10000,
    carryoverFrom: "2026-11",
    carryoverOpening: november.carryover,
  };
  assert.equal(
    budgetSummary(changedPlan, entries, new Date(2026, 10, 1, 12)).total,
    15000,
  );
  assert.equal(
    budgetSummary(
      { ...plan, carryover: false },
      entries,
      new Date(2026, 11, 1, 12),
    ).remaining,
    8000,
  );
});
test("daily spending adjusts when the available account balance changes", () => {
  const plan = { budget: 8000, cycle: "monthly", rollover: true };
  const date = new Date(2026, 9, 1, 12);
  const full = budgetSummary(plan, [], date, 8000);
  const lower = budgetSummary(plan, [], date, 4000);
  assert.equal(full.safePerDay.toFixed(2), "258.06");
  assert.equal(lower.safePerDay.toFixed(2), "129.03");
  assert.equal(lower.remaining, 8000);
});
test("paid bills recalculate the remaining daily amount from money actually left", () => {
  const plan = {
    budget: 5708.55,
    cycle: "payday",
    budgetStart: "2026-10-31",
    nextPayday: "2026-11-19",
    rollover: true,
  };
  const today = new Date(2026, 10, 1, 12);
  const paidBill = [
    {
      type: "expense",
      amount: 1619,
      date: today.toISOString(),
      category: "Bills",
    },
  ];
  const summary = budgetSummary(plan, paidBill, today, 4089.55);
  assert.equal(summary.remaining, 4089.55);
  assert.equal(summary.remainingDays, 18);
  assert.equal(summary.dailyPool, 4089.55);
  assert.equal(summary.safePerDay.toFixed(2), "227.20");
  assert.equal(summary.leftToday, 0);
});
test("an account-linked plan carries the real balance into the next month once", () => {
  const plan = {
    budget: 5000,
    budgetSource: "accounts",
    cycle: "monthly",
    rollover: true,
    carryover: true,
    carryoverFrom: "2026-10",
    carryoverOpening: 5000,
  };
  const summary = budgetSummary(plan, [], new Date(2026, 10, 1, 12), 5000);
  assert.equal(summary.total, 5000);
  assert.equal(summary.remaining, 5000);
  assert.equal(summary.carryover, 0);
  assert.equal(summary.safePerDay.toFixed(2), "166.67");
});
