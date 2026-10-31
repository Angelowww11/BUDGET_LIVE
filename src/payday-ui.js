import { dayKey } from "./budget.js";
import { esc } from "./ui.js";

export function paydayFields(settings) {
  return `<fieldset class="payday-fields" ${settings.cycle === "payday" ? "" : "hidden"}><legend>Your allowance dates</legend><div class="form-row"><label>Budget starts<input type="date" name="budgetStart" ${settings.cycle === "payday" ? "required" : ""} value="${esc(settings.budgetStart || dayKey(new Date()))}"></label><label>Next allowance / income<input type="date" name="nextPayday" ${settings.cycle === "payday" ? "required" : ""} value="${esc(settings.nextPayday || "")}"></label></div><label class="checkbox"><input type="checkbox" name="repeatPayday" ${settings.repeatPayday ? "checked" : ""}> Repeat on this day each month</label><p class="small muted">Your money covers the start date through the day before your next allowance. Repeating renews the spending plan; it doesn’t add income to an account.</p></fieldset>`;
}

export function salaryFields(
  settings,
  { visible = settings.cycle === "salary", includeEnabled = false } = {},
) {
  const salary = settings.salary || {};
  const day = (value, fallback) =>
    esc(value === undefined || value === null ? fallback : value);
  const amount = (value) => esc(Number(value) > 0 ? value : "");
  return `<fieldset class="salary-fields" ${visible ? "" : "hidden"}><legend>Your salary paydays</legend>${
    includeEnabled
      ? `<label class="checkbox"><input type="checkbox" name="salaryEnabled" ${salary.enabled ? "checked" : ""}> Track my salary paydays</label>`
      : ""
  }<div class="form-row"><label>First payday <span class="optional">day of month</span><input type="number" name="salaryDay1" min="1" max="31" step="1" inputmode="numeric" data-salary-required ${visible ? "required" : ""} value="${day(salary.day1, 15)}"></label><label>First amount <span class="optional">optional</span><input name="salaryAmount1" inputmode="decimal" value="${amount(salary.amount1)}" placeholder="0.00"></label></div><div class="form-row"><label>Second payday <span class="optional">day of month</span><input type="number" name="salaryDay2" min="1" max="31" step="1" inputmode="numeric" data-salary-required ${visible ? "required" : ""} value="${day(salary.day2, 30)}"></label><label>Second amount <span class="optional">optional</span><input name="salaryAmount2" inputmode="decimal" value="${amount(salary.amount2)}" placeholder="0.00"></label></div><p class="small muted">Use two different dates, such as the 15th and 30th. In shorter months, the 29th–31st move to the last day. Amounts are expected income; logging a salary creates a normal income entry.</p></fieldset>`;
}

export function updatePaydayFields(form) {
  const cycle = form.querySelector('[name="cycle"]')?.value;
  const fields = form.querySelector(".payday-fields");
  if (fields) {
    const enabled = cycle === "payday";
    fields.hidden = !enabled;
    fields.querySelectorAll('input[type="date"]').forEach((input) => {
      input.required = enabled;
    });
  }
  const salary = form.querySelector(".salary-fields");
  if (salary) {
    const enabled = cycle === "salary";
    salary.hidden = !enabled;
    salary.querySelectorAll("[data-salary-required]").forEach((input) => {
      input.required = enabled;
    });
  }
}
