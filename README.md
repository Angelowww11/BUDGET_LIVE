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

- Daily allowance for monthly, weekly, or two-week spending periods, with optional rollover.
- A responsive overview, actual seven-day spending chart, period budget ring, and cash-flow summary.
- Expense and income entry with a visual category grid, notes, dates, payment method, and tags.
- Editing, duplicating, deletion with Undo, and a searchable journal with month, category, payment, date-range, and transaction-type filters.
- Quick-add shortcuts that can be created from an existing transaction, edited, and undone after logging.
- Monthly category limits, progress, and over-budget states.
- Savings goals with target dates, suggested weekly contributions, and a contribution form.
- Bills and recurring expenses/income with explicit payment confirmation and correct next-date handling.
- Monthly category breakdown, savings rate, largest expense, tracking streak, and cumulative spending chart. The budget pace comparison is shown only for monthly spending plans.
- Six complete color themes and custom category icons/colors.
- JSON backup/restore, CSV export, a previous on-device recovery copy, and storage-conflict protection.
- Sample preview mode that does not overwrite personal records.

## Privacy and update safety

The public repository contains app code and assets only. Personal records use the existing `daylight-budget-v1` browser storage key; it is preserved across updates. Older records retain their IDs and fields, with additive defaults for new features.

There is no backend, analytics, bank linking, account, or transaction upload. Fonts and icons are bundled locally. Browser storage is not cloud sync or encryption; anyone with access to the unlocked browser profile can access it.

- App releases cache only app files. The service worker never clears localStorage and only removes its own old app caches.
- New releases wait for the user to choose **Update now**. An unfinished entry is not reloaded automatically.
- Saving retains the previous data copy under `daylight-budget-v1-recovery`.
- Invalid data opens a recovery screen rather than being silently replaced by empty records.
- Failed writes leave the saved value intact. Another window's edits are detected before a conflicting save.
- **More → Data & privacy** provides full backup and restore. Backup files are private and should be kept somewhere safe.
- Clearing browser data, changing the website origin, moving devices, private browsing, browser storage eviction, or uninstalling may remove local records. A downloaded backup is the recovery path.

## Budget assumptions

The spending plan is the amount available to spend, separate from recorded income. Logging income does not automatically increase it. Category limits are monthly guides within this plan, not additional money. Savings contributions update the goal tracker without logging an expense. Recurring items are logged only after confirmation; no background scheduler or notification delivery is implied.

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
- `src/categories.js` and `src/icons.js`: curated category metadata and local SVG imports.
- `src/pwa.js` and `scripts/build-pwa.mjs`: installation, offline files, and prompted updates.

## Publishing

The existing GitHub Actions workflow runs tests and builds, then deploys `dist` to GitHub Pages on each push to `main`. Keep **Settings → Pages → Source** set to **GitHub Actions**. The deployment uses the repository name as its base path.

## Credits and research

The icon family is [Phosphor](https://github.com/phosphor-icons/core), under MIT; its license is included in `public/phosphor-license.txt`. Manrope and DM Sans are bundled from their Fontsource packages, with their respective licenses. The Daylight app mark and page design are original.

See [design and research notes](docs/DESIGN.md) for the product references, design decisions, and verification performed for this release.
