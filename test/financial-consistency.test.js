import test from "node:test";
import assert from "node:assert/strict";
import { emptyState } from "../src/store.js";
import { backup, restore } from "../src/store.js";
import { budgetSummary, budgetFromAvailableBalance } from "../src/budget.js";
import { accountSummary } from "../src/accounts.js";
import { monthTotals } from "../src/model.js";

test("editing an expense updates the budget, account, and monthly flow together", () => {
  const data = emptyState();
  data.settings.budget = 8000;
  data.settings.carryover = false;
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
  data.settings.budgetSource = "accounts";
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
  assert.equal(copy.settings.budgetSource, "accounts");
  assert.equal(copy.transactions[0].id, "original");
});
test("using account funds as a plan does not count a deleted expense twice", () => {
  const data = emptyState();
  const today = new Date(2026, 10, 1, 18);
  const accountId = data.accounts[0].id;
  data.settings.budget = 0;
  data.settings.carryoverFrom = "2026-10";
  data.settings.carryoverOpening = 2000;
  data.transactions = [
    {
      id: "income",
      type: "income",
      amount: 5000,
      date: "2026-11-01T12:00:00",
      accountId,
      category: "Allowance",
    },
    {
      id: "expense",
      type: "expense",
      amount: 1000,
      date: "2026-11-01T13:00:00",
      accountId,
      category: "Bills",
    },
  ];
  assert.equal(accountSummary(data, today).configured, true);
  assert.equal(accountSummary(data, today).spendable, 4000);
  const useFunds = () => {
    data.settings.budget = budgetFromAvailableBalance(
      data.settings,
      data.transactions,
      accountSummary(data, today).spendable,
      today,
    );
    data.settings.carryoverFrom = "2026-11";
    data.settings.carryoverOpening = 0;
  };
  useFunds();
  assert.equal(data.settings.budget, 5000);
  assert.equal(
    budgetSummary(data.settings, data.transactions, today).remaining,
    4000,
  );
  data.settings.budgetSource = "accounts";
  data.settings.carryover = false;
  assert.equal(
    budgetSummary(
      data.settings,
      data.transactions,
      today,
      accountSummary(data, today).spendable,
    ).remaining,
    4000,
  );
  useFunds();
  assert.equal(data.settings.budget, 5000);
  data.transactions = data.transactions.filter((t) => t.id !== "expense");
  useFunds();
  assert.equal(data.settings.budget, 5000);
  assert.equal(
    budgetSummary(
      data.settings,
      data.transactions,
      today,
      accountSummary(data, today).spendable,
    ).remaining,
    5000,
  );
  assert.equal(accountSummary(data, today).spendable, 5000);
  data.transactions[0].amount = 3000;
  assert.equal(
    budgetSummary(
      data.settings,
      data.transactions,
      today,
      accountSummary(data, today).spendable,
    ).remaining,
    3000,
  );
});
