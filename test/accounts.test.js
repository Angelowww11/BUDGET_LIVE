import test from "node:test";
import assert from "node:assert/strict";
import { normalize, emptyState, backup, restore } from "../src/store.js";
import {
  accountBalances,
  accountSummary,
  transactionAccountId,
  openingForCurrentBalance,
} from "../src/accounts.js";
import { budgetSummary } from "../src/budget.js";

const now = new Date(2026, 9, 15, 12);
function ledger() {
  const d = emptyState();
  d.settings.budget = 8000;
  d.accounts[0].openingBalance = 5000;
  d.accounts[1].openingBalance = 1000;
  d.accounts[2].openingBalance = 2000;
  d.transactions = [
    {
      id: "income",
      type: "income",
      amount: 500,
      category: "Salary",
      date: "2026-10-10T12:00:00",
      accountId: "account-cash",
    },
    {
      id: "expense",
      type: "expense",
      amount: 150,
      category: "Food",
      date: "2026-10-12T12:00:00",
      accountId: "account-cash",
    },
  ];
  return d;
}
test("accounts include opening balances and signed entries", () => {
  const summary = accountSummary(ledger(), now);
  assert.equal(summary.total, 8350);
  assert.equal(summary.spendable, 6350);
  assert.equal(summary.savings, 2000);
});
test("a transfer moves balances without changing income or the spending budget", () => {
  const d = ledger(),
    before = budgetSummary(d.settings, d.transactions, now),
    sum = accountSummary(d, now).total;
  d.transfers.push({
    id: "transfer",
    fromId: "account-cash",
    toId: "account-savings",
    amount: 1000,
    date: "2026-10-14T12:00:00",
  });
  const balances = accountBalances(d, now);
  assert.equal(balances.find((a) => a.id === "account-cash").balance, 4350);
  assert.equal(balances.find((a) => a.id === "account-savings").balance, 3000);
  assert.equal(accountSummary(d, now).total, sum);
  assert.equal(
    budgetSummary(d.settings, d.transactions, now).spent,
    before.spent,
  );
  assert.equal(d.transactions.length, 2);
});
test("correcting a current balance retains all recorded entries", () => {
  const d = ledger(),
    original = structuredClone(d.transactions);
  d.accounts[0].openingBalance = openingForCurrentBalance(
    d,
    "account-cash",
    6000,
    now,
  );
  assert.equal(
    accountBalances(d, now).find((a) => a.id === "account-cash").balance,
    6000,
  );
  assert.deepEqual(d.transactions, original);
});
test("older payment methods map to accounts without rewriting transactions", () => {
  const source = {
    ...emptyState(),
    transactions: [
      {
        id: "old",
        type: "expense",
        amount: 25,
        category: "Transport",
        date: "2026-10-12T12:00:00",
        paymentMethod: "ewallet",
      },
    ],
  };
  delete source.accounts;
  const upgraded = normalize(source);
  assert.equal(
    transactionAccountId(upgraded, upgraded.transactions[0]),
    "account-ewallet",
  );
  assert.deepEqual(upgraded.transactions, source.transactions);
  assert.equal(accountSummary(upgraded, now).total, -25);
});
test("future entries do not change balances until their date", () => {
  const d = ledger();
  d.transactions.push({
    id: "future",
    type: "expense",
    amount: 400,
    category: "Bills",
    date: "2026-10-20T12:00:00",
    accountId: "account-cash",
  });
  assert.equal(accountSummary(d, now).total, 8350);
});
test("invalid account references and self-transfers are rejected", () => {
  const d = ledger();
  d.transactions[0].accountId = "missing";
  assert.throws(() => normalize(d), /unknown account/);
  const other = ledger();
  other.transfers.push({
    id: "bad",
    fromId: "account-cash",
    toId: "account-cash",
    amount: 100,
    date: "2026-10-14",
  });
  assert.throws(() => normalize(other), /transfer is invalid/);
});
test("backup and restore retain accounts, transfers, and original record IDs", () => {
  const d = ledger();
  d.transfers.push({
    id: "kept-transfer",
    fromId: "account-cash",
    toId: "account-savings",
    amount: 300,
    date: "2026-10-14T12:00:00",
  });
  const restored = restore(backup(d));
  assert.deepEqual(restored.accounts, d.accounts);
  assert.deepEqual(restored.transfers, d.transfers);
  assert.deepEqual(restored.transactions, d.transactions);
  assert.deepEqual(accountSummary(restored, now), accountSummary(d, now));
});
