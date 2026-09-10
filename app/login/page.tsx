import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in or create a Breeq account to play.",
};

export default function LoginPage() {
  const googleEnabled = Boolean(
    process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET,
  );

  return (
    <section className="mx-auto flex min-h-[100svh] w-full max-w-lg flex-col items-center justify-center px-4 pb-16 pt-28">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">
        Account
      </p>
      <h1 className="mt-4 text-center text-4xl font-semibold tracking-tight text-ink">
        Take the <span className="text-neon">paddle</span>
      </h1>
      <p className="mt-3 max-w-sm text-center text-base leading-7 text-ink-muted">
        Sign in to play. New here? Switch to sign up and pick a username.
      </p>
      <div className="mt-8 w-full">
        <AuthForm googleEnabled={googleEnabled} />
      </div>
    </section>
  );
}
