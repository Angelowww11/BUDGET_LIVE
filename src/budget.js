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
export function validatePayday(settings) {
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
  if (
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
export function budgetSummary(settings, transactions, today = new Date()) {
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
  const total = Math.max(0, Number(settings.budget) || 0);
  const daily = days ? total / days : 0;
  const beforeToday = Math.max(0, total - spent + todaySpent);
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
    spent,
    todaySpent,
    safePerDay,
    leftToday,
    baseDaily: daily,
    remaining,
    percent: safePerDay ? todaySpent / safePerDay : todaySpent ? 2 : 0,
  };
}
