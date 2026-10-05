import type { Metadata } from "next";
import { BreakoutPreview } from "@/components/breakout-preview";

/**
 * Gameplay clip for a Plypto bounty. Framed by their app, kept out of search.
 * Their card already has the title, the reward and the button, so this page
 * is only the live board, packed into the slot: bricks on top, paddle below.
 */

export const metadata: Metadata = {
  title: "Play",
  description: "Break the wall. A brick breaker built by players.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function PlyptoEmbedPage() {
  return (
    <div className="plypto-embed">
      <div className="plypto-stage">
          <BreakoutPreview controls="auto" followQuery={false} showCaption={false} showHud poster loop />
      </div>
    </div>
  );
}
