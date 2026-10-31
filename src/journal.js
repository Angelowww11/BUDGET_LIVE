import { dayKey, periodBounds } from "./budget.js";
import { localDate, filterTransactions } from "./model.js";
import { transactionAccountId } from "./accounts.js";

export function journalRange(mode, anchor) {
  const date = localDate(anchor);
  let start = new Date(date),
    end = new Date(date);
  if (mode === "all") return { from: "", to: "", label: "All time" };
  if (mode === "week") {
    start = periodBounds(date, "weekly").start;
    end = new Date(start);
    end.setDate(start.getDate() + 6);
  } else if (mode === "month") {
    start = new Date(date.getFullYear(), date.getMonth(), 1);
    end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  }
  const fmt = (d) =>
    d.toLocaleDateString("en", { month: "short", day: "numeric" });
  const label =
    mode === "day"
      ? date.toLocaleDateString("en", {
          weekday: "short",
          month: "long",
          day: "numeric",
          year: "numeric",
        })
      : mode === "month"
        ? date.toLocaleDateString("en", { month: "long", year: "numeric" })
        : `${fmt(start)} – ${fmt(end)}, ${end.getFullYear()}`;
  return { from: dayKey(start), to: dayKey(end), label };
}

export function shiftJournalDate(mode, anchor, step) {
  const date = localDate(anchor);
  if (mode === "month") {
    date.setDate(1);
    date.setMonth(date.getMonth() + step);
  } else date.setDate(date.getDate() + step * (mode === "week" ? 7 : 1));
  return dayKey(date);
}

export function journalItems(data, ctx, filtered = true) {
  const range = journalRange(ctx.activityPeriod, ctx.activityDate);
  const f = filtered ? ctx.filters : {};
  const from = [range.from, f.from].filter(Boolean).sort().at(-1) || "";
  const to = [range.to, f.to].filter(Boolean).sort()[0] || "";
  const entries = f.accountId
    ? data.transactions.filter(
        (t) => transactionAccountId(data, t) === f.accountId,
      )
    : data.transactions;
  return filterTransactions(entries, { ...f, month: "", from, to });
}
