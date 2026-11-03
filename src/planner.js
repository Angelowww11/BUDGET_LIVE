import { icon } from "./icons.js";
import { accountArtwork } from "./accounts-ui.js";
import { accountTypes } from "./accounts.js";
import { salaryBounds } from "./budget.js";
import { esc, money, button, progress } from "./ui.js";

// Presentation only: all balances and allowance figures come from budgetSummary.
export function plannerOverview(data, s, accounts, flow, now, cycleName) {
  const c = data.settings.currency;
  const salary =
    data.settings.cycle === "salary" ? salaryBounds(data.settings) : null;
  const next = salary?.end || (data.settings.cycle === "payday" ? s.end : null);
  const period = next
    ? `Until ${next.toLocaleDateString("en", { month: "short", day: "numeric" })}`
    : now.toLocaleDateString("en", { month: "long", year: "numeric" });
  const fixed = data.settings.rollover === false;
  return `<div class="page-heading planner-heading"><div><p class="eyebrow">${now.toLocaleDateString("en", { weekday: "long", month: "long", day: "numeric" })}</p><h1>My money <em>planner.</em></h1></div><span class="planner-edition">A little intention.<br>A clearer everyday.</span></div>
  <div class="planner-board">
    <section class="money-cover" aria-label="Spending balance">
      <div class="cover-heading"><span class="cover-kicker">YOUR SPENDING BALANCE</span>${button("Edit plan", "budget-dialog", "pencil-simple", "text-button")}</div>
      <div class="cover-amount">${money(s.remaining, c)}</div>
      <p class="cover-description">${money(s.spent, c)} spent of ${money(s.total, c)} this ${cycleName}</p>
      <div class="cover-period"><span>${icon("calendar-blank")}${period}</span><span>${s.remainingDays} ${s.remainingDays === 1 ? "day" : "days"} left</span></div>
      ${s.total === 0 ? `<div class="cover-setup">${button("Set my budget", "budget-dialog", "arrow-right", "button cover-button")}${button("Try a sample", "start-demo", "", "text-button")}</div>` : `<div class="cover-actions">${button("Expense", "add-entry", "arrow-up-right", "button cover-button")}${button("Income", "add-income", "arrow-down-left", "button cover-button secondary")}</div>`}
      <button class="cover-account-total" data-action="view-accounts"><span>${icon("wallet")}All accounts</span><strong>${money(accounts.total, c)}</strong>${icon("caret-right")}</button>
    </section>
    <section class="daily-pocket" aria-label="Your daily allowance">
      <div class="pocket-top"><span class="pocket-tab">THE DAILY POCKET</span><div class="calendar-stamp"><strong>${now.getDate()}</strong><span>${now.toLocaleDateString("en", { month: "short" })}</span></div></div>
      <h2>Your daily allowance</h2><div class="pocket-amount">${money(s.safePerDay, c)}<span>/ day</span></div>
      <p class="pocket-caption">${fixed ? "Within your fixed cap and the funds remaining." : "Your remaining funds, shared across the days ahead."}</p>
      <div class="pocket-equation" aria-label="Remaining funds divided by remaining days"><span>${money(s.dailyPool, c)}</span><i>÷</i><span>${s.remainingDays} days</span><i>=</i><strong>${s.active && s.remainingDays ? money(s.dailyPool / s.remainingDays, c) : money(0, c)}</strong></div>
      <div class="pocket-today"><div><span>Spent today</span><strong class="expense">${money(s.todaySpent, c)}</strong></div><div><span>Left for today</span><strong>${money(s.leftToday, c)}</strong></div></div>
      ${progress(s.todaySpent, s.safePerDay, "Today’s allowance used", s.todaySpent > s.safePerDay)}
      <div class="pocket-foot"><span>${icon(fixed ? "calendar-blank" : "arrows-clockwise")}${fixed ? `Fixed cap ${money(s.baseDaily, c)}` : "Adjusts with your balance"}</span>${button("Change", "budget-dialog", "", "text-button")}</div>
    </section>
    <section class="planner-cashflow" aria-label="This month’s cash flow"><div class="cashflow-label"><span>${now.toLocaleDateString("en", { month: "long" })}</span><small>THE MONTH SO FAR</small></div><div class="cashflow-entries"><button data-action="month-flow" data-value="income"><span class="flow-emblem income">${icon("arrow-down-left")}</span><span><small>Money in</small><strong>${money(flow.income, c)}</strong></span>${icon("caret-right")}</button><button data-action="month-flow" data-value="expense"><span class="flow-emblem expense">${icon("arrow-up-right")}</span><span><small>Money out</small><strong>${money(flow.expense, c)}</strong></span>${icon("caret-right")}</button></div></section>
  </div>
  <section class="wallet-section" aria-label="Individual account balances"><div class="wallet-heading"><div><p class="eyebrow">EVERY PESO HAS A PLACE</p><h2>Your wallets <em>& accounts</em></h2></div>${button("Manage", "view-accounts", "arrow-right", "text-button")}</div><div class="wallet-grid" tabindex="0" aria-label="Scroll through account balances">${accounts.accounts.map((a) => `<button class="wallet-divider" data-action="account-activity" data-id="${esc(a.id)}" style="--wallet-color:${accountTypes[a.type]?.color || "var(--accent)"}"><div class="wallet-divider-top">${accountArtwork(a)}<span>${accountTypes[a.type]?.name || "Account"}</span>${icon("arrow-up-right")}</div><span class="wallet-name">${esc(a.name)}</span><strong>${money(a.balance, c)}</strong><small>${a.includeInSpending ? "Available for spending" : "Set aside"}</small></button>`).join("")}</div><div class="wallet-footer"><span>${money(accounts.spendable, c)} for spending · ${money(accounts.savings, c)} set aside</span>${button("Move money", "transfer", "arrows-clockwise", "text-button")}</div></section>`;
}
