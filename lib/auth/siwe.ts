export const SIWE_NONCE_COOKIE = "breeq.siwe-nonce";

export function siweMessage(address: string, nonce: string) {
  return [
    "Breeq",
    "",
    "Sign this message to sign in.",
    `Address: ${address}`,
    `Nonce: ${nonce}`,
  ].join("\n");
}
