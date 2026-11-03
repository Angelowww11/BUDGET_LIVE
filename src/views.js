import { paydayFields, salaryFields } from "./payday-ui.js";
import {
  budgetSummary,
  budgetFromAvailableBalance,
  dayKey,
  nextSalaryDate,
  salaryBounds,
  salarySlots,
} from "./budget.js";
import { categoryNames, categoryMeta, categoryBadge } from "./categories.js";
import { icon } from "./icons.js";
import { colorMode, themeSwatch } from "./appearance.js";
import {
  accountsPanel,
  accountsView,
  entryAccountLabel,
  accountArtwork,
} from "./accounts-ui.js";
import { accountSummary, accountTypes } from "./accounts.js";
import { journalRange, journalItems } from "./journal.js";
import {
  total,
  inMonth,
  monthTotals,
  monthKey,
  monthDate,
  shiftMonth,
  localDate,
  daysBetween,
  paidThisMonth,
  categoryTotals,
  activityStreak,
} from "./model.js";
import {
  esc,
  money,
  button,
  iconButton,
  empty,
  percent,
  progress,
  frequencyLabels,
  dayOrdinal,
} from "./ui.js";

const planAmount = (data) =>
  data.settings.budgetSource === "accounts"
    ? budgetFromAvailableBalance(
        data.settings,
        data.transactions,
        accountSummary(data).spendable,
      )
    : data.settings.budget;
const title = (eyebrow, heading, detail, action = "") =>
  `<div class="page-heading"><div><p class="eyebrow">${eyebrow}</p><h1>${heading}</h1>${detail ? `<p class="page-description">${detail}</p>` : ""}</div>${action}</div>`;
export function monthPicker(month) {
  return `<div class="month-picker">${iconButton("Previous month", "previous-month", "caret-left")}<label class="month-label"><span>${monthDate(month).toLocaleDateString("en", { month: "long", year: "numeric" })}</span><input type="month" aria-label="Select month" id="selected-month" value="${month}"></label>${iconButton("Next month", "next-month", "caret-right")}</div>`;
}
function panelHead(name, description = "", action = "") {
  return `<div class="panel-heading"><div><h2>${name}</h2>${description ? `<p>${description}</p>` : ""}</div>${action}</div>`;
}

export function transactionList(
  data,
  items,
  { limit = Infinity, compact = false } = {},
) {
  if (!items.length)
    return empty(
      "A fresh page for your money",
      "Add your first transaction. Small habits start here.",
      "receipt",
      "add-entry",
      "Add a transaction",
    );
  const groups = new Map();
  for (const t of items.slice(0, limit)) {
    const key = dayKey(t.date);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(t);
  }
  const today = dayKey(new Date());
  return `<div class="transaction-groups ${compact ? "compact" : ""}">${[
    ...groups,
  ]
    .map(([date, rows]) => {
      const daily = rows.reduce(
        (n, t) =>
          n + (t.type === "income" ? Number(t.amount) : -Number(t.amount)),
        0,
      );
      return `<section class="day-group"><div class="day-heading"><h3>${date === today ? "Today" : localDate(date).toLocaleDateString("en", { month: "short", day: "numeric", weekday: "short" })}</h3><span>${daily > 0 ? "+" : daily < 0 ? "−" : ""}${money(Math.abs(daily), data.settings.currency)}</span></div><div class="transaction-list">${rows.map((t) => `<button class="transaction-row" data-action="edit-entry" data-id="${esc(t.id)}" aria-label="Edit ${esc(t.category)} ${esc(money(t.amount, data.settings.currency))}">${categoryBadge(data, t.category, t.type)}<span class="transaction-copy"><strong>${esc(t.note || t.category)}</strong><span>${esc(t.category)}<i>·</i>${esc(entryAccountLabel(data, t))}${t.tags?.length ? `<i>·</i>${esc(t.tags[0])}` : ""}</span></span><span class="transaction-amount ${t.type}">${t.type === "income" ? "+" : "−"}${money(t.amount, data.settings.currency)}</span>${icon("caret-right", "row-chevron")}</button>`).join("")}</div></section>`;
    })
    .join("")}</div>`;
}

function weekChart(data) {
  const now = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (6 - i));
    const amount = total(
      data.transactions.filter(
        (t) => t.type === "expense" && dayKey(t.date) === dayKey(d),
      ),
    );
    return { date: d, amount };
  });
  const max = Math.max(...days.map((d) => d.amount), 1);
  const sum = days.reduce((n, d) => n + d.amount, 0);
  return `<div class="week-chart" role="group" aria-label="Daily expenses over the last seven days">${days.map((d, i) => `<button class="chart-day ${i === 6 ? "today" : ""}" data-action="day-activity" data-date="${dayKey(d.date)}" aria-label="${d.date.toLocaleDateString("en", { weekday: "long", month: "short", day: "numeric" })}: ${money(d.amount, data.settings.currency)}"><span class="bar-label">${d.amount ? money(d.amount, data.settings.currency, true) : "—"}</span><span class="bar-track"><span style="height:${d.amount ? Math.max(7, (d.amount / max) * 100) : 0}%"></span></span><span class="weekday">${i === 6 ? "Today" : d.date.toLocaleDateString("en", { weekday: "short" })}</span></button>`).join("")}</div><div class="chart-footer"><span>7-day total</span><strong>${money(sum, data.settings.currency)}</strong><span class="muted">Tap a day to see its entries</span></div>`;
}

function budgetRing(data, s) {
  const pct = percent(s.spent, s.total);
  return `<div class="budget-ring-wrap"><svg class="budget-ring" viewBox="0 0 144 144" aria-hidden="true"><circle cx="72" cy="72" r="59" class="ring-track"/><circle cx="72" cy="72" r="59" class="ring-value ${s.spent > s.total ? "over" : ""}" stroke-dasharray="${pct * 3.707} 370.7" transform="rotate(-90 72 72)"/></svg><div class="ring-label"><strong>${s.total ? `${Math.round(pct)}<small>%</small>` : "—"}</strong><span>${s.total ? "of budget used" : "No budget set yet"}</span></div></div>`;
}

const financeVignette = `<svg class="finance-vignette" viewBox="0 0 140 116" aria-hidden="true"><path d="M18 85h109" class="vignette-ground"/><rect x="37" y="18" width="63" height="78" rx="5" class="vignette-paper" transform="rotate(9 68 56)"/><path d="M53 34l31 5M51 44l20 3M49 55l31 5" class="vignette-lines"/><path d="M23 55l64-9a6 6 0 0 1 7 6v46H29a6 6 0 0 1-6-6z" class="vignette-wallet"/><path d="M24 62h70M84 75h18v17H84a8.5 8.5 0 0 1 0-17z" class="vignette-stitch"/><circle cx="88" cy="83.5" r="1.5" fill="currentColor"/><circle cx="111" cy="51" r="15" class="vignette-coin"/><path d="M111 43v16m-4-12h6a3 3 0 0 1 0 6h-6m0-3h6" class="vignette-lines"/></svg>`;

export function homeView(ctx) {
  const { data } = ctx,
    now = new Date(),
    c = data.settings.currency;
  const m = monthTotals(data, monthKey(now)),
    accounts = accountSummary(data),
    today = dayKey(now);
  const s = budgetSummary(
    data.settings,
    data.transactions,
    now,
    accounts.configured || data.settings.budgetSource === "accounts"
      ? accounts.spendable
      : Infinity,
  );
  const todayEntries = data.transactions
    .filter((t) => t.type === "expense" && dayKey(t.date) === today)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  const recentIncome = data.transactions
    .filter((t) => t.type === "income" && new Date(t.date) <= now)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  const pairs = categoryTotals(todayEntries),
    setup = s.total === 0;
  const salary = salaryBounds(data.settings),
    salaryDays = salarySlots(data.settings)
      .map((slot) => dayOrdinal(slot.day))
      .join(" & ");
  const cycleName =
    data.settings.cycle === "salary"
      ? "salary period"
      : data.settings.cycle === "payday"
        ? "allowance period"
        : data.settings.cycle === "monthly"
          ? "month"
          : data.settings.cycle === "weekly"
            ? "week"
            : "2 weeks";
  const adjusted = Math.abs(s.safePerDay - s.baseDaily) > 0.005;
  const upcoming = [...data.bills]
    .filter((b) => !b.completed)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 2);
  return `<div class="page-heading money-page-heading"><div><p class="eyebrow">${now.toLocaleDateString("en", { weekday: "long", month: "long", day: "numeric" })}</p><h1>Your money, in view<span class="handwritten-dot">.</span></h1></div>${financeVignette}${button("Add transaction", "add-entry", "plus", "button primary desktop-only")}</div>
  <div class="overview-flow" aria-label="This month’s cash flow"><button data-action="month-flow" data-value="income"><span class="flow-emblem income">${icon("arrow-down-left")}</span><span><small>Income this month</small><strong>${money(m.income, c)}</strong></span>${icon("caret-right")}</button><button data-action="month-flow" data-value="expense"><span class="flow-emblem expense">${icon("arrow-up-right")}</span><span><small>Spent this month</small><strong>${money(m.expense, c)}</strong></span>${icon("caret-right")}</button></div>
  <div class="dashboard-grid"><div class="dashboard-main">
  <section class="daily-card balance-first"><div class="daily-heading"><span class="eyebrow">AVAILABLE THIS PERIOD</span>${button("Edit plan", "budget-dialog", "pencil-simple", "text-button")}</div><div class="daily-amount">${money(s.remaining, c)}</div><div class="budget-subline"><span>${money(s.spent, c)} spent of ${money(s.total, c)} this ${cycleName}</span><span>${s.remainingDays} ${s.remainingDays === 1 ? "day" : "days"} left</span></div>
  ${setup ? `<div class="setup-actions">${button("Set my budget", "budget-dialog", "arrow-right", "button primary")}${button("Explore a sample", "start-demo", "", "button plain")}</div>` : `<div class="budget-equation" role="group" aria-label="${data.settings.rollover === false ? "Fixed daily limit" : "Current daily spending limit"}"><span>${money(s.dailyPool, c)}</span><i>÷</i><span>${s.remainingDays} days</span><i>=</i><strong>${money(s.dailyPool / Math.max(1, s.remainingDays), c)}<small>/ day</small></strong></div>`}
  ${data.settings.cycle === "salary" && salary ? `<div class="payday-summary salary-summary">${icon("briefcase")}<span><strong>Next salary<br>${salary.end.toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}</strong><small>${salary.next.amount ? money(salary.next.amount, c) : "Amount not set"} · ${salaryDays} each month</small></span>${button("Change paydays", "edit-salary", "", "text-button")}</div>` : data.settings.cycle === "payday" ? `<div class="payday-summary">${icon("calendar-dots")}<span><strong>${s.active ? "Next allowance" : new Date() < s.start ? "Budget starts" : "Allowance date reached"}<br>${(new Date() < s.start ? s.start : s.end).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}</strong><small>${s.active ? `${s.remainingDays} spending days left, including today` : "Edit your plan to set the money and dates for your next allowance."}</small></span>${button("Change dates", "budget-dialog", "", "text-button")}</div>` : ""}<div class="today-budget-grid"><div><span>${adjusted ? "Adjusted limit today" : "Daily budget"}</span><strong>${money(s.safePerDay, c)}</strong></div><div><span>Spent today</span><strong class="${s.todaySpent > s.safePerDay ? "expense" : ""}">${money(s.todaySpent, c)}</strong></div><div class="today-left"><span>Left to spend today</span><strong>${money(s.leftToday, c)}</strong></div></div>${progress(s.todaySpent, s.safePerDay, "Today’s budget used", s.percent >= 0.8)}
  ${!setup ? `<p class="allowance-note">${icon(data.settings.rollover ? "arrows-clockwise" : "calendar-blank")}${data.settings.rollover ? `Flexible rollover is on. Unspent money is shared across the ${s.remainingDays} remaining days.` : `Fixed daily cap: ${money(s.baseDaily, c)}. Available funds are also spread over the days left.`}${button(data.settings.rollover ? "Use fixed limit" : "Change", data.settings.rollover ? "fixed-daily-limit" : "budget-dialog", "", "text-button")}</p>` : ""}
  <button class="overview-account-link" data-action="view-accounts">${icon("wallet")}<span>Overall account balance <strong>${money(accounts.total, c)}</strong></span>${icon("caret-right")}</button></section>
  <section class="account-glance" aria-label="Account balances">${panelHead("Your accounts", "Cash, banks, and money set aside.", button("Manage", "view-accounts", "arrow-right", "text-button"))}<div class="account-rail" tabindex="0" aria-label="Scroll through accounts">${accounts.accounts.map((a) => `<button class="account-pocket" data-action="account-activity" data-id="${esc(a.id)}" style="--pocket-color:${accountTypes[a.type]?.color || "var(--accent)"}">${accountArtwork(a)}<span>${esc(a.name)}</span><strong>${money(a.balance, c)}</strong><small>${a.includeInSpending ? "For spending" : "Set aside"}</small></button>`).join("")}</div>${button("Move between accounts", "transfer", "arrows-clockwise", "text-button rail-transfer")}</section>
  <section class="panel today-spending-panel">${panelHead("Today’s spending", `${todayEntries.length} ${todayEntries.length === 1 ? "expense" : "expenses"} · ${money(s.todaySpent, c)} spent`, button("Day view", "today-activity", "arrow-right", "text-button"))}${
    pairs.length
      ? `<div class="today-category-tags">${pairs
          .slice(0, 4)
          .map(
            ([cat, value]) =>
              `<button data-action="today-category" data-category="${esc(cat)}">${categoryBadge(data, cat)}<span>${esc(cat)}<b>${money(value, c)}</b></span></button>`,
          )
          .join(
            "",
          )}</div>${transactionList(data, todayEntries, { limit: 4, compact: true })}`
      : empty(
          "No spending today",
          "No expenses today yet. Your earlier entries are in Activity.",
          "sun",
          "add-entry",
          "Log an expense",
        )
  }</section>
  <section class="panel">${panelHead("Recent income", `${money(m.income, c)} received this month`, button("All income", "income-activity", "arrow-right", "text-button"))}${recentIncome.length ? transactionList(data, recentIncome, { limit: 3, compact: true }) : empty("No income recorded yet", "Add an allowance, salary, or other money received.", "arrow-down-left", "add-income", "Add income")}</section>
  <section class="panel quick-panel">${panelHead("Quick entries", "The usuals, without the extra taps.", button("New shortcut", "add-template", "plus", "text-button"))}<div class="shortcut-grid">${data.templates.length ? data.templates.map((t) => `<div class="shortcut"><button class="shortcut-log" data-action="quick-add" data-id="${esc(t.id)}">${categoryBadge(data, t.category)}<span><strong>${esc(t.name || t.category)}</strong><small>${money(t.amount, c)}</small></span></button>${iconButton(`Edit ${t.name || t.category} shortcut`, "edit-template", "dots-three", `data-id="${esc(t.id)}"`)}</div>`).join("") : `<button class="shortcut-placeholder" data-action="add-template">${icon("bookmark-simple")}<span>Save your coffee, commute, or lunch.<small>One tap next time.</small></span>${icon("plus")}</button>`}</div></section>
  <section class="panel">${panelHead("Spending this week", "Tap any day to open its entries.", button("Week view", "week-activity", "arrow-right", "text-button"))}${weekChart(data)}</section>

  </div><aside class="dashboard-side" aria-label="Accounts and budget summary">${accountsPanel(data)}
  <section class="panel period-mini-panel">${panelHead(`This ${cycleName}’s budget`)}${budgetRing(data, s)}<div class="key-value"><span>Starting budget</span><strong>${money(s.total, c)}</strong></div><div class="key-value"><span>Spent so far</span><strong>${money(s.spent, c)}</strong></div><div class="key-value"><span>Still available</span><strong>${money(s.remaining, c)}</strong></div><div class="panel-note">${icon("calendar-dots")}<span>${money(s.baseDaily, c)} × ${s.days} days in this period.</span></div></section>
  <section class="panel cashflow-panel">${panelHead("This month’s flow")}<div class="flow-item"><span class="flow-icon income">${icon("arrow-down-left")}</span><span>Money in</span><strong>${money(m.income, c)}</strong></div><div class="flow-item"><span class="flow-icon expense">${icon("arrow-up-right")}</span><span>Money out</span><strong>${money(m.expense, c)}</strong></div><div class="key-value flow-net"><span>Net this month</span><strong>${money(m.net, c)}</strong></div></section>
  <section class="panel">${panelHead("On the horizon", "", button("Plan", "view-bills", "arrow-right", "text-button"))}${upcoming.length ? upcoming.map((b) => billRow(data, b, true)).join("") : `<div class="mini-empty">${icon("calendar-dots")}<p>Make room for what’s coming.</p>${button("Add a bill", "add-bill", "plus", "text-button")}</div>`}</section></aside></div>`;
}

export function activityView(ctx) {
  const { data, filters } = ctx,
    c = data.settings.currency,
    range = journalRange(ctx.activityPeriod, ctx.activityDate);
  const all = journalItems(data, ctx),
    selected = all,
    income = total(all.filter((t) => t.type === "income")),
    expense = total(all.filter((t) => t.type === "expense"));
  const cats = [...new Set(data.transactions.map((t) => t.category))].sort();
  const rangePicker =
    ctx.activityPeriod === "all"
      ? '<span class="soft-badge">All recorded entries</span>'
      : `<div class="month-picker journal-picker">${iconButton("Previous period", "previous-range", "caret-left")}<label class="month-label"><span>${esc(range.label)}</span><input id="activity-date" type="${ctx.activityPeriod === "month" ? "month" : "date"}" aria-label="Choose ${ctx.activityPeriod === "week" ? "a day in the week" : ctx.activityPeriod}" value="${ctx.activityPeriod === "month" ? ctx.activityDate.slice(0, 7) : ctx.activityDate}"></label>${iconButton("Next period", "next-range", "caret-right")}</div>`;
  return `${title("YOUR MONEY JOURNAL", "Activity", "Review income and expenses by day, week, or month.", rangePicker)}<div class="journal-controls"><div class="segmented journal-periods" role="group" aria-label="Activity period">${[
    ["day", "Day"],
    ["week", "Week"],
    ["month", "Month"],
    ["all", "All time"],
  ]
    .map(
      ([value, label]) =>
        `<button data-action="activity-period" data-value="${value}" class="${ctx.activityPeriod === value ? "selected" : ""}" aria-pressed="${ctx.activityPeriod === value}">${label}</button>`,
    )
    .join(
      "",
    )}</div>${button("Today", "today-range", "sun", "button small outline")}</div>
  <div class="stats-strip"><div>${icon("arrow-down-left", "income")}<span>Income in this view<strong id="view-income">${money(income, c)}</strong></span></div><div>${icon("arrow-up-right", "expense")}<span>Spent in this view<strong id="view-spent">${money(expense, c)}</strong></span></div><div>${icon("wallet")}<span>Net in this view<strong id="view-net">${money(income - expense, c)}</strong></span></div></div>
  <section class="panel"><div class="activity-tools"><div class="segmented" role="group" aria-label="Transaction type">${[
    ["all", "All entries"],
    ["expense", "Expenses"],
    ["income", "Income"],
  ]
    .map(
      ([value, label]) =>
        `<button data-action="filter-type" data-value="${value}" class="${filters.type === value ? "selected" : ""}" aria-pressed="${filters.type === value}">${label}</button>`,
    )
    .join(
      "",
    )}</div><div class="activity-search">${icon("magnifying-glass")}<input id="transaction-search" type="search" placeholder="Search notes, categories, tags…" aria-label="Search transactions" value="${esc(filters.query)}"></div>${iconButton("Toggle filters", "toggle-filters", "sliders-horizontal", `aria-expanded="${ctx.showFilters}"`)}</div>
  ${ctx.showFilters ? `<div class="filter-grid"><label>Category<select id="filter-category"><option value="">All categories</option>${cats.map((cat) => `<option ${cat === filters.category ? "selected" : ""}>${esc(cat)}</option>`).join("")}</select></label><label>Account<select id="filter-accountId"><option value="">All accounts</option>${data.accounts.map((a) => `<option value="${esc(a.id)}" ${filters.accountId === a.id ? "selected" : ""}>${esc(a.name)}</option>`).join("")}</select></label><label>From (within this view)<input type="date" id="filter-from" value="${esc(filters.from)}"></label><label>To<input type="date" id="filter-to" value="${esc(filters.to)}"></label>${button("Clear filters", "clear-filters", "", "text-button")}</div>` : ""}<div class="list-summary"><span id="results-count">${selected.length} ${selected.length === 1 ? "entry" : "entries"}</span>${button("Export CSV", "export-csv", "export", "text-button")}</div><div id="transaction-results">${selected.length ? transactionList(data, selected) : empty("No entries for this view", "Choose another day or week, or log something here.", "calendar-blank", "add-entry", "Add a transaction")}</div></section>`;
}

function billRow(data, b, compact = false, editAction = "edit-bill") {
  const due = daysBetween(new Date(), localDate(b.dueDate));
  const dueText =
    due < 0
      ? `${Math.abs(due)}d overdue`
      : due === 0
        ? "Due today"
        : due === 1
          ? "Due tomorrow"
          : localDate(b.dueDate).toLocaleDateString("en", {
              month: "short",
              day: "numeric",
            });
  return `<div class="bill-row">${categoryBadge(data, b.category, b.type)}<div><strong>${esc(b.name)}</strong><span class="${due < 0 ? "expense" : ""}">${dueText}${compact ? "" : ` · ${frequencyLabels[b.frequency] || "Monthly"}`}</span></div><strong class="bill-amount">${money(b.amount, data.settings.currency)}</strong>${compact ? "" : `<div class="bill-actions">${paidThisMonth(data.transactions, b) ? `<button type="button" class="button small soft" disabled aria-disabled="true" title="Already logged this month. You can log it again next month.">${icon("check")}<span>${b.type === "income" ? "Received this month" : "Paid this month"}</span></button>` : button(b.type === "income" ? "Received" : "Mark paid", "pay-bill", "check", "button small soft", `data-id="${esc(b.id)}"`)}${iconButton("Edit recurring entry", editAction, "pencil-simple", `data-id="${esc(b.id)}"`)}</div>`}</div>`;
}

function goalCard(data, g, compact = false) {
  const c = data.settings.currency,
    pct = percent(g.saved, g.target),
    remaining = Math.max(0, g.target - g.saved);
  const days = g.deadline
    ? Math.max(1, daysBetween(new Date(), localDate(g.deadline)))
    : 0;
  const suggestions =
    days && remaining
      ? `${money(remaining / Math.max(1, Math.ceil(days / 7)), c)} per week to reach your date`
      : remaining
        ? `${money(remaining, c)} to go. One small step at a time.`
        : "You made it. A goal worth celebrating.";
  return `<section class="panel goal-card"><div class="goal-top"><span class="goal-art">${icon(g.icon || "piggy-bank")}</span>${iconButton(`Edit ${g.name}`, "edit-goal", "dots-three", `data-id="${esc(g.id)}"`)}</div><h3>${esc(g.name)}</h3><div class="goal-amount"><strong>${money(g.saved, c)}</strong><span>of ${money(g.target, c)}</span></div>${progress(g.saved, g.target, `${g.name} progress`)}<div class="goal-meta"><span>${Math.round(pct)}% saved</span><span>${g.deadline ? localDate(g.deadline).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" }) : "No deadline"}</span></div><p class="small muted goal-suggestion">${suggestions}</p>${button("Add savings", "contribute", "plus", "button soft full", `data-id="${esc(g.id)}"`)}</section>`;
}

export function planView(ctx) {
  const { data, planTab } = ctx,
    c = data.settings.currency,
    month = monthKey(new Date()),
    m = monthTotals(data, month);
  const action =
    planTab === "goals"
      ? button("New goal", "add-goal", "plus")
      : planTab === "bills"
        ? button("New recurring entry", "add-bill", "plus")
        : planTab === "monthly"
          ? button("New monthly bill", "add-monthly-bill", "plus")
          : planTab === "salary"
            ? button(
                "Edit paydays",
                "edit-salary",
                "pencil-simple",
                "button soft",
              )
            : button("Set a category limit", "add-limit", "plus");
  let content;
  if (planTab === "goals") {
    const saved = data.goals.reduce((n, g) => n + Number(g.saved), 0);
    content = `<div class="plan-banner"><span class="banner-art">${icon("piggy-bank")}</span><div><span class="eyebrow">SMALL STEPS, BIGGER POSSIBILITIES</span><h2>${money(saved, c)} saved toward your goals</h2><p>Savings are tracked separately from your spending budget.</p></div></div><div class="goal-grid">${data.goals.map((g) => goalCard(data, g)).join("")}</div>${data.goals.length ? "" : `<section class="panel">${empty("Give your savings a purpose", "An emergency fund, a trip, or something just for you.", "piggy-bank", "add-goal", "Create a goal")}</section>`}`;
  } else if (planTab === "salary") {
    const salary = data.settings.salary || {},
      slots = salarySlots(data.settings),
      totalSalary = slots.reduce((sum, slot) => sum + slot.amount, 0),
      bounds = salaryBounds(data.settings),
      salaryDays = slots.map((slot) => dayOrdinal(slot.day)).join(" & ");
    if (!salary.enabled)
      content = `<div class="plan-banner"><span class="banner-art">${icon("briefcase")}</span><div><span class="eyebrow">SALARY PAYDAYS</span><h2>Two paydays, one clear plan.</h2><p>Add the two dates your salary usually arrives and the amount for each.</p></div>${button("Set paydays", "edit-salary", "plus", "button soft")}</div><section class="panel">${empty("Let your paydays do the planning", "Add dates such as the 15th and 30th. You can also make your spending plan reset on each payday.", "briefcase", "edit-salary", "Set salary paydays")}</section>`;
    else
      content = `<div class="plan-banner salary-banner"><span class="banner-art">${icon("briefcase")}</span><div><span class="eyebrow">SALARY PAYDAYS</span><h2>${totalSalary ? money(totalSalary, c) : "Two paydays"} <small>/ month</small></h2><p>${salaryDays}${bounds ? ` · Next ${bounds.end.toLocaleDateString("en", { month: "short", day: "numeric" })}` : ""}${data.settings.cycle === "salary" ? " · Your spending plan follows these dates" : ""}</p></div>${button("Edit paydays", "edit-salary", "pencil-simple", "button soft")}</div><div class="salary-grid">${slots
        .map((slot) => {
          const next = nextSalaryDate(slot.day),
            days = daysBetween(new Date(), next);
          return `<section class="panel salary-card"><div class="salary-card-top"><span class="salary-day">${dayOrdinal(slot.day)}</span>${button(slot.amount ? "Log salary" : "Set amount", "log-salary", slot.amount ? "check" : "pencil-simple", "button small soft", `data-day="${slot.day}"`)}</div><strong class="salary-amount">${slot.amount ? money(slot.amount, c) : "Amount not set"}</strong><p class="small muted">Next payday: ${next.toLocaleDateString("en", { weekday: "short", month: "short", day: "numeric" })}${days === 0 ? " · today" : days === 1 ? " · tomorrow" : ` · in ${days} days`}</p></section>`;
        })
        .join(
          "",
        )}</div><div class="info-banner">${icon("wallet")}<p>${data.settings.cycle === "salary" ? `Each spending period runs from one payday to the next. Logging a salary adds an income entry${data.settings.budgetSource === "accounts" ? " and updates your plan." : "; adjust the plan separately when you want to spend more."}` : "Your spending plan is not using these dates yet."}${data.settings.cycle !== "salary" ? ` ${button("Use for my spending plan", "use-salary-plan", "", "text-button")}` : ""}</p></div>`;
  } else if (planTab === "monthly") {
    const bills = data.bills
      .filter(
        (b) =>
          !b.completed &&
          (b.type || "expense") === "expense" &&
          b.frequency === "monthly",
      )
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    const monthlyTotal = bills.reduce((sum, b) => sum + Number(b.amount), 0),
      next = bills[0];
    content = `<div class="plan-banner monthly-bills-banner"><span class="banner-art">${icon("repeat")}</span><div><span class="eyebrow">RECURRING MONTHLY BILLS</span><h2>${money(monthlyTotal, c)} <small>/ month</small></h2><p>${bills.length} ${bills.length === 1 ? "bill or subscription" : "bills and subscriptions"}${next ? ` · Next: ${esc(next.name)} on ${localDate(next.dueDate).toLocaleDateString("en", { month: "short", day: "numeric" })}` : ""}</p></div>${button("Add monthly bill", "add-monthly-bill", "plus", "button soft")}</div><section class="panel">${panelHead("Subscriptions & monthly bills", "The recurring expenses that show up every month.")}${bills.length ? bills.map((b) => billRow(data, b, false, "edit-monthly-bill")).join("") : empty("No monthly bills yet", "Add streaming, internet, rent, or any subscription that repeats each month.", "repeat", "add-monthly-bill", "Add a monthly bill")}</section>`;
  } else if (planTab === "bills") {
    const bills = data.bills
      .filter((b) => !b.completed)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    content = `<div class="info-banner">${icon("calendar-dots")}<p>Plan ahead, then tap <strong>Mark paid</strong> to log an expense. Recurring dates move forward only when you confirm a payment. Monthly bills and subscriptions can also be managed in their own section.</p></div><section class="panel">${panelHead("All recurring entries", "Expected payments and income, in date order.")}${bills.length ? bills.map((b) => billRow(data, b)).join("") : empty("Nothing on the horizon yet", "Add rent, subscriptions, or your next payday.", "calendar-dots", "add-bill", "Add a recurring entry")}</section>`;
  } else {
    const by = Object.fromEntries(categoryTotals(m.tx));
    const limits = Object.entries(data.categoryBudgets).filter(
      ([, amount]) => amount > 0,
    );
    content = `<div class="plan-banner"><span class="banner-art">${icon("wallet")}</span><div><span class="eyebrow">YOUR SPENDING PLAN</span><h2>${money(planAmount(data), c)} <small>/ ${data.settings.cycle === "salary" ? "salary period" : data.settings.cycle === "payday" ? "allowance period" : data.settings.cycle === "biweekly" ? "2 weeks" : data.settings.cycle === "weekly" ? "week" : "month"}</small></h2><p>${data.settings.budgetSource === "accounts" ? "Following the money left in your spending accounts." : "The amount you choose to spend, separate from logged income."}</p></div>${button("Edit plan", "budget-dialog", "pencil-simple", "button soft")}</div><div class="section-title"><div><h2>Monthly category limits</h2><p>Keep a little structure around the things that add up.</p></div><span class="soft-badge">${monthDate(month).toLocaleDateString("en", { month: "long" })}</span></div><div class="limit-grid">${limits
      .map(([cat, limit]) => {
        const used = by[cat] || 0,
          pct = percent(used, limit);
        return `<button class="panel limit-card" data-action="edit-limit" data-category="${esc(cat)}"><div class="limit-heading">${categoryBadge(data, cat)}<strong>${esc(cat)}</strong>${icon("pencil-simple")}</div><div class="limit-amount"><strong>${money(used, c)}</strong><span>of ${money(limit, c)}</span></div>${progress(used, limit, `${cat} budget used`, used / limit >= 0.8)}<div class="limit-footer"><span class="${used > limit ? "expense" : ""}">${used > limit ? `${money(used - limit, c)} over` : `${money(limit - used, c)} left`}</span><span>${Math.round(pct)}%</span></div></button>`;
      })
      .join(
        "",
      )}</div>${limits.length ? "" : `<section class="panel">${empty("Let your categories do the planning", "Set a monthly cap for food, transport, or any category.", "list-checks", "add-limit", "Set a category limit")}</section>`}`;
  }
  return `${title("LOOKING AHEAD", "Your plan", "Manage budgets, savings, and recurring payments.", action)}<div class="subnav" role="group" aria-label="Plan sections">${[
    ["limits", "Spending limits", "wallet"],
    ["goals", "Savings goals", "target"],
    ["salary", "Paydays", "briefcase"],
    ["monthly", "Monthly bills", "repeat"],
    ["bills", "Upcoming", "calendar-dots"],
  ]
    .map(
      ([value, label, glyph]) =>
        `<button data-action="plan-tab" data-value="${value}" class="${planTab === value ? "selected" : ""}" aria-pressed="${planTab === value}">${icon(glyph)}${label}</button>`,
    )
    .join("")}</div>${content}`;
}

function categoryDonut(data, pairs) {
  const sum = pairs.reduce((n, [, v]) => n + v, 0);
  let offset = 0;
  const segments = pairs
    .map(([cat, value]) => {
      const length = sum ? (value / sum) * 376.99 : 0,
        color = categoryMeta(data, cat).color;
      const circle = `<circle cx="80" cy="80" r="60" fill="none" stroke="${color}" stroke-width="21" stroke-dasharray="${Math.max(0, length - 2)} ${376.99 - Math.max(0, length - 2)}" stroke-dashoffset="${-offset}"/>`;
      offset += length;
      return circle;
    })
    .join("");
  return `<div class="category-donut"><svg viewBox="0 0 160 160" aria-hidden="true"><circle cx="80" cy="80" r="60" class="donut-track" fill="none" stroke-width="21"/><g transform="rotate(-90 80 80)">${segments}</g></svg><div><span>Total spent</span><strong>${money(sum, data.settings.currency, true)}</strong></div></div>`;
}

function paceChart(data, month) {
  const start = monthDate(month),
    days = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);
  const items = inMonth(data.transactions, month).filter(
    (t) => t.type === "expense" && new Date(t.date) <= todayEnd,
  );
  const byDay = Array.from({ length: days }, (_, i) =>
    total(items.filter((t) => new Date(t.date).getDate() === i + 1)),
  );
  const showGuide = data.settings.cycle === "monthly";
  const max = Math.max(
    showGuide ? planAmount(data) : 0,
    ...byDay.reduce((a, v) => [...a, (a.at(-1) || 0) + v], []),
    1,
  );
  const today =
    month === monthKey(new Date())
      ? new Date().getDate()
      : month > monthKey(new Date())
        ? 0
        : days;
  let cumulative = 0;
  const points = byDay.slice(0, today).map((v, i) => {
    cumulative += v;
    return `${20 + (i / Math.max(1, days - 1)) * 660},${170 - (cumulative / max) * 140}`;
  });
  const budgetY = 170 - (planAmount(data) / max) * 140;
  return `<div class="pace-chart"><svg viewBox="0 0 700 200" role="img" aria-label="${showGuide ? "Cumulative spending compared with a steady monthly budget pace. Solid line is actual spending; dashed line is budget pace." : "Cumulative spending over the selected month."}"><path d="M20 30H680M20 100H680M20 170H680" class="chart-grid"/>${showGuide ? `<path d="M20 170 680 ${budgetY}" class="pace-guide"/>` : ""}${points.length ? `<polyline points="${points.join(" ")}" class="pace-actual"/>` : ""}<text x="20" y="194">1</text><text x="340" y="194">${Math.round(days / 2)}</text><text x="665" y="194">${days}</text></svg></div><div class="chart-legend"><span><i class="legend-line actual"></i>Actual spending</span>${showGuide ? '<span><i class="legend-line dashed"></i>Budget pace</span>' : ""}</div>`;
}

export function insightsView(ctx) {
  const { data, month } = ctx,
    c = data.settings.currency,
    m = monthTotals(data, month),
    pairs = categoryTotals(m.tx);
  const prev = monthTotals(data, shiftMonth(month, -1));
  const change =
    prev.expense > 0 ? ((m.expense - prev.expense) / prev.expense) * 100 : null;
  const top = pairs[0],
    biggest = m.tx
      .filter((t) => t.type === "expense")
      .sort((a, b) => Number(b.amount) - Number(a.amount))[0];
  const rate = m.income > 0 ? ((m.income - m.expense) / m.income) * 100 : null;
  return `${title("THE BIGGER PICTURE", "Insights", "Your income, spending, and savings over time.", monthPicker(month))}<div class="insight-metrics"><section class="panel metric-card"><span class="metric-icon income">${icon("arrow-down-left")}</span><span>Income</span><strong>${money(m.income, c)}</strong><small>${m.tx.filter((t) => t.type === "income").length} incoming entries</small></section><section class="panel metric-card"><span class="metric-icon expense">${icon("arrow-up-right")}</span><span>Expenses</span><strong>${money(m.expense, c)}</strong><small>${change === null ? "No previous month to compare" : `${Math.abs(change).toFixed(1)}% ${change >= 0 ? "more" : "less"} than last month`}</small></section><section class="panel metric-card"><span class="metric-icon">${icon("piggy-bank")}</span><span>Savings rate</span><strong>${rate === null ? "—" : `${Math.round(rate)}%`}</strong><small>${rate === null ? "Log income to see your rate" : "Income remaining after expenses"}</small></section></div><div class="insights-grid"><section class="panel">${panelHead("Where your money went", "Every category has its own story.")}<div class="donut-layout">${categoryDonut(data, pairs)}<div class="category-breakdown">${pairs.length ? pairs.map(([cat, value]) => `<button data-action="category-activity" data-category="${esc(cat)}">${categoryBadge(data, cat)}<span>${esc(cat)}<small>${Math.round((value / m.expense) * 100)}% of expenses</small></span><strong>${money(value, c)}</strong>${icon("caret-right")}</button>`).join("") : empty("Your picture is still taking shape", "Add an expense to see your spending mix.", "chart-pie-slice")}</div></div></section><section class="panel">${panelHead("Small things to notice")}<div class="insight-note">${icon("basket")}<div><h3>${top ? `${esc(top[0])} is your top category` : "Your top category will appear here"}</h3><p>${top ? `${money(top[1], c)}, or ${Math.round((top[1] / m.expense) * 100)}% of your spending this month.` : "As you log expenses, your spending patterns will become clearer."}</p></div></div><div class="insight-note">${icon("receipt")}<div><h3>${biggest ? "Your largest single expense" : "Every entry brings clarity"}</h3><p>${biggest ? `${money(biggest.amount, c)} for ${esc(biggest.note || biggest.category)}.` : "A short note helps you remember what a purchase was for."}</p></div></div><div class="insight-note">${icon("sun")}<div><h3>${activityStreak(data.transactions)}-day tracking streak</h3><p>Consistency matters more than perfection.</p></div></div></section><section class="panel wide-panel">${panelHead(data.settings.cycle === "monthly" ? "Spending vs. your plan" : "Spending through the month", "How your spending builds across the month.")}${paceChart(data, month)}</section></div>`;
}

export const themes = [
  ["green", "Sage", "#346b58", "#e4eee7"],
  ["blue", "Blue", "#315ed5", "#e5edff"],
  ["brown", "Mocha", "#805a43", "#ede2d6"],
  ["pink", "Blush", "#ae597d", "#f8e2eb"],
  ["yellow", "Sunshine", "#8c691b", "#fbebac"],
  ["lavender", "Lilac", "#79609e", "#eee5f5"],
  ["peach", "Peach", "#a45d3e", "#f9e5d8"],
  ["cherry", "Cherry", "#9b3e53", "#f5dfe5"],
  ["teal", "Lagoon", "#287b7b", "#dceeee"],
  ["dark", "Dark", "#a7c9ba", "#24322e"],
  ["night", "Navy night", "#b1bfec", "#242b43"],
  ["black", "Black", "#ececf2", "#101012"],
  ["blueblack", "Blue & Black", "#93b5ff", "#101a30"],
];

export function settingsView(ctx) {
  const { data, settingsTab } = ctx;
  let content;
  if (settingsTab === "appearance")
    content = `<section class="panel">${panelHead("Color palette", "Choose a color. Dark mode keeps your chosen palette.")}<div class="theme-grid">${themes.map(([id, name, accent, tint]) => `<button class="theme-preview ${data.settings.theme === id ? "selected" : ""}" data-action="theme" data-value="${id}" aria-pressed="${data.settings.theme === id}" style="--preview-accent:${themeSwatch(id, accent, tint, data.settings)[0]};--preview-tint:${themeSwatch(id, accent, tint, data.settings)[1]}"><span class="mini-preview"><i></i><i></i><i></i><i></i></span><span>${name}${data.settings.theme === id ? icon("check-circle") : ""}</span></button>`).join("")}</div></section>`;
  else if (settingsTab === "accounts") content = accountsView(ctx);
  else if (settingsTab === "categories")
    content = `<section class="panel">${panelHead("Make your categories yours", "Choose a name, icon, and color that you recognize instantly.", button("New category", "add-category", "plus", "button small primary"))}<div class="category-manager">${[
      "expense",
      "income",
    ]
      .map(
        (type) =>
          `<section><h3>${type === "expense" ? "Expenses" : "Income"}</h3>${categoryNames(
            data,
            type,
          )
            .map(
              (name) =>
                `<button class="manage-category" data-action="edit-category" data-category="${esc(name)}" data-type="${type}">${categoryBadge(data, name, type)}<span>${esc(name)}</span>${icon("pencil-simple")}</button>`,
            )
            .join("")}</section>`,
      )
      .join("")}</div></section>`;
  else if (settingsTab === "data")
    content = `<div class="settings-grid"><section class="panel">${panelHead("Keep a copy, keep your peace of mind", "Your records live on this device. A private backup lets you move them.")}<div class="backup-illustration">${icon("shield-check")}</div><div class="settings-actions">${button("Download full backup", "export-backup", "download-simple")}${button("Restore a backup", "restore-backup", "upload-simple", "button soft")}${button("Export transactions as CSV", "export-csv", "export", "button plain")}</div><p class="small muted">Last backup: ${data.settings.lastBackup ? new Date(data.settings.lastBackup).toLocaleString() : "No backup downloaded yet"}. Keep backup files somewhere private.</p></section><section class="panel">${panelHead("Your data, your device")}<div class="privacy-feature">${icon("lock-key")}<div><h3>Private by default</h3><p>No account, analytics, bank connection, or transaction uploads.</p></div></div><div class="privacy-feature">${icon("arrows-clockwise")}<div><h3>Built for updates</h3><p>App updates replace the interface, not your saved records. A previous copy is also kept on this device.</p></div></div><div class="privacy-feature">${icon("device-mobile")}<div><h3>Moving to a new device?</h3><p>Download a backup here and restore it there. Keep a backup before clearing browser data or installing on iPhone, where app storage can be separate.</p></div></div>${button("Request persistent storage", "persist-storage", "shield-check", "button soft")}<div class="panel-note"><span>Need a clean start? This removes all records and balances from this device after a double check.</span></div>${button("Reset all data", "reset-data", "trash", "button danger")}</section></div>`;
  else if (settingsTab === "install")
    content = `<section class="panel install-panel"><div class="install-app-art">${icon("device-mobile")}</div><span class="eyebrow">YOUR MONEY, WITH YOU</span><h2>A little more at home on your phone.</h2><p>Add M.Y.M.P. to your home screen. Open it like an app, keep logging offline, and pick up where you left off.</p>${button(ctx.installed ? "Already installed" : "Install M.Y.M.P.", "install", "download-simple", "button primary", ctx.installed ? "disabled" : "")}<div class="install-steps"><section><h3>Android</h3><p>Open this site in Chrome. Tap Install M.Y.M.P. above, or use the browser menu → Add to Home screen → Install.</p></section><section><h3>iPhone & iPad</h3><p>Open this site in Safari. Tap Share → Add to Home Screen, enable Open as Web App if shown, then tap Add.</p></section></div><div class="info-banner">${icon("shield-check")}<p>Before installing or changing devices, download a backup from Data & privacy. Some browsers keep installed-app storage separate.</p></div><span class="offline-status">${icon(ctx.offlineReady ? "check-circle" : "arrows-clockwise")}${ctx.offlineReady ? "Offline files are ready on this device" : "Open the app online once to prepare offline access"}</span></section>`;
  else
    content = `<div class="settings-grid"><section class="panel">${panelHead("A spending plan that fits you", "Choose a limit for this period.")}<form id="budget-settings" class="form"><label>Plan for this period<input name="budget" inputmode="decimal" required value="${esc(planAmount(data))}"></label>${data.settings.budgetSource === "accounts" ? '<input type="hidden" name="useAccountFunds" value="1"><p class="small muted">Following your spending accounts. Income, expenses, and deletions update this plan automatically.</p>' : ""}${accountSummary(data).configured ? '<button type="button" class="text-button" id="use-account-funds">Set plan from money left in accounts</button>' : ""}<div class="form-row"><label>Currency<select name="currency">${["PHP", "USD", "EUR", "GBP", "JPY", "AUD", "CAD", "SGD", "INR"].map((c) => `<option ${c === data.settings.currency ? "selected" : ""}>${c}</option>`).join("")}</select></label><label>Budget period<select name="cycle">${[
      ["monthly", "Monthly"],
      ["payday", "Until next allowance / income"],
      ["salary", "Twice monthly (salary dates)"],
      ["weekly", "Weekly"],
      ["biweekly", "Every 2 weeks"],
    ]
      .map(
        ([value, text]) =>
          `<option value="${value}" ${data.settings.cycle === value ? "selected" : ""}>${text}</option>`,
      )
      .join(
        "",
      )}</select></label></div>${paydayFields(data.settings)}${salaryFields(data.settings)}<label class="switch-label"><span><strong>Flexible daily allowance</strong><small>Adjust remaining days as you spend more or less.</small></span><input type="checkbox" role="switch" name="rollover" ${data.settings.rollover ? "checked" : ""}></label><p class="small muted">Your plan does not add money to an account. Record money received as income; set any money you already had in Accounts.</p><p class="form-error" role="alert"></p><button class="button primary" type="submit">${icon("check")}Save spending plan</button></form></section><section class="panel settings-companion"><span class="companion-art">${icon("flower-lotus")}</span><h2>A clearer spending plan</h2><p>The daily allowance helps you see what’s available. Some days cost more than others. You can adjust the plan whenever life changes.</p><div class="panel-note">${icon("wallet")}<span>${data.settings.budgetSource === "accounts" ? "Income and spending update your plan automatically while it follows your accounts." : "Logging income records money received. Change your spending plan when you want to make more of it available."}</span></div></section></div>`;
  return `${title("YOUR PREFERENCES", "Settings", "Accounts, appearance, and private data.")}<div class="appearance-shortcut">${icon(colorMode(data.settings) === "dark" ? "moon" : "sun")}<span><strong>Dark mode</strong><small>${colorMode(data.settings) === "dark" ? "On · an easier view after hours" : "Off · switch it on anytime"}</small></span><button class="mode-switch" data-action="toggle-dark" role="switch" aria-label="Dark mode" aria-checked="${colorMode(data.settings) === "dark"}"><i></i></button>${button("More themes", "view-themes", "arrow-right", "text-button")}</div><div class="subnav settings-nav" role="group" aria-label="Settings sections">${[
    ["general", "Spending plan", "wallet"],
    ["accounts", "Accounts", "credit-card"],
    ["appearance", "Themes", "sun"],
    ["categories", "Categories", "tag"],
    ["data", "Data & privacy", "shield-check"],
    ["install", "Install app", "device-mobile"],
  ]
    .map(
      ([value, label, glyph]) =>
        `<button data-action="settings-tab" data-value="${value}" class="${settingsTab === value ? "selected" : ""}" aria-pressed="${settingsTab === value}">${icon(glyph)}${label}</button>`,
    )
    .join("")}</div>${content}`;
}
