import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { TutorialRun } from "@/components/tutorial-run";
import { STORY_PATH } from "@/lib/auth/paths";
import { requireProgress } from "@/lib/auth/session";
import { getTutorialStatus } from "@/lib/tutorial";

export const metadata: Metadata = {
  title: "How to Play",
  description: "A guided first wall: the paddle, the first two bricks, and a zone.",
};

export default async function TutorialPage() {
  const { user } = await requireProgress();
  const status = await getTutorialStatus(user.id);

  if (!status.enabled) {
    redirect(STORY_PATH);
  }

  return <TutorialRun done={status.done} />;
}
