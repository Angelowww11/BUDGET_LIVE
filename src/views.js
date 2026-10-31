import { budgetSummary, dayKey } from "./budget.js";
import { categoryNames, categoryMeta, categoryBadge } from "./categories.js";
import { icon } from "./icons.js";
import {
  total,
  inMonth,
  monthKey,
  monthDate,
  shiftMonth,
  localDate,
  daysBetween,
  categoryTotals,
  filterTransactions,
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
  methodLabels,
  frequencyLabels,
} from "./ui.js";

const title = (eyebrow, heading, detail, action = "") =>
  `<div class="page-heading"><div><p class="eyebrow">${eyebrow}</p><h1>${heading}</h1>${detail ? `<p class="page-description">${detail}</p>` : ""}</div>${action}</div>`;
export function monthPicker(month) {
  return `<div class="month-picker">${iconButton("Previous month", "previous-month", "caret-left")}<label class="month-label"><span>${monthDate(month).toLocaleDateString("en", { month: "long", year: "numeric" })}</span><input type="month" aria-label="Select month" id="selected-month" value="${month}"></label>${iconButton("Next month", "next-month", "caret-right")}</div>`;
}
export function monthTotals(data, month) {
  const tx = inMonth(data.transactions, month);
  const income = total(tx.filter((t) => t.type === "income"));
  const expense = total(tx.filter((t) => t.type === "expense"));
  return { tx, income, expense, net: income - expense };
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
      return `<section class="day-group"><div class="day-heading"><h3>${date === today ? "Today" : localDate(date).toLocaleDateString("en", { month: "short", day: "numeric", weekday: "short" })}</h3><span>${daily > 0 ? "+" : daily < 0 ? "−" : ""}${money(Math.abs(daily), data.settings.currency)}</span></div><div class="transaction-list">${rows.map((t) => `<button class="transaction-row" data-action="edit-entry" data-id="${esc(t.id)}" aria-label="Edit ${esc(t.category)} ${esc(money(t.amount, data.settings.currency))}">${categoryBadge(data, t.category, t.type)}<span class="transaction-copy"><strong>${esc(t.note || t.category)}</strong><span>${esc(t.category)}<i>·</i>${esc(methodLabels[t.paymentMethod] || "Cash")}${t.tags?.length ? `<i>·</i>${esc(t.tags[0])}` : ""}</span></span><span class="transaction-amount ${t.type}">${t.type === "income" ? "+" : "−"}${money(t.amount, data.settings.currency)}</span>${icon("caret-right", "row-chevron")}</button>`).join("")}</div></section>`;
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

export function homeView(ctx) {
  const { data } = ctx,
    s = budgetSummary(data.settings, data.transactions);
  const c = data.settings.currency,
    m = monthTotals(data, monthKey(new Date()));
  const setup = s.total === 0;
  const recent = [...data.transactions].sort(
    (a, b) => new Date(b.date) - new Date(a.date),
  );
  const status = setup
    ? "Start your plan"
    : s.percent > 1
      ? "Over today’s allowance"
      : s.percent >= 0.8
        ? "Close to today’s limit"
        : "A little room to breathe";
  const upcoming = [...data.bills]
    .filter((b) => !b.completed)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 2);
  return `${title(new Date().toLocaleDateString("en", { weekday: "long", month: "long", day: "numeric" }), "A clearer day for your money.", "A little awareness. A little more peace of mind.", button("Add transaction", "add-entry", "plus", "button primary desktop-only"))}
  <div class="dashboard-grid"><div class="dashboard-main">
    <section class="daily-card"><div class="daily-heading"><span class="eyebrow">SAFE TO SPEND TODAY</span><span class="status-pill ${!setup && s.percent > 1 ? "danger" : ""}">${icon(setup ? "sparkle" : s.percent > 1 ? "warning-circle" : "check-circle")}${setup ? "Let’s begin" : "Daily allowance"}</span></div>
    <div class="daily-amount">${setup ? '<span class="unset-amount">Your next good habit.</span>' : money(s.leftToday, c)}</div><p class="daily-message">${setup ? "Give your spending a plan. We’ll help you take it one day at a time." : status}</p>
    ${setup ? `<div class="setup-actions">${button("Set my budget", "budget-dialog", "arrow-right", "button primary")}${button("Explore a sample", "start-demo", "", "button plain")}</div>` : `<div class="daily-bottom"><div><span>Spent today</span><strong>${money(s.todaySpent, c)}</strong></div><div><span>Today’s allowance</span><strong>${money(s.safePerDay, c)}</strong></div><div><span>Days remaining</span><strong>${s.remainingDays}<small> incl. today</small></strong></div></div>${progress(s.todaySpent, s.safePerDay, "Today’s allowance used", s.percent >= 0.8)}`}
    </section>
    <section class="panel quick-panel">${panelHead("Your everyday shortcuts", "The little things you log often.", button("New shortcut", "add-template", "plus", "text-button"))}<div class="shortcut-grid">${
      data.templates.length
        ? data.templates
            .slice(0, 6)
            .map(
              (t) =>
                `<div class="shortcut"><button class="shortcut-log" data-action="quick-add" data-id="${esc(t.id)}">${categoryBadge(data, t.category)}<span><strong>${esc(t.name || t.category)}</strong><small>${money(t.amount, c)}</small></span></button>${iconButton(`Edit ${t.name || t.category} shortcut`, "edit-template", "dots-three", `data-id="${esc(t.id)}"`)}</div>`,
            )
            .join("")
        : `<button class="shortcut-placeholder" data-action="add-template">${icon("bookmark-simple")}<span>Save your coffee, commute, or lunch.<small>One tap next time.</small></span>${icon("plus")}</button>`
    }</div></section>
    <section class="panel">${panelHead("Your spending rhythm", "The last seven days, one day at a time.", `<span class="soft-badge">${icon("chart-pie-slice")}7 days</span>`)}${weekChart(data)}</section>
    <section class="panel activity-panel">${panelHead("Recent activity", "", button("View all", "view-activity", "arrow-right", "text-button"))}${transactionList(data, recent, { limit: 4, compact: true })}</section>
  </div><aside class="dashboard-side" aria-label="Budget summary and upcoming">
    <section class="panel month-panel">${panelHead("Your spending plan", "", iconButton("Edit spending plan", "budget-dialog", "pencil-simple"))}<p class="small muted">${s.start.toLocaleDateString("en", { month: "short", day: "numeric" })} – ${new Date(s.end.getTime() - 86400000).toLocaleDateString("en", { month: "short", day: "numeric" })}</p>${budgetRing(data, s)}<div class="plan-remaining"><span>Remaining this period</span><strong>${money(Math.max(0, s.total - s.spent), c)}</strong></div><div class="key-value"><span><i class="legend-dot spent-dot"></i>Spent</span><strong>${money(s.spent, c)}</strong></div><div class="key-value"><span><i class="legend-dot budget-dot"></i>Budget</span><strong>${money(s.total, c)}</strong></div><div class="panel-note">${icon("arrows-clockwise")}<span>${data.settings.rollover ? "Unspent money adjusts your next daily allowance." : "Your daily allowance stays fixed this period."}</span></div></section>
    <section class="panel cashflow-panel">${panelHead("This month’s flow")}<div class="flow-item"><span class="flow-icon income">${icon("arrow-down-left")}</span><span>Money in</span><strong>${money(m.income, c)}</strong></div><div class="flow-item"><span class="flow-icon expense">${icon("arrow-up-right")}</span><span>Money out</span><strong>${money(m.expense, c)}</strong></div><div class="key-value flow-net"><span>Net balance</span><strong>${money(m.net, c)}</strong></div></section>
    <section class="panel">${panelHead("On the horizon", "", button("Plan", "view-bills", "arrow-right", "text-button"))}${upcoming.length ? upcoming.map((b) => billRow(data, b, true)).join("") : `<div class="mini-empty">${icon("calendar-dots")}<p>Make room for what’s coming.</p>${button("Add a bill", "add-bill", "plus", "text-button")}</div>`}</section>
    <div class="privacy-note">${icon("shield-check")}<span>A public app. Your private money.<br><strong>Saved only on this device.</strong></span></div>
  </aside></div>`;
}

export function activityView(ctx) {
  const { data, month, filters } = ctx,
    m = monthTotals(data, month),
    c = data.settings.currency;
  const selected = filterTransactions(data.transactions, {
    ...filters,
    month: filters.allTime ? "" : month,
  });
  const cats = [...new Set(data.transactions.map((t) => t.category))].sort();
  return `${title("YOUR MONEY JOURNAL", "Every little thing, in one place.", "See what came in, what went out, and where it went.", monthPicker(month))}
  <div class="stats-strip"><div>${icon("arrow-down-left", "income")}<span>Income<strong>${money(m.income, c)}</strong></span></div><div>${icon("arrow-up-right", "expense")}<span>Expenses<strong>${money(m.expense, c)}</strong></span></div><div>${icon("wallet")}<span>Net this month<strong>${money(m.net, c)}</strong></span></div></div>
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
  ${
    ctx.showFilters
      ? `<div class="filter-grid"><label>Category<select id="filter-category"><option value="">All categories</option>${cats.map((cat) => `<option ${cat === filters.category ? "selected" : ""}>${esc(cat)}</option>`).join("")}</select></label><label>Payment<select id="filter-method"><option value="">All methods</option>${Object.entries(
          methodLabels,
        )
          .map(
            ([v, n]) =>
              `<option value="${v}" ${filters.method === v ? "selected" : ""}>${n}</option>`,
          )
          .join(
            "",
          )}</select></label><label>From<input type="date" id="filter-from" value="${esc(filters.from)}"></label><label>To<input type="date" id="filter-to" value="${esc(filters.to)}"></label><label class="checkbox"><input type="checkbox" id="filter-all-time" ${filters.allTime ? "checked" : ""}> Search all months</label>${button("Clear filters", "clear-filters", "", "text-button")}</div>`
      : ""
  }
  <div class="list-summary"><span id="results-count">${selected.length} ${selected.length === 1 ? "entry" : "entries"}</span>${button("Export CSV", "export-csv", "export", "text-button")}</div><div id="transaction-results">${selected.length ? transactionList(data, selected) : empty("No entries to show", "Try another month or clear your filters.", "magnifying-glass", "add-entry", "Add a transaction")}</div></section>`;
}

function billRow(data, b, compact = false) {
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
  return `<div class="bill-row">${categoryBadge(data, b.category, b.type)}<div><strong>${esc(b.name)}</strong><span class="${due < 0 ? "expense" : ""}">${dueText}${compact ? "" : ` · ${frequencyLabels[b.frequency] || "Monthly"}`}</span></div><strong class="bill-amount">${money(b.amount, data.settings.currency)}</strong>${compact ? "" : `<div class="bill-actions">${button(b.type === "income" ? "Received" : "Mark paid", "pay-bill", "check", "button small soft", `data-id="${esc(b.id)}"`)}${iconButton("Edit recurring entry", "edit-bill", "pencil-simple", `data-id="${esc(b.id)}"`)}</div>`}</div>`;
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
        : button("Set a category limit", "add-limit", "plus");
  let content;
  if (planTab === "goals") {
    const saved = data.goals.reduce((n, g) => n + Number(g.saved), 0);
    content = `<div class="plan-banner"><span class="banner-art">${icon("piggy-bank")}</span><div><span class="eyebrow">SMALL STEPS, BIGGER POSSIBILITIES</span><h2>${money(saved, c)} saved toward your goals</h2><p>Savings are tracked separately from your spending budget.</p></div></div><div class="goal-grid">${data.goals.map((g) => goalCard(data, g)).join("")}</div>${data.goals.length ? "" : `<section class="panel">${empty("Give your savings a purpose", "An emergency fund, a trip, or something just for you.", "piggy-bank", "add-goal", "Create a goal")}</section>`}`;
  } else if (planTab === "bills") {
    const bills = data.bills
      .filter((b) => !b.completed)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    content = `<div class="info-banner">${icon("calendar-dots")}<p>Plan ahead, then tap <strong>Mark paid</strong> to log an expense. Recurring dates move forward only when you confirm a payment.</p></div><section class="panel">${panelHead("Bills & recurring entries", "Expected payments and income, in date order.")}${bills.length ? bills.map((b) => billRow(data, b)).join("") : empty("Nothing on the horizon yet", "Add rent, subscriptions, or your next payday.", "calendar-dots", "add-bill", "Add a recurring entry")}</section>`;
  } else {
    const by = Object.fromEntries(categoryTotals(m.tx));
    const limits = Object.entries(data.categoryBudgets).filter(
      ([, amount]) => amount > 0,
    );
    content = `<div class="plan-banner"><span class="banner-art">${icon("wallet")}</span><div><span class="eyebrow">YOUR SPENDING PLAN</span><h2>${money(data.settings.budget, c)} <small>/ ${data.settings.cycle === "biweekly" ? "2 weeks" : data.settings.cycle === "weekly" ? "week" : "month"}</small></h2><p>The amount you choose to spend, separate from logged income.</p></div>${button("Edit plan", "budget-dialog", "pencil-simple", "button soft")}</div><div class="section-title"><div><h2>Monthly category limits</h2><p>Keep a little structure around the things that add up.</p></div><span class="soft-badge">${monthDate(month).toLocaleDateString("en", { month: "long" })}</span></div><div class="limit-grid">${limits
      .map(([cat, limit]) => {
        const used = by[cat] || 0,
          pct = percent(used, limit);
        return `<button class="panel limit-card" data-action="edit-limit" data-category="${esc(cat)}"><div class="limit-heading">${categoryBadge(data, cat)}<strong>${esc(cat)}</strong>${icon("pencil-simple")}</div><div class="limit-amount"><strong>${money(used, c)}</strong><span>of ${money(limit, c)}</span></div>${progress(used, limit, `${cat} budget used`, used / limit >= 0.8)}<div class="limit-footer"><span class="${used > limit ? "expense" : ""}">${used > limit ? `${money(used - limit, c)} over` : `${money(limit - used, c)} left`}</span><span>${Math.round(pct)}%</span></div></button>`;
      })
      .join(
        "",
      )}</div>${limits.length ? "" : `<section class="panel">${empty("Let your categories do the planning", "Set a monthly cap for food, transport, or any category.", "list-checks", "add-limit", "Set a category limit")}</section>`}`;
  }
  return `${title("A LITTLE PLANNING GOES A LONG WAY", "Make room for what matters.", "Your spending, future plans, and everyday commitments.", action)}<div class="subnav" role="group" aria-label="Plan sections">${[
    ["limits", "Spending limits", "wallet"],
    ["goals", "Savings goals", "target"],
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
  const items = inMonth(data.transactions, month).filter(
    (t) => t.type === "expense",
  );
  const byDay = Array.from({ length: days }, (_, i) =>
    total(items.filter((t) => new Date(t.date).getDate() === i + 1)),
  );
  const showGuide = data.settings.cycle === "monthly";
  const max = Math.max(
    showGuide ? data.settings.budget : 0,
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
  const budgetY = 170 - (data.settings.budget / max) * 140;
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
  return `${title("THE BIGGER PICTURE", "Get to know your money.", "Clear patterns. Better decisions. No guesswork.", monthPicker(month))}<div class="insight-metrics"><section class="panel metric-card"><span class="metric-icon income">${icon("arrow-down-left")}</span><span>Income</span><strong>${money(m.income, c)}</strong><small>${m.tx.filter((t) => t.type === "income").length} incoming entries</small></section><section class="panel metric-card"><span class="metric-icon expense">${icon("arrow-up-right")}</span><span>Expenses</span><strong>${money(m.expense, c)}</strong><small>${change === null ? "No previous month to compare" : `${Math.abs(change).toFixed(1)}% ${change >= 0 ? "more" : "less"} than last month`}</small></section><section class="panel metric-card"><span class="metric-icon">${icon("piggy-bank")}</span><span>Savings rate</span><strong>${rate === null ? "—" : `${Math.round(rate)}%`}</strong><small>${rate === null ? "Log income to see your rate" : "Income remaining after expenses"}</small></section></div><div class="insights-grid"><section class="panel">${panelHead("Where your money went", "Every category has its own story.")}<div class="donut-layout">${categoryDonut(data, pairs)}<div class="category-breakdown">${pairs.length ? pairs.map(([cat, value]) => `<button data-action="category-activity" data-category="${esc(cat)}">${categoryBadge(data, cat)}<span>${esc(cat)}<small>${Math.round((value / m.expense) * 100)}% of expenses</small></span><strong>${money(value, c)}</strong>${icon("caret-right")}</button>`).join("") : empty("Your picture is still taking shape", "Add an expense to see your spending mix.", "chart-pie-slice")}</div></div></section><section class="panel">${panelHead("Small things to notice")}<div class="insight-note">${icon("basket")}<div><h3>${top ? `${esc(top[0])} is your top category` : "Your top category will appear here"}</h3><p>${top ? `${money(top[1], c)}, or ${Math.round((top[1] / m.expense) * 100)}% of your spending this month.` : "As you log expenses, your spending patterns will become clearer."}</p></div></div><div class="insight-note">${icon("receipt")}<div><h3>${biggest ? "Your largest single expense" : "Every entry brings clarity"}</h3><p>${biggest ? `${money(biggest.amount, c)} for ${esc(biggest.note || biggest.category)}.` : "A short note helps you remember what a purchase was for."}</p></div></div><div class="insight-note">${icon("sun")}<div><h3>${activityStreak(data.transactions)}-day tracking streak</h3><p>Consistency matters more than perfection.</p></div></div></section><section class="panel wide-panel">${panelHead(data.settings.cycle === "monthly" ? "Spending vs. your plan" : "Spending through the month", "How your spending builds across the month.")}${paceChart(data, month)}</section></div>`;
}

export const themes = [
  ["green", "Sage", "#346b58", "#e4eee7"],
  ["blue", "Ocean", "#496c9c", "#e3ebf5"],
  ["brown", "Mocha", "#805a43", "#ede2d6"],
  ["pink", "Blush", "#ae597d", "#f8e2eb"],
  ["yellow", "Sunshine", "#8c691b", "#fbebac"],
  ["dark", "Midnight", "#a7c9ba", "#24322e"],
];

export function settingsView(ctx) {
  const { data, settingsTab } = ctx;
  let content;
  if (settingsTab === "appearance")
    content = `<section class="panel">${panelHead("Find your kind of daylight", "The same calm workspace, in your favorite colors.")}<div class="theme-grid">${themes.map(([id, name, accent, tint]) => `<button class="theme-preview ${data.settings.theme === id ? "selected" : ""}" data-action="theme" data-value="${id}" aria-pressed="${data.settings.theme === id}" style="--preview-accent:${accent};--preview-tint:${tint}"><span class="mini-preview"><i></i><i></i><i></i><i></i></span><span>${name}${data.settings.theme === id ? icon("check-circle") : ""}</span></button>`).join("")}</div></section>`;
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
    content = `<div class="settings-grid"><section class="panel">${panelHead("Keep a copy, keep your peace of mind", "Your records live on this device. A private backup lets you move them.")}<div class="backup-illustration">${icon("shield-check")}</div><div class="settings-actions">${button("Download full backup", "export-backup", "download-simple")}${button("Restore a backup", "restore-backup", "upload-simple", "button soft")}${button("Export transactions as CSV", "export-csv", "export", "button plain")}</div><p class="small muted">Last backup: ${data.settings.lastBackup ? new Date(data.settings.lastBackup).toLocaleString() : "No backup downloaded yet"}. Keep backup files somewhere private.</p></section><section class="panel">${panelHead("Your data, your device")}<div class="privacy-feature">${icon("lock-key")}<div><h3>Private by default</h3><p>No account, analytics, bank connection, or transaction uploads.</p></div></div><div class="privacy-feature">${icon("arrows-clockwise")}<div><h3>Built for updates</h3><p>App updates replace the interface, not your saved records. A previous copy is also kept on this device.</p></div></div><div class="privacy-feature">${icon("device-mobile")}<div><h3>Moving to a new device?</h3><p>Download a backup here and restore it there. Keep a backup before clearing browser data or installing on iPhone, where app storage can be separate.</p></div></div>${button("Request persistent storage", "persist-storage", "shield-check", "button soft")}</section></div>`;
  else if (settingsTab === "install")
    content = `<section class="panel install-panel"><div class="install-app-art">${icon("device-mobile")}</div><span class="eyebrow">YOUR MONEY, WITH YOU</span><h2>A little more at home on your phone.</h2><p>Add Daylight to your home screen. Open it like an app, keep logging offline, and pick up where you left off.</p>${button(ctx.installed ? "Already installed" : "Install Daylight", "install", "download-simple", "button primary", ctx.installed ? "disabled" : "")}<div class="install-steps"><section><h3>Android</h3><p>Open this site in Chrome. Tap Install Daylight above, or use the browser menu → Add to Home screen → Install.</p></section><section><h3>iPhone & iPad</h3><p>Open this site in Safari. Tap Share → Add to Home Screen, enable Open as Web App if shown, then tap Add.</p></section></div><div class="info-banner">${icon("shield-check")}<p>Before installing or changing devices, download a backup from Data & privacy. Some browsers keep installed-app storage separate.</p></div><span class="offline-status">${icon(ctx.offlineReady ? "check-circle" : "arrows-clockwise")}${ctx.offlineReady ? "Offline files are ready on this device" : "Open the app online once to prepare offline access"}</span></section>`;
  else
    content = `<div class="settings-grid"><section class="panel">${panelHead("A spending plan that fits you", "Start with the amount available after fixed commitments.")}<form id="budget-settings" class="form"><label>Amount available to spend<input name="budget" inputmode="decimal" required value="${esc(data.settings.budget)}"></label><div class="form-row"><label>Currency<select name="currency">${["PHP", "USD", "EUR", "GBP", "JPY", "AUD", "CAD", "SGD", "INR"].map((c) => `<option ${c === data.settings.currency ? "selected" : ""}>${c}</option>`).join("")}</select></label><label>Budget period<select name="cycle">${[
      ["monthly", "Monthly"],
      ["weekly", "Weekly"],
      ["biweekly", "Every 2 weeks"],
    ]
      .map(
        ([value, text]) =>
          `<option value="${value}" ${data.settings.cycle === value ? "selected" : ""}>${text}</option>`,
      )
      .join(
        "",
      )}</select></label></div><label class="switch-label"><span><strong>Flexible daily allowance</strong><small>Adjust remaining days as you spend more or less.</small></span><input type="checkbox" role="switch" name="rollover" ${data.settings.rollover ? "checked" : ""}></label><p class="form-error" role="alert"></p><button class="button primary" type="submit">${icon("check")}Save spending plan</button></form></section><section class="panel settings-companion"><span class="companion-art">${icon("flower-lotus")}</span><h2>A plan, not a perfect score.</h2><p>The daily allowance helps you see what’s available. Some days cost more than others. You can adjust the plan whenever life changes.</p><div class="panel-note">${icon("wallet")}<span>Logging income records money received. Change your spending plan when you want to make more of it available.</span></div></section></div>`;
  return `${title("A SPACE THAT FEELS LIKE YOU", "Make yourself at home.", "Your preferences, your categories, your data.")}<div class="subnav settings-nav" role="group" aria-label="Settings sections">${[
    ["general", "Spending plan", "wallet"],
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
