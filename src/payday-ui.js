import { dayKey } from "./budget.js";
import { esc } from "./ui.js";

export function paydayFields(settings) {
  return `<fieldset class="payday-fields" ${settings.cycle === "payday" ? "" : "hidden"}><legend>Your allowance dates</legend><div class="form-row"><label>Budget starts<input type="date" name="budgetStart" ${settings.cycle === "payday" ? "required" : ""} value="${esc(settings.budgetStart || dayKey(new Date()))}"></label><label>Next allowance / income<input type="date" name="nextPayday" ${settings.cycle === "payday" ? "required" : ""} value="${esc(settings.nextPayday || "")}"></label></div><label class="checkbox"><input type="checkbox" name="repeatPayday" ${settings.repeatPayday ? "checked" : ""}> Repeat on this day each month</label><p class="small muted">Your money covers the start date through the day before your next allowance. Repeating renews the spending plan; it doesn’t add income to an account.</p></fieldset>`;
}

export function updatePaydayFields(form) {
  const enabled = form.querySelector('[name="cycle"]')?.value === "payday";
  const fields = form.querySelector(".payday-fields");
  if (!fields) return;
  fields.hidden = !enabled;
  fields.querySelectorAll('input[type="date"]').forEach((input) => {
    input.required = enabled;
  });
}
