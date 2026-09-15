import type { Metadata } from "next";
import Link from "next/link";
import {
  LegalBody,
  LegalCrossLinks,
  LegalSection,
  LegalUpdated,
  SITE_URL,
} from "@/components/legal-doc";
import { VaultShell } from "@/components/vault-shell";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Breeq collects, uses, stores, and shares personal data for accounts, play, Earn, payments, and the Android app.",
};

export default function PrivacyPage() {
  return (
    <VaultShell
      kicker="Privacy"
      title="Privacy Policy."
      lede="This policy explains what personal data Breeq collects, why we collect it, who we share it with, how long we keep it, and the rights you can exercise."
    >
      <LegalBody>
        <LegalUpdated />
        <LegalCrossLinks current="privacy" />

        <LegalSection n={1} title="Who we are">
          <p>
            The controller of your personal data is the operator of Breeq (“Breeq”, “we”,
            “us”), which provides the website at {SITE_URL}, the Android application “Breeq:
            Brick Breaker &amp; Earn”, and related features (the “Service”). You can reach
            us through <Link href="/contact">Contact</Link>.
          </p>
          <p>
            We have not appointed a statutory data-protection officer. If we later appoint
            one, or an EU or UK representative, we will publish those details on this page.
            This policy is meant to meet the transparency rules of the EU/EEA GDPR, the UK
            GDPR, the EU ePrivacy rules as implemented in France, and, where it applies, the
            California Consumer Privacy Act as amended (CPRA).
          </p>
        </LegalSection>

        <LegalSection n={2} title="Scope">
          <p>
            This policy covers personal data processed when you visit the site, create an
            account, play Story or Earn, publish a wall, buy gems, request a withdrawal,
            share a referral link, contact us, or use the Android app. It does not cover
            third-party sites you open from Breeq (Google, Stripe, Cloudinary, social
            networks, block explorers) except to the extent we send them data as described
            below.
          </p>
          <p>
            Use of the Service is also governed by the <Link href="/terms">Terms of
            Service</Link>. Capitalised terms not defined here have the meaning given there.
          </p>
        </LegalSection>

        <LegalSection n={3} title="Data we collect">
          <h3>Account and identity</h3>
          <ul>
            <li>username, display name, email address, password hash (we never store a plaintext password);</li>
            <li>
              Google account identifiers, verified email, and profile name or image Google
              sends us if you use “Continue with Google”;
            </li>
            <li>
              wallet address and a short-lived sign-in nonce if you use wallet / SIWE
              sign-in;
            </li>
            <li>role (player or admin), account timestamps, and linked sign-in providers;</li>
            <li>age-related flags only if we later ask you to confirm you are 18+.</li>
          </ul>
          <h3>Play and progress</h3>
          <ul>
            <li>
              XP, player level, tutorial completion, Story chapter clears, star grades, hit
              counts, scores, and which pieces the Story has already explained;
            </li>
            <li>
              Earn maps you publish (title, slug, layout JSON, ticket price, difficulty
              snapshot, play and win counts, featured/hidden status);
            </li>
            <li>
              Earn runs (ticket, seed, score, locked payout, outcome, timestamps);
            </li>
            <li>ledger lines for every gem and ETH movement.</li>
          </ul>
          <h3>Photos and other User Content</h3>
          <p>
            If you choose a photo as a wall background, we receive the file you pick,
            compress it in the browser, and store a hosted copy (currently Cloudinary, folder
            for Earn skies). Gradient skies are identifiers, not photos. Usernames, titles,
            and layouts are stored so other players can see and play the wall. Do not upload
            photos of people who have not agreed, or any image that is illegal or that
            depicts a minor in a sexual or nude context.
          </p>
          <h3>Money and withdrawals</h3>
          <ul>
            <li>
              gem and ETH balances (ETH stored as an integer in gwei);
            </li>
            <li>
              gem purchases: pack size, USD amount, discount, Stripe Checkout session id,
              status, and timestamps — not full card numbers;
            </li>
            <li>
              withdrawal requests: amount, destination address, status, optional
              transaction hash and operator notes;
            </li>
            <li>
              referral code, who referred you, which share button was used when we know it,
              and gems paid for that referral.
            </li>
          </ul>
          <p>
            Stripe processes card data as an independent controller / processor under its
            own policy. We may receive a customer email, payment status, and identifiers
            needed to credit gems once.
          </p>
          <h3>Device, logs, and diagnostics</h3>
          <ul>
            <li>
              IP address, user-agent (including a Breeq Android token when you use the
              app), approximate country from IP, timestamps, and security logs;
            </li>
            <li>
              crash or render-process events inside the Android shell, used to recover the
              app, not to build an advertising profile;
            </li>
            <li>
              sound, haptics, swipe, and theme preferences (cookies and, for theme
              auditioning, localStorage).
            </li>
          </ul>
          <h3>Contact</h3>
          <p>
            If you use the Contact form, we ask for a name, email, and message so
            we can reply. Treat anything you type as ordinary correspondence: do
            not send government-id images, card numbers, or seed phrases.
          </p>
          <h3>Data we do not collect today</h3>
          <p>
            We do not run third-party advertising SDKs, do not sell lists of players, and
            do not use your photos to train a public generative model. We do not ask for
            precise GPS. Haptics use the device vibrator only when you have that preference
            on.
          </p>
        </LegalSection>

        <LegalSection n={4} title="How we collect it">
          <ul>
            <li>
              <strong className="font-medium text-ink">Directly from you</strong> — sign-up,
              account settings, editor uploads, checkout, withdrawal forms, Contact, and
              play inputs.
            </li>
            <li>
              <strong className="font-medium text-ink">Automatically</strong> — cookies,
              server logs, the Android WebView cookie jar, and game events needed to save
              progress and settle a run.
            </li>
            <li>
              <strong className="font-medium text-ink">From others</strong> — Google (sign-in
              profile), Stripe (payment result), Cloudinary (hosted image URLs), a referrer’s
              link, and blockchain networks if we send or confirm a withdrawal.
            </li>
          </ul>
        </LegalSection>

        <LegalSection n={5} title="Why we use it and legal bases (GDPR)">
          <p>We process personal data only when a legal basis applies:</p>
          <ul>
            <li>
              <strong className="font-medium text-ink">Contract</strong> (GDPR Art. 6(1)(b))
              — creating and securing the account; providing Story, the editor, and Earn;
              crediting gems; recording the ledger; processing withdrawal requests; sending
              transactional notices.
            </li>
            <li>
              <strong className="font-medium text-ink">Legitimate interests</strong> (Art.
              6(1)(f)) — keeping the Service safe (fraud, cheats, chargebacks, multi-accounting);
              debugging; improving difficulty proofs and economy settings; establishing,
              exercising, or defending legal claims; modest product analytics derived from
              server logs. You may object (Section 10). We do not use legitimate interests
              to override a child or to send you marketing you did not ask for.
            </li>
            <li>
              <strong className="font-medium text-ink">Legal obligation</strong> (Art. 6(1)(c))
              — tax, accounting, sanctions screening, responding to a binding order, and
              consumer-law record keeping.
            </li>
            <li>
              <strong className="font-medium text-ink">Consent</strong> (Art. 6(1)(a) and
              ePrivacy) — optional cookies that are not strictly necessary, if we later add
              them; sharing to a social network you click; certain photo uses beyond
              operating the wall, if we ever ask. You can withdraw consent without affecting
              processing that happened before withdrawal.
            </li>
            <li>
              <strong className="font-medium text-ink">Vital interests / public task</strong>{" "}
              — only if we must, for example to report CSAM or an imminent threat.
            </li>
          </ul>
          <p>
            We do not use your data for automated decisions that produce legal or similarly
            significant effects solely by automated means, other than ordinary game rules
            (tickets, proofs, run expiry, anti-abuse blocks). Integrity holds and withdrawal
            refusals can be reviewed if you contact us.
          </p>
        </LegalSection>

        <LegalSection n={6} title="Cookies and similar technologies">
          <p>
            We use first-party cookies and similar storage. We do not currently set
            third-party advertising cookies. Browser storage on the Android WebView is the
            same Service, persisted by the app.
          </p>
          <h3>Strictly necessary</h3>
          <ul>
            <li>
              authentication and session cookies set by our sign-in stack (Auth.js),
              including CSRF protection;
            </li>
            <li>
              a short-lived SIWE nonce cookie (<code className="text-ink">breeq.siwe-nonce</code>)
              while a wallet sign-in is in progress.
            </li>
          </ul>
          <h3>Functional preferences (up to 12 months)</h3>
          <ul>
            <li>
              <code className="text-ink">breeq-theme</code> — light or dark appearance;
            </li>
            <li>
              <code className="text-ink">breeq-sound</code> — sound on or off;
            </li>
            <li>
              <code className="text-ink">breeq-haptics</code> — vibration on or off;
            </li>
            <li>
              <code className="text-ink">breeq-swipe</code> — paddle swipe mode.
            </li>
          </ul>
          <p>
            These preference cookies are first-party, not used for advertising, and exist so
            the Service remembers a choice you made. You can change the underlying setting
            in the game header or account page; that overwrites the cookie. You can also
            delete cookies in the browser, which may sign you out.
          </p>
          <h3>Referral attribution (30 days)</h3>
          <p>
            Visiting a share link <code className="text-ink">/r/…</code> sets an HttpOnly{" "}
            <code className="text-ink">breeq-ref</code> cookie (SameSite=Lax) so a later
            sign-up can credit the inviter. It is not an advertising tracker for third
            parties. If you do not want it, do not use an invite link, or clear the cookie
            before you register.
          </p>
          <h3>Local and session storage</h3>
          <p>
            The browser may hold a theme audition key, a short-lived skip-to-shop intent,
            and similar client state needed to finish a flow after Stripe redirects you
            back. That data stays on the device unless a screen-sync feature we add later
            says otherwise.
          </p>
        </LegalSection>

        <LegalSection n={7} title="Who we share data with">
          <p>
            We do not sell personal data. We share it with processors and other recipients
            who need it to run the Service:
          </p>
          <ul>
            <li>
              <strong className="font-medium text-ink">Hosting and delivery</strong> — the
              platform that serves breeq.space (currently Vercel) and related CDNs;
            </li>
            <li>
              <strong className="font-medium text-ink">Database</strong> — MongoDB (account,
              game, ledger);
            </li>
            <li>
              <strong className="font-medium text-ink">Sign-in</strong> — Google, if you
              choose Google; your wallet software, if you choose SIWE;
            </li>
            <li>
              <strong className="font-medium text-ink">Payments</strong> — Stripe, for gem
              Checkout, receipts, and fraud signals;
            </li>
            <li>
              <strong className="font-medium text-ink">Images</strong> — Cloudinary, for
              hosted wall photos and variants;
            </li>
            <li>
              <strong className="font-medium text-ink">Blockchains</strong> — a public ETH
              network if we execute a withdrawal; the destination address and amount become
              public;
            </li>
            <li>
              <strong className="font-medium text-ink">Other players</strong> — username,
              published walls, public play counts, and whatever the live board shows;
            </li>
            <li>
              <strong className="font-medium text-ink">Professional advisers and
              authorities</strong> — where needed for law, tax, or a dispute;
            </li>
            <li>
              <strong className="font-medium text-ink">A buyer</strong> — if we transfer the
              Service, under a contract that continues this level of protection.
            </li>
          </ul>
          <p>
            If you tap X, Facebook, WhatsApp, Telegram, or Copy, that network receives
            whatever the share URL and your device send. That is your act, not our sale of
            data.
          </p>
        </LegalSection>

        <LegalSection n={8} title="International transfers">
          <p>
            We may process data in the EU/EEA, the United Kingdom, the United States, and
            other countries where our processors operate. Where a transfer leaves a
            jurisdiction that requires safeguards, we rely on an adequacy decision where
            one exists, and otherwise on Standard Contractual Clauses (and the UK
            addendum where required), plus supplementary measures our processors publish.
            A copy of the relevant clauses can be requested through{" "}
            <Link href="/contact">Contact</Link> to the extent we are allowed to share them.
          </p>
        </LegalSection>

        <LegalSection n={9} title="How long we keep data">
          <ul>
            <li>
              Account, progress, maps, runs, and ledger — for the life of the account, then
              deleted or irreversibly anonymised within a reasonable period after closure,
              unless a longer legal hold applies.
            </li>
            <li>
              Purchase and withdrawal records — at least as long as tax, anti-fraud, and
              accounting law require (often five to ten years).
            </li>
            <li>
              Contact messages — as long as needed to answer you and keep a limited record
              of the correspondence.
            </li>
            <li>
              Security logs — typically up to 12 months, longer if an incident is open.
            </li>
            <li>
              Cookies — as stated in Section 6, or until you delete them.
            </li>
            <li>
              Backups — rolling windows; deletion on the live system may take until the
              backup expires.
            </li>
          </ul>
          <p>
            We may keep a record of banned identifiers (email, wallet, payment fingerprint)
            so the ban can be enforced.
          </p>
        </LegalSection>

        <LegalSection n={10} title="Your rights">
          <h3>EEA, UK, and similar laws</h3>
          <p>Subject to the limits in those laws, you may:</p>
          <ul>
            <li>access a copy of your personal data;</li>
            <li>rectify inaccurate data (much of this you can already edit in Account);</li>
            <li>
              erase data (“right to be forgotten”), which may require closing the account
              and may not reach public chain records or legally required books;
            </li>
            <li>restrict or object to processing that relies on legitimate interests;</li>
            <li>receive data you provided in a structured, commonly used format, and transmit it;</li>
            <li>withdraw consent where consent is the basis;</li>
            <li>complain to a supervisory authority.</li>
          </ul>
          <p>
            Our lead concern for EU players is typically the French authority, CNIL
            (cnil.fr). You may also contact the authority of your EU/EEA member state or,
            in the UK, the ICO.
          </p>
          <h3>California and similar US state laws</h3>
          <p>
            We do not sell personal information and we do not share it for cross-context
            behavioural advertising. We do not use or disclose sensitive personal
            information to infer characteristics, beyond what is needed to run an account
            you asked for. California residents may request know/access, delete, and
            correct, and may use an authorised agent. We will not discriminate against you
            for exercising a privacy right. If a future feature ever looks like a “sale”
            or “share” under CPRA, we will provide a Do Not Sell or Share control before
            that feature goes live.
          </p>
          <p>
            To exercise any right, use <Link href="/contact">Contact</Link> from the email
            on the account, or another method that lets us verify you. We may ask for
            information reasonably necessary to confirm identity and will answer within the
            statutory period (generally one month under GDPR, 45 days under CPRA, extendable
            as those laws allow).
          </p>
        </LegalSection>

        <LegalSection n={11} title="Children">
          <p>
            The Service is not directed to children under 13, and we do not knowingly
            collect their personal data. If you believe we have, contact us and we will
            delete it. Players under 18 must not use paid or Earn features. We may delete
            an under-age account and associated User Content when we learn of it, without
            restoring spent gems except where the law requires.
          </p>
        </LegalSection>

        <LegalSection n={12} title="Security">
          <p>
            We use reasonable technical and organisational measures (hashed passwords, TLS
            in transit, access-controlled admin tools, atomic balance writes, webhook
            secrets). No method is perfectly secure. You must keep your password, email,
            and wallet keys confidential. Blockchain payments you receive are public. If we
            become aware of a breach that must be notified, we will notify the competent
            authority and affected people as the law requires.
          </p>
        </LegalSection>

        <LegalSection n={13} title="Photos, biometrics, and sensitive data">
          <p>
            Please do not upload special-category data (health, political opinions,
            religious beliefs, sexual life) or biometric templates. A photo of a face on a
            wall is User Content you chose to publish, not a biometric identification
            system we run. We do not currently require ID documents; if a withdrawal review
            asks for them, we will tell you why, who sees them, and how long they are kept,
            before you send them.
          </p>
        </LegalSection>

        <LegalSection n={14} title="Do not track and global privacy control">
          <p>
            The Service does not change behaviour in response to a browser’s “Do Not Track”
            signal today, because we do not run a third-party ad graph. If we add
            non-essential trackers, we will honour Global Privacy Control and similar
            opt-out signals for those trackers where required.
          </p>
        </LegalSection>

        <LegalSection n={15} title="Changes">
          <p>
            We may update this policy. The “Last updated” date will change, and we may give
            in-Service or email notice for material changes. The updated policy applies from
            posting unless a later date is stated. If you do not agree, stop using the
            Service and request account closure.
          </p>
        </LegalSection>

        <LegalSection n={16} title="Contact">
          <p>
            Privacy requests and questions: <Link href="/contact">breeq.space/contact</Link>.
            Operator: Breeq, {SITE_URL}. We may add a postal address, company registration,
            and VAT number here when they exist.
          </p>
        </LegalSection>
      </LegalBody>
    </VaultShell>
  );
}
