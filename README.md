# Daylight Budget

A public, mobile-first budgeting website. Personal records remain in the visitor's browser. The repository and deployed files contain no transaction data.

## Local setup

```sh
npm install
npm run dev
```

Run `npm test` for daily budget and rollover checks and `npm run build` to verify the website.

## Privacy and updates

- Records are saved under the stable `daylight-budget-v1` browser storage key. Code deployments do not clear it.
- There is no backend, account, analytics, or network request for personal records. The font may load from Google Fonts; a system font is used if offline.
- Browser storage is tied to the site origin. Changing the GitHub Pages URL, clearing site data, private browsing, or moving to another device requires a JSON backup and restore.
- Download a JSON backup from **More** before changing devices or the site URL. Store that file somewhere private. CSV export is available for analysis.
- Never commit personal backup or CSV files. `.gitignore` excludes them, but check commits before publishing.

## Publishing

Create a new GitHub repository, push this folder to its `main` branch, then set **Settings → Pages → Build and deployment → Source: GitHub Actions**. Each push runs tests, builds, and publishes the website. Keep the repository public if you want the website public. GitHub Pages hosts the app code only.

## Scope

Includes onboarding via budget setup, daily allowance and rollover, expense and income entry, editing and deleting, searchable activity, quick add, summary insights, savings goals, CSV export, and JSON backup/restore. Advanced items in the attached product brief such as receipt images, biometrics, recurring reminders, wallets, and bills are not implemented in this version. Browser storage cannot guarantee recovery if the browser clears data; backups are essential.
