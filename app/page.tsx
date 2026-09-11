import Link from "next/link";
import { BreakoutPreview } from "@/components/breakout-preview";
import { LoreDeck, type LoreEpisode } from "@/components/lore-deck";
import { PieceKit } from "@/components/piece-kit";
import { CATALOG, LEVEL_BUDGET } from "@/game/breakout/engine/catalog";
import { GAME_MENU_PATH } from "@/lib/auth/paths";
import { EARN_UNLOCK_LEVEL } from "@/lib/progress";
import { getEpisodeCovers } from "@/lib/story";

const steps = [
  {
    index: "01",
    title: "Your wall",
    body: "Every level is built by a player. Lay glass, hard, and steel bricks over a photo of your choice — then explosives, ghosts, keys and locks if you want the wall to fight back.",
  },
  {
    index: "02",
    title: "Zones and obstacles",
    body: "Drop zones onto the field and the ball obeys them: slow, ×2, ×3, gravity, portals, a mirror. Add bumpers, a fan, a sweeping guard. Where you put them is the whole design.",
  },
  {
    index: "03",
    title: "Lives, heat, rules",
    body: "One to five lives. The ball gets faster with rapid rebounds — the classic rule. Add a timer, make the wall descend, or force one color to fall first.",
  },
  {
    index: "04",
    title: "For players, by players",
    body: "Clear your own level before you publish it. Then it goes on the shelf for everyone, with your name and your photo behind the glass.",
  },
] as const;

const PIECE_COUNT = CATALOG.filter((entry) => entry.family !== "rule").length;

/**
 * The lore, one card per episode. `cover` is the same-origin photo the seed
 * ships; the database's photo (the one the admin picked) wins when it is
 * reachable. Gecko Legacy is hand-made in the editor and has no local file.
 */
const episodes = [
  {
    index: "01",
    slug: "gecko-legacy",
    title: "Gecko Legacy",
    body: "A light behind a window. A shell cracking on a cold grey moon. Kal is born far from anywhere, and the first walls teach him to move.",
    cover: null,
  },
  {
    index: "02",
    slug: "cold-orbit",
    title: "Cold Orbit",
    body: "The pod he hatched from was built for one egg — and it holds a star chart with one star circled. Kal lifts off through asteroids, a dead relay, and a wormhole.",
    cover: "/backgrounds/cold-orbit.jpg",
  },
  {
    index: "03",
    slug: "glass-sky",
    title: "Glass Sky",
    body: "The way home: a comet's tail, the rings of a giant, the Maw, the Sentinels' gate, twin suns — and one last wall, the glass sky of Vitra.",
    cover: "/backgrounds/glass-sky.jpg",
  },
  {
    index: "04",
    slug: "empty-nest",
    title: "Empty Nest",
    body: "Under the glass, nobody is home. The Keepers — drones left to mind a dark city — show Kal the day the suns flickered and his people left.",
    cover: "/backgrounds/empty-nest.jpg",
  },
  {
    index: "05",
    slug: "lumen-reef",
    title: "Lumen Reef",
    body: "A shallow ocean lit from below, and a reef that is a people. The Corallines sing of two fleets — then the Gnaw come at dusk, and Kal fights.",
    cover: "/backgrounds/lumen-reef.jpg",
  },
  {
    index: "06",
    slug: "ashen-court",
    title: "Ashen Court",
    body: "A burned-out star, a court of Cindermoths who hoard the light, a queen called the Candle. The way on costs a cage, wardens, and a duel.",
    cover: "/backgrounds/ashen-court.jpg",
  },
  {
    index: "07",
    slug: "the-hush",
    title: "The Hush",
    body: "A sky full of wrecks. The Ember Fleet — Kal's own kind — has held the line for years against a dark that eats light. Kal takes his place on the wall.",
    cover: "/backgrounds/the-hush.jpg",
  },
  {
    index: "08",
    slug: "second-sun",
    title: "Second Sun",
    body: "Aurel: one young sun, an unclaimed world. A glass sky built pane by pane, one last shadow, and the truth about twelve pods. Home is where they are.",
    cover: "/backgrounds/second-sun.jpg",
  },
] as const satisfies readonly LoreEpisode[];

const earnSteps = [
  { title: "Build", body: "Your wall, your photo, your rules — from the same kit as the Story." },
  { title: "Publish", body: "Clear it yourself, pass the autopilot proof, put it on the shelf." },
  { title: "Compete", body: "Challenge other players on it. Winners take real money." },
] as const;

export default async function Home() {
  const covers = await getEpisodeCovers();
  const lore: LoreEpisode[] = episodes.map((episode) => ({
    ...episode,
    cover: covers[episode.slug] ?? episode.cover,
  }));

  return (
    <>
      <section className="relative mx-auto flex min-h-[100svh] w-full max-w-6xl flex-col justify-center gap-16 overflow-x-clip px-6 pb-20 pt-28 lg:flex-row lg:items-center lg:gap-20">
        <div className="max-w-xl">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">
            Breeq · Brick breaker
          </p>
          <h1 className="mt-5 text-5xl font-semibold tracking-tight text-ink sm:text-6xl">
            Build the wall.
            <br />
            <span className="text-neon">Break</span> the wall.
          </h1>
          <p className="mt-6 text-lg leading-8 text-ink-muted">
            A brick breaker made by players, for players. Design a level over
            your own photo from a kit of {PIECE_COUNT} pieces — bricks that
            explode or come back, zones that bend the ball, portals, bumpers, a
            black hole — and dare everyone else to clear it.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Link href={GAME_MENU_PATH} className="btn-play play-shimmer">
              Play
            </Link>
            <a href="#how-it-works" className="nav-link">
              How it works
            </a>
          </div>
        </div>

        <BreakoutPreview />
      </section>

      <section
        id="how-it-works"
        className="mx-auto w-full max-w-6xl px-6 pb-28"
      >
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">
          How it works
        </p>
        <h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          You are not playing our levels. You are playing each other&apos;s.
        </h2>

        <ol className="mt-14 grid gap-5 md:grid-cols-2">
          {steps.map((step) => (
            <li key={step.index} className="glass p-7">
              <p className="font-mono text-xs tracking-[0.16em] text-accent">
                {step.index}
              </p>
              <h3 className="mt-3 text-2xl font-semibold tracking-tight text-ink">
                {step.title}
              </h3>
              <p className="mt-3 text-base leading-7 text-ink-muted">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section id="story" className="lore-section">
        <div className="mx-auto w-full max-w-6xl px-6 pb-28">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">
            Story
          </p>
          <h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Follow <span className="text-neon">Kal</span> home.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-ink-muted">
            Kal is a small galactic gecko who wakes up on a world that is not his
            own. He does not know where he came from — only a warmth he remembers
            from inside the egg, and a pull toward the light. Every wall in the
            Story is a step on his way back to his origins: the shell he hatched
            from, the pod that carried it, a chart with one star circled, the
            planet with a glass sky — and what he finds when nobody is home.
            Beyond it, a migration&apos;s route through worlds of light and worlds
            of ash, the peoples who live there, and a war against the dark that
            made his people leave.
          </p>
          <LoreDeck episodes={lore} />
        </div>
      </section>

      <section id="earn" className="mx-auto w-full max-w-6xl px-6 pb-28">
        <div className="glass p-7 sm:p-10">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">
              Earn
            </p>
            <span className="coming-soon">Coming soon</span>
          </div>
          <h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Your maps. Their paddles. <span className="text-neon">Real</span> money.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-ink-muted">
            Earn is where the Story ends and the players take over. Build your
            own maps with the full kit, publish them, and face other players on
            them for real stakes. It unlocks at level {EARN_UNLOCK_LEVEL} —
            about halfway through Cold Orbit.
          </p>
          <ol className="mt-8 grid gap-5 sm:grid-cols-3">
            {earnSteps.map((step, index) => (
              <li key={step.title}>
                <p className="font-mono text-xs tracking-[0.16em] text-accent">
                  0{index + 1}
                </p>
                <h3 className="mt-2 text-lg font-semibold tracking-tight text-ink">
                  {step.title}
                </h3>
                <p className="mt-1 text-sm leading-6 text-ink-muted">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="kit" className="mx-auto w-full max-w-6xl px-6 pb-28">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">
          The kit
        </p>
        <h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          {PIECE_COUNT} pieces. You <span className="text-neon">choose</span>.
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-7 text-ink-muted">
          Every piece costs points and a level has {LEVEL_BUDGET} to spend. The
          editor refuses a wall that cannot be cleared: portals must be paired,
          keys cannot be sealed in, nothing sits in the paddle lane, and the
          autopilot has to beat it once before you can publish.
        </p>
        <PieceKit />
      </section>
    </>
  );
}
