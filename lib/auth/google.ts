/** Google sign-in is on when both OAuth client values are present (server only). */
export function isGoogleEnabled() {
  return Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
}
