/**
 * Share links and the referral reward — the constants both the browser (the
 * share row) and the server (`lib/referrals.ts`) agree on. No DOM, no Prisma.
 */

/** Gems the referrer earns when a friend signs up through their link. */
export const REFERRAL_GEMS = 10;
/** Sign-ups that pay, per referrer. Later ones are recorded, not paid. */
export const REFERRAL_MAX_PAID = 10;

/** Cookie dropped by `/r/<code>`; read once at sign-up. Value: `<code>` or `<code>:<via>`. */
export const REFERRAL_COOKIE = "breeq-ref";
export const REFERRAL_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

/** Referral codes: 8 lowercase letters and digits, no look-alikes (0/o, 1/l/i). */
export const REFERRAL_CODE_ALPHABET = "23456789abcdefghjkmnpqrstuvwxyz";
export const REFERRAL_CODE_LENGTH = 8;

export const SHARE_CHANNELS = ["x", "facebook", "whatsapp", "telegram"] as const;
export type ShareChannel = (typeof SHARE_CHANNELS)[number];

/** Anything the `via` query may carry, buttons included. */
export const SHARE_SOURCES = [...SHARE_CHANNELS, "copy"] as const;
export type ShareSource = (typeof SHARE_SOURCES)[number];

export const SHARE_CHANNEL_LABEL: Record<ShareChannel, string> = {
  x: "X",
  facebook: "Facebook",
  whatsapp: "WhatsApp",
  telegram: "Telegram",
};

export function isShareSource(value: string | null | undefined): value is ShareSource {
  return typeof value === "string" && (SHARE_SOURCES as readonly string[]).includes(value);
}

export function isReferralCode(value: string): boolean {
  if (value.length !== REFERRAL_CODE_LENGTH) return false;
  for (const char of value) {
    if (!REFERRAL_CODE_ALPHABET.includes(char)) return false;
  }
  return true;
}

/** `/r/<code>?via=<source>` — the public door that sets the referral cookie. */
export function referralPath(code: string, via?: ShareSource) {
  return via ? `/r/${code}?via=${via}` : `/r/${code}`;
}

export function referralUrl(origin: string, code: string, via?: ShareSource) {
  return `${origin.replace(/\/$/, "")}${referralPath(code, via)}`;
}

/** The invitation a player sends after clearing a story wall. */
export function clearShareText(title: string) {
  return `Hey, join me! I just beat "${title}" on Breeq, a brick breaker built by players. Take the paddle with my link and help me earn gems.`;
}

/**
 * The share intent of each network. All four are universal links: with the app
 * installed, iOS and Android open it directly; otherwise the web share page.
 * Facebook ignores any text and takes its copy from the link's Open Graph tags.
 */
export function shareHref(channel: ShareChannel, url: string, text: string) {
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(text);
  switch (channel) {
    case "x":
      return `https://x.com/intent/post?text=${t}&url=${u}`;
    case "facebook":
      return `https://www.facebook.com/sharer/sharer.php?u=${u}`;
    case "whatsapp":
      return `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`;
    case "telegram":
      return `https://t.me/share/url?url=${u}&text=${t}`;
  }
}
