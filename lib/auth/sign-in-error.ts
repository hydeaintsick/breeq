/**
 * Auth.js sends OAuth failures back to `/login?error=<code>`.
 * Turn the code into one calm sentence for the form; unknown codes get a generic line.
 */
const MESSAGES: Record<string, string> = {
  OAuthAccountNotLinked:
    "That email already has a Breeq account. Sign in the way you did before, then link Google from your account page.",
  OAuthCallbackError: "Google sign-in was cancelled or timed out. Try again.",
  OAuthSignInError: "Google sign-in could not start. Try again.",
  AccessDenied: "We could not confirm that Google email. Verify it with Google, then try again.",
  Configuration: "Sign-in is not configured on this server yet.",
  Verification: "That sign-in link is no longer valid. Try again.",
  CredentialsSignin: "Username, email, or password is not right.",
  Callback: "Sign-in failed on the way back. Try again.",
};

export function signInErrorMessage(code: string | string[] | undefined) {
  const value = Array.isArray(code) ? code[0] : code;
  if (!value) {
    return null;
  }

  return MESSAGES[value] ?? "Sign-in failed. Try again.";
}
