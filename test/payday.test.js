import test from "node:test";
import assert from "node:assert/strict";
import {
  budgetSummary,
  periodBounds,
  validatePayday,
  dayKey,
  salaryBounds,
  nextSalaryDate,
} from "../src/budget.js";
import { emptyState, backup, restore } from "../src/store.js";
const settings = {
  budget: 8000,
  cycle: "payday",
  budgetStart: "2026-10-31",
  nextPayday: "2026-11-19",
  rollover: false,
};

test("allowance on November 19 divides October 31 funds over 19 spending days", () => {
  const s = budgetSummary(settings, [], new Date(2026, 9, 31, 12));
  assert.equal(s.days, 19);
  assert.equal(s.remainingDays, 19);
  assert.equal(s.baseDaily.toFixed(2), "421.05");
  assert.equal(dayKey(s.end), "2026-11-19");
});
test("payday period crosses month end and includes only its expenses", () => {
  const tx = ["2026-10-30", "2026-10-31", "2026-11-01", "2026-11-19"].map(
    (date) => ({ type: "expense", amount: 100, date: date + "T12:00:00" }),
  );
  const s = budgetSummary(
    { ...settings, rollover: true },
    tx,
    new Date(2026, 10, 1, 12),
  );
  assert.equal(s.spent, 200);
  assert.equal(s.todaySpent, 100);
  assert.equal(s.remainingDays, 18);
  assert.equal(s.safePerDay, 7800 / 18);
});
test("one-off plan ends at payday without granting another daily allowance", () => {
  const s = budgetSummary(settings, [], new Date(2026, 10, 19, 12));
  assert.equal(s.active, false);
  assert.equal(s.remainingDays, 0);
  assert.equal(s.leftToday, 0);
});
test("monthly payday renews on its chosen date across a year boundary", () => {
  const p = periodBounds(new Date(2027, 0, 5), "payday", {
    ...settings,
    repeatPayday: true,
  });
  assert.equal(dayKey(p.start), "2026-12-19");
  assert.equal(dayKey(p.end), "2027-01-19");
  assert.equal(p.remainingDays, 14);
  const s = budgetSummary(
    { ...settings, repeatPayday: true },
    [],
    new Date(2026, 10, 19, 12),
  );
  assert.equal(dayKey(s.start), "2026-11-19");
  assert.equal(s.days, 30);
});
test("monthly payday clamps February and returns to the original 31st", () => {
  const config = { ...settings, nextPayday: "2026-12-31", repeatPayday: true };
  const p = periodBounds(new Date(2027, 1, 28, 12), "payday", config);
  assert.equal(dayKey(p.start), "2027-02-28");
  assert.equal(dayKey(p.end), "2027-03-31");
  const leap = periodBounds(new Date(2028, 1, 29, 12), "payday", config);
  assert.equal(dayKey(leap.start), "2028-02-29");
});
test("future plan does not allow spending before its start", () => {
  assert.equal(
    budgetSummary(settings, [], new Date(2026, 9, 30, 12)).leftToday,
    0,
  );
});
test("spending today stays visible even when a one-off allowance has ended", () => {
  const date = new Date(2026, 10, 19, 12);
  const s = budgetSummary(
    settings,
    [{ type: "expense", amount: 100, date: date.toISOString() }],
    date,
  );
  assert.equal(s.todaySpent, 100);
  assert.equal(s.spent, 0);
  assert.equal(s.leftToday, 0);
});
test("payday validation rejects missing, impossible, and reversed dates", () => {
  for (const nextPayday of ["", "2026-02-30", "2026-10-30", "2026-10-31"])
    assert.throws(() => validatePayday({ ...settings, nextPayday }));
  assert.doesNotThrow(() => validatePayday(settings));
});
test("private backup retains allowance dates and original records", () => {
  const data = emptyState();
  Object.assign(data.settings, settings, { repeatPayday: true });
  data.transactions = [
    {
      id: "keep",
      type: "expense",
      amount: 50,
      date: "2026-10-31T12:00:00",
      category: "Food",
    },
  ];
  const copy = restore(backup(data));
  assert.equal(copy.settings.nextPayday, settings.nextPayday);
  assert.equal(copy.settings.repeatPayday, true);
  assert.equal(copy.transactions[0].id, "keep");
});

const salarySettings = {
  budget: 16000,
  cycle: "salary",
  rollover: false,
  salary: {
    enabled: true,
    day1: 15,
    day2: 30,
    amount1: 8000,
    amount2: 8000,
  },
};
test("salary periods run from one payday to the next", () => {
  const p = periodBounds(new Date(2027, 0, 5, 12), "salary", salarySettings);
  assert.equal(dayKey(p.start), "2026-12-30");
  assert.equal(dayKey(p.end), "2027-01-15");
  assert.equal(p.days, 16);
  const onPayday = periodBounds(
    new Date(2027, 0, 15, 12),
    "salary",
    salarySettings,
  );
  assert.equal(dayKey(onPayday.start), "2027-01-15");
  assert.equal(dayKey(onPayday.end), "2027-01-30");
  assert.equal(onPayday.remainingDays, 15);
});
test("salary paydays clamp to the end of February and return in March", () => {
  const p = periodBounds(new Date(2027, 1, 20, 12), "salary", salarySettings);
  assert.equal(dayKey(p.start), "2027-02-15");
  assert.equal(dayKey(p.end), "2027-02-28");
  const after = periodBounds(
    new Date(2027, 1, 28, 12),
    "salary",
    salarySettings,
  );
  assert.equal(dayKey(after.start), "2027-02-28");
  assert.equal(dayKey(after.end), "2027-03-15");
  assert.equal(dayKey(nextSalaryDate(30, new Date(2027, 1, 20))), "2027-02-28");
  assert.equal(dayKey(nextSalaryDate(15, new Date(2027, 1, 20))), "2027-03-15");
});
test("salary summary divides the plan across the short pay period", () => {
  const s = budgetSummary(salarySettings, [], new Date(2027, 1, 20, 12));
  assert.equal(dayKey(s.start), "2027-02-15");
  assert.equal(dayKey(s.end), "2027-02-28");
  assert.equal(s.days, 13);
  assert.equal(s.remainingDays, 8);
});
test("salary payday validation requires two different valid days", () => {
  assert.doesNotThrow(() => validatePayday(salarySettings));
  assert.throws(
    () =>
      validatePayday({
        ...salarySettings,
        salary: { ...salarySettings.salary, enabled: false },
      }),
    /salary payday/i,
  );
  assert.throws(
    () =>
      validatePayday({
        ...salarySettings,
        salary: { ...salarySettings.salary, day2: 15 },
      }),
    /different/i,
  );
  assert.throws(
    () =>
      validatePayday({
        ...salarySettings,
        salary: { ...salarySettings.salary, day1: 32 },
      }),
    /1 through 31/i,
  );
  assert.equal(salaryBounds({ ...salarySettings, salary: { ...salarySettings.salary, enabled: false } }), null);
});
test("salary schedule survives a private backup", () => {
  const data = emptyState();
  Object.assign(data.settings, salarySettings);
  const copy = restore(backup(data));
  assert.deepEqual(copy.settings.salary, salarySettings.salary);
});
