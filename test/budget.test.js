import test from "node:test";
import assert from "node:assert/strict";
import { budgetSummary, periodBounds } from "../src/budget.js";
const settings = { budget: 3100, cycle: "monthly", rollover: true };
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
