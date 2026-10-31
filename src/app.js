import { paydayFields, salaryFields, updatePaydayFields } from "./payday-ui.js";
import "@fontsource-variable/dm-sans/standard.css";
import "@fontsource-variable/manrope";
import "./app.css";
import {
  budgetSummary,
  dayKey,
  validatePayday,
  validateSalary,
} from "./budget.js";
import {
  load,
  save,
  backup,
  restore,
  emptyState,
  normalize,
  STORAGE_KEY,
  RECOVERY_KEY,
} from "./store.js";
import { icon } from "./icons.js";
import { colorMode, toggleColorMode, selectColorTheme } from "./appearance.js";
import {
  categoryNames,
  categoryMeta,
  categoryBadge,
  categoryColors,
  categoryIconNames,
} from "./categories.js";
import {
  round,
  parseAmount,
  monthKey,
  shiftMonth,
  localDate,
  advanceDueDate,
  nextDueDateAfterPayment,
  nextDueDateForDay,
  paidThisMonth,
} from "./model.js";
import {
  esc,
  money,
  currency,
  button,
  iconButton,
  empty,
  frequencyLabels,
  dayOrdinal,
  logo,
} from "./ui.js";
import {
  homeView,
  activityView,
  insightsView,
  planView,
  settingsView,
  transactionList,
} from "./views.js";
import { demoState } from "./demo.js";
import { pwaState, initPWA, installApp, updateApp } from "./pwa.js";
import {
  accountTypes,
  accountBalances,
  accountSummary,
  transactionAccountId,
  openingForCurrentBalance,
  methodForAccount,
} from "./accounts.js";
import { journalItems, shiftJournalDate } from "./journal.js";

const app = document.querySelector("#app");
let data,
  storageProblem = "",
  demoOriginal = null,
  toastTimer,
  undoState = null;
try {
  data = load();
} catch (error) {
  storageProblem = error.message;
  data = emptyState();
}
const ctx = {
  view: ["home", "transactions", "plan", "stats", "settings"].includes(
    location.hash.slice(1),
  )
    ? location.hash.slice(1)
    : "home",
  month: monthKey(new Date()),
  activityPeriod: "day",
  activityDate: dayKey(new Date()),
  planTab: "limits",
  settingsTab: "general",
  filters: {
    type: "all",
    query: "",
    category: "",
    method: "",
    from: "",
    to: "",
    accountId: "",
  },
  showFilters: false,
  demo: false,
  ...pwaState,
};
const navItems = [
  ["home", "Overview", "house-simple"],
  ["transactions", "Activity", "receipt"],
  ["plan", "Plan", "calendar-dots"],
  ["stats", "Insights", "chart-pie-slice"],
  ["settings", "More", "gear-six"],
];
const uid = () => crypto.randomUUID();

function render() {
  document.documentElement.dataset.theme = data.settings.theme || "green";
  document.documentElement.dataset.mode = colorMode(data.settings);
  document.querySelector('meta[name="theme-color"]').content = getComputedStyle(
    document.documentElement,
  )
    .getPropertyValue("--page")
    .trim();
  if (storageProblem) {
    renderRecovery();
    return;
  }
  const view = {
    home: homeView,
    transactions: activityView,
    plan: planView,
    stats: insightsView,
    settings: settingsView,
  }[ctx.view];
  app.innerHTML = `<a class="skip-link" href="#main-content">Skip to content</a><div class="app-shell"><aside class="sidebar" aria-label="Navigation and app tools"><button class="brand" data-action="navigate" data-view="home" aria-label="Daylight overview">${logo}<span>daylight<small>A LITTLE MORE PEACE OF MIND</small></span></button><p class="sidebar-label">YOUR PERSONAL SPACE</p><nav aria-label="Main navigation">${navItems.map(([value, label, glyph], index) => `${index === 2 ? `<button class="nav-add" data-action="add-entry" aria-label="Add transaction">${icon("plus")}<span>Add</span></button>` : ""}<button data-action="navigate" data-view="${value}" class="nav-item ${ctx.view === value ? "active" : ""}" ${ctx.view === value ? 'aria-current="page"' : ""}>${icon(glyph)}<span>${label}</span>${ctx.view === value ? "<i></i>" : ""}</button>`).join("")}</nav>${button("New transaction", "add-entry", "plus", "button primary sidebar-add")}<div class="sidebar-bottom"><button class="install-card" data-action="view-install">${icon("device-mobile")}<span><strong>Take Daylight with you</strong><small>Install on your phone</small></span>${icon("arrow-right")}</button><div class="sidebar-privacy">${icon("shield-check")}<span>Your records stay<br><strong>on this device.</strong></span></div></div></aside><div class="workspace"><header class="topbar"><button class="brand mobile-brand" data-action="navigate" data-view="home">${logo}<span>daylight</span></button><div class="breadcrumb"><span>My workspace</span>${icon("caret-right")}<strong>${navItems.find(([id]) => id === ctx.view)[1]}</strong></div><div class="topbar-actions"><span class="connection"><i class="${navigator.onLine ? "" : "offline"}"></i>${navigator.onLine ? "Saved on this device" : "Offline · still saving"}</span>${button(ctx.installed ? "Installed" : "Install app", "install", ctx.installed ? "check-circle" : "download-simple", "button small outline top-install", ctx.installed ? "disabled" : "")}<button class="icon-button theme-toggle" data-action="toggle-dark" aria-label="${colorMode(data.settings) === "dark" ? "Switch to light mode" : "Switch to dark mode"}" title="${colorMode(data.settings) === "dark" ? "Switch to light mode" : "Switch to dark mode"}">${icon(colorMode(data.settings) === "dark" ? "sun" : "moon")}</button></div></header>${ctx.demo ? `<div class="demo-banner" role="region" aria-label="Sample preview">${icon("sparkle")}<span><strong>Sample preview</strong> · These records are examples. Your own data is untouched.</span>${button("Exit preview", "exit-demo", "x", "text-button")}</div>` : ""}<main id="main-content" tabindex="-1">${view({ ...ctx, data })}</main><footer class="app-footer"><span>Made for the everyday.</span><span>${icon("lock-key")}Private by design.</span></footer></div><button class="mobile-add" data-action="add-entry" aria-label="Add transaction">${icon("plus")}</button></div><div id="toast-region" class="toast-region" aria-live="polite"></div>${ctx.needsUpdate ? `<div class="update-notice" role="status">${icon("sparkle")}<span>A fresh version is ready.</span>${button("Update now", "update-app", "", "text-button")}</div>` : ""}`;
}

function renderRecovery() {
  app.innerHTML = `<main class="recovery-page"><div class="panel">${icon("shield-check", "recovery-icon")}<h1>Let’s protect your saved records.</h1><p>${esc(storageProblem)}</p><p>Your original saved data is still on this device. Download it before restoring a backup.</p><div class="settings-actions">${button("Download saved data", "download-raw", "download-simple")}${button("Restore a backup", "restore-backup", "upload-simple", "button soft")}${button("Recover previous copy", "recover-copy", "arrow-counter-clockwise", "button plain")}</div></div></main><div id="toast-region" class="toast-region" aria-live="polite"></div>`;
}

function notify(message, undo = false) {
  clearTimeout(toastTimer);
  const region = document.querySelector("#toast-region");
  if (!region) return;
  region.innerHTML = `<div class="toast">${icon("check-circle")}<span>${esc(message)}</span>${undo ? '<button data-action="undo">Undo</button>' : ""}${iconButton("Dismiss message", "dismiss-toast", "x")}</div>`;
  toastTimer = setTimeout(
    () => {
      region.innerHTML = "";
      undoState = null;
    },
    undo ? 9000 : 6500,
  );
}

function change(fn, message, { undo = true } = {}) {
  if (storageProblem)
    throw new Error("Restore your records before making changes.");
  const before = structuredClone(data),
    next = structuredClone(data);
  fn(next);
  const checked = normalize(next);
  if (!ctx.demo) save(checked);
  data = checked;
  undoState = undo ? before : null;
  render();
  if (message) notify(ctx.demo ? `${message} · preview only` : message, undo);
}

function navigate(view) {
  ctx.view = view;
  history.replaceState(null, "", `#${view}`);
  render();
  window.scrollTo({ top: 0, behavior: "instant" });
}

function modal(
  title,
  body,
  { subtitle = "", className = "", submitLabel = "", id = "modal-form" } = {},
) {
  const dialog = document.createElement("dialog");
  dialog.className = `sheet ${className}`;
  dialog.setAttribute("aria-labelledby", "dialog-title");
  dialog.innerHTML = `<form id="${id}"><header class="sheet-header"><div>${subtitle ? `<p class="eyebrow">${subtitle}</p>` : ""}<h2 id="dialog-title">${title}</h2></div><button class="icon-button" type="button" data-close aria-label="Close dialog">${icon("x")}</button></header><div class="sheet-body">${body}<p class="form-error" role="alert"></p></div>${submitLabel ? `<footer class="sheet-footer"><button class="button primary full" type="submit">${icon("check")}<span>${submitLabel}</span></button></footer>` : ""}</form>`;
  document.body.append(dialog);
  document.body.classList.add("modal-open");
  dialog.showModal();
  dialog.querySelector("[data-close]").onclick = () => dialog.close();
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) {
      const r = dialog.getBoundingClientRect();
      if (
        e.clientX < r.left ||
        e.clientX > r.right ||
        e.clientY < r.top ||
        e.clientY > r.bottom
      )
        dialog.close();
    }
  });
  dialog.addEventListener("close", () => {
    document.body.classList.remove("modal-open");
    dialog.remove();
  });
  return dialog;
}

function formSubmit(dialog, handler) {
  dialog.querySelector("form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const error = dialog.querySelector(".form-error");
    error.textContent = "";
    try {
      await handler(new FormData(e.target));
    } catch (err) {
      error.textContent =
        err.message || "Something went wrong. Please try again.";
      error.scrollIntoView({ block: "nearest" });
    }
  });
}

function typeSwitch(type = "expense") {
  return `<div class="type-switch" role="group" aria-label="Entry type">${[
    ["expense", "Expense", "arrow-up-right"],
    ["income", "Income", "arrow-down-left"],
  ]
    .map(
      ([value, label, glyph]) =>
        `<label><input type="radio" name="type" value="${value}" ${type === value ? "checked" : ""}><span>${icon(glyph)}${label}</span></label>`,
    )
    .join("")}</div>`;
}
function categorySelect(type = "expense", selected = "") {
  const names = [
    ...new Set([...(selected ? [selected] : []), ...categoryNames(data, type)]),
  ];
  return `<select name="category" required>${names.map((name) => `<option ${name === selected ? "selected" : ""}>${esc(name)}</option>`).join("")}</select>`;
}
function accountSelect(selected = "") {
  return `<select name="accountId" required aria-label="Account">${accountBalances(
    data,
  )
    .map(
      (a) =>
        `<option value="${esc(a.id)}" ${a.id === selected ? "selected" : ""}>${esc(a.name)} · ${money(a.balance, data.settings.currency)}</option>`,
    )
    .join("")}</select>`;
}

function accountDialog(account = {}) {
  const current = account.id
    ? accountBalances(data).find((a) => a.id === account.id)?.balance || 0
    : 0;
  const d = modal(
    account.id ? "This pocket of your money." : "A place for your money.",
    `<label>Account name<input name="name" required maxlength="40" placeholder="Cash, payroll card, rainy-day fund…" value="${esc(account.name || "")}"></label><label>Account type<select name="accountType" ${account.id ? "disabled" : ""}>${Object.entries(
      accountTypes,
    )
      .map(
        ([key, meta]) =>
          `<option value="${key}" ${key === (account.type || "cash") ? "selected" : ""}>${meta.name}</option>`,
      )
      .join(
        "",
      )}</select></label><label>Current balance <span class="optional">${esc(data.settings.currency)}</span><input name="currentBalance" inputmode="decimal" required value="${current}"></label><p class="small muted">Enter the balance you have now. This corrects the starting balance behind your existing entries; it does not create extra income.</p><label class="switch-label"><span><strong>Available for everyday spending</strong><small>Turn off for savings or money you want to set aside.</small></span><input name="includeInSpending" type="checkbox" role="switch" ${account.includeInSpending !== false ? "checked" : ""}></label>${account.id ? '<button class="button danger small" type="button" id="delete-account">Delete unused account</button>' : ""}`,
    { subtitle: "YOUR ACCOUNTS", submitLabel: "Save account" },
  );
  d.querySelector('[name="accountType"]').addEventListener("change", (e) => {
    d.querySelector('[name="includeInSpending"]').checked =
      e.target.value !== "savings";
  });
  d.querySelector("#delete-account")?.addEventListener("click", () => {
    try {
      const used =
        [...data.transactions, ...data.templates, ...data.bills].some(
          (t) => transactionAccountId(data, t) === account.id,
        ) ||
        data.transfers.some(
          (t) => t.fromId === account.id || t.toId === account.id,
        );
      if (used || Math.abs(current) > 0.005)
        throw new Error(
          "This account has a balance or recorded history. Keep it so those records stay accurate.",
        );
      if (data.accounts.length < 2)
        throw new Error("Keep at least one account.");
      change((next) => {
        next.accounts = next.accounts.filter((a) => a.id !== account.id);
      }, "Account removed");
      d.close();
    } catch (error) {
      d.querySelector(".form-error").textContent = error.message;
    }
  });
  formSubmit(d, (f) => {
    const balance = Number(
      String(f.get("currentBalance")).replace(/[,\s]/g, ""),
    );
    if (!Number.isFinite(balance) || Math.abs(balance) > 1e12)
      throw new Error(
        "Enter a valid balance. Use a minus sign for money owed.",
      );
    const name = String(f.get("name")).trim();
    if (!name) throw new Error("Give the account a name.");
    const item = {
      ...account,
      id: account.id || uid(),
      name,
      type: account.type || f.get("accountType"),
      openingBalance: account.id
        ? openingForCurrentBalance(data, account.id, balance)
        : round(balance),
      includeInSpending: f.has("includeInSpending"),
      configured: true,
    };
    change((next) => {
      if (account.id)
        next.accounts = next.accounts.map((a) =>
          a.id === account.id ? item : a,
        );
      else next.accounts.push(item);
    }, "Account saved");
    d.close();
  });
}

function transferDialog() {
  if (data.accounts.length < 2) {
    accountDialog();
    return;
  }
  const options = (selected) =>
    data.accounts
      .map(
        (a) =>
          `<option value="${esc(a.id)}" ${selected === a.id ? "selected" : ""}>${esc(a.name)}</option>`,
      )
      .join("");
  const d = modal(
    "Same money. A different pocket.",
    `<div class="form-row"><label>From<select name="fromId">${options(data.accounts[0].id)}</select></label><label>To<select name="toId">${options(data.accounts[1].id)}</select></label></div><label>Amount<input autofocus name="amount" inputmode="decimal" required placeholder="0.00"></label><label>Date<input name="date" type="date" required value="${dayKey(new Date())}"></label><label>Note <span class="optional">optional</span><input name="note" maxlength="120" placeholder="A little for my savings"></label><p class="small muted">A transfer moves funds between accounts. Your total balance, income, spending, and daily budget do not change.</p>`,
    { subtitle: "MOVE MONEY", submitLabel: "Save transfer" },
  );
  formSubmit(d, (f) => {
    if (f.get("fromId") === f.get("toId"))
      throw new Error("Choose two different accounts.");
    const amount = parseAmount(f.get("amount")),
      date = localDate(f.get("date"));
    if (!Number.isFinite(date.getTime()))
      throw new Error("Choose a valid date.");
    const available = accountBalances(data, date).find(
      (a) => a.id === f.get("fromId"),
    );
    if (!available) throw new Error("Choose a valid account.");
    if (amount > available.balance + 0.005)
      throw new Error(
        `${available.name} has ${money(available.balance, data.settings.currency)} available. Correct its balance first or transfer a smaller amount.`,
      );
    change((next) => {
      next.transfers.push({
        id: uid(),
        fromId: f.get("fromId"),
        toId: f.get("toId"),
        amount,
        date: date.toISOString(),
        note: String(f.get("note")).trim(),
      });
    }, "Money moved between accounts");
    d.close();
  });
}

function entryDialog(entry = {}) {
  let type = entry.type || "expense",
    selected = entry.category || categoryNames(data, type)[0];
  const choices = () => [
    ...new Set([
      ...(entry.category && entry.type === type ? [entry.category] : []),
      ...categoryNames(data, type),
    ]),
  ];
  const tiles = () =>
    choices()
      .map(
        (name) =>
          `<button type="button" class="category-tile ${selected === name ? "selected" : ""}" data-pick-category="${esc(name)}" aria-pressed="${selected === name}">${categoryBadge(data, name, type)}<span>${esc(name)}</span></button>`,
      )
      .join("");
  const d = modal(
    entry.id ? "A closer look." : "What’s the story?",
    `${typeSwitch(type)}<label class="entry-account-field">${icon("wallet")}<span>Account</span>${accountSelect(transactionAccountId(data, entry))}</label><label class="amount-field"><span>Amount <small>${esc(data.settings.currency)}</small></span><div><span class="amount-symbol">${esc(currency(data.settings.currency))}</span><input autofocus name="amount" inputmode="decimal" autocomplete="off" placeholder="0.00" value="${esc(entry.amount || "")}" required aria-label="Transaction amount"></div></label><div class="field-heading"><strong>Choose a category</strong><button type="button" class="text-button" id="entry-new-category">New category</button></div><input type="hidden" name="category" value="${esc(selected)}"><div class="category-picker" role="group" aria-label="Transaction categories">${tiles()}</div><label>Note <span class="optional">optional</span><input name="note" placeholder="Coffee with a friend, grocery run…" maxlength="160" value="${esc(entry.note || "")}"></label><details class="entry-details" ${entry.date && dayKey(entry.date) !== dayKey(new Date()) ? "open" : ""}><summary>${icon("sliders-horizontal")}Date & tags${icon("caret-right")}</summary><div class="form-row"><label>Date<input type="date" name="date" required value="${esc(entry.date ? dayKey(entry.date) : dayKey(new Date()))}"></label></div><label>Tags <span class="optional">comma separated</span><input name="tags" placeholder="work, weekend, shared" maxlength="240" value="${esc((entry.tags || []).join(", "))}"></label></details>${entry.id ? `<div class="entry-more-actions">${button("Save as shortcut", "unused", "bookmark-simple", "button small soft", 'id="entry-shortcut"')}${button("Duplicate", "unused", "copy", "button small soft", 'id="entry-duplicate"')}<button type="button" id="entry-delete" class="button small danger">${icon("trash")}Delete</button></div>` : ""}`,
    {
      subtitle: entry.id ? "EDIT TRANSACTION" : "A MOMENT FOR YOUR MONEY",
      className: "entry-sheet",
      submitLabel: entry.id ? "Save changes" : "Save transaction",
    },
  );
  const picker = d.querySelector(".category-picker");
  picker.addEventListener("click", (e) => {
    const tile = e.target.closest("[data-pick-category]");
    if (!tile) return;
    selected = tile.dataset.pickCategory;
    d.querySelector('[name="category"]').value = selected;
    picker.innerHTML = tiles();
  });
  d.querySelectorAll('[name="type"]').forEach(
    (r) =>
      (r.onchange = () => {
        type = r.value;
        selected = categoryNames(data, type)[0];
        d.querySelector('[name="category"]').value = selected;
        picker.innerHTML = tiles();
      }),
  );
  d.querySelector("#entry-new-category").onclick = () => {
    const f = new FormData(d.querySelector("form"));
    const draft = {
      ...entry,
      type,
      amount: f.get("amount"),
      category: selected,
      note: f.get("note"),
      accountId: f.get("accountId"),
      paymentMethod: methodForAccount(data, f.get("accountId")),
      tags: String(f.get("tags"))
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      date:
        entry.date && dayKey(entry.date) === f.get("date")
          ? entry.date
          : localDate(f.get("date")).toISOString(),
    };
    d.close();
    categoryDialog(
      null,
      type,
      (name) => entryDialog({ ...draft, category: name }),
      () => entryDialog(draft),
    );
  };
  d.querySelector("#entry-shortcut")?.addEventListener("click", () => {
    d.close();
    templateDialog({
      ...entry,
      id: undefined,
      name: entry.note || entry.category,
    });
  });
  d.querySelector("#entry-duplicate")?.addEventListener("click", () => {
    d.close();
    entryDialog({ ...entry, id: undefined, date: new Date().toISOString() });
  });
  d.querySelector("#entry-delete")?.addEventListener("click", () => {
    try {
      change((next) => {
        next.transactions = next.transactions.filter((t) => t.id !== entry.id);
      }, "Transaction deleted");
      d.close();
    } catch (e) {
      d.querySelector(".form-error").textContent = e.message;
    }
  });
  formSubmit(d, (f) => {
    const date = String(f.get("date"));
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      !Number.isFinite(localDate(date).getTime())
    )
      throw new Error("Choose a valid date.");
    const now = new Date();
    const chosen = localDate(date);
    chosen.setHours(
      now.getHours(),
      now.getMinutes(),
      now.getSeconds(),
      now.getMilliseconds(),
    );
    const item = {
      ...entry,
      id: entry.id || uid(),
      type: f.get("type"),
      amount: parseAmount(f.get("amount")),
      category: f.get("category"),
      note: String(f.get("note")).trim(),
      accountId: f.get("accountId"),
      paymentMethod: methodForAccount(data, f.get("accountId")),
      tags: String(f.get("tags"))
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 12),
      date:
        entry.date && dayKey(entry.date) === date
          ? entry.date
          : chosen.toISOString(),
    };
    change(
      (next) => {
        if (entry.id)
          next.transactions = next.transactions.map((t) =>
            t.id === entry.id ? item : t,
          );
        else next.transactions.push(item);
      },
      entry.id
        ? "Transaction updated"
        : `${item.type === "income" ? "Income" : "Expense"} added`,
    );
    d.close();
  });
}

function templateDialog(template = {}) {
  const d = modal(
    template.id ? "Your everyday shortcut." : "Make next time easier.",
    `<label>Name<input name="name" required maxlength="40" placeholder="Morning coffee" value="${esc(template.name || "")}"></label>${typeSwitch(template.type || "expense")}<div class="form-row"><label>Category${categorySelect(template.type || "expense", template.category)}</label><label>Amount<input name="amount" inputmode="decimal" required value="${esc(template.amount || "")}" placeholder="0.00"></label></div><label>Account${accountSelect(transactionAccountId(data, template))}</label><p class="small muted">One tap adds this entry with today’s date. You can undo it.</p>${template.id ? '<button class="button danger small" type="button" id="delete-template">Delete shortcut</button>' : ""}`,
    { subtitle: "QUICK ADD", submitLabel: "Save shortcut" },
  );
  d.querySelectorAll('[name="type"]').forEach(
    (r) =>
      (r.onchange = () => {
        d.querySelector('[name="category"]').outerHTML = categorySelect(
          r.value,
        );
      }),
  );
  d.querySelector("#delete-template")?.addEventListener("click", () => {
    try {
      change((next) => {
        next.templates = next.templates.filter((t) => t.id !== template.id);
      }, "Shortcut deleted");
      d.close();
    } catch (e) {
      d.querySelector(".form-error").textContent = e.message;
    }
  });
  formSubmit(d, (f) => {
    const item = {
      ...template,
      id: template.id || uid(),
      name: String(f.get("name")).trim(),
      type: f.get("type"),
      category: f.get("category"),
      amount: parseAmount(f.get("amount")),
      accountId: f.get("accountId"),
      paymentMethod: methodForAccount(data, f.get("accountId")),
    };
    change((next) => {
      if (template.id)
        next.templates = next.templates.map((t) =>
          t.id === template.id ? item : t,
        );
      else next.templates.push(item);
    }, "Shortcut saved");
    d.close();
  });
}

function goalDialog(goal = {}) {
  const options = [
    "piggy-bank",
    "shield-check",
    "airplane-tilt",
    "house-line",
    "graduation-cap",
    "gift",
  ];
  const d = modal(
    goal.id ? "Shape your goal." : "Something to look forward to.",
    `<label>Goal name<input name="name" required maxlength="60" placeholder="My emergency fund" value="${esc(goal.name || "")}"></label><div class="form-row"><label>Target amount<input name="target" inputmode="decimal" required placeholder="25000" value="${esc(goal.target || "")}"></label><label>Already saved<input name="saved" inputmode="decimal" value="${esc(goal.saved || 0)}"></label></div><label>Target date <span class="optional">optional</span><input name="deadline" type="date" value="${esc(goal.deadline || "")}"></label><fieldset class="icon-options"><legend>A little personality</legend>${options.map((name) => `<label><input type="radio" name="icon" value="${name}" ${(goal.icon || "piggy-bank") === name ? "checked" : ""}><span>${icon(name)}</span><span class="sr-only">${name.replaceAll("-", " ")}</span></label>`).join("")}</fieldset>${goal.id ? '<button type="button" class="button danger small" id="delete-goal">Delete goal</button>' : ""}`,
    { subtitle: "SAVINGS GOAL", submitLabel: "Save goal" },
  );
  d.querySelector("#delete-goal")?.addEventListener("click", () => {
    try {
      change((next) => {
        next.goals = next.goals.filter((g) => g.id !== goal.id);
      }, "Goal deleted");
      d.close();
    } catch (e) {
      d.querySelector(".form-error").textContent = e.message;
    }
  });
  formSubmit(d, (f) => {
    const saved =
      String(f.get("saved")).trim() === "" || Number(f.get("saved")) === 0
        ? 0
        : parseAmount(f.get("saved"));
    const item = {
      ...goal,
      id: goal.id || uid(),
      name: String(f.get("name")).trim(),
      target: parseAmount(f.get("target")),
      saved,
      deadline: f.get("deadline"),
      icon: f.get("icon"),
    };
    change((next) => {
      if (goal.id)
        next.goals = next.goals.map((g) => (g.id === goal.id ? item : g));
      else next.goals.push(item);
    }, "Goal saved");
    d.close();
  });
}

function contributionDialog(id) {
  const goal = data.goals.find((g) => g.id === id);
  if (!goal) return;
  const d = modal(
    "One step closer.",
    `<div class="contribution-goal">${icon(goal.icon || "piggy-bank")}<strong>${esc(goal.name)}</strong><span>${money(goal.saved, data.settings.currency)} of ${money(goal.target, data.settings.currency)}</span></div><label>Amount saved<input name="amount" autofocus inputmode="decimal" required placeholder="0.00"></label><p class="small muted">This updates your savings tracker. It doesn’t add an expense or change your daily spending allowance.</p>`,
    { subtitle: "ADD SAVINGS", submitLabel: "Add to goal" },
  );
  formSubmit(d, (f) => {
    const amount = parseAmount(f.get("amount"));
    change((next) => {
      const g = next.goals.find((g) => g.id === id);
      g.saved = round(Number(g.saved) + amount);
    }, "Savings added");
    d.close();
  });
}

function limitDialog(category = "") {
  const d = modal(
    "A little structure helps.",
    `<label>Expense category${categorySelect("expense", category)}</label><label>Monthly limit<input name="amount" inputmode="decimal" required autofocus value="${esc(data.categoryBudgets[category] || "")}" placeholder="5000"></label><p class="small muted">This is a monthly guide for this category. It doesn’t increase your overall spending plan.</p>${category ? '<button type="button" class="button danger small" id="delete-limit">Remove limit</button>' : ""}`,
    { subtitle: "CATEGORY LIMIT", submitLabel: "Save limit" },
  );
  d.querySelector("#delete-limit")?.addEventListener("click", () => {
    try {
      change((next) => {
        delete next.categoryBudgets[category];
      }, "Category limit removed");
      d.close();
    } catch (e) {
      d.querySelector(".form-error").textContent = e.message;
    }
  });
  formSubmit(d, (f) => {
    const amount = parseAmount(f.get("amount"));
    change((next) => {
      if (category && category !== f.get("category"))
        delete next.categoryBudgets[category];
      next.categoryBudgets[f.get("category")] = amount;
    }, "Category limit saved");
    d.close();
  });
}

function billDialog(bill = {}) {
  const d = modal(
    "Know what’s coming.",
    `${typeSwitch(bill.type || "expense")}<label>Name<input name="name" required maxlength="60" value="${esc(bill.name || "")}" placeholder="Internet, rent, or payday"></label><div class="form-row"><label>Category${categorySelect(bill.type || "expense", bill.category)}</label><label>Amount<input name="amount" inputmode="decimal" required value="${esc(bill.amount || "")}" placeholder="0.00"></label></div><div class="form-row"><label>Next due date<input name="dueDate" type="date" required value="${esc(bill.dueDate || dayKey(new Date()))}"></label><label>Repeats<select name="frequency">${Object.entries(
      frequencyLabels,
    )
      .map(
        ([value, label]) =>
          `<option value="${value}" ${(bill.frequency || "monthly") === value ? "selected" : ""}>${label}</option>`,
      )
      .join(
        "",
      )}</select></label></div><label>Account${accountSelect(transactionAccountId(data, bill))}</label><p class="small muted">Nothing is logged automatically. Confirm a payment from Upcoming when it happens.</p>${bill.id ? '<button type="button" class="button danger small" id="delete-bill">Delete recurring entry</button>' : ""}`,
    { subtitle: "BILLS & RECURRING", submitLabel: "Save recurring entry" },
  );
  d.querySelectorAll('[name="type"]').forEach(
    (r) =>
      (r.onchange = () => {
        d.querySelector('[name="category"]').outerHTML = categorySelect(
          r.value,
        );
      }),
  );
  d.querySelector("#delete-bill")?.addEventListener("click", () => {
    try {
      change((next) => {
        next.bills = next.bills.filter((b) => b.id !== bill.id);
      }, "Recurring entry deleted");
      d.close();
    } catch (e) {
      d.querySelector(".form-error").textContent = e.message;
    }
  });
  formSubmit(d, (f) => {
    const dueDate = f.get("dueDate");
    if (!Number.isFinite(localDate(dueDate).getTime()))
      throw new Error("Choose a valid date.");
    const item = {
      ...bill,
      id: bill.id || uid(),
      name: String(f.get("name")).trim(),
      type: f.get("type"),
      category: f.get("category"),
      amount: parseAmount(f.get("amount")),
      dueDate,
      anchorDay:
        bill.dueDate === dueDate
          ? bill.anchorDay || localDate(dueDate).getDate()
          : localDate(dueDate).getDate(),
      frequency: f.get("frequency"),
      accountId: f.get("accountId"),
      paymentMethod: methodForAccount(data, f.get("accountId")),
      completed: false,
    };
    change((next) => {
      if (bill.id)
        next.bills = next.bills.map((b) => (b.id === bill.id ? item : b));
      else next.bills.push(item);
    }, "Recurring entry saved");
    d.close();
  });
}

function categoryDialog(
  name = null,
  type = "expense",
  onSaved = null,
  onCancel = null,
) {
  let completed = false;
  const meta = categoryMeta(data, name, type);
  const d = modal(
    name ? "Give it your own look." : "A category that fits your life.",
    `<label>Category name<input name="name" required maxlength="32" value="${esc(name || "")}" placeholder="Pets, self-care, side projects…"></label>${typeSwitch(type)}<fieldset class="icon-picker"><legend>Choose a symbol</legend>${categoryIconNames.map((value) => `<label><input type="radio" name="icon" value="${value}" ${meta.icon === value ? "checked" : ""}><span>${icon(value)}</span><span class="sr-only">${value.replaceAll("-", " ")}</span></label>`).join("")}</fieldset><div class="color-field"><label>Color<input name="color" type="color" value="${meta.color}"></label><div class="color-presets">${categoryColors.map((color) => `<button type="button" data-color="${color}" style="background:${color}" aria-label="Choose color ${color}"></button>`).join("")}</div></div>${name && name !== "Other" ? '<button type="button" class="button danger small" id="hide-category">Hide category from the picker</button><p class="small muted">Existing transactions keep their category and remain in your reports.</p>' : ""}`,
    { subtitle: "PERSONAL CATEGORIES", submitLabel: "Save category" },
  );
  d.addEventListener("close", () => {
    if (!completed) onCancel?.();
  });
  d.querySelectorAll("[data-color]").forEach(
    (b) =>
      (b.onclick = () => {
        d.querySelector('[name="color"]').value = b.dataset.color;
      }),
  );
  d.querySelector("#hide-category")?.addEventListener("click", () => {
    try {
      change((next) => {
        next.hiddenCategories = [...new Set([...next.hiddenCategories, name])];
      }, "Category hidden");
      d.close();
    } catch (e) {
      d.querySelector(".form-error").textContent = e.message;
    }
  });
  formSubmit(d, (f) => {
    const nextName = String(f.get("name")).trim();
    if (!nextName) throw new Error("Give your category a name.");
    if (["__proto__", "constructor", "prototype"].includes(nextName))
      throw new Error("Choose another category name.");
    if (
      nextName !== name &&
      (categoryNames(data, "expense").includes(nextName) ||
        categoryNames(data, "income").includes(nextName))
    )
      throw new Error(
        "That category name is already in use. Choose a different name.",
      );
    if (name === "Other" && (nextName !== "Other" || f.get("type") !== type))
      throw new Error(
        "Other is the fallback category. You can change its icon and color, or create a new category.",
      );
    change((next) => {
      if (name && name !== nextName) {
        next.transactions.forEach((t) => {
          if (t.category === name && t.type === type) t.category = nextName;
        });
        next.templates.forEach((t) => {
          if (t.category === name && (t.type || "expense") === type)
            t.category = nextName;
        });
        next.bills.forEach((b) => {
          if (b.category === name && b.type === type) b.category = nextName;
        });
        if (next.categoryBudgets[name]) {
          next.categoryBudgets[nextName] = next.categoryBudgets[name];
          delete next.categoryBudgets[name];
        }
        next.hiddenCategories.push(name);
        delete next.categoryDetails[name];
      }
      next.categoryDetails[nextName] = {
        icon: f.get("icon"),
        color: f.get("color"),
        type: f.get("type"),
      };
      next.hiddenCategories = next.hiddenCategories.filter(
        (n) => n !== nextName,
      );
      if (!next.categories.includes(nextName) && f.get("type") === "expense")
        next.categories.push(nextName);
    }, "Category saved");
    completed = true;
    d.close();
    onSaved?.(nextName);
  });
}

function budgetDialog() {
  const d = modal(
    "Give your spending a plan.",
    `<label>Available to spend<input autofocus name="budget" inputmode="decimal" required value="${esc(data.settings.budget || Math.max(0, accountSummary(data).spendable) || "")}" placeholder="8000"></label>${accountSummary(data).configured ? '<button type="button" class="text-button" id="use-account-funds">Use available spending-account balance</button>' : ""}<div class="form-row"><label>Currency<select name="currency">${["PHP", "USD", "EUR", "GBP", "JPY", "AUD", "CAD", "SGD", "INR"].map((c) => `<option ${c === data.settings.currency ? "selected" : ""}>${c}</option>`).join("")}</select></label><label>Period<select name="cycle">${[
      ["monthly", "Monthly"],
      ["payday", "Until next allowance / income"],
      ["salary", "Twice monthly (salary dates)"],
      ["weekly", "Weekly"],
      ["biweekly", "Every 2 weeks"],
    ]
      .map(
        ([v, l]) =>
          `<option value="${v}" ${data.settings.cycle === v ? "selected" : ""}>${l}</option>`,
      )
      .join(
        "",
      )}</select></label></div>${paydayFields(data.settings)}${salaryFields(data.settings)}<label class="switch-label"><span><strong>Flexible daily allowance</strong><small>Let unspent money adjust the remaining days.</small></span><input type="checkbox" role="switch" name="rollover" ${data.settings.rollover ? "checked" : ""}></label>${!accountSummary(data).configured && !data.transactions.length && !data.transfers.length ? '<label class="checkbox"><input type="checkbox" name="cashStartingBalance" checked> This is also my current Cash balance</label>' : ""}<p class="small muted">Use the money available after your fixed commitments. Logging income won’t change this amount automatically.</p>`,
    { subtitle: "YOUR SPENDING PLAN", submitLabel: "Save my plan" },
  );
  updatePaydayFields(d);
  d.querySelector("#use-account-funds")?.addEventListener("click", () => {
    d.querySelector("[name=budget]").value = Math.max(
      0,
      accountSummary(data).spendable,
    ).toFixed(2);
  });
  formSubmit(d, (f) => {
    saveBudget(f);
    d.close();
  });
}
function saveBudget(f) {
  const budget =
    Number(f.get("budget")) === 0 ? 0 : parseAmount(f.get("budget"));
  const cycle = f.get("cycle");
  const salary =
    cycle === "salary"
      ? {
          enabled: true,
          day1: Number(f.get("salaryDay1")),
          day2: Number(f.get("salaryDay2")),
          amount1: optionalAmount(f.get("salaryAmount1")),
          amount2: optionalAmount(f.get("salaryAmount2")),
        }
      : null;
  const schedule = {
    cycle,
    budgetStart: f.get("budgetStart"),
    nextPayday: f.get("nextPayday"),
    repeatPayday: f.has("repeatPayday"),
    ...(salary ? { salary } : {}),
  };
  validatePayday(schedule);
  const carryoverOpening =
    data.settings.cycle === "monthly" &&
    data.settings.budget > 0 &&
    data.settings.carryover !== false
      ? budgetSummary(data.settings, data.transactions).carryover
      : 0;
  change((next) => {
    if (f.has("cashStartingBalance")) {
      const cash = next.accounts.find((a) => a.type === "cash");
      if (cash) {
        cash.openingBalance = budget;
        cash.configured = true;
      }
    }
    next.settings = {
      ...next.settings,
      budget,
      currency: f.get("currency"),
      ...schedule,
      rollover: f.has("rollover"),
      carryover: f.has("carryover"),
      carryoverFrom: monthKey(new Date()),
      carryoverOpening,
    };
  }, "Spending plan saved");
}

function optionalAmount(value) {
  const text = String(value ?? "").trim();
  if (!text) return 0;
  const n = Number(text.replace(/[,\s]/g, ""));
  if (!Number.isFinite(n) || n < 0 || n > 1e12)
    throw new Error("Salary amounts must be zero or more.");
  return round(n);
}

function salaryDialog() {
  const d = modal(
    "Two paydays. One clear plan.",
    `${salaryFields(data.settings, { visible: true, includeEnabled: true })}<label class="switch-label"><span><strong>Use these dates for my spending plan</strong><small>Each salary period starts on a payday and ends on the next one.</small></span><input type="checkbox" role="switch" name="useSalaryForBudget" ${data.settings.cycle === "salary" ? "checked" : ""}></label><p class="small muted">Turn this off to keep the spending plan on its current period. Your salary schedule stays here for reference and logging.</p>`,
    { subtitle: "SALARY PAYDAYS", submitLabel: "Save paydays" },
  );
  formSubmit(d, (f) => {
    const useForBudget = f.has("useSalaryForBudget");
    const salary = {
      enabled: useForBudget || f.has("salaryEnabled"),
      day1: Number(f.get("salaryDay1")),
      day2: Number(f.get("salaryDay2")),
      amount1: optionalAmount(f.get("salaryAmount1")),
      amount2: optionalAmount(f.get("salaryAmount2")),
    };
    validateSalary(salary);
    change(
      (next) => {
        next.settings.salary = salary;
        if (useForBudget) next.settings.cycle = "salary";
        else if (next.settings.cycle === "salary")
          next.settings.cycle = "monthly";
      },
      salary.enabled ? "Salary paydays saved" : "Salary paydays turned off",
    );
    d.close();
  });
}

function monthlyBillDialog(bill = {}) {
  const editing = Boolean(bill.id);
  const dueDay =
    Number(bill.anchorDay) ||
    (bill.dueDate ? localDate(bill.dueDate).getDate() : new Date().getDate());
  const d = modal(
    editing ? "Keep the monthly rhythm." : "A monthly bill, handled.",
    `<label>Name<input name="name" required maxlength="60" value="${esc(bill.name || "")}" placeholder="Streaming, internet, rent"></label><div class="form-row"><label>Amount<input name="amount" inputmode="decimal" required value="${esc(bill.amount || "")}" placeholder="0.00"></label><label>Due day <span class="optional">of each month</span><input type="number" name="dueDay" min="1" max="31" step="1" inputmode="numeric" required value="${esc(dueDay)}"></label></div><label>Category${categorySelect("expense", bill.category || "Subscriptions")}</label><label>Account${accountSelect(transactionAccountId(data, bill))}</label><p class="small muted">In months without this date, it falls on the last day. Nothing is logged automatically — use <strong>Mark paid</strong> when it happens.</p>${editing ? '<button type="button" class="button danger small" id="delete-monthly-bill">Delete monthly bill</button>' : ""}`,
    {
      subtitle: "MONTHLY BILL",
      submitLabel: editing ? "Save bill" : "Add monthly bill",
    },
  );
  d.querySelector("#delete-monthly-bill")?.addEventListener("click", () => {
    try {
      change((next) => {
        next.bills = next.bills.filter((b) => b.id !== bill.id);
      }, "Monthly bill deleted");
      d.close();
    } catch (e) {
      d.querySelector(".form-error").textContent = e.message;
    }
  });
  formSubmit(d, (f) => {
    const day = Number(f.get("dueDay"));
    if (!Number.isInteger(day) || day < 1 || day > 31)
      throw new Error("Choose a due day from 1 to 31.");
    const dueDate =
      editing && Number(bill.anchorDay || dueDay) === day && bill.dueDate
        ? bill.dueDate
        : nextDueDateForDay(day);
    const item = {
      ...bill,
      id: bill.id || uid(),
      name: String(f.get("name")).trim(),
      type: "expense",
      category: f.get("category"),
      amount: parseAmount(f.get("amount")),
      dueDate,
      anchorDay: day,
      frequency: "monthly",
      accountId: f.get("accountId"),
      paymentMethod: methodForAccount(data, f.get("accountId")),
      completed: false,
    };
    change(
      (next) => {
        if (bill.id)
          next.bills = next.bills.map((b) => (b.id === bill.id ? item : b));
        else next.bills.push(item);
      },
      editing ? "Monthly bill updated" : "Monthly bill saved",
    );
    d.close();
  });
}

function download(name, content, type = "application/json") {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function restoreDialog(next) {
  const d = modal(
    "Bring your records back.",
    `<div class="restore-summary">${icon("shield-check")}<strong>${next.transactions.length} transactions</strong><span>${next.goals.length} savings goals · ${next.templates.length} shortcuts</span></div><p>This will replace the records on this device. A copy of your current records will download first.</p>`,
    {
      subtitle: "RESTORE BACKUP",
      submitLabel: "Back up current data & restore",
    },
  );
  formSubmit(d, () => {
    if (!storageProblem)
      download(
        `daylight-before-restore-${dayKey(new Date())}.backup.json`,
        backup(ctx.demo ? demoOriginal : data),
      );
    save(next, { replace: true });
    storageProblem = "";
    demoOriginal = null;
    ctx.demo = false;
    data = next;
    render();
    d.close();
    notify("Backup restored");
  });
}

function chooseBackup() {
  document.querySelector("#backup-input")?.remove();
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json,application/json";
  input.id = "backup-input";
  input.hidden = true;
  document.body.append(input);
  input.onchange = async () => {
    try {
      const file = input.files[0];
      if (!file) return;
      if (file.size > 20 * 1024 * 1024)
        throw new Error(
          "This backup is too large to load. Choose a file under 20 MB.",
        );
      restoreDialog(restore(await file.text()));
    } catch (e) {
      notify(e.message);
    } finally {
      input.remove();
    }
  };
  input.click();
}

function updateActivityResults() {
  const { filters } = ctx;
  const q = document.querySelector("#transaction-search");
  if (q) filters.query = q.value;
  for (const key of ["category", "method", "from", "to", "accountId"]) {
    const el = document.querySelector(`#filter-${key}`);
    if (el) filters[key] = el.value;
  }
  const items = journalItems(data, ctx);
  const income = round(
      items
        .filter((t) => t.type === "income")
        .reduce((n, t) => n + Number(t.amount), 0),
    ),
    spent = round(
      items
        .filter((t) => t.type === "expense")
        .reduce((n, t) => n + Number(t.amount), 0),
    );
  document.querySelector("#view-income").textContent = money(
    income,
    data.settings.currency,
  );
  document.querySelector("#view-spent").textContent = money(
    spent,
    data.settings.currency,
  );
  document.querySelector("#view-net").textContent = money(
    income - spent,
    data.settings.currency,
  );

  document.querySelector("#transaction-results").innerHTML = items.length
    ? transactionList(data, items)
    : empty(
        "No matching entries",
        "Try another month or clear your filters.",
        "magnifying-glass",
      );
  document.querySelector("#results-count").textContent =
    `${items.length} ${items.length === 1 ? "entry" : "entries"}`;
}

const lastPayments = new Map();
app.addEventListener("click", async (event) => {
  const el = event.target.closest("[data-action]");
  if (!el) return;
  const { action, id, value, category, view, date, day } = el.dataset;
  try {
    switch (action) {
      case "navigate":
        navigate(view);
        break;
      case "add-entry":
        entryDialog(
          ctx.view === "transactions" && ctx.activityPeriod !== "all"
            ? { date: localDate(ctx.activityDate).toISOString() }
            : {},
        );
        break;
      case "edit-entry":
        entryDialog(data.transactions.find((t) => t.id === id));
        break;
      case "view-activity":
        navigate("transactions");
        break;
      case "view-bills":
        ctx.planTab = "bills";
        navigate("plan");
        break;
      case "view-accounts":
        ctx.settingsTab = "accounts";
        navigate("settings");
        break;
      case "view-themes":
        ctx.settingsTab = "appearance";
        navigate("settings");
        break;
      case "toggle-dark":
        change((next) => toggleColorMode(next.settings), "Appearance updated", {
          undo: false,
        });
        break;
      case "add-account":
        accountDialog();
        break;
      case "edit-account":
        accountDialog(data.accounts.find((a) => a.id === id));
        break;
      case "transfer":
        transferDialog();
        break;
      case "delete-transfer":
        change((next) => {
          next.transfers = next.transfers.filter((t) => t.id !== id);
        }, "Transfer removed");
        break;
      case "account-activity":
        ctx.activityPeriod = "all";
        ctx.filters = {
          type: "all",
          query: "",
          category: "",
          method: "",
          from: "",
          to: "",
          accountId: id,
        };
        ctx.showFilters = true;
        navigate("transactions");
        break;
      case "view-data":
        ctx.settingsTab = "data";
        navigate("settings");
        break;
      case "view-install":
        ctx.settingsTab = "install";
        navigate("settings");
        break;
      case "fixed-daily-limit":
        change((next) => {
          next.settings.rollover = false;
        }, "Fixed daily limit enabled");
        break;
      case "budget-dialog":
        budgetDialog();
        break;
      case "add-template":
        templateDialog();
        break;
      case "edit-template":
        templateDialog(data.templates.find((t) => t.id === id));
        break;
      case "quick-add": {
        const t = data.templates.find((t) => t.id === id);
        if (!t) break;
        change(
          (next) => {
            next.transactions.push({
              id: uid(),
              type: t.type || "expense",
              amount: t.amount,
              category: t.category,
              note: t.name || t.note || "",
              date: new Date().toISOString(),
              accountId: transactionAccountId(data, t),
              paymentMethod: methodForAccount(
                data,
                transactionAccountId(data, t),
              ),
              tags: [],
              templateId: t.id,
            });
          },
          `${t.name || t.category} added`,
        );
        break;
      }
      case "previous-month":
        ctx.month = shiftMonth(ctx.month, -1);
        ctx.filters.from = ctx.filters.to = "";
        render();
        break;
      case "next-month":
        ctx.month = shiftMonth(ctx.month, 1);
        ctx.filters.from = ctx.filters.to = "";
        render();
        break;
      case "filter-type":
        ctx.filters.type = value;
        render();
        break;
      case "toggle-filters":
        ctx.showFilters = !ctx.showFilters;
        render();
        break;
      case "clear-filters":
        ctx.filters = {
          type: "all",
          query: "",
          category: "",
          method: "",
          from: "",
          to: "",
        };
        render();
        break;
      case "day-activity":
      case "today-activity":
      case "today-category":
      case "week-activity":
        ctx.activityDate = date || dayKey(new Date());
        ctx.activityPeriod = action === "week-activity" ? "week" : "day";
        ctx.filters = {
          type: "all",
          query: "",
          category: action === "today-category" ? category : "",
          method: "",
          from: "",
          to: "",
          accountId: "",
        };
        navigate("transactions");
        break;
      case "activity-period":
        ctx.activityPeriod = value;
        ctx.filters.from = ctx.filters.to = "";
        render();
        break;
      case "previous-range":
      case "next-range":
        ctx.activityDate = shiftJournalDate(
          ctx.activityPeriod,
          ctx.activityDate,
          action === "previous-range" ? -1 : 1,
        );
        ctx.filters.from = ctx.filters.to = "";
        render();
        break;
      case "today-range":
        ctx.activityPeriod = "day";
        ctx.activityDate = dayKey(new Date());
        ctx.filters.from = ctx.filters.to = "";
        render();
        break;
      case "category-activity":
        ctx.activityPeriod = "month";
        ctx.activityDate = ctx.month + "-01";
        ctx.filters = {
          type: "expense",
          query: "",
          category,
          method: "",
          from: "",
          to: "",
          accountId: "",
        };
        ctx.showFilters = true;
        navigate("transactions");
        break;
      case "plan-tab":
        ctx.planTab = value;
        render();
        break;
      case "add-goal":
        goalDialog();
        break;
      case "edit-goal":
        goalDialog(data.goals.find((g) => g.id === id));
        break;
      case "contribute":
        contributionDialog(id);
        break;
      case "add-limit":
        limitDialog();
        break;
      case "edit-limit":
        limitDialog(category);
        break;
      case "add-bill":
        billDialog();
        break;
      case "edit-bill":
        billDialog(data.bills.find((b) => b.id === id));
        break;
      case "add-monthly-bill":
        monthlyBillDialog();
        break;
      case "edit-monthly-bill":
        monthlyBillDialog(data.bills.find((b) => b.id === id));
        break;
      case "edit-salary":
        salaryDialog();
        break;
      case "use-salary-plan":
        try {
          validateSalary(data.settings.salary);
          change((next) => {
            next.settings.salary.enabled = true;
            next.settings.cycle = "salary";
          }, "Spending plan now follows your salary paydays");
        } catch {
          salaryDialog();
        }
        break;
      case "log-salary": {
        const salary = data.settings.salary || {};
        const payDay = Number(day);
        const amount =
          Number(salary.day1) === payDay
            ? Number(salary.amount1) || 0
            : Number(salary.day2) === payDay
              ? Number(salary.amount2) || 0
              : 0;
        entryDialog({
          type: "income",
          category: "Salary",
          amount: amount || "",
          note: `Salary · ${dayOrdinal(payDay)}`,
          date: new Date().toISOString(),
        });
        break;
      }
      case "pay-bill": {
        if (Date.now() - (lastPayments.get(id) || 0) < 1500) break;
        const b = data.bills.find((b) => b.id === id);
        if (!b || b.completed) break;
        if (paidThisMonth(data.transactions, b)) {
          notify("Already logged this month. You can log it again next month.");
          break;
        }
        change(
          (next) => {
            next.transactions.push({
              id: uid(),
              type: b.type || "expense",
              amount: b.amount,
              category: b.category,
              note: b.name,
              date: new Date().toISOString(),
              accountId: transactionAccountId(data, b),
              paymentMethod: methodForAccount(
                data,
                transactionAccountId(data, b),
              ),
              tags: [],
              recurringId: b.id,
            });
            const target = next.bills.find((b) => b.id === id);
            const nextDate = nextDueDateAfterPayment(b);
            if (nextDate) target.dueDate = nextDate;
            else target.completed = true;
          },
          b.type === "income"
            ? "Income received and logged"
            : "Bill paid and recorded as an expense",
        );
        lastPayments.set(id, Date.now());
        break;
      }
      case "settings-tab":
        ctx.settingsTab = value;
        render();
        break;
      case "theme":
        change(
          (next) => selectColorTheme(next.settings, value),
          "Theme saved",
          { undo: false },
        );
        break;
      case "add-category":
        categoryDialog();
        break;
      case "edit-category":
        categoryDialog(category, el.dataset.type);
        break;
      case "start-demo":
        demoOriginal = structuredClone(data);
        data = demoState();
        ctx.demo = true;
        ctx.month = monthKey(new Date());
        navigate("home");
        break;
      case "exit-demo":
        data = demoOriginal;
        demoOriginal = null;
        ctx.demo = false;
        undoState = null;
        render();
        break;
      case "export-backup":
        download(
          `daylight-${ctx.demo ? "sample-" : ""}${dayKey(new Date())}.backup.json`,
          backup(data),
        );
        if (!ctx.demo) {
          try {
            change(
              (next) => {
                next.settings.lastBackup = new Date().toISOString();
              },
              "",
              { undo: false },
            );
          } catch {}
        }
        notify("Backup downloaded. Keep the file somewhere private.");
        break;
      case "export-csv": {
        const rows = [
          [
            "date",
            "type",
            "amount",
            "currency",
            "category",
            "note",
            "payment",
            "account",
            "tags",
          ],
          ...data.transactions.map((t) => [
            t.date,
            t.type,
            t.amount,
            data.settings.currency,
            t.category,
            t.note,
            t.paymentMethod || "cash",
            data.accounts.find((a) => a.id === transactionAccountId(data, t))
              ?.name || "",
            (t.tags || []).join("; "),
          ]),
        ];
        const csv = rows
          .map((row) =>
            row
              .map((cell) => {
                let s = String(cell ?? "");
                if (/^[=+\-@\t\r]/.test(s.trimStart())) s = `'${s}`;
                return `"${s.replaceAll('"', '""')}"`;
              })
              .join(","),
          )
          .join("\r\n");
        download(
          `daylight-${dayKey(new Date())}.csv`,
          "\uFEFF" + csv,
          "text/csv;charset=utf-8",
        );
        notify("Transactions exported");
        break;
      }
      case "restore-backup":
        chooseBackup();
        break;
      case "download-raw":
        download(
          "daylight-saved-records.json",
          localStorage.getItem(STORAGE_KEY) || "{}",
        );
        break;
      case "recover-copy": {
        const raw = localStorage.getItem(RECOVERY_KEY);
        if (!raw)
          throw new Error(
            "No previous copy is available. Restore a downloaded backup.",
          );
        restoreDialog(normalize(JSON.parse(raw)));
        break;
      }
      case "persist-storage": {
        const granted = await navigator.storage?.persist?.();
        notify(
          granted
            ? "Persistent storage enabled for this device"
            : "The browser manages storage. Keep a downloaded backup too.",
        );
        break;
      }
      case "install":
        if (!ctx.installed && !(await installApp())) {
          ctx.settingsTab = "install";
          navigate("settings");
          notify("Follow the steps below to install on your phone.");
        }
        break;
      case "update-app":
        updateApp();
        break;
      case "undo":
        if (undoState) {
          const next = undoState;
          if (!ctx.demo) save(next);
          data = next;
          undoState = null;
          render();
          notify("Change undone");
        }
        break;
      case "dismiss-toast":
        clearTimeout(toastTimer);
        document.querySelector("#toast-region").innerHTML = "";
        break;
    }
  } catch (error) {
    notify(
      error.name === "QuotaExceededError"
        ? "Device storage is full. Download a backup before freeing space."
        : error.message,
    );
  }
});

// Keep all screen and toast actions delegated to one stable element.
app.addEventListener("input", (e) => {
  if (e.target.id === "transaction-search") updateActivityResults();
});
app.addEventListener("change", (e) => {
  if (
    e.target.id === "selected-month" &&
    /^\d{4}-\d{2}$/.test(e.target.value)
  ) {
    ctx.month = e.target.value;
    ctx.filters.from = ctx.filters.to = "";
    render();
  } else if (
    e.target.id === "activity-date" &&
    /^\d{4}-\d{2}(-\d{2})?$/.test(e.target.value)
  ) {
    ctx.activityDate =
      e.target.value.length === 7 ? e.target.value + "-01" : e.target.value;
    ctx.filters.from = ctx.filters.to = "";
    render();
  } else if (e.target.id?.startsWith("filter-")) updateActivityResults();
});
app.addEventListener("submit", (e) => {
  if (e.target.id !== "budget-settings") return;
  e.preventDefault();
  try {
    saveBudget(new FormData(e.target));
  } catch (error) {
    e.target.querySelector(".form-error").textContent = error.message;
  }
});
window.addEventListener("online", render);
window.addEventListener("offline", render);
let renderedDay = dayKey(new Date());
setInterval(() => {
  const currentDay = dayKey(new Date());
  if (currentDay === renderedDay || document.querySelector("dialog[open]"))
    return;
  if (ctx.activityDate === renderedDay && ctx.activityPeriod === "day")
    ctx.activityDate = currentDay;
  if (ctx.month === renderedDay.slice(0, 7)) ctx.month = currentDay.slice(0, 7);
  renderedDay = currentDay;
  render();
}, 30_000);
window.addEventListener("storage", (e) => {
  if (e.key !== STORAGE_KEY || ctx.demo) return;
  if (document.querySelector("dialog[open]")) {
    notify("Records changed in another window. Refresh before saving.");
    return;
  }
  try {
    data = load();
    render();
  } catch (error) {
    storageProblem = error.message;
    render();
  }
});
window.addEventListener("hashchange", () => {
  const view = location.hash.slice(1);
  if (navItems.some(([id]) => id === view)) {
    ctx.view = view;
    render();
  }
});
render();
initPWA((state) => {
  Object.assign(ctx, state);
  render();
});
if (
  new URLSearchParams(location.search).get("action") === "add" &&
  !storageProblem
)
  entryDialog();

document.addEventListener("change", (event) => {
  if (event.target.matches('select[name="cycle"]'))
    updatePaydayFields(event.target.closest("form"));
});
