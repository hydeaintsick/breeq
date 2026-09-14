import type { Metadata } from "next";
import Link from "next/link";
import { EarnSetting } from "@/components/earn-setting";
import { TutorialSetting } from "@/components/tutorial-setting";
import { requireAdmin } from "@/lib/auth/session";
import { EARN_PATH, TUTORIAL_PATH } from "@/lib/auth/paths";
import { EARN_UNLOCK_LEVEL } from "@/lib/progress";
import { getSiteSettings } from "@/lib/tutorial";

export const metadata: Metadata = {
  title: "Settings — Admin",
  description: "Site switches.",
};

export default async function AdminSettingsPage() {
  await requireAdmin();
  const settings = await getSiteSettings();

  return (
    <section>
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">Admin space</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">Settings</h1>

      <ul className="mt-8 grid gap-4 sm:grid-cols-2">
        <li className="glass p-6">
          <h2 className="text-xl font-semibold tracking-tight text-ink">Tutorial</h2>
          <p className="mt-2 text-sm leading-6 text-ink-muted">
            A guided first wall ahead of the story: the paddle, glass and hard bricks, a slow zone. Players clear it
            once; you can{" "}
            <Link href={TUTORIAL_PATH} className="underline underline-offset-4">
              play it
            </Link>{" "}
            any time.
          </p>
          <TutorialSetting enabled={settings.tutorialEnabled} />
        </li>
        <li className="glass p-6">
          <h2 className="text-xl font-semibold tracking-tight text-ink">Earn</h2>
          <p className="mt-2 text-sm leading-6 text-ink-muted">
            Player-built walls played for gems and cleared for ETH. Unlocks at level {EARN_UNLOCK_LEVEL} in Story.
            {settings.earnEnabled ? (
              <>
                {" "}
                You can{" "}
                <Link href={EARN_PATH} className="underline underline-offset-4">
                  open the store
                </Link>{" "}
                while it is on.
              </>
            ) : (
              <> Players will not see it until you turn it on.</>
            )}
          </p>
          <EarnSetting enabled={settings.earnEnabled} />
        </li>
      </ul>
    </section>
  );
}
