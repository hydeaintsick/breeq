"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useBalances } from "@/components/balances-provider";
import { BreakoutPreview } from "@/components/breakout-preview";
import { useGemShop } from "@/components/gem-shop";
import { HapticsToggle } from "@/components/haptics-toggle";
import { SoundToggle } from "@/components/sound-toggle";
import { useStorySurface, type StoryZone } from "@/components/story-chrome";
import { StoryClear, type ClearCost } from "@/components/story-clear";
import { StoryJourney, type JourneyCard, type StoryJourneyHandle } from "@/components/story-journey";
import { StoryLose } from "@/components/story-lose";
import { StoryPlay } from "@/components/story-play";
import { StorySkipSheet } from "@/components/story-skip";
import { HUE_VAR, StoryTrail } from "@/components/story-trail";
import { SwipeToggle } from "@/components/swipe-toggle";
import { useImmersive } from "@/components/use-immersive";
import { useStoryTheme } from "@/components/use-story-theme";
import type { ChapterClearResult, ChapterSkipResult } from "@/app/actions/progress";
import { applyBackgroundPhoto, parseStoredLevel } from "@/game/breakout/engine";
import { starsForClear } from "@/game/breakout/engine/stars";
import { QUIET_START } from "@/game/breakout/levels";
import { hueForEpisode, sceneForEpisode, type JourneyNodeInput, type JourneyNodeState } from "@/game/journey";
import { STORY_PATH, TUTORIAL_PATH } from "@/lib/auth/paths";
import { ambientPhoto, boardPhoto, nodePhoto, screenPhoto } from "@/lib/photo";
import { SKIP_CHAPTER_GEMS } from "@/lib/progress";
import {
  chapterIsLocked,
  continueChapterIndex,
  episodeIsComplete,
  episodeIsLocked,
  episodeLockHint,
  episodeProgress,
  type StoryChapterCard,
  type StoryEpisodeCard,
} from "@/lib/story";

const FALLBACK_LEVELS = [QUIET_START];
const TUTORIAL_HINT = "Finish the tutorial first.";
const EMPTY_DISCOVERIES: readonly string[] = [];
/** The iris takes this long to open or close, matched by `.story-sheet` in the stylesheet. */
const IRIS_MS = 440;

/**
 * A skip that went to the shop for gems. Stripe Checkout leaves the page, so
 * the wall being skipped is kept here and the sheet comes back up over it when
 * the player returns — the pack lands, then the skip is one more tap.
 */
const SKIP_INTENT_KEY = "breeq-skip-intent";
const SKIP_INTENT_TTL_MS = 15 * 60 * 1000;
type SkipIntent = { episode: string; chapter: string; at: number };

function readSkipIntent(): SkipIntent | null {
  try {
    const raw = window.sessionStorage.getItem(SKIP_INTENT_KEY);
    window.sessionStorage.removeItem(SKIP_INTENT_KEY);
    if (!raw) return null;
    const intent = JSON.parse(raw) as Partial<SkipIntent>;
    if (typeof intent.episode !== "string" || typeof intent.chapter !== "string" || typeof intent.at !== "number") return null;
    if (Date.now() - intent.at > SKIP_INTENT_TTL_MS) return null;
    return { episode: intent.episode, chapter: intent.chapter, at: intent.at };
  } catch {
    return null;
  }
}

function writeSkipIntent(intent: Omit<SkipIntent, "at">) {
  try {
    window.sessionStorage.setItem(SKIP_INTENT_KEY, JSON.stringify({ ...intent, at: Date.now() }));
  } catch {
    // Private mode without storage: the shop still opens, the sheet just will not come back after Stripe.
  }
}

/** The how-to-play slide that sits ahead of the episodes while the tutorial is on. */
export type ShelfTutorial = { done: boolean };

function chapterLabel(cleared: number, total: number) {
  if (total <= 0) {
    return "No chapters";
  }
  if (cleared <= 0) {
    return total === 1 ? "1 chapter" : `${total} chapters`;
  }
  if (total === 1) {
    return "1 of 1 chapter";
  }
  return `${cleared} of ${total} chapters`;
}

/** Episode index → journey node index (the tutorial, when shown, is node 0). */
function continueIndex(episodes: readonly StoryEpisodeCard[], slug?: string) {
  if (slug) {
    const match = episodes.findIndex((episode) => episode.slug === slug);
    if (match >= 0) {
      return match;
    }
  }
  const playable = episodes.findIndex(
    (episode, index) => !episodeIsLocked(episodes, index) && !episodeIsComplete(episode),
  );
  if (playable >= 0) {
    return playable;
  }
  return Math.max(0, episodes.length - 1);
}

/**
 * Where the iris closes back to: the medallion the episode was opened from
 * when it is still on the page, otherwise the episode's node on the map
 * (direct `/story/[slug]` visits never tapped one).
 */
function cardRect(
  journey: StoryJourneyHandle | null,
  episodes: readonly StoryEpisodeCard[],
  episode: StoryEpisodeCard,
  card: HTMLElement | null,
  offset: number,
): DOMRect | null {
  if (card?.isConnected) {
    const rect = card.getBoundingClientRect();
    if (rect.width >= 8) return rect;
  }
  const index = episodes.findIndex((item) => item.id === episode.id) + offset;
  const rect = journey?.anchorRect(index) ?? null;
  return rect && rect.width >= 8 ? rect : null;
}

function openingChapterIndex(episodes: readonly StoryEpisodeCard[], slug?: string) {
  const episode = episodes.find((item) => item.slug === slug);
  if (!episode) {
    return 0;
  }
  const index = episodes.findIndex((item) => item.id === episode.id);
  return episodeIsLocked(episodes, index) ? 0 : continueChapterIndex(episode.chapters);
}

/** The iris: a circle on the medallion, or one wide enough to cover the whole screen from there. */
function irisStyle(origin: DOMRect | null, grown: boolean): CSSProperties | undefined {
  if (!origin) return undefined;
  const cx = origin.left + origin.width / 2;
  const cy = origin.top + origin.height / 2;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const far = Math.hypot(Math.max(cx, vw - cx), Math.max(cy, vh - cy)) + 12;
  return {
    "--iris-x": `${cx.toFixed(1)}px`,
    "--iris-y": `${cy.toFixed(1)}px`,
    "--iris-r": `${(grown ? far : origin.width * 0.5).toFixed(1)}px`,
  } as CSSProperties;
}

export function StoryShelf({
  episodes,
  initialSlug,
  tutorial = null,
  arriveFromTutorial = false,
  discovered = EMPTY_DISCOVERIES,
}: {
  episodes: StoryEpisodeCard[];
  initialSlug?: string;
  /** Show the how-to-play slide first; episodes stay locked until it is done. */
  tutorial?: ShelfTutorial | null;
  /** The player just finished the tutorial: open on its card, then swipe to episode one. */
  arriveFromTutorial?: boolean;
  /** Piece ids already explained to this player; a run stops on the first touch of anything else. */
  discovered?: readonly string[];
}) {
  const router = useRouter();
  const titleId = useId();
  /** Slides ahead of the first episode. */
  const offset = tutorial ? 1 : 0;
  /** The story waits for the tutorial. */
  const gate = tutorial !== null && !tutorial.done;
  const [shelf, setShelf] = useState(episodes);
  /** The node the map opens on. */
  const [start] = useState(() =>
    gate || (arriveFromTutorial && offset > 0) ? 0 : continueIndex(episodes, initialSlug) + offset,
  );
  const journeyRef = useRef<StoryJourneyHandle | null>(null);
  const [open, setOpen] = useState<StoryEpisodeCard | null>(() => {
    const episode = episodes.find((item) => item.slug === initialSlug);
    if (!episode || gate) {
      return null;
    }
    const index = episodes.findIndex((item) => item.id === episode.id);
    return episodeIsLocked(episodes, index) ? null : episode;
  });
  const [origin, setOrigin] = useState<DOMRect | null>(null);
  const [grown, setGrown] = useState(Boolean(initialSlug));
  /** The iris is closing back onto its medallion; unmounts when it lands. */
  const [closing, setClosing] = useState(false);
  /** The open sheet hides the whole page: the map behind it can rest. */
  const [covered, setCovered] = useState(false);
  const originCardRef = useRef<HTMLElement | null>(null);
  const [playing, setPlaying] = useState<StoryChapterCard | null>(null);
  const [paused, setPaused] = useState(false);
  /** Pieces explained so far, this session included: the next chapter must not repeat them. */
  const [known, setKnown] = useState<ReadonlySet<string>>(() => new Set(discovered));
  const onDiscovered = useCallback((id: string) => {
    setKnown((current) => (current.has(id) ? current : new Set(current).add(id)));
  }, []);
  /** The chapter's story beat is up; the board waits underneath until it is tapped away. */
  const [intro, setIntro] = useState(false);
  /** The wall came down: score is known at once, the payout arrives a beat later. */
  const [cleared, setCleared] = useState<{
    score: number;
    stars: 0 | 1 | 2 | 3;
    result: ChapterClearResult | null;
  } | null>(null);
  const [lost, setLost] = useState<{ score: number; reason: "lives" | "timeout" | "crushed" } | null>(null);
  const [runId, setRunId] = useState(0);
  const [portal, setPortal] = useState<HTMLElement | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  /** The wall the trail's dock shows. */
  const [chapterActive, setChapterActive] = useState(() => openingChapterIndex(episodes, initialSlug));
  /** Bumps when the road should stand on `chapterActive` at once. */
  const [trailSnap, setTrailSnap] = useState(0);
  /** The wall the player is about to buy past: the confirmation sheet is up. */
  const [skipping, setSkipping] = useState<StoryChapterCard | null>(null);
  /** The skip went through: its clear screen owns the sheet until it is tapped away. */
  const [skipped, setSkipped] = useState<{ chapter: StoryChapterCard; index: number; result: ChapterSkipResult } | null>(null);
  const shop = useGemShop();
  const balances = useBalances();
  const publishBalances = balances?.setBalances;
  const gems = balances?.balances.gems ?? 0;

  // The theme plays under the map and the episode sheet, and steps aside for a run or a skip's clear screen.
  useStoryTheme(playing !== null || skipped !== null);
  // Story owns the screen: full screen and portrait where the browser allows it.
  useImmersive();

  /** The map: one node per episode, the tutorial ahead of them when it is on. */
  const nodes = useMemo<JourneyNodeInput[]>(() => {
    const list: JourneyNodeInput[] = [];
    if (tutorial) {
      list.push({
        id: "tutorial",
        kicker: "00",
        title: "How to Play",
        state: tutorial.done ? "cleared" : "current",
        stars: 0,
        progress: tutorial.done ? 1 : 0,
        cover: null,
        hue: "steel",
        scene: "drill",
      });
    }
    let frontier = gate;
    shelf.forEach((episode, index) => {
      const locked = gate || episodeIsLocked(shelf, index);
      const progress = episodeProgress(episode);
      const state: JourneyNodeState = locked ? "locked" : episodeIsComplete(episode) ? "cleared" : frontier ? "open" : "current";
      if (state === "current") frontier = true;
      list.push({
        id: episode.id,
        kicker: String(index + 1).padStart(2, "0"),
        title: episode.title,
        state,
        stars: progress.starValue,
        progress: progress.total > 0 ? progress.cleared / progress.total : 0,
        cover: episode.backgroundUrl ? nodePhoto(episode.backgroundUrl) : null,
        hue: hueForEpisode(episode.slug, index),
        scene: sceneForEpisode(episode.slug, index),
      });
    });
    return list;
  }, [gate, shelf, tutorial]);

  /** The route as the header chrome needs it: the book unseals by slug, the galaxy map lights by state. */
  const zones = useMemo<StoryZone[]>(() => {
    const list: StoryZone[] = [];
    if (tutorial) list.push({ slug: "tutorial", title: "How to Play", kicker: "00", state: nodes[0].state, hue: "steel" });
    shelf.forEach((episode, index) => {
      const node = nodes[index + offset];
      list.push({ slug: episode.slug, title: episode.title, kicker: node.kicker, state: node.state, hue: node.hue });
    });
    return list;
  }, [nodes, offset, shelf, tutorial]);
  const chrome = useStorySurface(
    zones,
    useCallback((index: number) => journeyRef.current?.goTo(index), []),
  );
  /** The book or the galaxy map is over the route: it neither draws nor sounds. */
  const sheeted = chrome?.panel != null;

  // The dive from the Story card lifts once the map has drawn: two frames after mount.
  const arrive = chrome?.arrive;
  useEffect(() => {
    if (!arrive) return;
    let raf2 = 0;
    const raf1 = window.requestAnimationFrame(() => {
      raf2 = window.requestAnimationFrame(() => arrive());
    });
    return () => {
      window.cancelAnimationFrame(raf1);
      window.cancelAnimationFrame(raf2);
    };
  }, [arrive]);

  const cards = useMemo<JourneyCard[]>(() => {
    const list: JourneyCard[] = [];
    if (tutorial) {
      list.push({
        kicker: "Tutorial",
        title: "How to Play",
        meta: tutorial.done ? "Done. Replay it any time." : "The paddle, the first two bricks, a zone. About two minutes.",
        action: tutorial.done ? "Replay" : "Start",
        locked: false,
        hint: null,
        stars: null,
        href: TUTORIAL_PATH,
      });
    }
    shelf.forEach((episode, index) => {
      const locked = gate || episodeIsLocked(shelf, index);
      const progress = episodeProgress(episode);
      list.push({
        kicker: `Episode ${String(index + 1).padStart(2, "0")}`,
        title: episode.title,
        meta: episode.tagline ?? chapterLabel(progress.cleared, progress.total),
        action: episodeIsComplete(episode) ? "Replay" : progress.cleared > 0 ? "Continue" : "Play",
        locked,
        hint: gate ? TUTORIAL_HINT : episodeLockHint(shelf, index),
        stars: progress.cleared > 0 ? progress.starValue : null,
      });
    });
    return list;
  }, [gate, shelf, tutorial]);

  useEffect(() => {
    setPortal(document.body);
  }, []);

  useEffect(() => {
    setShelf(episodes);
  }, [episodes]);

  // Back from the shop with a skip in mind: the episode opens straight on
  // (no medallion to grow from) with the confirmation sheet already up.
  useEffect(() => {
    const intent = readSkipIntent();
    if (!intent || gate) return;
    const index = episodes.findIndex((episode) => episode.slug === intent.episode);
    const episode = episodes[index];
    if (!episode || episodeIsLocked(episodes, index)) return;
    const chapterIndex = episode.chapters.findIndex((chapter) => chapter.id === intent.chapter);
    const chapter = episode.chapters[chapterIndex];
    if (!chapter || chapter.cleared || chapterIsLocked(episode.chapters, chapterIndex)) return;
    // Restoring a surface the player left mid-flow: the state is the intent, read once on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrigin(null);
    setGrown(true);
    setClosing(false);
    setOpen(episode);
    setChapterActive(chapterIndex);
    setTrailSnap((n) => n + 1);
    setSkipping(chapter);
    // Mount only: the intent is consumed as it is read.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The iris has opened: the page under it is fully hidden, and its map and
  // sound can rest until the sheet comes down.
  useEffect(() => {
    if (!open || !grown || closing) {
      return;
    }
    const sheet = sheetRef.current;
    const done = () => setCovered(true);
    const onEnd = (event: TransitionEvent) => {
      if (event.target !== sheet || event.propertyName !== "clip-path") {
        return;
      }
      done();
    };
    sheet?.addEventListener("transitionend", onEnd);
    const fallback = window.setTimeout(done, origin ? IRIS_MS + 60 : 0);
    return () => {
      sheet?.removeEventListener("transitionend", onEnd);
      window.clearTimeout(fallback);
    };
  }, [closing, grown, open, origin]);

  useEffect(() => {
    if (!open || closing) {
      return;
    }
    if (!origin || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setGrown(true);
      return;
    }
    const frame = window.setTimeout(() => setGrown(true), 20);
    return () => window.clearTimeout(frame);
  }, [closing, open, origin]);

  const finishClose = useCallback(() => {
    setPlaying(null);
    setPaused(false);
    setCleared(null);
    setLost(null);
    setSkipping(null);
    setSkipped(null);
    setOpen(null);
    setGrown(false);
    setOrigin(null);
    setClosing(false);
    setCovered(false);
    journeyRef.current?.zoom(null);
    if (initialSlug) {
      router.push(STORY_PATH);
    }
  }, [initialSlug, router]);

  /**
   * Close is the opening played backwards: the map eases back out while the
   * iris closes onto the medallion the episode grew from (re-measured, the map
   * may have moved), then the sheet unmounts once the circle lands.
   */
  const closeSheet = useCallback(() => {
    if (closing) {
      return;
    }
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const target = open ? cardRect(journeyRef.current, shelf, open, originCardRef.current, offset) : null;
    if (!target || reduced) {
      finishClose();
      return;
    }
    setPlaying(null);
    setPaused(false);
    setCleared(null);
    setLost(null);
    setCovered(false);
    setOrigin(target);
    setGrown(false);
    setClosing(true);
    journeyRef.current?.zoom(null);
  }, [closing, finishClose, offset, open, shelf]);

  useEffect(() => {
    if (!closing) {
      return;
    }
    const sheet = sheetRef.current;
    let done = false;
    const finish = () => {
      if (done) {
        return;
      }
      done = true;
      finishClose();
    };
    const onEnd = (event: TransitionEvent) => {
      if (event.target !== sheet || event.propertyName !== "clip-path") {
        return;
      }
      finish();
    };
    sheet?.addEventListener("transitionend", onEnd);
    const fallback = window.setTimeout(finish, IRIS_MS + 80);
    return () => {
      sheet?.removeEventListener("transitionend", onEnd);
      window.clearTimeout(fallback);
    };
  }, [closing, finishClose]);

  useEffect(() => {
    if (!open && !playing) {
      return;
    }
    const html = document.documentElement;
    const previousHtml = html.style.overflow;
    const previousBody = document.body.style.overflow;
    html.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      html.style.overflow = previousHtml;
      document.body.style.overflow = previousBody;
    };
  }, [open, playing]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }
      if (shop.isOpen) {
        // The shop's own handler closes it; the sheet under it stays.
        return;
      }
      if (skipping) {
        setSkipping(null);
        return;
      }
      if (skipped) {
        closeSkipped();
        return;
      }
      if (playing) {
        if (cleared || lost) {
          setPaused(false);
          setCleared(null);
          setLost(null);
          setPlaying(null);
          return;
        }
        if (intro) {
          setIntro(false);
          return;
        }
        setPaused(true);
        return;
      }
      closeSheet();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // Fresh from the tutorial: let the card land, then carry the player on to
  // the first episode, now unlocked. The query is dropped so a reload stays put.
  const arrived = useRef(false);
  useEffect(() => {
    if (!arriveFromTutorial || offset === 0 || arrived.current) {
      return;
    }
    window.history.replaceState(window.history.state, "", STORY_PATH);
    const id = window.setTimeout(() => {
      arrived.current = true;
      journeyRef.current?.goTo(offset);
    }, 700);
    return () => window.clearTimeout(id);
  }, [arriveFromTutorial, offset]);

  function openNode(node: number, anchor: HTMLElement) {
    const episode = shelf[node - offset];
    if (episode) openEpisode(episode, anchor, node);
  }

  function openEpisode(episode: StoryEpisodeCard, card: HTMLElement, node: number) {
    const index = shelf.findIndex((item) => item.id === episode.id);
    if (gate || episodeIsLocked(shelf, index)) {
      return;
    }
    const current = shelf[index] ?? episode;
    originCardRef.current = card;
    setOrigin(card.getBoundingClientRect());
    setGrown(false);
    setClosing(false);
    setOpen(current);
    setChapterActive(continueChapterIndex(current.chapters));
    setTrailSnap((n) => n + 1);
    setPlaying(null);
    setPaused(false);
    setCleared(null);
    setLost(null);
    // The sky leans into the zone as the iris opens over it.
    journeyRef.current?.zoom(node);
  }

  function markCleared(chapterId: string, stars: 0 | 1 | 2 | 3) {
    const patch = (episode: StoryEpisodeCard) => ({
      ...episode,
      chapters: episode.chapters.map((chapter) =>
        chapter.id === chapterId
          ? { ...chapter, cleared: true, stars: Math.max(chapter.stars, stars) as 0 | 1 | 2 | 3 }
          : chapter,
      ),
    });
    setShelf((current) => current.map(patch));
    setOpen((current) => (current ? patch(current) : current));
  }

  function quitRun() {
    if (playing && open) {
      const index = open.chapters.findIndex((chapter) => chapter.id === playing.id);
      const next = cleared && index >= 0 && index < open.chapters.length - 1 ? index + 1 : Math.max(0, index);
      setChapterActive(next);
      setTrailSnap((n) => n + 1);
    }
    setPaused(false);
    setCleared(null);
    setLost(null);
    setPlaying(null);
  }

  function startChapter(chapter: StoryChapterCard) {
    if (!open) {
      return;
    }
    const index = open.chapters.findIndex((item) => item.id === chapter.id);
    if (chapterIsLocked(open.chapters, index)) {
      return;
    }
    setChapterActive(index);
    setPaused(false);
    setCleared(null);
    setLost(null);
    setRunId(0);
    // The story beat opens the run; a tap dismisses it and serves the ball.
    setIntro(Boolean(chapter.intro));
    setPlaying(chapter);
  }

  function retryRun() {
    setPaused(false);
    setCleared(null);
    setLost(null);
    setRunId((n) => n + 1);
  }

  /** "Skip for 50" under Play: the confirmation sheet comes up over the road. */
  function askSkip(chapter: StoryChapterCard) {
    if (!open) return;
    const index = open.chapters.findIndex((item) => item.id === chapter.id);
    if (chapter.cleared || chapterIsLocked(open.chapters, index)) return;
    setChapterActive(index);
    setSkipping(chapter);
  }

  /** Short on gems: remember the wall, then open the shop over the sheet. */
  function topUpForSkip(chapter: StoryChapterCard | null = skipping) {
    if (open && chapter) writeSkipIntent({ episode: open.slug, chapter: chapter.id });
    shop.open();
  }

  /**
   * "Skip for 50" on the game over screen: the confirmation sheet comes up over
   * the lost run. Short on gems, the shop opens straight away with the sheet
   * waiting underneath — the pack lands, then the skip is one more tap.
   */
  function skipFromLose() {
    if (!open || !playing) return;
    const index = open.chapters.findIndex((item) => item.id === playing.id);
    const chapter = open.chapters[index];
    if (!chapter || chapter.cleared) return;
    setSkipping(chapter);
    if (gems < SKIP_CHAPTER_GEMS) topUpForSkip(chapter);
  }

  /** The server took the gems and recorded the clear: the road moves on, the clear screen plays. */
  function onSkipped(result: ChapterSkipResult) {
    const chapter = skipping;
    if (!open || !chapter) return;
    const index = open.chapters.findIndex((item) => item.id === chapter.id);
    markCleared(chapter.id, 1);
    // Bought from the game over screen: the run is over for good.
    setPlaying(null);
    setPaused(false);
    setCleared(null);
    setLost(null);
    setSkipping(null);
    setSkipped({ chapter, index, result });
  }

  /** Off the skip's clear screen: the dock stands on the next wall. */
  function closeSkipped() {
    if (skipped && open) {
      const next = skipped.index < open.chapters.length - 1 ? skipped.index + 1 : skipped.index;
      setChapterActive(next);
      setTrailSnap((n) => n + 1);
    }
    setSkipped(null);
  }

  const skipCost = useMemo<ClearCost | undefined>(
    () =>
      skipped
        ? {
            gems: skipped.result.cost,
            from: skipped.result.before.gems,
            to: skipped.result.balances.gems,
            onCount: () => publishBalances?.(skipped.result.balances),
          }
        : undefined,
    [publishBalances, skipped],
  );
  const skippedNext = skipped && open ? (open.chapters[skipped.index + 1] ?? null) : null;

  const playingIndex = open && playing ? open.chapters.findIndex((chapter) => chapter.id === playing.id) : -1;
  const nextChapter = playingIndex >= 0 ? (open?.chapters[playingIndex + 1] ?? null) : null;
  /** Read from the shelf, not `playing`: a clear earlier in this session already patched it. */
  const playingCleared = playingIndex >= 0 ? Boolean(open?.chapters[playingIndex]?.cleared) : true;
  const episodeDone = Boolean(open && open.chapters.every((chapter) => chapter.cleared));
  const openProgress = open ? episodeProgress(open) : null;
  const openIndex = open ? shelf.findIndex((item) => item.id === open.id) : -1;
  const openHue = open ? hueForEpisode(open.slug, Math.max(0, openIndex)) : "blue";

  return (
    <div className="story-page story-page-journey" data-covered={covered ? "true" : undefined}>
      <StoryJourney
        ref={journeyRef}
        nodes={nodes}
        cards={cards}
        start={start}
        paused={covered || sheeted}
        keyboard={!open && !playing && !sheeted}
        onOpen={openNode}
      />

      {portal && open
        ? createPortal(
            <>
              <div
                ref={sheetRef}
                className="story-sheet"
                data-iris={origin ? "true" : undefined}
                data-grown={grown}
                data-closing={closing ? "true" : undefined}
                style={irisStyle(origin, grown)}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
              >
                <div
                  className="story-sheet-sky pointer-events-none [&_*]:pointer-events-none"
                  data-resting={playing ? "true" : undefined}
                  style={{ "--sky-hue": HUE_VAR[openHue] } as CSSProperties}
                  inert
                >
                  {open.backgroundUrl ? (
                    <>
                      {/* The zone's sky as a halo: the photo blurred on the server, drifting; a
                          zoomed detail of the photo over it, faint; the zone's neon breathing on
                          top. The place is felt more than shown. */}
                      <div
                        className="story-sheet-halo"
                        style={{ backgroundImage: `url("${ambientPhoto(open.backgroundUrl).replace(/"/g, "")}")` }}
                      />
                      <div
                        className="story-sheet-photo"
                        style={{ backgroundImage: `url("${screenPhoto(open.backgroundUrl).replace(/"/g, "")}")` }}
                      />
                      <div className="story-sheet-bloom" />
                    </>
                  ) : (
                    <div className="story-sheet-body">
                      <BreakoutFill episode={open} />
                    </div>
                  )}
                  <div className="story-sheet-scrim" aria-hidden="true" />
                </div>
                <div className="story-sheet-body">
                  <div className="story-sheet-bar">
                    <div className="min-w-0">
                      <p className="font-mono text-xs tracking-[0.16em] text-[#a7b4ff]">
                        Episode {String(openIndex + 1).padStart(2, "0")}
                      </p>
                      <p id={titleId} className="truncate text-sm text-white/80">
                        {open.title}
                        {openProgress && openProgress.total > 0 ? (
                          <span className="text-white/55">
                            {" · "}
                            {openProgress.cleared} / {openProgress.total}
                          </span>
                        ) : null}
                      </p>
                    </div>
                    <button type="button" className="story-close" aria-label="Back to the route" onClick={closeSheet}>
                      <CloseGlyph />
                    </button>
                  </div>
                  <StoryTrail
                    chapters={open.chapters}
                    backgroundUrl={open.backgroundUrl}
                    hue={openHue}
                    selected={chapterActive}
                    onSelect={setChapterActive}
                    onPlay={startChapter}
                    onSkip={askSkip}
                    live={covered}
                    snap={trailSnap}
                    keyboard={!playing && !closing && !skipping && !skipped}
                  />
                </div>
              </div>
              {skipping && (!playing || lost) ? (
                <StorySkipSheet
                  key={skipping.id}
                  chapter={skipping}
                  index={Math.max(0, open.chapters.findIndex((item) => item.id === skipping.id))}
                  onSkipped={onSkipped}
                  onTopUp={() => topUpForSkip()}
                  onClose={() => setSkipping(null)}
                />
              ) : null}
              {skipped && !playing ? (
                <div className="story-skip-stage">
                  <StoryClear
                    key={skipped.chapter.id}
                    title={skipped.chapter.title}
                    score={0}
                    stars={1}
                    result={skipped.result.result}
                    hasNext={skippedNext !== null}
                    episodeDone={episodeDone}
                    kicker="Chapter skipped"
                    cost={skipCost}
                    note="One star for now. Replay the wall any time to earn the other two."
                    onNext={() => {
                      setSkipped(null);
                      if (skippedNext) startChapter(skippedNext);
                    }}
                    onClose={closeSkipped}
                  />
                </div>
              ) : null}
              {playing ? (
                <div className="story-play" role="dialog" aria-modal="true" aria-label={playing.title}>
                  <StoryPlay
                    chapterId={playing.id}
                    title={playing.title}
                    storedLevel={playing.level}
                    backgroundUrl={open.backgroundUrl}
                    seed={17 + runId}
                    paused={paused || intro}
                    chrome={
                      cleared || lost || intro ? null : (
                        <button
                          type="button"
                          className="story-pause"
                          aria-label="Pause"
                          onClick={() => setPaused(true)}
                        >
                          <CloseGlyph />
                        </button>
                      )
                    }
                    discovered={known}
                    onDiscovered={onDiscovered}
                    onCleared={({ score, paddleHits, livesLeft }) => {
                      const level = parseStoredLevel(playing.level, {
                        id: playing.id,
                        name: playing.title,
                        author: "Breeq",
                      });
                      const nextStars = starsForClear(level, { paddleHits, livesLeft });
                      setPaused(false);
                      setLost(null);
                      setCleared({ score, stars: nextStars, result: null });
                      markCleared(playing.id, nextStars);
                    }}
                    onAwarded={(result) => {
                      const best = result.bestStars ?? result.stars ?? 1;
                      setCleared((current) =>
                        current
                          ? { ...current, result, stars: result.stars ?? current.stars }
                          : { score: 0, stars: best, result },
                      );
                      markCleared(playing.id, best);
                    }}
                    onOver={({ score, reason }) => {
                      setPaused(false);
                      setCleared(null);
                      setLost({ score, reason });
                    }}
                  />
                  {intro && playing.intro && !cleared && !lost ? (
                    <button
                      type="button"
                      className="story-intro"
                      onClick={() => setIntro(false)}
                      aria-label={`Chapter ${playingIndex + 1}, ${playing.title}. ${playing.intro} Tap to begin.`}
                    >
                      <div className="story-intro-body">
                        <p className="story-clear-kicker">Chapter {String(playingIndex + 1).padStart(2, "0")}</p>
                        <h3 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">{playing.title}</h3>
                        <p className="story-intro-text">{playing.intro}</p>
                        <span className="story-intro-cue">Tap to begin</span>
                      </div>
                    </button>
                  ) : null}
                  {cleared ? (
                    <StoryClear
                      key={playing.id}
                      title={playing.title}
                      score={cleared.score}
                      stars={cleared.stars}
                      result={cleared.result}
                      hasNext={nextChapter !== null}
                      episodeDone={episodeDone}
                      onNext={() => {
                        if (nextChapter) startChapter(nextChapter);
                      }}
                      onClose={quitRun}
                    />
                  ) : null}
                  {lost ? (
                    <StoryLose
                      key={`${playing.id}-${runId}`}
                      title={playing.title}
                      score={lost.score}
                      reason={lost.reason}
                      onRetry={retryRun}
                      onSkip={playingCleared ? undefined : skipFromLose}
                      veiled={skipping !== null}
                      onClose={quitRun}
                    />
                  ) : null}
                  {paused && !cleared && !lost ? (
                    <div className="story-pause-menu">
                      <div className="glass w-full max-w-sm p-6 sm:p-8">
                        <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">Paused</p>
                        <h3 className="mt-3 text-3xl font-semibold tracking-tight text-ink">{playing.title}</h3>
                        <div className="mt-8 grid gap-3">
                          <button type="button" className="btn-play min-h-11 w-full" onClick={() => setPaused(false)}>
                            Resume
                          </button>
                          <SoundToggle variant="row" />
                          <HapticsToggle variant="row" />
                          <SwipeToggle variant="row" />
                          <button type="button" className="btn-glass min-h-11 w-full" onClick={quitRun}>
                            Quit
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </>,
            portal,
          )
        : null}
    </div>
  );
}

function BreakoutFill({ episode }: { episode: StoryEpisodeCard }) {
  const levels = useMemo(
    () =>
      episode.previewLevel
        ? [
            applyBackgroundPhoto(
              parseStoredLevel(episode.previewLevel, { id: episode.id, name: episode.title, author: "Breeq" }),
              episode.backgroundUrl ? boardPhoto(episode.backgroundUrl) : episode.backgroundUrl,
            ),
          ]
        : FALLBACK_LEVELS,
    [episode],
  );
  return (
    <BreakoutPreview
      levels={levels}
      seed={11}
      controls="auto"
      followQuery={false}
      fill
      showCaption={false}
      showHud={false}
    />
  );
}

function CloseGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        d="M6 6l12 12M18 6L6 18"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
