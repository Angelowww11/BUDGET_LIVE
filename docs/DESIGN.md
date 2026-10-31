# Daylight 2: design and product research

Reviewed on October 31, 2026. These references informed individual decisions; the interface, layout, color tokens, and app mark are Daylight's own.

## Product references

| Reference | What was useful | What Daylight implements |
| --- | --- | --- |
| [MyMoney by Ananta Raha](https://play.google.com/store/apps/details?id=com.raha.app.mymoney.free) | Visual category recognition and transactions grouped by day | Consistent category artwork, a date-grouped journal, clear income and expense amounts |
| [Spendee budget guidance](https://help.spendee.com/article/131-budget-my-money) | Category budgets and daily spending awareness | Monthly category caps, progress, remaining amounts, and over-limit states |
| [Spendee category customization](https://help.spendee.com/article/227-how-to-create-a-custom-category) | Personal names, icons, and colors | Custom expense and income categories with an icon and color picker |
| [Spendee overview](https://www.spendee.com/) | A readable view of money in, money out, and category spending | Compact cash flow summaries and category-level charts |
| [Copilot dashboard](https://help.copilot.money/en/articles/6045480-dashboard-tab-overview) | Spending pace, upcoming items, and useful overview priorities | Daily allowance, seven-day spending, a monthly pace chart, and upcoming entries |
| [Copilot recurring entries](https://help.copilot.money/en/articles/3760068-creating-recurrings) | Expected payments organized by schedule | Confirmed recurring expenses and income; no silent or duplicate automatic entries |
| [Wallet planned payments](https://support.budgetbakers.com/hc/en-us/articles/7149523920786-Setup-Planned-Payments) | Upcoming-payment overview and payment confirmation | Mark paid/received, automatic next-date calculation, and Undo |
| [Wallet setup](https://support.budgetbakers.com/hc/en-us/articles/7151352625938-Getting-Started-with-Wallet) | Manual entry and a dashboard with clear reports | A compact entry sheet, useful month filters, and inspectable chart values |

## Visual direction

- **Colors:** fog `#f5f6f4`, paper `#ffffff`, forest `#356e57`, ink `#233b33`, soft sage `#e3eee4`, and oat `#f8eee2`. Ocean, Mocha, Blush, Sunshine, and Midnight share the same semantic token system.
- **Type:** locally bundled Manrope for headings and key amounts, DM Sans for labels and interface text. Amounts use tabular numbers where alignment matters.
- **Layout:** a stable desktop rail, two-column overview, and one-column phone screens. Add belongs in the mobile navigation dock, so it does not cover transaction amounts or shortcuts.
- **Identity:** the daily allowance is the primary decision. Charts use actual records, not decorative sample values. Empty states have real next actions, and the optional sample preview never overwrites personal records.
- **Entry flow:** amount → visual category → Save. Notes, payment method, dates, and tags are optional. The Save button stays visible while the sheet body scrolls. Creating a category preserves the unfinished entry.

## Icon research and choice

[Phosphor](https://github.com/phosphor-icons/core) provides a broad, consistent family with multiple weights. Daylight uses its **duotone category symbols** for recognition at small sizes and its **regular utility symbols** for controls. Each category gets a stable, purpose-selected pictogram and color: a food bowl, grocery basket, coffee cup, bus, receipt, heartbeat, briefcase, laptop, gift, and other recognizable objects. Artwork appears consistently in the picker, journal, shortcuts, limits, and insights.

All used SVGs and fonts are bundled with the app. There are no icon-font or image-CDN requests. Phosphor's MIT license is included in `public/phosphor-license.txt`; the font packages include their respective licenses.

## Installation and data research

- [MDN installability](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable): manifest, app icons, standalone mode, and Android install prompt.
- [MDN offline operation](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Offline_and_background_operation): a service worker precaches app assets for offline access.
- [MDN service-worker updates](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Tutorials/CycleTracker/Service_workers): a content-derived version identifies each offline release. Updates wait for user-triggered reload.
- [Apple web apps](https://developer.apple.com/videos/play/wwdc2023/10120/): iPhone installation uses Add to Home Screen; standalone app storage can be separate from browser storage, so the interface recommends a backup before installation.
- [MDN persistent storage](https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/persist): persistent storage can be requested, but downloadable backups remain necessary.

## Verification

- Responsive review at 320, 390, 768, and 1440 pixels, including each main view and the entry sheet.
- Accessibility scan of all six overview themes and a separate insights scan; SVG chart-label contrast also reviewed manually.
- Browser checks for entry editing, category creation with draft preservation, shortcuts and Undo, limits, bill confirmation and Undo, and savings contributions.
- Older JSON backup restore verified through the interface, retaining record IDs and original fields.
- Production subpath tested with the service worker: offline reload, offline income entry, another reload, and a prompted app update that retained the same saved transaction.

## Balance and daily-journal update

The overview now leads with remaining budget, shows the original budget divided by the full number of days, and keeps today's limit, spending, remaining allowance, and expense details together. The original income/expense journal is available as Day, Week, Month, and All time, with an independent date picker. Weeks start Monday and can cross month boundaries.

Cash, Card, and Savings start as separate accounts; users can add Bank, E-wallet, or additional accounts. Old transactions are mapped from their existing payment methods without rewriting record IDs or amounts. Changing a current account balance corrects its opening balance. Transfers move funds between accounts without changing total money, income, spending, or the daily budget.

The new palette choices are Lilac, Peach, Cherry, Lagoon, and Navy night, bringing the total to eleven. Dark mode has a header moon/sun control and an explicit switch in More. Small receipt-style dividers and category tags add personality while keeping the money readable.

Verification adds exact 8,000 / 31 budget checks, account-balance and transfer conservation tests, legacy mapping, account backup round-trips, week boundaries, selected-day entry, and four responsive widths. The overview and account screens were scanned in all eleven themes.
