import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";
import { isGoogleEnabled } from "@/lib/auth/google";
import { signInErrorMessage } from "@/lib/auth/sign-in-error";
import { findReferrer, type Referrer } from "@/lib/referrals";

type SearchParams = Promise<{ error?: string | string[]; invite?: string | string[] }>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function inviterName(referrer: Referrer) {
  return referrer.username ? `@${referrer.username}` : referrer.name ?? "A friend";
}

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const referrer = await findReferrer(first((await searchParams).invite));
  if (!referrer) {
    return {
      title: "Sign in",
      description: "Sign in or create a Breeq account to play.",
    };
  }
  const who = inviterName(referrer);
  const title = `${who} invited you to Breeq`;
  const description = `${who} just beat a wall on Breeq, a brick breaker built by players, for players. Take the paddle and join them.`;
  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
    twitter: { card: "summary", title, description },
  };
}

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const googleEnabled = isGoogleEnabled();
  const { error, invite } = await searchParams;
  const referrer = await findReferrer(first(invite));

  return (
    <section className="mx-auto flex min-h-[100svh] w-full max-w-lg flex-col items-center justify-center px-4 pb-16 pt-28">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">
        {referrer ? "You're invited" : "Account"}
      </p>
      <h1 className="mt-4 text-center text-4xl font-semibold tracking-tight text-ink">
        Take the <span className="text-neon">paddle</span>
      </h1>
      <p className="mt-3 max-w-sm text-center text-base leading-7 text-ink-muted">
        {referrer
          ? `${inviterName(referrer)} invited you to play. Create your account and pick up where they left off.`
          : googleEnabled
            ? "Continue with Google, or use email, username, or a wallet. New here? One tap creates your account."
            : "Sign in with email, username, or a wallet. New here? Switch to sign up and pick a username."}
      </p>
      <div className="mt-8 w-full">
        <AuthForm
          googleEnabled={googleEnabled}
          initialError={signInErrorMessage(first(error))}
          initialMode={referrer ? "signup" : "signin"}
        />
      </div>
    </section>
  );
}
