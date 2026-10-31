import { dayKey } from "./budget.js";
export const round = (n) =>
  Math.round((Number(n) + Number.EPSILON) * 100) / 100;
export const total = (items) =>
  round(items.reduce((n, t) => n + Number(t.amount), 0));
export const monthKey = (date) => dayKey(date).slice(0, 7);
export const inMonth = (items, month) =>
  items.filter((t) => monthKey(t.date) === month);
export const localDate = (date) => new Date(`${date}T12:00:00`);
export const monthDate = (month) => new Date(`${month}-01T12:00:00`);
export const shiftMonth = (month, amount) => {
  const d = monthDate(month);
  d.setMonth(d.getMonth() + amount);
  return monthKey(d);
};
export const daysBetween = (start, end) =>
  Math.round(
    (Date.UTC(end.getFullYear(), end.getMonth(), end.getDate()) -
      Date.UTC(start.getFullYear(), start.getMonth(), start.getDate())) /
      86400000,
  );
export function parseAmount(value) {
  const n = Number(String(value).replace(/[,\s]/g, ""));
  if (!Number.isFinite(n) || n <= 0 || n > 1e12)
    throw new Error("Enter an amount greater than zero.");
  return round(n);
}
export function categoryTotals(items) {
  const map = new Map();
  for (const t of items.filter((t) => t.type === "expense"))
    map.set(t.category, round((map.get(t.category) || 0) + Number(t.amount)));
  return [...map].sort((a, b) => b[1] - a[1]);
}
export function advanceDueDate(date, frequency, anchorDay) {
  const d = localDate(date);
  if (frequency === "once") return null;
  if (frequency === "weekly" || frequency === "biweekly")
    d.setDate(d.getDate() + (frequency === "weekly" ? 7 : 14));
  else {
    const day = anchorDay || d.getDate();
    d.setDate(1);
    d.setMonth(d.getMonth() + (frequency === "yearly" ? 12 : 1));
    d.setDate(
      Math.min(day, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()),
    );
  }
  return dayKey(d);
}
export function nextDueDateForDay(day, from = new Date()) {
  const d = new Date(from);
  d.setHours(0, 0, 0, 0);
  const scheduled = (year, month) =>
    new Date(
      year,
      month,
      Math.min(Number(day), new Date(year, month + 1, 0).getDate()),
    );
  let date = scheduled(d.getFullYear(), d.getMonth());
  if (date < d) date = scheduled(d.getFullYear(), d.getMonth() + 1);
  return dayKey(date);
}
export function activityStreak(items, today = new Date()) {
  const days = new Set(items.map((t) => dayKey(t.date)));
  const cursor = new Date(today);
  if (!days.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days.has(dayKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
export function filterTransactions(
  items,
  {
    month,
    query = "",
    type = "all",
    category = "",
    method = "",
    from = "",
    to = "",
  },
) {
  const q = query.trim().toLowerCase();
  return items
    .filter(
      (t) =>
        (!month || monthKey(t.date) === month) &&
        (type === "all" || t.type === type) &&
        (!category || t.category === category) &&
        (!method || (t.paymentMethod || "cash") === method) &&
        (!from || dayKey(t.date) >= from) &&
        (!to || dayKey(t.date) <= to) &&
        (!q ||
          `${t.category} ${t.note || ""} ${(t.tags || []).join(" ")}`
            .toLowerCase()
            .includes(q)),
    )
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}
