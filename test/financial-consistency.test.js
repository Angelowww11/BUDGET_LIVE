import test from "node:test";
import assert from "node:assert/strict";
import { emptyState } from "../src/store.js";
import { backup, restore } from "../src/store.js";
import { budgetSummary } from "../src/budget.js";
import { accountSummary } from "../src/accounts.js";
import { monthTotals } from "../src/model.js";

test("editing an expense updates the budget, account, and monthly flow together", () => {
  const data = emptyState();
  data.settings.budget = 8000;
  data.accounts[0].openingBalance = 8000;
  data.transactions = [
    {
      id: "e1",
      type: "expense",
      amount: 500,
      date: "2026-11-01T12:00:00",
      accountId: data.accounts[0].id,
      category: "Food",
    },
    {
      id: "i1",
      type: "income",
      amount: 2000,
      date: "2026-11-01T13:00:00",
      accountId: data.accounts[0].id,
      category: "Salary",
    },
    {
      id: "e2",
      type: "expense",
      amount: 300,
      date: "2026-11-02T12:00:00",
      accountId: data.accounts[0].id,
      category: "Transport",
    },
  ];
  const today = new Date(2026, 10, 1, 18);
  assert.equal(
    budgetSummary(data.settings, data.transactions, today).spent,
    500,
  );
  assert.equal(accountSummary(data, today).total, 9500);
  assert.equal(monthTotals(data, "2026-11", today).expense, 500);
  assert.equal(monthTotals(data, "2026-11", today).income, 2000);
  data.transactions[0].amount = 700;
  assert.equal(
    budgetSummary(data.settings, data.transactions, today).remaining,
    7300,
  );
  assert.equal(accountSummary(data, today).total, 9300);
  assert.equal(monthTotals(data, "2026-11", today).expense, 700);
});
test("saved carryover settings and transactions survive a private backup", () => {
  const data = emptyState();
  data.settings.carryoverFrom = "2026-10";
  data.settings.carryoverOpening = 500;
  data.transactions = [
    {
      id: "original",
      type: "expense",
      amount: 20,
      date: "2026-10-01T12:00:00",
      category: "Food",
    },
  ];
  const copy = restore(backup(data));
  assert.equal(copy.settings.carryoverFrom, "2026-10");
  assert.equal(copy.settings.carryoverOpening, 500);
  assert.equal(copy.transactions[0].id, "original");
});
