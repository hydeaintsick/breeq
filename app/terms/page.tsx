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
  title: "Terms of Service",
  description:
    "Terms of Service for Breeq: the website, the game, Earn, gem purchases, ETH withdrawals, and the Android app.",
};

export default function TermsPage() {
  return (
    <VaultShell
      kicker="Terms"
      title="Terms of Service."
      lede="These terms govern every use of Breeq: the site, the game, player-built walls, gem packs, ETH pots, and the Android app. If you do not agree, do not use the Service."
    >
      <LegalBody>
        <LegalUpdated />
        <LegalCrossLinks current="terms" />

        <LegalSection n={1} title="Agreement">
          <p>
            These Terms of Service (the “Terms”) are a legally binding agreement between you
            and the operator of Breeq (“Breeq”, “we”, “us”, or “our”). They cover the website
            at {SITE_URL}, the Android application “Breeq: Brick Breaker &amp; Earn”, accounts,
            Story, the editor, Earn, gem purchases, ETH balances and withdrawals, referrals,
            and any related content, APIs, or features we make available (together, the
            “Service”).
          </p>
          <p>
            By accessing or using the Service, creating an account, clicking to accept,
            purchasing gems, starting an Earn run, or continuing to use the Service after a
            change to these Terms, you agree to these Terms and to the{" "}
            <Link href="/privacy">Privacy Policy</Link>. If you use the Service on behalf of an
            organization, you represent that you have authority to bind it, and “you” includes
            that organization.
          </p>
          <p>
            If any mandatory law of your country of residence gives you rights that cannot be
            waived, those rights prevail over conflicting language in these Terms, but only to
            the minimum extent required.
          </p>
        </LegalSection>

        <LegalSection n={2} title="The Service">
          <p>
            Breeq is an entertainment product: a brick-breaker whose Story walls are
            authored by us and whose Earn walls may be authored by players. The Service may
            include, without limitation:
          </p>
          <ul>
            <li>a marketing site, whitepaper, and contact form;</li>
            <li>accounts (email and password, Google sign-in, and wallet / SIWE sign-in);</li>
            <li>Story episodes, a tutorial, XP, player levels, and paid skips;</li>
            <li>a level editor, difficulty rating, and publication of player walls;</li>
            <li>
              Earn: gem tickets, ETH pots, a wallet ledger, and withdrawal requests;
            </li>
            <li>gem packs sold through Stripe Checkout;</li>
            <li>referral links and rewards;</li>
            <li>an Android WebView shell that loads the same Service.</li>
          </ul>
          <p>
            Features can be enabled, disabled, gated by player level, limited to certain
            countries, or changed at any time. Admin tools, economy numbers, and site
            switches are part of how we operate the Service, not a promise to you.
          </p>
          <p>
            The Service is provided for personal, non-commercial entertainment, except where
            we expressly allow you to publish a wall and receive a ticket price or a
            withdrawal under these Terms. Nothing on the Service is an offer of securities,
            an investment product, a bank or e-money account, a custody wallet, a payment
            institution, a lottery, or a gambling licence.
          </p>
        </LegalSection>

        <LegalSection n={3} title="Eligibility and age">
          <p>
            You must be able to form a binding contract. You must not use the Service if you
            are barred from doing so under the laws of France, the European Union, the United
            States, or your place of residence or use.
          </p>
          <ul>
            <li>
              You must be at least <strong className="font-medium text-ink">13</strong> years
              old to create an account or use the Service.
            </li>
            <li>
              If you are under 18, you may use Story and other unpaid play only with the
              consent of a parent or legal guardian who agrees to these Terms on your behalf
              and is responsible for your use.
            </li>
            <li>
              You must be at least <strong className="font-medium text-ink">18</strong> to
              buy gems, spend gems on tickets or skips, publish an Earn wall, receive or
              hold an ETH balance, request a withdrawal, or use any real-money feature.
            </li>
          </ul>
          <p>
            We may ask for proof of age or identity at any time, including before a
            withdrawal. If we reasonably believe you do not meet these rules, we may suspend
            or close the account, cancel pending payouts, and refuse refunds except where
            the law requires otherwise.
          </p>
          <p>
            The Service is not directed to children under 13, and we do not knowingly
            collect personal data from them. See the Privacy Policy.
          </p>
        </LegalSection>

        <LegalSection n={4} title="Accounts and security">
          <p>
            Some features require an account. You must provide accurate information and keep
            it current. You may sign in with email and password, Google (where enabled), or a
            compatible wallet. You are responsible for every action taken through your
            account and for keeping credentials, devices, recovery email, and wallet keys
            under your control.
          </p>
          <p>
            Notify us through <Link href="/contact">Contact</Link> if you believe the
            account has been compromised. We may refuse a username, reclaim unused names,
            merge or split accounts we reasonably believe are duplicates or abusive, and
            require a particular sign-in method. Linking a Google profile is allowed only
            where Google has verified the email. We may reject, unlink, or freeze a wallet
            address that we reasonably associate with fraud, sanctions, or a third party’s
            funds.
          </p>
          <p>
            One natural person may hold one player account unless we agree otherwise in
            writing. We may treat related accounts (same device, payment method, wallet,
            email pattern, or conduct) as one person for eligibility, Earn, referrals, and
            abuse.
          </p>
        </LegalSection>

        <LegalSection n={5} title="Licence to use the Service">
          <p>
            We grant you a limited, revocable, non-exclusive, non-transferable,
            non-sublicensable licence to access and use the Service for its intended
            entertainment purpose, in accordance with these Terms. We and our licensors
            retain all right, title, and interest in the Service, including the engine,
            Story, lore, software, audiovisual assets, trademarks, and ranking systems. No
            rights are granted except as expressly stated.
          </p>
          <p>You must not, and must not assist anyone to:</p>
          <ul>
            <li>
              copy, scrape, crawl, index, or harvest the Service except ordinary browser
              caching or a publicly documented interface we provide;
            </li>
            <li>
              reverse engineer, decompile, or extract source from the Service except to the
              limited extent mandatory law allows after a written request we have refused;
            </li>
            <li>
              bypass technical limits, seeds, proofs, timers, run windows, or payment
              checks; use bots, trainers, memory editors, or modified clients against live
              Earn or Story scoring;
            </li>
            <li>
              probe, scan, or attack the Service, or interfere with other players’ sessions;
            </li>
            <li>
              frame or mirror the Service, or use our marks in a way that suggests
              endorsement;
            </li>
            <li>
              use the Service to develop a competing game engine or to train a machine
              learning model, except on content you own and that these Terms do not
              restrict.
            </li>
          </ul>
        </LegalSection>

        <LegalSection n={6} title="Play, Story, and the editor">
          <p>
            Gameplay is deterministic for a given level, seed, and input stream. That does
            not make any particular clear, score, star grade, difficulty label, or autopilot
            result a warranty. Difficulty ratings, proofs, and “clearable” checks are tools.
            They can be wrong, incomplete, or later revised. A wall can still be unfair,
            frustrating, or unbeatable for a human.
          </p>
          <p>
            Story progress, XP, levels, discoveries, and tutorial state are stored on your
            account. We may reset, cap, or rebalance them, including after an exploit, an
            economy change, or a season reset we announce. Paying gems to skip a Story wall
            marks that wall cleared on the terms shown at the time of the skip; a replay may
            still raise a star grade. Skips are virtual items (Section 9), not a sale of the
            underlying chapter.
          </p>
          <p>
            The editor may refuse layouts that fail validation (including unpaired portals,
            pieces in the paddle lane, over-budget walls, or a failed robot proof). Passing
            validation is not permission to publish unlawful, infringing, or harmful
            content, and is not a promise that other players will enjoy or beat the wall.
          </p>
        </LegalSection>

        <LegalSection n={7} title="User content">
          <p>
            “User Content” means anything you submit, upload, publish, or display through
            the Service, including usernames, wall titles, photos and skies, level data,
            messages sent through Contact, and any other text or media.
          </p>
          <h3>Licence you grant us</h3>
          <p>
            You retain whatever ownership you have in your User Content. You grant Breeq a
            worldwide, perpetual, irrevocable, royalty-free, transferable, sublicensable
            licence to host, store, reproduce, adapt, transcode, publicly display, publicly
            perform, distribute, and otherwise use that User Content in connection with
            operating, improving, promoting, and protecting the Service — including in
            previews, store listings, social posts, and the Android app — in any media now
            known or later developed. This licence survives termination for content that
            remains reasonably necessary (for example a wall other players still hold a
            history with, backups, and legal records).
          </p>
          <h3>Your promises</h3>
          <p>You represent and warrant that:</p>
          <ul>
            <li>
              you own the User Content or have all rights, licences, and consents needed to
              grant the licence above, including from people depicted in a photo;
            </li>
            <li>
              User Content is not illegal, infringing, defamatory, deceptive, or sexually
              exploitative, and does not depict minors in any sexual, nude, or suggestive
              context;
            </li>
            <li>
              User Content does not contain malware, hidden tracking, or instructions to
              cheat the Service;
            </li>
            <li>
              publication will not violate another person’s privacy, publicity, or
              intellectual-property rights.
            </li>
          </ul>
          <p>
            We may refuse, hide, edit, or delete User Content, unpublish walls, and report
            material to authorities, with or without notice, including where we have only a
            reasonable suspicion of a problem. We are not obligated to monitor User Content
            and do not endorse it. Hosting a wall is not editorial approval.
          </p>
          <h3>Notice of infringement</h3>
          <p>
            If you believe User Content infringes your copyright or other rights, send a
            notice through <Link href="/contact">Contact</Link> with: (a) your name and
            contact details; (b) the work claimed to be infringed; (c) the URL or other
            precise location of the material; (d) a statement that you have a good-faith
            belief the use is not authorised; (e) a statement, under penalty of perjury,
            that the notice is accurate and that you are the owner or authorised to act; and
            (f) your physical or electronic signature. We may share the notice with the
            uploader and follow a counter-notice process where the law requires it. Repeat
            infringers may lose their accounts.
          </p>
        </LegalSection>

        <LegalSection n={8} title="Acceptable use">
          <p>You must not:</p>
          <ul>
            <li>
              break any law, including gambling, money-transmission, tax, sanctions, export,
              advertising, or child-protection law;
            </li>
            <li>
              harass, threaten, dox, or impersonate anyone, or use a username that suggests
              you are Breeq or another player;
            </li>
            <li>
              cheat, collude, farm, or manipulate Earn, referrals, difficulty proofs, or
              leaderboards, including by reporting false run outcomes;
            </li>
            <li>
              use multiple accounts, VPNs, or payment instruments to evade limits, bans,
              tickets, “once per wall”, or the ban on playing your own map;
            </li>
            <li>
              buy, sell, or transfer accounts, gems, XP, ETH balances, or referral rights,
              except a withdrawal we process to an address you control;
            </li>
            <li>
              submit a chargeback or payment dispute without first contacting us, except
              where a card scheme or the law requires you to go to the issuer first;
            </li>
            <li>
              upload others’ photos, trademarks, or personal data without permission;
            </li>
            <li>
              use the Service if you are on a sanctions list, in a comprehensively
              sanctioned territory, or for the benefit of such a person.
            </li>
          </ul>
        </LegalSection>

        <LegalSection n={9} title="Virtual items (gems, XP, progress)">
          <p>
            Gems, XP, player levels, stars, discoveries, cosmetic or progress flags, and
            similar credits (“Virtual Items”) are licensed game features. They are not
            money, e-money, a stored-value account, a security, or property. You have no
            vested right in them. They have no cash value except where these Terms
            separately describe an ETH balance arising from Earn.
          </p>
          <p>
            Virtual Items are non-transferable, non-redeemable, and forfeitable. We may
            change prices, packs, skip costs, ticket ranges, publish costs, earn rates, and
            what Virtual Items can be spent on. If we close the Service, unused gems and XP
            may expire without compensation except where mandatory law says otherwise.
          </p>
          <p>
            Spending gems (tickets, publishing, skips, or anything we later add) is final
            once the relevant action succeeds. We do not restore spent gems because you lost
            a run, disliked a wall, or changed your mind.
          </p>
        </LegalSection>

        <LegalSection n={10} title="Purchases and Stripe">
          <p>
            Gem packs are sold through Stripe Checkout or another processor we name at
            purchase. We do not receive or store full payment-card numbers. Stripe’s terms
            and privacy notice also apply to the checkout. Prices, discounts, and pack sizes
            are shown before you pay and may change for future purchases. Taxes, if any, are
            added or included as displayed at checkout.
          </p>
          <p>
            A pack is credited once, when payment is confirmed (by webhook or by the shop
            claiming the session). We may refuse, delay, or reverse a credit if payment
            fails, is charged back, is flagged as high-risk, or appears fraudulent. If a
            chargeback or reversal occurs after gems were credited or spent, you still owe
            us the amount, and we may debit Virtual Items, ETH balance, and future
            withdrawals, and suspend the account.
          </p>
          <h3>Refunds and withdrawal of consent (EEA / UK / France)</h3>
          <p>
            Digital content is supplied immediately when gems are credited to the account.
            By buying a pack you (a) request immediate performance and (b) acknowledge that
            you lose the statutory cooling-off / withdrawal right once that performance
            begins, to the extent permitted by Article L. 221-28 of the French Consumer
            Code, Article 16 of Directive 2011/83/EU, and equivalent UK rules. Where those
            conditions are not validly met, statutory withdrawal remains available for the
            period the law sets.
          </p>
          <p>
            Otherwise, all gem sales are final. We may issue a goodwill refund in our
            discretion. Nothing in this section limits a mandatory consumer warranty or a
            right you cannot waive.
          </p>
        </LegalSection>

        <LegalSection n={11} title="Earn, ETH pots, and withdrawals">
          <p>
            Earn is an optional, skill-based entertainment mode. From a stated player level
            (admins may bypass), and only while the feature is switched on, you may publish
            a wall or pay a gem ticket to attempt someone else’s wall. A clear may credit an
            ETH amount to an in-Service balance. That feature is the highest-risk part of
            Breeq. Read this section before you spend a ticket.
          </p>
          <h3>Not gambling, not an investment, not a bank</h3>
          <p>
            Earn is offered as a game of skill, not a game of chance, lottery, pool, or
            sportsbook. Outcomes depend on how you play a published layout. You must not use
            Earn where your law treats this activity as gambling or requires a licence we do
            not hold. You are solely responsible for determining that your use is lawful. We
            may geo-restrict, ask for declarations, or shut Earn down in a territory without
            liability.
          </p>
          <p>
            Gems spent as tickets are Virtual Items. They are not a stake of legal tender.
            An ETH credit is not interest, yield, a share of profits, or an invitation to
            invest. Past pots, win rates, and difficulty labels are not a prediction. You
            can lose the entire value of gems you spend, including gems you bought with
            money.
          </p>
          <h3>How a run works</h3>
          <ul>
            <li>
              Buying a ticket may forfeit any run you still have open. Quitting or letting a
              run expire forfeits the ticket.
            </li>
            <li>
              A run older than the stated window (currently 45 minutes, which we may change)
              cannot win.
            </li>
            <li>
              You cannot win on your own wall. A wall pays you at most once.
            </li>
            <li>
              The ETH amount for a win is calculated when the ticket is bought, using the
              then-current economy (including gem USD price, ETH reference price, and win
              multiplier) and is locked into that run. Later price changes do not rewrite an
              open pot. They can change the next ticket.
            </li>
            <li>
              Unproven, hidden, or invalid walls may be refused. We may hide, unfeature, or
              remove a wall after publish.
            </li>
          </ul>
          <h3>Client-reported results and integrity</h3>
          <p>
            Run outcomes may be reported by your client. We may later verify them by
            server-side replay or other means. We may withhold, reverse, or claw back any
            credit, Virtual Item, or withdrawal we reasonably believe was obtained through
            error, latency, a modified client, a reported false win, collusion, or any
            breach of these Terms — including after a withdrawal request has been filed. You
            agree that our reasonable determination of a run’s outcome, subject to mandatory
            law, is final for operating the Service.
          </p>
          <h3>ETH balance</h3>
          <p>
            An ETH amount shown in the wallet is an unsecured contractual credit from us to
            you, recorded in gwei, not crypto held in a wallet you own. It is not a deposit,
            not client money, not a custodian arrangement, and not protected by any deposit
            guarantee or investor-compensation scheme. We may keep corresponding assets
            however we choose. You cannot assign, pledge, or net that credit except by a
            withdrawal we accept.
          </p>
          <h3>Withdrawals</h3>
          <p>
            Withdrawals are requests, processed by hand, to an address you supply. They are
            not instant, not guaranteed, and not a right to on-chain settlement on any
            particular network, block, or fee. We may:
          </p>
          <ul>
            <li>enforce a minimum amount and a one-pending-request rule;</li>
            <li>
              delay, split, refuse, or reverse a request, including for risk, sanctions, KYC
              or KYB, insufficient operator funds, network congestion, or suspected abuse;
            </li>
            <li>
              require government ID, proof of address, source-of-funds, a selfie, or a
              signed message from the destination wallet;
            </li>
            <li>
              debit network fees or a processing fee we disclose before you confirm;
            </li>
            <li>
              refund a rejected request to the in-Service ETH balance rather than to a
              card or to gems;
            </li>
            <li>pay on a chain and token we support (currently ETH) only.</li>
          </ul>
          <p>
            Blockchain transfers are typically irreversible. A wrong address, an
            unsupported contract, or a third-party wallet you do not control is your loss.
            Exchange rates between ETH and any fiat currency move; we do not compensate
            volatility between lock-in, credit, and payout.
          </p>
          <h3>Authors of walls</h3>
          <p>
            Publishing costs gems. Ticket prices must stay inside the ranges we set. You
            are responsible for your wall’s content and for any claim that it is unfair,
            infringing, or unlawful. Ticket revenue is not “your” money sitting in escrow;
            other players pay us in gems, and winners are paid from our ETH credits under
            these Terms. We do not promise you a share of pots on your wall unless we
            publish a separate, then-current rule that says so.
          </p>
        </LegalSection>

        <LegalSection n={12} title="Referrals">
          <p>
            If you share an invite link, a cookie may remember the referrer for a limited
            time. We may pay a stated gem amount for a limited number of qualifying new
            accounts. Self-referrals, fake accounts, incentivised click-farms, and any
            attempt to game the cap are void. We may recast, cap, delay, or cancel referral
            rewards, including after they were shown on a ledger. Referral gems are Virtual
            Items (Section 9). Sharing on third-party networks is subject to those networks’
            rules; we are not responsible for how they handle a link you post.
          </p>
        </LegalSection>

        <LegalSection n={13} title="Third-party services">
          <p>
            The Service depends on third parties, including hosting, databases, Google
            sign-in, Stripe, Cloudinary, blockchain networks, wallet software, and social
            networks you choose to open. Their outages, fees, forks, reorgs, policy changes,
            and terms are outside our control. Opening a third-party link or SDK is at your
            risk. We are not those parties’ agent.
          </p>
        </LegalSection>

        <LegalSection n={14} title="Android application">
          <p>
            The Android app is a native shell around the same website. It may persist
            cookies, handle back navigation, open share targets, and pick photos you choose
            for a wall. Store listing, OS permissions, and billing rules of Google Play are
            additional. If Play policy and these Terms conflict for a purchase made inside
            the app, the policy that legally must apply to that purchase prevails for that
            purchase only.
          </p>
        </LegalSection>

        <LegalSection n={15} title="Feedback">
          <p>
            If you send ideas, bug reports, or suggestions, you grant us a perpetual,
            worldwide, royalty-free right to use them without restriction or compensation.
            You waive moral-rights claims to the extent waivable.
          </p>
        </LegalSection>

        <LegalSection n={16} title="Changes, availability, and beta">
          <p>
            We may modify, suspend, or discontinue any part of the Service, including Earn
            and gem sales, with or without notice, including for maintenance, legal risk, or
            commercially reasonable reasons. The Service may contain errors. We do not
            warrant uninterrupted, secure, or error-free operation, or that saves, balances,
            or runs will never be lost.
          </p>
          <p>
            We may change these Terms. For material changes we will post the new Terms on
            this page and update the date, and we may also give in-Service notice. The new
            Terms apply from posting, or from a later effective date we state. If you
            continue to use the Service after that date, you accept the change. If you do
            not agree, stop using the Service and, where the law requires, you may close the
            account and ask us about unused paid gems that the law treats as unperformed.
          </p>
        </LegalSection>

        <LegalSection n={17} title="Suspension, termination, and forfeiture">
          <p>
            You may stop using the Service at any time. You may ask us to close the account
            through <Link href="/contact">Contact</Link> or account settings where offered.
          </p>
          <p>
            We may suspend, restrict, or terminate access immediately if we reasonably
            believe you breached these Terms, created legal or security risk, failed a
            payment, or if we are required to by law. During a suspension, tickets, runs,
            and withdrawals may fail. On termination for cause we may, to the extent
            permitted by law, expire Virtual Items and unsecured ETH credits obtained in
            connection with the breach. Unused paid gems that the law treats as an unplayed
            digital-content order will be handled as that law requires.
          </p>
          <p>
            Sections that by nature should survive (including 5, 7, 9–12, 15, and 18–26)
            survive termination.
          </p>
        </LegalSection>

        <LegalSection n={18} title="Disclaimers">
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, THE SERVICE IS PROVIDED “AS IS” AND “AS
            AVAILABLE”, WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, OR
            STATUTORY, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE,
            QUIET ENJOYMENT, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT YOU WILL WIN, THAT
            A WALL IS FAIR, THAT BALANCES ARE ERROR-FREE, THAT WITHDRAWALS WILL COMPLETE, OR
            THAT ETH OR GEM PRICES WILL HOLD.
          </p>
          <p>
            Some jurisdictions do not allow certain disclaimers. In those places, the
            disclaimer applies to the fullest extent allowed, and mandatory consumer
            guarantees (including any applicable legal guarantee of conformity for digital
            content) remain.
          </p>
        </LegalSection>

        <LegalSection n={19} title="Limitation of liability">
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, BREEQ AND ITS OPERATORS, OFFICERS,
            EMPLOYEES, CONTRACTORS, AND LICENSORS WILL NOT BE LIABLE FOR ANY INDIRECT,
            INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES, OR ANY LOSS
            OF PROFITS, REVENUE, DATA, GOODWILL, VIRTUAL ITEMS, OR CRYPTOCURRENCY VALUE,
            EVEN IF ADVISED OF THE POSSIBILITY.
          </p>
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, OUR TOTAL LIABILITY ARISING OUT OF OR
            RELATING TO THE SERVICE OR THESE TERMS WILL NOT EXCEED THE GREATER OF (A) THE
            AMOUNTS YOU PAID US FOR GEM PACKS IN THE TWELVE (12) MONTHS BEFORE THE CLAIM, OR
            (B) ONE HUNDRED EURO (€100).
          </p>
          <p>
            These limits do not apply to liability that cannot be limited: death or personal
            injury caused by negligence, fraud or fraudulent misrepresentation, or any other
            liability that mandatory law says must remain. If you are a consumer in the EEA
            or United Kingdom, we remain liable for reasonably foreseeable loss caused by
            our failure to use reasonable care and skill, but we are not liable for loss
            that was not foreseeable or that results from your breach.
          </p>
        </LegalSection>

        <LegalSection n={20} title="Indemnity">
          <p>
            You will defend, indemnify, and hold harmless Breeq and its operators, officers,
            employees, contractors, and licensors from and against any claim, damage, loss,
            and reasonable legal fees arising out of: (a) your User Content; (b) your use of
            Earn, withdrawals, or payment instruments; (c) your breach of these Terms or of
            law; or (d) your dispute with another player. We may assume exclusive defence;
            you will cooperate. This indemnity does not require a consumer to indemnify us
            beyond what mandatory law allows.
          </p>
        </LegalSection>

        <LegalSection n={21} title="Taxes">
          <p>
            You are solely responsible for taxes, reporting, and accounting that apply to
            gems, skips, tickets, ETH credits, withdrawals, and referral rewards, including
            income, capital gains, VAT, and withholding. We may withhold amounts we are
            required to withhold and may send information to tax authorities where the law
            requires.
          </p>
        </LegalSection>

        <LegalSection n={22} title="Sanctions, export, and location">
          <p>
            You represent that you are not located in, resident of, or ordinarily resident
            in a comprehensively sanctioned jurisdiction, and are not a denied or restricted
            party. You will not use the Service in violation of export or sanctions law. We
            may use IP address, payment, or wallet data to enforce this and may be wrong; you
            must not evade a block.
          </p>
        </LegalSection>

        <LegalSection n={23} title="Governing law and disputes">
          <p>
            These Terms and any dispute arising out of them or the Service are governed by
            the laws of France, excluding conflict-of-law rules that would choose another
            law, except that mandatory consumer protections of your country of residence
            still apply if you are a consumer.
          </p>
          <p>
            Subject to the next paragraph, the courts of Paris, France, have exclusive
            jurisdiction. If you are a consumer in the EEA, the United Kingdom, or
            Switzerland, you may instead bring proceedings in the courts of your place of
            residence, and we may bring proceedings against you only in those courts. You
            may also use the European Commission’s ODR platform where it remains available.
          </p>
          <p>
            Before filing a claim, you agree to contact us and try to resolve the dispute
            informally for thirty (30) days, unless the law sets a shorter pre-action
            period or immediate relief is reasonably needed. THIS SECTION DOES NOT REQUIRE
            CONSUMERS TO ARBITRATE OR TO WAIVE CLASS OR REPRESENTATIVE ACTIONS WHERE THAT
            WAIVER WOULD BE UNENFORCEABLE. If you are using the Service as a business,
            neither party will bring a class, collective, or representative action, and any
            dispute will be individual only.
          </p>
        </LegalSection>

        <LegalSection n={24} title="Apple, Google, and other app stores">
          <p>
            If you download an app from a store, that store is not a party to these Terms
            and has no obligation to provide maintenance or support. To the maximum extent
            permitted by law, the store has no warranty obligation. The store and its
            subsidiaries are third-party beneficiaries of this section and may enforce it.
            Your use must also comply with the store’s terms.
          </p>
        </LegalSection>

        <LegalSection n={25} title="Miscellaneous">
          <p>
            These Terms are the entire agreement between you and us about the Service and
            replace prior terms on the same subject. We may assign these Terms or the
            Service without restriction. You may not assign without our prior written
            consent. If a provision is unenforceable, it is modified to the minimum extent
            needed, and the rest remains in force. A failure to enforce is not a waiver.
            There are no third-party beneficiaries except as stated for app stores. Headings
            are for convenience only. “Including” means “including without limitation”.
            Notices to you may be posted in the Service, sent to your account email, or
            shown at next sign-in. Notices to us go through <Link href="/contact">Contact</Link>.
          </p>
          <p>
            These Terms are written in English. That English version controls, even if we
            later provide a translation.
          </p>
        </LegalSection>

        <LegalSection n={26} title="Contact">
          <p>
            Operator of the Service: Breeq, {SITE_URL}. Legal and operational notices:{" "}
            <Link href="/contact">breeq.space/contact</Link>. We may publish a postal
            address, company number, or VAT number on this page when they exist.
          </p>
        </LegalSection>
      </LegalBody>
    </VaultShell>
  );
}
