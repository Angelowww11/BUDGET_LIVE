import test from "node:test";
import assert from "node:assert/strict";
import { emptyState } from "../src/store.js";
import {
  journalRange,
  journalItems,
  shiftJournalDate,
} from "../src/journal.js";

test("week views include entries on both sides of a month boundary", () => {
  const d = emptyState();
  d.transactions = [
    {
      id: "oct",
      type: "expense",
      amount: 10,
      category: "Food",
      date: "2026-10-31T12:00:00",
    },
    {
      id: "nov",
      type: "income",
      amount: 20,
      category: "Salary",
      date: "2026-11-01T12:00:00",
    },
    {
      id: "outside",
      type: "expense",
      amount: 5,
      category: "Food",
      date: "2026-11-02T12:00:00",
    },
  ];
  const ctx = {
    activityPeriod: "week",
    activityDate: "2026-10-31",
    filters: {},
  };
  assert.deepEqual(
    journalItems(d, ctx).map((t) => t.id),
    ["nov", "oct"],
  );
  assert.equal(journalRange("week", "2026-10-31").from, "2026-10-26");
  assert.equal(journalRange("week", "2026-10-31").to, "2026-11-01");
  ctx.activityPeriod = "day";
  assert.deepEqual(
    journalItems(d, ctx).map((t) => t.id),
    ["oct"],
  );
  ctx.activityPeriod = "month";
  assert.deepEqual(
    journalItems(d, ctx).map((t) => t.id),
    ["oct"],
  );
  ctx.activityPeriod = "all";
  assert.equal(journalItems(d, ctx).length, 3);
});
test("daily and weekly navigation cross month and year boundaries", () => {
  assert.equal(shiftJournalDate("day", "2026-12-31", 1), "2027-01-01");
  assert.equal(shiftJournalDate("week", "2026-10-31", 1), "2026-11-07");
  assert.equal(shiftJournalDate("month", "2026-01-31", 1), "2026-02-01");
});
test("account filtering also finds old records with only a payment method", () => {
  const d = emptyState();
  d.transactions = [
    {
      id: "cash",
      type: "expense",
      amount: 10,
      category: "Food",
      date: "2026-10-31T12:00:00",
      paymentMethod: "cash",
    },
    {
      id: "card",
      type: "expense",
      amount: 20,
      category: "Food",
      date: "2026-10-31T12:00:00",
      paymentMethod: "card",
    },
  ];
  assert.deepEqual(
    journalItems(d, {
      activityPeriod: "day",
      activityDate: "2026-10-31",
      filters: { accountId: "account-card" },
    }).map((t) => t.id),
    ["card"],
  );
});
