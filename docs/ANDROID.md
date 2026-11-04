# M.Y.M.P. Android application

The Android app bundles the same tested money journal as the public website. It
opens without an initial website visit, supports Android back/minimize controls,
and exports backups and CSV files through Android's share sheet. Import uses the
system file picker. It has no bank connection, account login, analytics, or
transaction upload.

## Install and move existing records

1. In the current browser/PWA, open **More → Data & privacy → Save full backup**.
2. Download `MYMP-Android.apk` from the project's GitHub releases and open it.
3. Allow installation from the browser when Android asks.
4. In the Android app, open **More → Data & privacy → Restore a backup**.

The Android app and website have different private storage. Records do not appear
automatically in a new installation. Restoring a full backup transfers entries,
account balances, plans, bills, goals, categories, and preferences.

## Updates and data

- Keep `com.angelowww11.mymp`, the `https://localhost` WebView origin, and the
  existing `daylight-budget-v1` data key unchanged across releases.
- Install a newer signed APK over the existing app. Do not uninstall first.
- Android verifies the release signing certificate before accepting an update.
- Private records live in application storage. Uninstalling or clearing that
  storage removes them; a downloaded backup is the recovery route.
- App exports use only an app-private cache directory and grant the selected
  destination temporary access to the exported file. Android cloud backup is
  disabled for the app.
- Web app updates are still offered through **Update now**; Android app updates
  are installed through signed APK releases. Native app files are bundled rather
  than fetched from a remote website.

## Build

Use Node 22+, JDK 21, and Android SDK platform 36. Install dependencies, then run:

```sh
npm ci
npm test
npm run android:sync
cd android
./gradlew assembleRelease lintRelease --no-daemon
```

On Windows, `npm run android:release` builds, runs Android lint, aligns and signs
the release APK, verifies its signature, and writes `releases/MYMP-Android.apk`
and a SHA-256 checksum. The script uses `JAVA_HOME` and `ANDROID_HOME`; it also
recognizes the portable toolchain under `C:\misscellenious\mymp-build-tools`.

The first signed build creates a private signing key and configuration under
`%LOCALAPPDATA%\MYMP\signing`, restricted to the current Windows user. **Back up
this entire private folder securely.** Future updates must use the same key. The
key, password, and built installers are excluded from Git. Set
`MYMP_SIGNING_CONFIG` to a restored configuration file when building elsewhere.
The public CI build checks compilation and lint and produces an explicitly
unsigned verification artifact, not the downloadable signed installer.

Increment the package version before releasing. `prepare-android.mjs` derives a
monotonically increasing Android version code as major × 10000 + minor × 100 +
patch, and prepares the real app icons and splash art.

## Platform APIs

The implementation follows the official Capacitor APIs for
[App](https://capacitorjs.com/docs/apis/app),
[Filesystem](https://capacitorjs.com/docs/apis/filesystem),
[Share](https://capacitorjs.com/docs/apis/share), and
[System Bars](https://capacitorjs.com/docs/apis/system-bars).
