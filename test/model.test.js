import test from "node:test";
import assert from "node:assert/strict";
import {
  advanceDueDate,
  nextDueDateAfterPayment,
  paidThisMonth,
  nextDueDateForDay,
  parseAmount,
  filterTransactions,
  activityStreak,
} from "../src/model.js";

test("monthly recurring dates clamp and return to the original day", () => {
  const feb = advanceDueDate("2026-01-31", "monthly", 31);
  assert.equal(feb, "2026-02-28");
  assert.equal(advanceDueDate(feb, "monthly", 31), "2026-03-31");
  assert.equal(advanceDueDate("2024-02-29", "yearly", 29), "2025-02-28");
  assert.equal(advanceDueDate("2026-10-31", "weekly"), "2026-11-07");
  assert.equal(advanceDueDate("2026-10-31", "once"), null);
});
test("an overdue bill paid today advances to its next real due date", () => {
  const paidAt = new Date(2026, 10, 1, 12);
  assert.equal(
    nextDueDateAfterPayment(
      { dueDate: "2026-08-31", frequency: "monthly", anchorDay: 31 },
      paidAt,
    ),
    "2026-11-30",
  );
  assert.equal(
    nextDueDateAfterPayment(
      { dueDate: "2026-10-25", frequency: "weekly" },
      paidAt,
    ),
    "2026-11-08",
  );
});
test("an old income entry cannot mark an expense bill paid", () => {
  const bill = { id: "bill-1", type: "expense", frequency: "monthly" };
  const now = new Date(2026, 10, 1, 12);
  const oldIncome = [
    { recurringId: bill.id, type: "income", date: now.toISOString() },
  ];
  assert.equal(paidThisMonth(oldIncome, bill, now), false);
  assert.equal(
    paidThisMonth(
      [
        ...oldIncome,
        { recurringId: bill.id, type: "expense", date: now.toISOString() },
      ],
      bill,
      now,
    ),
    true,
  );
});
test("amount entry handles commas, cents, and invalid values", () => {
  assert.equal(parseAmount("1,250.50"), 1250.5);
  assert.equal(parseAmount("0.1"), 0.1);
  for (const value of ["", "no", "-5", "Infinity", "0"])
    assert.throws(() => parseAmount(value));
});
test("combined filters search notes and tags without changing the source", () => {
  const tx = [
    {
      id: "1",
      type: "expense",
      amount: 150,
      category: "Food",
      note: "Lunch",
      tags: ["work"],
      date: "2026-10-25T12:00:00",
      paymentMethod: "card",
    },
    {
      id: "2",
      type: "income",
      amount: 100,
      category: "Gifts",
      note: "",
      date: "2026-09-01T12:00:00",
    },
  ];
  assert.deepEqual(
    filterTransactions(tx, {
      month: "2026-10",
      type: "expense",
      query: "work",
      method: "card",
      from: "2026-10-01",
      to: "2026-10-31",
    }).map((t) => t.id),
    ["1"],
  );
  assert.equal(
    filterTransactions(tx, { month: "2026-10", type: "income" }).length,
    0,
  );
  assert.equal(tx.length, 2);
});
test("tracking streak includes yesterday when today is not logged yet", () => {
  assert.equal(
    activityStreak(
      [{ date: "2026-10-29T12:00:00" }, { date: "2026-10-30T12:00:00" }],
      new Date(2026, 9, 31, 12),
    ),
    2,
  );
});

test("monthly due days clamp to the end of short months", () => {
  assert.equal(nextDueDateForDay(31, new Date(2026, 0, 10, 12)), "2026-01-31");
  assert.equal(nextDueDateForDay(31, new Date(2026, 1, 10, 12)), "2026-02-28");
  assert.equal(nextDueDateForDay(31, new Date(2028, 1, 10, 12)), "2028-02-29");
  assert.equal(nextDueDateForDay(15, new Date(2026, 1, 20, 12)), "2026-03-15");
  assert.equal(nextDueDateForDay(15, new Date(2026, 1, 15, 12)), "2026-02-15");
});
