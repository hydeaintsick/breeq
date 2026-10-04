# Play Store listing

Everything Play Console asks for, in the order it asks. Assets live next to this file:

| Asset | File | Play requirement |
| --- | --- | --- |
| App icon | `icon-512.png` | 512×512 PNG, 32-bit, ≤ 1 MB |
| Feature graphic | `feature-1024x500.png` | 1024×500 PNG/JPEG, no alpha |
| Phone screenshots (5) | `screenshots/phone/01…05.png` | 1080×1920, 9:16, 24-bit PNG |
| 7-inch tablet (5) | `screenshots/tablet-7/01…05.png` | 1440×2560 |
| 10-inch tablet (5) | `screenshots/tablet-10/01…05.png` | 2160×3840 |
| Release bundle | `../dist/breeq-<version>-<code>.aab` | built by `pnpm android:release` |

Screenshots are real captures. Upload them in numeric order. The first frame in
search is the board, then the "one more wall" loop, then Kal. Earn, the ETH pot,
and the "go on sale" editor are in `screenshots/retired/` and stay out of this
listing. The feature graphic is `feature-1024x500.png`: the board, "Break the wall.",
no Earn and no ETH. The previous banner is kept in `screenshots/retired/`.

---

## Main store listing

### App name (30 characters max)

```
Bricks Breaker: Breeq
```

21 characters. The words people type, first, then the name. "Story" stays in the
short description: almost nobody searches it, and it spends title characters
that should match "bricks breaker". "Earn" and "ETH" stay out.

### Short description (80 characters max)

```
Break neon bricks across 240 walls. One story. No ads. One more ball.
```

69 characters. This line sits under the name in search, so it sells the tap:
no ads, one more ball, and the story. The title already carries the search term.

### Full description (4000 characters max)

```
Breeq is a brick breaker with a road home.

Kal hatched alone on the wrong moon. Clear a wall and the next one is already waiting: 24 episodes, 240 walls, three stars if the ball stays up, and a page in the Book of Kal every time a chapter falls.

ONE MORE WALL
Each wall is a minute and a decision. The ball comes back hotter. A clean run pays three stars. Miss, and the same wall is still there. The story does not move on without you.

RINGS THAT BEND THE BALL
Slow rings, ×2 and ×3, a split that throws a second ball, portals, locks and keys, bricks that explode, bricks that grow back, bumpers, rails, fans, and a black hole you have to read before you fire. Every episode teaches one piece, then asks you to use it.

A ROAD YOU CAN SEE
The galaxy map fills in behind you, one world at a time. Twenty-four episodes, ten walls each. You always know the next one, and you always know you have not finished.

HELP KAL FIND HOME
Kal is a galactic gecko. All he has is a pod, a star chart with one star circled, and a heartbeat he remembers from inside the egg. Walk him home, past the Lanterns, the peoples of the Long Migration, and the Hush, the dark that eats light.

MADE FOR ONE THUMB
Portrait only. The board fills the screen. The paddle follows your finger. Sound is written in the key of the level. Haptics land with the brick. Both can be switched off.

THE STORY IS FREE
No ads. No subscription. Gems are optional: they recharge a run, or skip a wall you are stuck on. Sign in with Google or email. Your XP and your place on the road are the same in the app and on breeq.space.

Share a clear on X, WhatsApp, Telegram, or Facebook. Friends who join from your link earn you gems.
```

About 1,700 characters. The first two sentences are what Play shows before
"Read more", so they carry the search term and the hook. Plain text only: Play
strips markdown, and emoji in descriptions read as spam to reviewers. No ETH,
no player editor, no "play to earn": those screens are not in the app while
Earn is switched off, and a listing that promises them is a misleading-claims
rejection.

### What's new (500 characters max, per release)

```
The story is the game.
• 24 episodes, 240 walls, the Book of Kal, and a galaxy map that fills in as you clear.
• Rings that slow the ball, double it, split it, or send it through a portal.
• One thumb, portrait, sound in the level's key. No ads.
```

"What's new" only changes when you ship a release. The title, the short
description, the full description, and the screenshots can be saved on the
listing without a new app bundle.

---

## Store settings

- **App or game:** Game
- **Category:** Arcade
- **Tags (up to 5):** Brick breaker, Arcade, Casual, Single player, Stylized. Drop "Play-to-earn" and "Level editor"; the console only accepts tags it offers, so skip any of these it does not list.
- **Email:** the address you monitor for Play (shown publicly)
- **Website:** https://breeq.space
- **Privacy policy:** https://breeq.space/privacy

## App content declarations

Answer these once under **Policy → App content**. Nothing here is optional; a missing
declaration blocks the release.

- **Privacy policy:** https://breeq.space/privacy
- **Ads:** No, the app contains no ads.
- **App access:** "All or some functionality is restricted." Add one instruction set:
  - Name: `Review account`
  - Username: `playreview@breeq.space`
  - Password: `Paddle-Review-2026!`
  - Instructions: "Sign in with the email tab. Open Play. Story is the only mode
    on the menu. Earn is switched off and does not appear."
- **Content rating:** IARC questionnaire, category *Game*. Answer No to violence,
  sexuality, language, controlled substances, and to gambling / wagering: there
  is no pot, no ticket, and no payout while Earn is closed. Answer **Yes** to
  "does the app allow users to spend real money" (gem packs). For user interaction,
  the share links still exist; published walls do not, so do not describe player
  walls as something a reviewer can open.
- **Target audience:** leave the current rating in place until you resubmit the
  questionnaire. Do not opt into the Families program. Gem packs are real-money
  purchases, and the story is not a children's app.
- **News app:** No. **COVID-19 tracing:** No. **Government app:** No.
- **Financial features:** none, while Earn is closed. The ETH balance and the
  withdrawal form are not reachable. Declare them again only when Earn reopens.
- **Health:** none.
- **Data safety:** see the table below.

### Data safety form

| Data | Collected | Shared | Purpose | Notes |
| --- | --- | --- | --- | --- |
| Email address | Yes | No | Account management | Auth.js sign-in, Google or email |
| Name | Yes (Google display name) | No | Account management | Username shown in the game |
| Photos | Yes, user-picked | No | App functionality | Wall backgrounds, uploaded to Cloudinary |
| Purchase history | Yes | No | App functionality | Gem packs via Stripe, ledger |
| Financial info (wallet address) | No, while Earn is closed | – | – | The withdrawal form is not reachable. Switch this back to Yes when Earn reopens. |
| App interactions | Yes | No | Analytics, app functionality | Runs, clears, XP |
| Crash logs | No | – | – | No SDK |
| Device or other IDs | No | – | – | – |

Encryption in transit: Yes. Data deletion: Yes, from the account page or by email.
No data is collected by third-party SDKs; the app is a WebView over breeq.space with
no analytics or ads library.

### Policy notes (read before submitting)

1. **Payments.** Gem packs are sold through Stripe Checkout inside the WebView. Play's
   Payments policy requires Google Play Billing for digital goods sold in an app
   distributed on Play. Expect a rejection under "Payments" if the review team buys a
   pack. Two ways through: (a) implement Play Billing for gems on Android, or (b) hide
   the gem shop when the page runs inside the app (`navigator.userAgent` contains
   `BreeqApp/`, or `window.BreeqAndroid` exists) and let players top up on the web. Option (b) is the one-day fix;
   the listing copy above does not mention prices or Stripe.
2. **Real-money gaming.** With Earn closed, the app does not pay a pot and does
   not show one. Answer No to wagering, and do not describe ETH anywhere on the
   listing or in the screenshots. The policy comes back the day Earn reopens:
   a pot in ETH is a real-money contest whether or not the win is skill. Leave
   `earnEnabled` off until a clear is settled by the server, not by the phone.
3. **Crypto.** Withdrawals are manual, the app never holds keys and never mines: no
   "cryptocurrency exchange" or "mining" declaration is needed.

---

## Upload, step by step

### 0. Build and sign

```sh
pnpm android:release            # bumps versionCode, builds and signs android/dist/breeq-<v>-<code>.aab
```

The upload key lives in `android/keystore/` with `android/keystore.properties`. Play
App Signing is on for this app (the console shows "Google-generated" as the app
signing key); the AAB you upload is signed with the upload key and Google re-signs it.

### 1. Dashboard

Play Console → **Breeq** → **Dashboard**. Work through the "Set up your app" card in
this order; each row turns green when done.

### 2. App access, Ads, Content rating, Target audience, Data safety, Financial features

**Policy → App content.** Use the answers in the section above. Content rating issues
a certificate immediately; save it.

### 3. Store settings

**Grow → Store presence → Store settings.** Game, Arcade, tags, contact email,
website.

### 4. Main store listing

**Grow → Store presence → Main store listing.**

1. App name, short description, full description: paste the three blocks above.
2. Graphics:
   - App icon → `icon-512.png`
   - Feature graphic → `feature-1024x500.png`
   - Phone screenshots → drag `screenshots/phone/01…05.png` in order (the uploader
     keeps drop order; if it doesn't, reorder by dragging the thumbnails). Do not
     add anything from `screenshots/retired/`.
   - 7-inch tablet → `screenshots/tablet-7/01…05.png`
   - 10-inch tablet → `screenshots/tablet-10/01…05.png`
   - Video: leave empty. A YouTube trailer is optional and only helps with a landscape
     16:9 clip; the app is portrait.
3. **Save**, then **Preview** on the right: the banner says "Break the wall.",
   the first screenshot is the board, the second is the next wall, the third is Kal.

### 5. Testing track first

**Test and release → Testing → Closed testing** → create a track (`Beta`) →
**Create new release** → upload the `.aab` → release name `1.0.0 (1)` → paste "What's
new" → **Next** → **Save and publish**. Add yourself under **Testers** (an email list),
open the opt-in link on a phone, install, and check:

- Google sign-in completes inside the app (custom user agent, no "disallowed_useragent").
- A story run: sound, haptics, pause, clear screen.
- A referral link (`https://breeq.space/r/<code>`) opens the app, not Chrome. If it
  opens Chrome, `assetlinks.json` does not yet list the Play signing SHA-256: see
  step 7 below.

Play requires a closed test with at least 12 testers for 14 days before a new personal
developer account can apply for production. Organization accounts skip this.

### 6. Production

**Test and release → Production → Create new release** → **Add from library** (the same
bundle you tested) → **What's new** → **Next**. Fix any warnings (the "deobfuscation
file" one is safe to ignore for a WebView app), choose **Managed publishing** if you
want to control the exact go-live moment, then **Send for review**. First review takes
one to seven days.

### 7. After approval

- **Test and release → Setup → App signing:** copy the SHA-256 of the app signing key
  and append it to `ANDROID_CERT_SHA256` on Vercel (the upload key is already there,
  comma-separate the two), then redeploy so App Links verify for the Play build:

  ```sh
  pnpm dlx vercel env rm ANDROID_CERT_SHA256 production
  printf '29:84:…:E1:FA,<PLAY_SHA256>' | pnpm dlx vercel env add ANDROID_CERT_SHA256 production
  pnpm dlx vercel redeploy https://www.breeq.space
  ```

  Check with `curl https://breeq.space/.well-known/assetlinks.json` (200, no redirect)
  and Google's checker:
  `https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://breeq.space&relation=delegate_permission/common.handle_all_urls`.
- **Grow → Store presence → Custom store listings:** optional, a listing per country.
- **Monitor → Pre-launch report:** Google runs the build on real devices and posts
  crashes and accessibility findings; read it once per release.

### Next release

```sh
pnpm android:release 1.0.1     # versionName argument; versionCode bumps by itself
```

Upload the new `.aab` to the same track, update "What's new", send for review.
