export const dayKey = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
export function budgetDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return null;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return dayKey(date) === value ? date : null;
}
const ordinal = (d) =>
  Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000;
const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
const salaryDate = (year, month, day) =>
  new Date(year, month, Math.min(Number(day), daysInMonth(year, month)));
const validSalaryDay = (day) =>
  Number.isInteger(Number(day)) && Number(day) >= 1 && Number(day) <= 31;
export function salarySlots(settings = {}) {
  const salary = settings.salary;
  if (!salary?.enabled) return [];
  return [
    {
      key: 1,
      day: Number(salary.day1),
      amount: Number(salary.amount1) || 0,
    },
    {
      key: 2,
      day: Number(salary.day2),
      amount: Number(salary.amount2) || 0,
    },
  ]
    .filter((slot) => validSalaryDay(slot.day))
    .sort((a, b) => a.day - b.day);
}
export function validateSalary(salary) {
  if (!salary) throw new Error("Add your two salary payday dates.");
  if (!validSalaryDay(salary.day1) || !validSalaryDay(salary.day2))
    throw new Error("Salary payday dates must be days 1 through 31.");
  if (Number(salary.day1) === Number(salary.day2))
    throw new Error("Choose two different salary payday dates.");
  for (const amount of [salary.amount1, salary.amount2])
    if (
      amount !== undefined &&
      (!Number.isFinite(Number(amount)) || Number(amount) < 0)
    )
      throw new Error("Salary amounts must be zero or more.");
}
export function nextSalaryDate(day, from = new Date()) {
  const start = new Date(from);
  start.setHours(0, 0, 0, 0);
  const valid = validSalaryDay(day) ? Number(day) : 1;
  let date = salaryDate(start.getFullYear(), start.getMonth(), valid);
  if (date < start)
    date = salaryDate(start.getFullYear(), start.getMonth() + 1, valid);
  return date;
}
export function salaryBounds(settings, today = new Date()) {
  const slots = salarySlots(settings);
  if (slots.length < 2) return null;
  const d = new Date(today);
  d.setHours(0, 0, 0, 0);
  const candidates = [];
  for (const offset of [-1, 0, 1]) {
    const month = new Date(d.getFullYear(), d.getMonth() + offset, 1);
    for (const slot of slots) {
      const date = salaryDate(month.getFullYear(), month.getMonth(), slot.day);
      if (!candidates.some((item) => dayKey(item.date) === dayKey(date)))
        candidates.push({ ...slot, date });
    }
  }
  candidates.sort((a, b) => a.date - b.date);
  const previous = [...candidates].reverse().find((item) => item.date <= d);
  const next = candidates.find((item) => item.date > d);
  if (!previous || !next) return null;
  return { start: previous.date, end: next.date, previous, next };
}
export function validatePayday(settings) {
  if (settings.cycle === "salary") {
    if (!settings.salary?.enabled)
      throw new Error("Set up your two salary payday dates first.");
    validateSalary(settings.salary);
    return;
  }
  if (settings.cycle !== "payday") return;
  const start = budgetDate(settings.budgetStart),
    end = budgetDate(settings.nextPayday);
  if (!start || !end || end <= start)
    throw new Error(
      "Choose a next allowance date after the budget start date.",
    );
}
export function periodBounds(today, cycle = "monthly", settings = {}) {
  const d = new Date(today);
  d.setHours(0, 0, 0, 0);
  let start, end;
  const salaryPeriod = cycle === "salary" ? salaryBounds(settings, d) : null;
  if (salaryPeriod) {
    start = salaryPeriod.start;
    end = salaryPeriod.end;
  } else if (
    cycle === "payday" &&
    budgetDate(settings.budgetStart) &&
    budgetDate(settings.nextPayday) > budgetDate(settings.budgetStart)
  ) {
    start = budgetDate(settings.budgetStart);
    end = budgetDate(settings.nextPayday);
    if (settings.repeatPayday && d >= end) {
      const anchor = new Date(end);
      const payday = (offset) => {
        const month = new Date(
          anchor.getFullYear(),
          anchor.getMonth() + offset,
          1,
        );
        return new Date(
          month.getFullYear(),
          month.getMonth(),
          Math.min(
            anchor.getDate(),
            new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate(),
          ),
        );
      };
      let offset =
        (d.getFullYear() - anchor.getFullYear()) * 12 +
        d.getMonth() -
        anchor.getMonth();
      if (payday(offset) > d) offset--;
      start = payday(offset);
      end = payday(offset + 1);
    }
  } else if (cycle === "weekly") {
    start = new Date(d);
    start.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    end = new Date(start);
    end.setDate(start.getDate() + 7);
  } else if (cycle === "biweekly") {
    const anchor = new Date(2024, 0, 1);
    const ordinal = (x) =>
      Date.UTC(x.getFullYear(), x.getMonth(), x.getDate()) / 86400000;
    const weeks = Math.floor((ordinal(d) - ordinal(anchor)) / 14);
    start = new Date(anchor);
    start.setDate(anchor.getDate() + weeks * 14);
    end = new Date(start);
    end.setDate(start.getDate() + 14);
  } else {
    start = new Date(d.getFullYear(), d.getMonth(), 1);
    end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
  }
  return {
    start,
    end,
    days: ordinal(end) - ordinal(start),
    remainingDays: Math.max(
      0,
      ordinal(end) - Math.max(ordinal(d), ordinal(start)),
    ),
    active: d >= start && d < end,
  };
}
export function budgetSummary(
  settings,
  transactions,
  today = new Date(),
  availableBalance = Infinity,
) {
  const { start, end, days, remainingDays, active } = periodBounds(
    today,
    settings.cycle,
    settings,
  );
  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);
  const expenses = transactions.filter(
    (t) =>
      t.type === "expense" &&
      new Date(t.date) >= start &&
      new Date(t.date) < end &&
      new Date(t.date) <= todayEnd,
  );
  const spent = expenses.reduce((sum, t) => sum + Number(t.amount), 0);
  const todaySpent = transactions
    .filter((t) => t.type === "expense" && dayKey(t.date) === dayKey(today))
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const baseBudget = Math.max(0, Number(settings.budget) || 0);
  let carryover =
    settings.cycle === "monthly" && settings.carryover !== false
      ? Math.max(0, Number(settings.carryoverOpening) || 0)
      : 0;
  if (settings.cycle === "monthly" && settings.carryover !== false) {
    const anchor = budgetDate(`${settings.carryoverFrom}-01`);
    if (anchor && anchor < start) {
      const month = new Date(anchor);
      for (let count = 0; month < start && count < 120; count++) {
        const nextMonth = new Date(
          month.getFullYear(),
          month.getMonth() + 1,
          1,
        );
        const priorSpent = transactions
          .filter(
            (t) =>
              t.type === "expense" &&
              new Date(t.date) >= month &&
              new Date(t.date) < nextMonth,
          )
          .reduce((sum, t) => sum + Number(t.amount), 0);
        carryover = Math.max(0, carryover + baseBudget - priorSpent);
        month.setMonth(month.getMonth() + 1);
      }
    }
  }
  const total = baseBudget + carryover;
  const daily = days ? total / days : 0;
  const beforeToday = Math.max(
    0,
    Math.min(total - spent + todaySpent, availableBalance + todaySpent),
  );
  const safePerDay = !active
    ? 0
    : settings.rollover === false
      ? Math.min(daily, beforeToday)
      : beforeToday / Math.max(1, remainingDays);
  const remaining = Math.max(0, total - spent);
  const leftToday = Math.max(0, Math.min(remaining, safePerDay - todaySpent));
  return {
    start,
    end,
    days,
    remainingDays,
    active,
    total,
    baseBudget,
    carryover,
    spent,
    todaySpent,
    safePerDay,
    leftToday,
    baseDaily: daily,
    remaining,
    percent: safePerDay ? todaySpent / safePerDay : todaySpent ? 2 : 0,
  };
}
