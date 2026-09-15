# Play Store listing

Everything Play Console asks for, in the order it asks. Assets live next to this file:

| Asset | File | Play requirement |
| --- | --- | --- |
| App icon | `icon-512.png` | 512×512 PNG, 32-bit, ≤ 1 MB |
| Feature graphic | `feature-1024x500.png` | 1024×500 PNG/JPEG, no alpha |
| Phone screenshots (7) | `screenshots/phone/01…07.png` | 1080×1920, 9:16, 24-bit PNG |
| 7-inch tablet (7) | `screenshots/tablet-7/01…07.png` | 1440×2560 |
| 10-inch tablet (7) | `screenshots/tablet-10/01…07.png` | 2160×3840 |
| Release bundle | `../dist/breeq-<version>-<code>.aab` | built by `pnpm android:release` |

Screenshots are composed from real captures of the release build on a Pixel-class
emulator (1080×2400) signed in as the review account; the composer lives outside the
repo (a one-off `sharp` script). Upload them in numeric order: the first three read as
a triptych (Story → Build → Earn) and share one sky.

---

## Main store listing

### App name (30 characters max)

```
Breeq: Brick Breaker & Earn
```

27 characters. "Brick breaker" is the genre search term; "Earn" is the hook.

### Short description (80 characters max)

```
Break neon bricks on player-made walls. Clear them, earn gems, win pots in ETH.
```

79 characters.

### Full description (4000 characters max)

```
Breeq is a brick breaker built by players, for players.

Every wall is a photo someone chose, covered in glowing glass bricks and bonus rings that bend the ball. Take the paddle, clear the wall, and the next one is waiting.

PLAY THE STORY
Follow Kal, a galactic gecko, on the road home: 24 hand-built episodes, ten walls each. Every clear pays XP, three stars reward a clean run, and the level bar climbs.

RINGS THAT BEND THE BALL
Slow rings, ×2 and ×3 speed rings, split rings that spawn a second ball, portals that teleport it. Locks and keys, explosive bricks, regenerating bricks, bumpers, rails, fans and black holes. Each episode teaches one new piece and then makes you use it.

BUILD YOUR OWN WALL
The editor is the game. Place bricks over your own photo or one of twenty skies, drop the rings, set the rules. A robot proves your wall can be cleared before anyone pays to try it, and every published wall gets a difficulty score from Gentle to Brutal.

EARN
From level 5, the Earn store opens. Players publish walls with a pot in ETH. You pay a ticket in gems to try one; a clear pays the pot to your balance, once per wall. Publish your own walls, set the ticket price, and earn from every attempt. Withdraw to your own address whenever you want.

MADE FOR ONE THUMB
Portrait only. A canvas that fills the screen, a paddle that follows your finger, a slider for precise aim. Sound designed in each level's key, haptics on every hit, both optional.

INVITE FRIENDS
Share a cleared wall on X, WhatsApp, Telegram or Facebook. Friends who sign up through your link earn you gems.

ONE ACCOUNT EVERYWHERE
Sign in with Google or email. Your XP, gems, ETH balance and walls are the same here and on breeq.space.

No ads. No subscription. Gems are optional; the story is free.
```

About 1,750 characters. Plain text only: Play strips markdown, and emoji in
descriptions read as spam to reviewers.

### What's new (500 characters max, per release)

```
First release.
• 24 story episodes, 240 walls, a new piece every episode.
• Wall editor with photo backgrounds, twenty skies and a robot proof.
• Earn store: publish walls, buy tickets in gems, clear for pots in ETH.
• Sound in each level's key, haptics, portrait one-thumb play.
```

---

## Store settings

- **App or game:** Game
- **Category:** Arcade
- **Tags (up to 5):** Brick breaker, Arcade, Casual, Level editor, Play-to-earn
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
  - Instructions: "Sign in with the email tab. The account is level 7 with story
    episodes 1–2 cleared and Glass Sky in progress; it has gems to buy Earn tickets
    and owns one published wall (Twin Suns Remix)."
- **Content rating:** IARC questionnaire, category *Game*. Answer No to violence,
  sexuality, language, controlled substances. Answer **Yes** to "does the app allow
  users to spend real money" (gem packs) and **Yes** to "does the app let users
  interact / share user-generated content" (published walls, referral links). The
  real-money question about "gambling / wagering" is the one to read carefully, see
  the policy note below. Expected rating: Teen (simulated gambling) or Everyone 10+,
  depending on how the Earn store is declared.
- **Target audience:** 18 and over. Do not select any age group under 18: the ETH
  payouts make the app unsuitable for the Families program.
- **News app:** No. **COVID-19 tracing:** No. **Government app:** No.
- **Financial features:** declare "Other" financial features and describe the ETH
  balance and withdrawal by request. This is the honest answer for a stored balance
  paid out in crypto.
- **Health:** none.
- **Data safety:** see the table below.

### Data safety form

| Data | Collected | Shared | Purpose | Notes |
| --- | --- | --- | --- | --- |
| Email address | Yes | No | Account management | Auth.js sign-in, Google or email |
| Name | Yes (Google display name) | No | Account management | Username shown in the game |
| Photos | Yes, user-picked | No | App functionality | Wall backgrounds, uploaded to Cloudinary |
| Purchase history | Yes | No | App functionality | Gem packs via Stripe, ledger |
| Financial info (wallet address) | Yes, optional | No | App functionality | Only when the player requests a withdrawal |
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
2. **Real-money gaming.** Pots paid in ETH for clearing a wall are skill-based prizes,
   not chance, but Play treats crypto payouts under the Real-Money Gambling, Games and
   Contests policy and only allows them in listed countries with a license, or as a
   "contest" with an approved application. Declare it truthfully in the content rating
   and in App content → Financial features. If the review pushes back, ship the Story
   and the editor first and gate Earn behind a server flag (`earnEnabled` already
   exists) for the Play build.
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
   - Phone screenshots → drag `screenshots/phone/01…07.png` in order (the uploader
     keeps drop order; if it doesn't, reorder by dragging the thumbnails).
   - 7-inch tablet → `screenshots/tablet-7/*`
   - 10-inch tablet → `screenshots/tablet-10/*`
   - Video: leave empty. A YouTube trailer is optional and only helps with a landscape
     16:9 clip; the app is portrait.
3. **Save**, then **Preview** on the right: the first three screenshots should read as
   one sky.

### 5. Testing track first

**Test and release → Testing → Closed testing** → create a track (`Beta`) →
**Create new release** → upload the `.aab` → release name `1.0.0 (1)` → paste "What's
new" → **Next** → **Save and publish**. Add yourself under **Testers** (an email list),
open the opt-in link on a phone, install, and check:

- Google sign-in completes inside the app (custom user agent, no "disallowed_useragent").
- A story run: sound, haptics, pause, clear screen.
- A referral link (`https://breeq.space/r/<code>`) opens the app, not Chrome. If it
  opens Chrome, `assetlinks.json` is not yet served with the Play signing SHA-256: copy
  the "App signing key certificate" fingerprint from **Test and release → Setup → App
  signing** into `ANDROID_CERT_SHA256` (comma-separated with the upload key) and
  redeploy the site.

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
  into `ANDROID_CERT_SHA256` on Vercel and redeploy so App Links verify for the Play
  build.
- **Grow → Store presence → Custom store listings:** optional, a listing per country.
- **Monitor → Pre-launch report:** Google runs the build on real devices and posts
  crashes and accessibility findings; read it once per release.

### Next release

```sh
pnpm android:release 1.0.1     # versionName argument; versionCode bumps by itself
```

Upload the new `.aab` to the same track, update "What's new", send for review.
