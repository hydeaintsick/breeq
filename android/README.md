# Breeq for Android

A native shell around one WebView on `https://breeq.space/game/menu`. Portrait only,
Android 6.0 (API 23) and up, ~270 KB. The page is the product; the shell does what a
browser tab cannot (see `app/src/main/java/space/breeq/app/MainActivity.kt`).

## Release in one command

```sh
pnpm android:release          # → android/dist/breeq-<versionName>-<versionCode>.aab + .apk
pnpm android:release 1.1.0    # same, sets versionName
```

The first run mints the upload key into `android/keystore/breeq-upload.jks` and writes
`android/keystore.properties` (both git-ignored — **back them up**). Every run bumps
`versionCode` in `android/version.properties` (commit it), builds, signs, and prints the
certificate SHA-256. Upload the `.aab` in Play Console; `adb install -r` the `.apk` on a
test device.

Requirements: a JDK 17+ (`brew install --cask temurin`) and the Android SDK
(`brew install --cask android-commandlinetools`, or Android Studio). The script finds the
SDK by itself and Gradle downloads the missing platform. No Android Studio needed.

## Develop

```sh
pnpm android:debug                                           # build + install the debug app on the connected device
cd android && ./gradlew installDebug -Pbreeq.startUrl=http://10.0.2.2:3333/game/menu   # against `pnpm dev` from the emulator
```

The debug build has the id `space.breeq.app.debug`, allows cleartext HTTP, and enables
`chrome://inspect` remote debugging of the WebView.

## What the shell does

- **Edge to edge, in the page's colors.** The activity pads the WebView by the system-bar
  insets and paints the bars' backdrop with the page's `body` background; a script
  injected after each load reports it through `window.BreeqAndroid.setChrome()` whenever
  `html[data-theme]` flips, so the status bar follows the day/night setting.
- **Portrait**, no zoom, `textZoom` locked at 100 so the board keeps its layout, algorithmic
  darkening off (the page owns its theme).
- **Session** in the WebView's cookie jar, flushed on pause, back/forward state saved on
  process death; back navigates the WebView, then sends the app to the background.
- **Navigation policy.** Our hosts load inside. Google sign-in, Stripe Checkout and a bank's
  3-D Secure page also stay inside, since they come back to us with the session. The
  share row's networks (X, Facebook, WhatsApp, Telegram...) and `target=_blank` popups
  go to the matching app or the browser; `mailto:`, `tel:`, `intent://` too.
- **User agent** is the WebView's minus the `; wv` / `Version/4.0` markers (Google refuses
  those for OAuth), plus `BreeqApp/<version>` so the site can detect the app.
- **Photo picker** for the wall editor (`<input type="file" accept="image/*">`).
- **Offline view** with a retry when the first page cannot load; the splash (the board's
  night plate and the launcher mark) stays up until the page paints, five seconds at most.
- **App Links.** `https://breeq.space/*` is declared with `autoVerify`. Set
  `ANDROID_CERT_SHA256` on the site (upload key + Play app-signing key, comma-separated) so
  `/.well-known/assetlinks.json` lists them; then referral links open the app.

## Play Console

Listing copy and assets are in `store/`: `listing.md` (name, descriptions, category),
`icon-512.png`, `feature-1024x500.png`. Enable Play App Signing on the first upload; the key
minted here is the *upload* key.

Gem packs are bought through Stripe Checkout inside the WebView. Play's payments policy
expects Google Play Billing for digital goods sold inside an app: review this before the
first submission (the same question applies to ETH payouts under the real-money policies).
