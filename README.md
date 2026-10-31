# Daylight Budget

A private, installable money journal for daily spending, income, plans, and savings.

**Live app:** https://angelowww11.github.io/BUDGET_LIVE/

## Install on your phone

Open the live app online once to prepare offline files.

- **Android:** open in Chrome and tap **Install app**, or use Chrome's menu → **Add to Home screen** → **Install**.
- **iPhone / iPad:** open in Safari → **Share** → **Add to Home Screen** → enable **Open as Web App** if shown → **Add**.
- **Desktop:** use the browser's install button or **More → Install app**.

This is an installable web app with its own home-screen icon and standalone window. It can reopen and save records offline after the initial online visit. Before installing on iPhone or changing devices, download a backup: installed-app storage can be separate from browser storage.

## Features

- Balance-first overview with remaining budget, today’s spending and categories, overall account balance, and a visible division such as PHP 8,000 / 31 days = PHP 258.06 per day. New plans use a fixed daily allowance by default; existing rollover preferences are preserved.
- A responsive overview, actual seven-day spending chart, period budget ring, and cash-flow summary.
- Expense and income entry with a visual category grid, notes, dates, payment method, and tags.
- Editing, duplicating, deletion with Undo, and a searchable journal with Day, Week, Month, and All time views. Week views include entries across month and year boundaries. Filters cover category, account, dates, notes, tags, and transaction type.
- Quick-add shortcuts that can be created from an existing transaction, edited, and undone after logging.
- Monthly category limits, progress, and over-budget states.
- Savings goals with target dates, suggested weekly contributions, and a contribution form.
- Bills and recurring expenses/income with explicit payment confirmation and correct next-date handling.
- Monthly category breakdown, savings rate, largest expense, tracking streak, and cumulative spending chart. The budget pace comparison is shown only for monthly spending plans.
- Thirteen complete color themes, including Blue, Black, Blue & Black, Dark, and Navy night, plus a visible moon/sun toggle and a labeled dark-mode switch. Custom category icons/colors remain available.
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

The spending plan is the amount available to spend, separate from the overall account ledger and recorded income. The overview displays both budget balance and overall account balance with their labels. A first-time plan can also initialize Cash to the same amount without logging income. Logging income does not automatically increase it. Category limits are monthly guides within this plan, not additional money. Savings-goal contributions update the goal tracker without logging an expense. To move actual funds, use Accounts → Move money. Transfers retain the overall account total and do not change the spending plan. Accounts marked as set aside are excluded from the everyday-money subtotal. Recurring items are logged only after confirmation; no background scheduler or notification delivery is implied.

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
- `src/app.css`: one design system, all themes, and responsive layouts.
- `src/store.js`: backward-compatible storage, validation, backup/restore, and conflict handling.
- `src/budget.js` and `src/model.js`: budget and money calculations.
- `src/accounts.js` and `src/accounts-ui.js`: account balances, legacy payment-method mapping, and account views.
- `src/journal.js`: daily/weekly/monthly ranges, navigation, and date-aware filtering.
- `src/categories.js` and `src/icons.js`: curated category metadata and local SVG imports.
- `src/pwa.js` and `scripts/build-pwa.mjs`: installation, offline files, and prompted updates.

## Publishing

The existing GitHub Actions workflow runs tests and builds, then deploys `dist` to GitHub Pages on each push to `main`. Keep **Settings → Pages → Source** set to **GitHub Actions**. The deployment uses the repository name as its base path.

## Credits and research

The icon family is [Phosphor](https://github.com/phosphor-icons/core), under MIT; its license is included in `public/phosphor-license.txt`. Manrope and DM Sans are bundled from their Fontsource packages, with their respective licenses. The Daylight app mark and page design are original.

See [design and research notes](docs/DESIGN.md) for the product references, design decisions, and verification performed for this release.
