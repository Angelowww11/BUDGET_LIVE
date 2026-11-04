# M.Y.M.P.

A private, installable money journal for daily spending, income, plans, and savings.

**Live app:** https://angelowww11.github.io/BUDGET_LIVE/

## Android application and web installation

A signed Android installer is available in [GitHub releases](https://github.com/Angelowww11/BUDGET_LIVE/releases). The Android app includes its app files for first-launch offline use, native backup sharing, system-bar integration, and Android back-button behavior. See [Android installation and build instructions](docs/ANDROID.md).

Save a backup from your current browser before switching to Android, then restore it in the Android app. The two installations have separate private storage.

## Install the web app

Open the live app online once to prepare offline files.

- **Android:** open in Chrome and tap **Install app**, or use Chrome's menu → **Add to Home screen** → **Install**.
- **iPhone / iPad:** open in Safari → **Share** → **Add to Home Screen** → enable **Open as Web App** if shown → **Add**.
- **Desktop:** use the browser's install button or **More → Install app**.

This is an installable web app with its own home-screen icon and standalone window. It can reopen and save records offline after the initial online visit. Before installing on iPhone or changing devices, download a backup: installed-app storage can be separate from browser storage.

## Features

- Allowance-based budgets: choose **Edit plan → Until next allowance / income**, set the budget start and next payment date, and optionally repeat monthly. Daily limits use those dates instead of month end. The next payment date begins the new period; repeating renews the budget without adding an account transaction.
- Monthly spending plans carry unused budget into later months. The carried amount is included in the next month’s daily limit, and the setting can be changed in **Edit plan**. Cash, card, and savings balances keep their full transaction history independently.
- Salary paydays: choose **Twice monthly (salary dates)** in the spending plan, then set two paydays such as the 15th and 30th with an expected amount for each. The spending period runs from one payday to the next. **Plan → Paydays** shows both dates, the next payday, and a **Log salary** shortcut that opens a pre-filled income entry.
- Monthly bills and subscriptions: **Plan → Monthly bills** keeps a dedicated list of recurring monthly expenses with amount, due day, category, and account. It shows the monthly total, next bill, and offers **Mark paid** to log an expense when it actually happens.
- Balance-first overview with remaining budget, today’s spending and categories, overall account balance, and a visible division such as PHP 8,000 / 31 days = PHP 258.06 per day.
- The daily spending amount now recalculates from the money left across the remaining days and is capped by the balance in accounts marked available for everyday spending. Existing plans switch to flexible daily recalculation on update; a fixed limit can still be selected in the plan.
- A responsive overview, actual seven-day spending chart, period budget ring, and cash-flow summary.
- Expense and income entry with a visual category grid, notes, dates, payment method, and tags.
- Editing, duplicating, deletion with Undo, and a searchable journal with Day, Week, Month, and All time views. Week views include entries across month and year boundaries. Filters cover category, account, dates, notes, tags, and transaction type.
- Quick-add shortcuts that can be created from an existing transaction, edited, and undone after logging.
- Monthly category limits, progress, and over-budget states.
- Savings goals with target dates, suggested weekly contributions, and a contribution form.
- Bills and recurring expenses/income with explicit payment confirmation and correct next-date handling.
- Monthly category breakdown, savings rate, largest expense, tracking streak, and cumulative spending chart. The budget pace comparison is shown only for monthly spending plans.
- Thirteen complete color themes, including Blue, Black, Blue & Black, Dark, and Navy night, plus a visible moon/sun toggle and a labeled dark-mode switch. Color theme and light/dark mode are saved separately: turning on dark mode preserves the selected palette, including pink, brown, blue, and yellow. Custom category icons/colors remain available.
- Cash, Card, Savings, Bank, and E-wallet account types, editable current balances, account-specific records, and transfers that do not count as expenses or income.
- JSON backup/restore, CSV export, a previous on-device recovery copy, and storage-conflict protection.
- Sample preview mode that does not overwrite personal records.

## Privacy and update safety

The public repository contains app code and assets only. Personal records use the existing `daylight-budget-v1` browser storage key; it is preserved across updates. Older records retain their IDs and fields, with additive defaults for new features.

There is no backend, analytics, bank linking, account, or transaction upload. Fonts and icons are bundled locally. Browser storage is not cloud sync or encryption; anyone with access to the unlocked browser profile can access it.

- App releases cache only app files. The service worker never clears localStorage and only removes its own old app caches.
- New releases wait for the user to choose **Update now**. An unfinished entry is not reloaded automatically. Each offline release embeds its matching HTML and reloads its assets, so an older browser HTTP-cache entry cannot mix old markup with new files.
- Saving retains the previous data copy under `daylight-budget-v1-recovery`.
- Invalid data opens a recovery screen rather than being silently replaced by empty records.
- Failed writes leave the saved value intact. Another window's edits are detected before a conflicting save.
- **More → Data & privacy** provides full backup and restore. Backup files are private and should be kept somewhere safe.
- Clearing browser data, changing the website origin, moving devices, private browsing, browser storage eviction, or uninstalling may remove local records. A downloaded backup is the recovery path.

## Budget assumptions

The spending plan is the amount available to spend, separate from the overall account ledger and recorded income. The overview displays both budget balance and overall account balance with their labels. Saving a plan never creates cash or income. Choose **Set plan from money left in accounts** to link the plan to real account funds; income, expense edits, and deletions then recalculate it automatically. A manually entered plan remains a separate spending limit. Salary payday amounts are expectations used for display and pre-filling an income entry; they do not change the spending amount automatically. Monthly bills are also recorded only after **Mark paid** is confirmed. Category limits are monthly guides within this plan, not additional money. Savings-goal contributions update the goal tracker without logging an expense. To move actual funds, use Accounts → Move money. Transfers retain the overall account total and recalculate an account-linked plan when they move funds to or from money set aside. Accounts marked as set aside are excluded from the everyday-money subtotal. Recurring items are logged only after confirmation; no background scheduler or notification delivery is implied.

## Development

```sh
npm ci
npm run dev
npm test
npm run build
npm run preview
```

To reproduce the GitHub Pages path, set `BASE_PATH=/BUDGET_LIVE/` while building and previewing. PNG app icons are committed; `npm run icons` regenerates them from the original app-mark SVG.

- `src/app.js`: application actions, dialogs, and safe state changes.
- `src/views.js`: screens and charts.
- `src/app.css`, `src/planner.css`, `src/app-shell.css`: base components, the money-planner design, theme palettes, native safe areas, and installation screens.
- `src/store.js`: backward-compatible storage, validation, backup/restore, and conflict handling.
- `src/budget.js` and `src/model.js`: budget and money calculations.
- `src/accounts.js` and `src/accounts-ui.js`: account balances, legacy payment-method mapping, and account views.
- `src/journal.js`: daily/weekly/monthly ranges, navigation, and date-aware filtering.
- `src/categories.js` and `src/icons.js`: curated category metadata and local SVG imports.
- `src/pwa.js` and `scripts/build-pwa.mjs`: installation, offline files, and prompted updates.
- `src/platform.js`, `capacitor.config.json`, and `android/`: bundled Android runtime and native exports.
- `src/app-center.js`: install status, migration guidance, versions, and update controls.

## Publishing

The existing GitHub Actions workflow runs tests and builds, then deploys `dist` to GitHub Pages on each push to `main`. Keep **Settings → Pages → Source** set to **GitHub Actions**. The deployment uses the repository name as its base path.

## Credits and research

The icon family is [Phosphor](https://github.com/phosphor-icons/core), under MIT; its license is included in `public/phosphor-license.txt`. Manrope and DM Sans are bundled from their Fontsource packages, with their respective licenses. The M.Y.M.P. app mark and planner design are original. Instrument Sans and Instrument Serif are also bundled locally under their Fontsource font licenses.

See [design and research notes](docs/DESIGN.md) for the product references, design decisions, and verification performed for this release.
