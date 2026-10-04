/** Google's "Get it on Google Play" badge. The artwork is theirs; only the size is ours. */
const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.breeq.breeq";

export function PlayStoreBadge() {
  return (
    <a
      className="play-store-badge"
      href={PLAY_STORE_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Get it on Google Play"
    >
      <img src="/google-play-badge.svg" alt="" width={239} height={71} />
    </a>
  );
}
