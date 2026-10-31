import { icon } from "./icons.js";
export const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export const currency = (code) => {
  try {
    return new Intl.NumberFormat("en", { style: "currency", currency: code })
      .formatToParts(0)
      .find((p) => p.type === "currency").value;
  } catch {
    return code;
  }
};
export function money(amount, code = "PHP", compact = false) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: code,
    maximumFractionDigits: compact ? 0 : 2,
    minimumFractionDigits: compact ? 0 : 2,
  }).format(Number(amount) || 0);
}
export const button = (
  label,
  action,
  glyph = "",
  className = "button primary",
  extra = "",
) =>
  `<button type="button" class="${className}" data-action="${action}" ${extra}>${glyph ? icon(glyph) : ""}<span>${label}</span></button>`;
export const iconButton = (label, action, glyph, extra = "") =>
  `<button type="button" class="icon-button" aria-label="${esc(label)}" data-action="${action}" ${extra}>${icon(glyph)}</button>`;
export const empty = (title, detail, glyph = "tray", action = "", label = "") =>
  `<div class="empty-state">${icon(glyph, "empty-icon")}<h3>${title}</h3><p>${detail}</p>${action ? button(label, action, "plus", "button small soft") : ""}</div>`;
export const percent = (n, d) =>
  d > 0 ? Math.min(100, Math.max(0, (n / d) * 100)) : 0;
export const progress = (n, d, label, warning = false) =>
  `<div class="progress ${warning ? "warning" : ""}" role="progressbar" aria-label="${esc(label)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(percent(n, d))}"><span style="width:${percent(n, d)}%"></span></div>`;
export const methodLabels = {
  cash: "Cash",
  card: "Card",
  ewallet: "E-wallet",
  bank: "Bank",
};
export const frequencyLabels = {
  once: "One time",
  weekly: "Weekly",
  biweekly: "Every 2 weeks",
  monthly: "Monthly",
  yearly: "Yearly",
};
export const dayOrdinal = (day) => {
  const n = Number(day) || 0;
  const suffix =
    n % 100 >= 11 && n % 100 <= 13
      ? "th"
      : ({ 1: "st", 2: "nd", 3: "rd" }[n % 10] || "th");
  return `${n}${suffix}`;
};
export const logo = `<svg class="brand-symbol" viewBox="0 0 40 40" aria-hidden="true"><rect width="40" height="40" rx="13" fill="currentColor"/><path d="M12 26V15h5v11m6 0V11h5v15" stroke="var(--on-accent)" stroke-width="3.2" stroke-linecap="round"/><path d="M10 30h20" stroke="var(--on-accent)" stroke-opacity=".5" stroke-width="2" stroke-linecap="round"/></svg>`;
