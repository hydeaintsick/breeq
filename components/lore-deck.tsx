"use client";

import { useId, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Chevron, coverStyle, place, useDeck } from "@/components/deck";
import { STORY_PATH } from "@/lib/auth/paths";
import { ambientPhoto } from "@/lib/photo";

export type LoreEpisode = {
  /** "01" … "08", as printed on the cover. */
  index: string;
  slug: string;
  title: string;
  /** The episode's lore, shown on the open page beside the deck. */
  body: string;
  /** The photo behind every wall of the episode; `null` paints a neon plate. */
  cover: string | null;
};

export function LoreDeck({ episodes }: { episodes: readonly LoreEpisode[] }) {
  const pageId = useId();
  const [active, setActive] = useState(0);
  const { coverRef, go, last, stageProps } = useDeck<HTMLButtonElement>({
    count: episodes.length,
    active,
    onChange: setActive,
  });

  const open = episodes[active];

  return (
    <>
      <div className="lore-halo" aria-hidden="true">
        {episodes.map((episode, index) => {
          const ambient = episode.cover ? ambientPhoto(episode.cover) : null;
          return (
            <div key={episode.slug} className="lore-halo-plate" data-on={index === active ? "true" : undefined}>
              {episode.cover && ambient ? (
                <Image
                  src={ambient}
                  alt=""
                  width={64}
                  height={114}
                  sizes="64px"
                  className="lore-halo-photo"
                  // Cloudinary already served a 64px, server-blurred thumbnail.
                  unoptimized={ambient !== episode.cover}
                />
              ) : (
                <div className="lore-halo-fallback" />
              )}
            </div>
          );
        })}
      </div>

      <div className="lore-grid">
        <div
          {...stageProps}
          className="lore-stage"
          role="group"
          aria-roledescription="carousel"
          aria-label="Episode covers"
        >
          {episodes.map((episode, index) => {
            const placement = place(index - active);
            const isOpen = index === active;
            const hidden = placement.opacity === 0;
            return (
              <button
                key={episode.slug}
                ref={coverRef(index)}
                type="button"
                className="lore-cover"
                data-open={isOpen ? "true" : undefined}
                style={coverStyle(placement)}
                aria-label={isOpen ? `Episode ${episode.index}, ${episode.title}. Turn the page.` : `Open episode ${episode.index}, ${episode.title}.`}
                aria-current={isOpen ? "true" : undefined}
                aria-hidden={hidden ? "true" : undefined}
                tabIndex={isOpen ? 0 : -1}
                onClick={() => go(isOpen ? index + 1 : index)}
              >
                {episode.cover ? (
                  <Image
                    src={episode.cover}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 18rem, (min-width: 640px) 18rem, 64vw"
                    className="object-cover"
                    draggable={false}
                  />
                ) : (
                  <div className="lore-cover-fallback" />
                )}
                <span className="lore-cover-copy">
                  <span className="font-mono text-xs tracking-[0.16em] text-accent">Episode {episode.index}</span>
                  <span className="mt-2 block text-2xl font-semibold tracking-tight text-white sm:text-[1.7rem]">
                    {episode.title}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="lore-page">
          <div className="lore-page-nav">
            <button
              type="button"
              className="lore-arrow"
              aria-label="Previous episode"
              disabled={active === 0}
              onClick={() => go(active - 1)}
            >
              <Chevron direction="left" />
            </button>
            <div className="story-dots" role="tablist" aria-label="Episode">
              {episodes.map((episode, index) => (
                <button
                  key={episode.slug}
                  type="button"
                  className="story-dot"
                  role="tab"
                  aria-selected={index === active}
                  aria-controls={pageId}
                  aria-label={`Episode ${episode.index}, ${episode.title}`}
                  onClick={() => go(index)}
                />
              ))}
            </div>
            <button
              type="button"
              className="lore-arrow"
              aria-label="Next episode"
              disabled={active === last}
              onClick={() => go(active + 1)}
            >
              <Chevron direction="right" />
            </button>
          </div>
          <div id={pageId} className="lore-page-text" role="tabpanel" aria-live="polite">
            <div key={open.slug} className="lore-page-leaf">
              <p className="font-mono text-xs tracking-[0.16em] text-accent">
                Episode {open.index} · {active + 1} of {episodes.length}
              </p>
              <h3 className="mt-3 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{open.title}</h3>
              <p className="mt-3 text-base leading-7 text-ink-muted">{open.body}</p>
            </div>
          </div>
          <div className="lore-page-foot">
            <Link href={STORY_PATH} className="btn-play min-h-11">
              Play the story
            </Link>
            <p className="text-sm leading-6 text-ink-muted">
              Eight episodes, seventy-four walls, one new idea at a time. Swipe the covers to leaf through.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
