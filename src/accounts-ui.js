import { accountTypes, accountSummary, accountFor } from "./accounts.js";
import { icon } from "./icons.js";
import { button, iconButton, esc, money, empty } from "./ui.js";

export function accountArtwork(account) {
  const meta = accountTypes[account.type] || accountTypes.cash;
  return `<span class="account-art" style="--account-color:${meta.color}">${icon(meta.icon)}</span>`;
}

export function accountsPanel(data) {
  const summary = accountSummary(data),
    c = data.settings.currency;
  return `<section class="panel accounts-panel"><div class="panel-heading"><div><h2>Your accounts</h2><p>Where your money lives.</p></div>${button("Manage", "view-accounts", "arrow-right", "text-button")}</div><div class="accounts-total"><span>Overall account balance</span><strong>${money(summary.total, c)}</strong></div>${summary.accounts.map((a) => `<button class="account-row" data-action="edit-account" data-id="${esc(a.id)}">${accountArtwork(a)}<span><strong>${esc(a.name)}</strong><small>${a.includeInSpending ? "Everyday money" : "Set aside"}</small></span><b>${money(a.balance, c)}</b></button>`).join("")}<div class="panel-note">${icon("piggy-bank")}<span>${money(summary.savings, c)} set aside · ${money(summary.spendable, c)} in spending accounts.</span></div>${summary.configured ? "" : `<p class="small muted account-setup-note">Set your current balances to include money you had before these entries.</p>`}</section>`;
}

export function accountsView(ctx) {
  const { data } = ctx,
    summary = accountSummary(data),
    c = data.settings.currency;
  const transfers = [...data.transfers].sort(
    (a, b) => new Date(b.date) - new Date(a.date),
  );
  return `<section class="account-overview"><div><span class="eyebrow">ALL YOUR POCKETS</span><h2>Overall balance</h2><strong>${money(summary.total, c)}</strong><p>${money(summary.spendable, c)} for spending · ${money(summary.savings, c)} set aside</p></div><div class="account-overview-actions">${button("Add account", "add-account", "plus")}${button("Move money", "transfer", "arrows-clockwise", "button soft")}</div></section><div class="account-card-grid">${summary.accounts.map((a) => `<section class="panel account-card"><div class="account-card-top">${accountArtwork(a)}${iconButton(`Edit ${a.name}`, "edit-account", "pencil-simple", `data-id="${esc(a.id)}"`)}</div><h3>${esc(a.name)}</h3><span class="account-kind">${accountTypes[a.type].name}${a.includeInSpending ? "" : " · Set aside"}</span><strong class="account-card-balance">${money(a.balance, c)}</strong><span class="small muted">Opening balance + income − expenses ± transfers</span>${button("See entries", "account-activity", "arrow-right", "text-button", `data-id="${esc(a.id)}"`)}</section>`).join("")}</div><section class="panel transfer-panel"><div class="panel-heading"><div><h2>Money moved between accounts</h2><p>Transfers change where money is, not how much you spent.</p></div>${button("Transfer", "transfer", "plus", "text-button")}</div>${
    transfers.length
      ? transfers
          .map((t) => {
            const from = data.accounts.find((a) => a.id === t.fromId),
              to = data.accounts.find((a) => a.id === t.toId);
            return `<div class="transfer-row"><span class="transfer-symbol">${icon("arrows-clockwise")}</span><span><strong>${esc(from?.name || "Account")} → ${esc(to?.name || "Account")}</strong><small>${new Date(t.date).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}${t.note ? ` · ${esc(t.note)}` : ""}</small></span><b>${money(t.amount, c)}</b>${iconButton("Delete transfer", "delete-transfer", "trash", `data-id="${esc(t.id)}"`)}</div>`;
          })
          .join("")
      : empty(
          "Every pocket has a purpose",
          "Move money between Cash, Card, Savings, or your own accounts.",
          "wallet",
          "transfer",
          "Make a transfer",
        )
  }</section>`;
}

export function entryAccountLabel(data, transaction) {
  return accountFor(data, transaction)?.name || "Cash";
}
