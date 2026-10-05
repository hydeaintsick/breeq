import { NextResponse, type NextRequest } from "next/server";
import { STORY_PATH, TUTORIAL_PATH, storyEpisodePath } from "@/lib/auth/paths";
import { requireProgress } from "@/lib/auth/session";
import { getStoryShelf } from "@/lib/story";
import { routeStand } from "@/lib/story-route";
import { getTutorialStatus } from "@/lib/tutorial";
import { canonicalOrigin, requestOrigin } from "@/lib/guest-door";

export const dynamic = "force-dynamic";

/**
 * Where a cold start goes: the tutorial until it is done, then the episode
 * the player is standing on. A real redirect, so the Android WebView follows
 * it on the first load. The dock's link to the menu does not come here.
 */
export async function GET(request: NextRequest) {
  const { user } = await requireProgress();
  const tutorial = await getTutorialStatus(user.id);
  const origin = canonicalOrigin(requestOrigin(request.headers, request.nextUrl.origin));

  if (tutorial.required) {
    return NextResponse.redirect(new URL(TUTORIAL_PATH, origin));
  }

  const shelf = await getStoryShelf(user.id);
  const stand = routeStand(shelf.episodes, tutorial.enabled ? { done: tutorial.done } : null);
  const zone = stand.current ? stand.zones[stand.current.index] : null;
  if (!zone || zone.slug === "tutorial") {
    const dest = tutorial.enabled && !tutorial.done ? TUTORIAL_PATH : STORY_PATH;
    return NextResponse.redirect(new URL(dest, origin));
  }
  return NextResponse.redirect(new URL(storyEpisodePath(zone.slug), origin));
}
