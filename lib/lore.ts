/**
 * The lore of Kal, the wall-walker — the one text every story surface reads.
 *
 * `LORE_EPISODES` is the short form: one card per episode for the home page
 * deck. `LORE_BOOK` is the long form: the book the player opens from the story
 * chrome, a prologue that is always readable and one chapter per episode that
 * unseals when the zone is reached on the route. Everything here follows the
 * lore in README.md; new chapters must fit it.
 */

export type LoreEpisode = {
  /** "01" … "08", as printed on the cover. */
  index: string;
  slug: string;
  title: string;
  /** The episode's lore in two sentences, shown on the open deck page. */
  body: string;
  /** The same-origin photo the seed ships; `null` paints a neon plate. */
  cover: string | null;
};

export type LoreChapter = {
  /** Episode slug the chapter unseals with, or `null` for the prologue. */
  slug: string | null;
  /** "—" for the prologue, "01" … "08" for the episodes. */
  numeral: string;
  title: string;
  /** One line under the title. */
  epigraph: string;
  /** Paragraphs. */
  pages: readonly string[];
};

export const LORE_EPISODES = [
  {
    index: "01",
    slug: "gecko-legacy",
    title: "Gecko Legacy",
    body: "A light behind a window. A shell cracking on a cold grey moon. Kal is born far from anywhere, and the first walls teach him to move.",
    cover: "/backgrounds/gecko-legacy.jpg",
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
  {
    index: "09",
    slug: "green-static",
    title: "Green Static",
    body: "A signal in Kal's own heartbeat, a quiet green ship, and a document with his shell marks on it: a loan, due. The road turns into a jungle under glass.",
    cover: "/backgrounds/green-static.jpg",
  },
  {
    index: "10",
    slug: "the-vivarium",
    title: "The Vivarium",
    body: "Under the jungle, a laboratory in cold light. An old keeper tells Kal what the twelfth pod was — and what the Curator is growing in the vats.",
    cover: "/backgrounds/the-vivarium.jpg",
  },
  {
    index: "11",
    slug: "glasshouse",
    title: "Glasshouse",
    body: "The Curator's tower, a polite offer, and a copy that wakes up hollow. The Hush, which could never see Kal, looks out of his own face.",
    cover: "/backgrounds/glasshouse.jpg",
  },
  {
    index: "12",
    slug: "rootway",
    title: "Rootway",
    body: "Living tunnels between the stars, something hollow behind, and — in the fifth tunnel — Lys. The other egg. From here there are two on the wall.",
    cover: "/backgrounds/rootway.jpg",
  },
  {
    index: "13",
    slug: "wall-walker",
    title: "The Wall-walker",
    body: "A gecko drawn in stars across the whole sky. Kal and Lys walk it together, with the hollow fleet behind them learning the shape.",
    cover: "/backgrounds/wall-walker.jpg",
  },
  {
    index: "14",
    slug: "meridian",
    title: "Meridian",
    body: "The garden world where the loan was written, the Council that wrote it, and the wall where it is torn up. Nul is not in the wreckage.",
    cover: "/backgrounds/meridian.jpg",
  },
  {
    index: "15",
    slug: "seed-ship",
    title: "Seed-ship",
    body: "The Council confesses: the Hush is theirs, a Gleaner grown to gather light that never stopped. Kal and Lys take a seed-ship and the long road back.",
    cover: "/backgrounds/seed-ship.jpg",
  },
  {
    index: "16",
    slug: "the-tally",
    title: "The Tally",
    body: "Vireo through a broken roof, Marrow's ledger, and the creatures Kal let out of the cages. A fleet with nothing in common but a cage.",
    cover: "/backgrounds/the-tally.jpg",
  },
  {
    index: "17",
    slug: "grey-moon",
    title: "Grey Moon",
    body: "Back where it started. Nul is there first, with one question — which of us is the copy? — and he leaves with the pod's beacon.",
    cover: "/backgrounds/grey-moon.jpg",
  },
  {
    index: "18",
    slug: "keepers",
    title: "Keepers",
    body: "Vitra with the lights on, the Archive's last file, and every Lantern in the yard woken and lit with a light the Hush cannot see.",
    cover: "/backgrounds/keepers.jpg",
  },
  {
    index: "19",
    slug: "reef-fleet",
    title: "Reef Fleet",
    body: "The pearl returned, the mark grown into the Corallines' light, the Gnaw at dusk — and a reef that lifts off its sea for the first time.",
    cover: "/backgrounds/reef-fleet.jpg",
  },
  {
    index: "20",
    slug: "candles-debt",
    title: "The Candle's Debt",
    body: "A queen who keeps accounts, a map of the dark's edge — the Hush is a swarm with one heart — and a court of moths that comes to pay.",
    cover: "/backgrounds/candles-debt.jpg",
  },
  {
    index: "21",
    slug: "nul",
    title: "Nul",
    body: "The hollow fleet in the wrecks, and a copy who learned the shape by watching. Nul shuts the eye of the Hush and lets them pass.",
    cover: "/backgrounds/nul.jpg",
  },
  {
    index: "22",
    slug: "siege-of-aurel",
    title: "Siege of Aurel",
    body: "Everyone on the wall. The dark arrives whole and passes over the marked light as if it were not there. It can see the geckos.",
    cover: "/backgrounds/siege-of-aurel.jpg",
  },
  {
    index: "23",
    slug: "into-the-hush",
    title: "Into the Hush",
    body: "The one thing it cannot see walks in, and finds a granary where it expected a monster. Kal lets it see him: a seed, for planting.",
    cover: "/backgrounds/into-the-hush.jpg",
  },
  {
    index: "24",
    slug: "name-for-the-moon",
    title: "A Name for the Moon",
    body: "The Gleaner follows the seed home. Two suns come back to Vitra, a tool goes to sleep in the dust, and a nameless moon gets a name.",
    cover: "/backgrounds/name-for-the-moon.jpg",
  },
] as const satisfies readonly LoreEpisode[];

export const LORE_BOOK: readonly LoreChapter[] = [
  {
    slug: null,
    numeral: "—",
    title: "Wall-walkers",
    epigraph: "Before Kal. Before the road.",
    pages: [
      "Kal's people are wall-walkers. On Vitra, their home, the sky is a dome of tinted glass warmed by twin suns, and geckos live on it the way ours live on windows — clinging, climbing, chasing the light that comes through. Every wall in this story is glass for that reason. Breaking through one is what a Vitran gecko does.",
      "Kal never saw Vitra. His egg left it inside a pod built to carry a single egg across the dark — why, and from what, the pod does not say. It fell on a cold, nameless Grey Moon under a ringed blue giant. Kal hatched there alone, with three things he could not explain: a warmth he remembered from inside the egg, a rhythm like a heartbeat he had never heard outside it, and a pull toward any light behind any window.",
      "This book is his road, zone by zone. Each chapter unseals when Kal reaches it.",
    ],
  },
  {
    slug: "gecko-legacy",
    numeral: "01",
    title: "Gecko Legacy",
    epigraph: "A light behind a window.",
    pages: [
      "The first thing Kal knew was a light behind a window. Not the light itself — the window, and the way the light bent through it, and the way something in him leaned toward it before he had legs to lean with. Then the shell gave, and the cold came in, and the grey dust of a moon nobody had named took his first prints.",
      "He learned the way every gecko learns: by moving. A pane of glass between him and the light; a claw; a crack. Then a harder pane. Then one that did not break at all, and the lesson that some walls are meant to be climbed rather than broken. Bugs came to the light with him — small, bright, stupid things — and he ate his first party of them in the dark under the giant's rings.",
      "He did not know the word for what he was. He knew he was small, he was warm, and there was a window somewhere that was his. He started walking.",
    ],
  },
  {
    slug: "cold-orbit",
    numeral: "02",
    title: "Cold Orbit",
    epigraph: "Kal leaves the Grey Moon and learns to read the sky.",
    pages: [
      "The Grey Moon gave him one sunrise, and it was enough. In the light he found the pieces of his own shell lying in the regolith, and they were not from here: the marks on them matched nothing on the moon and everything on the half-buried capsule a little further on. A pod the size of a house, built for one egg. Etched on its inner shell, a chart of stars. One of them was circled.",
      "The pod still had a spark left. Kal pointed it at the circled star and lifted off through rocks the size of hills, past a dead relay whose dish still pointed somewhere, and into the door its last message described — a ring with an eye in it. On the far side, a ship torn in two carried the same marks as his shell.",
      "Its beacon still pulsed, in a rhythm Kal had known since before he hatched. He followed it.",
    ],
  },
  {
    slug: "glass-sky",
    numeral: "03",
    title: "Glass Sky",
    epigraph: "The way home.",
    pages: [
      "A ringed giant blocked the road, and Kal slung around it. A comet was going the same way, and he rode its tail through the ice and rock spinning in the rings. Between the systems something dark waited — the Maw, which had swallowed ships before and did not care for the difference between a ship and a pod.",
      "Then ships of light barred the way. The Lanterns: his own kind built them to keep strangers out, and they did not know him. Their gate opened only for keys. Beyond it, twin suns — he remembered them from inside the egg — and three moons circling a planet with a glass sky. Home. Vitra's sky does not let anyone through easily, not even its children, and the storm proved it.",
      "One last wall. On the other side, everyone Kal had never met.",
    ],
  },
  {
    slug: "empty-nest",
    numeral: "04",
    title: "Empty Nest",
    epigraph: "Under the glass sky, nobody is home.",
    pages: [
      "The wall gave, and Kal dropped through the glass sky into a city with no lights on. Every window was dark. He had never been anywhere his own kind had lived, and now he had, and it was empty. Only the Keepers moved — small drones left behind to mind the city — and they had never seen a gecko.",
      "In the hatchery every shell was empty but one, and that one fit the fragments he carried. The Archive opened for a Vitran claw and told him the rest: the twin suns had flickered. Something had fed on the light between them. His people named it the Hush, and Vitra emptied in the Long Migration. Twelve pods carried the last eggs after the fleet. Eleven arrived. The twelfth fell short, on a Grey Moon.",
      "The Archive also kept the migration's route: five worlds where the fleet meant to stop. Kal climbed the hull of a dark Lantern on its cradle and woke it wall by wall. When it rose through the sky it once guarded, the Keepers turned the lights back on.",
    ],
  },
  {
    slug: "lumen-reef",
    numeral: "05",
    title: "Lumen Reef",
    epigraph: "A sea of living light, and Kal's first fight.",
    pages: [
      "The first world on the route was a world of light: a shallow ocean lit from below, and a reef that was a people. The Corallines glow to speak and trade in light. Kal had none to trade but his own, so he offered the only other thing he had — a story — and the bells of glass drifting up the current carried news of a gecko to the elders.",
      "They remembered two fleets passing, they sang: a dark one, and after it a hurried fleet of geckos who left a light on the tallest coral and their claw marks in the glass. They kept a pearl the geckos had left in thanks. Something had been chewing the light out of the reef since — the Gnaw, the Hush's scouts, which come at dusk.",
      "Kal stood on the reef wall with the Corallines when the tide of teeth came. His first fight. He followed the Gnaw down past where the reef's light reaches, and came back up with the pearl: a map-stone that showed the next world. It was dark.",
    ],
  },
  {
    slug: "ashen-court",
    numeral: "06",
    title: "Ashen Court",
    epigraph: "A dead star, a court of moths, a price for the way on.",
    pages: [
      "Ash the size of continents. Kal landed in the dark at the foot of a burned-out star, where the Cindermoths hoard what light is left under their queen, the Candle. They had seen his glow before he saw them. Their queen asked what he wanted. The way to his people, he said.",
      "The geckos had paid for passage in light. Kal's glow was not for sale, and the Candle's answer was a cage. But Kal had been inside a shell before, and shells break. Wardens with wings of ash beat him back until he learned to hit what will not stay still; an ash storm hid the wall until he learned to listen for it. Then one wall stood between him and the Candle.",
      "It fell. Her hoard spilled back into the ash and light poured through the Court — which knelt, not to Kal, but to the light. The Candle kept her word. The route, she said: a battlefield, then a dawn. Your people are still fighting.",
    ],
  },
  {
    slug: "the-hush",
    numeral: "07",
    title: "The Hush",
    epigraph: "The dark that hunts light, and a gecko who has come a long way.",
    pages: [
      "A sky full of wrecks, and somewhere in them a fleet of geckos who had held the line for years: the Ember Fleet, amber ships, his own kind. They had not seen a Lantern in a lifetime and almost fired. An old gecko with a scarred tail, Sable, read the marks on his shell and went very still. She knew the ship that launched his pod.",
      "The Hush comes in waves. Kal took his place on the wall. The dark poured through a breach and he was the smallest thing in it; torchbearers lit the sky so the rest could aim, their fuel running out. Then the eye — a thing with no light in it at all. The Hush looked at Kal. Kal looked back.",
      "He knew walls, so he went first. He turned his Lantern into a light the Hush could not swallow, and when dawn came over the wrecks the Ember Fleet counted what it had left, and what it had gained: one small gecko.",
    ],
  },
  {
    slug: "second-sun",
    numeral: "08",
    title: "Second Sun",
    epigraph: "A young world, one sun, and a glass sky that has to be built.",
    pages: [
      "Aurel: one sun, young, unclaimed. The fleet had chosen it before Kal was born. For the first time he walked among more geckos than he could count, and he — who had broken through a glass sky — learned to set a pane in a steel frame. Under Aurel's sun the Corallines' light-seeds took root.",
      "One shadow of the Hush had followed the fleet, and it went for the seedlings first. Every gecko who could climb was on the half-built dome; Kal was fastest. The fleet's last wall was the unfinished sky, and it held. Afterward Sable told him the tale of twelve pods: twelve eggs, eleven arrived. The twelfth was Kal.",
      "Under Aurel's one sun the geckos lit a second — the dome, glowing from inside. Kal was never from Vitra. He is from the pod, the Grey Moon, and the road. Home is where they are. He is home.",
    ],
  },
  {
    slug: "green-static",
    numeral: "09",
    title: "Green Static",
    epigraph: "A signal in his own heartbeat.",
    pages: [
      "The dome over Aurel was three panes from closed when the signal came through it. Not the Hush — the Hush makes no sound. This was a rhythm, a double beat and a rest, and every gecko on the dome turned to look at Kal, because it was his. The pod's rhythm. The one he had known from inside the egg. Someone out there knew the code, and was playing it back.",
      "The ship came down without a sound, the color of a leaf. Its envoy was courteous. It carried a document with the marks from Kal's shell on it, and under the marks, in a script older than Vitra's: Specimen K-L. On loan. Due. Sable read it and went still the way she had gone still once before, on the wall; the cradle had already been aboard when the Migration began, she said, and nobody had asked what it was.",
      "Kal went. Not because the loan said so — because the envoy had the one thing he had wanted since the Grey Moon, which was the why. The ship took him to Vireo: a green world under a roof of glass, leaves the size of sails, a wind that never stopped, and fireflies that pulsed in his rhythm. Under the roof, a corridor of cages, each with something bright inside from a different sky. The Tally, the envoy called it. The last cage was empty, and the right size, and the door closed behind him.",
    ],
  },
  {
    slug: "the-vivarium",
    numeral: "10",
    title: "The Vivarium",
    epigraph: "Under the jungle, a laboratory — and the truth about the twelfth pod.",
    pages: [
      "Under the jungle, a floor that hummed. Cold light in even rows, tanks of glass with things in them that were only half there. An old gecko with a grey tail opened the cage — not to free him. Marrow had kept this place for the Sowers of Meridian before the Curator kept it for himself, and he had waited a long time to tell someone.",
      "The Sowers grow living things between the stars and lend them out. Vireo was their vivarium. A generation ago, when Vitra's suns first flickered, they lent the Vitrans one egg, grown here with one gift: the Hush could not see it. The Vitrans wanted to know why the dark passed over some light and fed on the rest; the Sowers wanted to know if the gift held in the field. Kal was the experiment. The twelfth pod was the Sowers' return cradle, launched in the panic of the Migration and lost — the reason it fell short is that it was never aimed at Aurel at all.",
      "The Curator, Vireo's keeper who never left when the Sowers did, had read the Ember Fleet's news: a gecko the dark could not swallow. He was growing copies in the vats, and whatever made Kal invisible to the Hush, the copies did not have it. Kal cut the power the only way he knew, wall by wall, and opened every cage. The Tally poured out into the jungle. And Marrow said the last thing: the Curator was not the only one who had been feeding here.",
    ],
  },
  {
    slug: "glasshouse",
    numeral: "11",
    title: "Glasshouse",
    epigraph: "A polite offer, and a copy that wakes up hollow.",
    pages: [
      "The Curator's tower rose out of the canopy: a spire of amber glass where Vireo's keeper had waited a generation for his experiment to come home. He was tall and thin and he never raised his voice. He offered Kal the one thing the loan had never promised — a place — in exchange for standing still. Kal had never stood still in his life.",
      "The vats opened early. Most of the copies did not wake. One did. It had Kal's face and none of his light, and the Hush, which could never see Kal, looked out of its eyes. Nul, the Curator called it, and for the first time he sounded afraid. Then he finally raised his voice, and the glasshouse answered: every pane at once.",
      "In the wreck of the study Kal found the Sowers' seed-map — the way to Meridian, where the loan had been written and could be unwritten. He fell through floor after floor and knew how to land; he had fallen through a whole sky once. The green ship still had a spark. Behind him the tower came down, and something hollow climbed out of it.",
    ],
  },
  {
    slug: "rootway",
    numeral: "12",
    title: "Rootway",
    epigraph: "Living tunnels between the stars, and someone ahead.",
    pages: [
      "The Sowers do not fly between stars. They grow there. The seed-map led into a root the width of a moon, and light ran through its walls in pulses Kal counted without meaning to — not his rhythm, but close. Behind him, engines that made no sound and a shape with his face: Nul had learned the road by watching him walk it.",
      "In the fifth tunnel, another gecko, on the ceiling, waiting. The other egg. Two had been grown in Vireo a generation ago; the Sowers had lent one and kept one — the control — and raised her on Meridian as a scout who walked on light the way Kal walked on glass. Lys. She had been sent to bring the loan home. She looked at him a long time. Then she climbed onto the wall beside him and did not bring him anywhere, and for the first time since the Grey Moon, Kal was not the only one on it.",
      "Nul's wardens came through the roots with the Curator's patience and none of his manners; the Hush was in the roots too, eating the sap light. Where the tunnel went dark, Lys drew a road across the dark and he followed it. It opened on stars. She pointed: the old Vitran sky-story, a gecko drawn in stars, its tail pointing the way. They went together.",
    ],
  },
  {
    slug: "wall-walker",
    numeral: "13",
    title: "The Wall-walker",
    epigraph: "A gecko drawn in stars across the whole sky.",
    pages: [
      "Every Vitran hatchling was shown it once: the Wall-walker, a gecko drawn in stars across the whole night, whose tail points the way the first geckos came, before Vitra, before the glass. Nobody had shown Kal. Lys showed him now, starting with the head — the stars first, then the lines, the way the story is told on Meridian. Four feet on the sky. Two geckos climbing. Kal had never had this much room.",
      "Nul was not following the road. He was following them, and through his eye, for the first time, the Hush saw where the road went. The hollow fleet came through the constellation behind them with Kal's face on every hull. Behind that, the sky itself went dark in the shape of a gecko: the Hush had learned the story too, and was telling it back.",
      "The last star of the tail had a circle drawn around it. Kal knew the circle. It had been etched inside the pod, on the Grey Moon, before he had a word for anything. Where the tail pointed, a green world came up over the dark. Meridian.",
    ],
  },
  {
    slug: "meridian",
    numeral: "14",
    title: "Meridian",
    epigraph: "Where the loan was written, and the wall where it is torn up.",
    pages: [
      "Seed-pods the size of moons drifted in a warm sky, and under them sat the Council of Seeds, who had written the loan a generation ago and had never had one refused. They weighed him: a seed the Hush could not see, worth a fleet. Kal had been weighed before, by a queen, and he knew what to do with a scale. Not a specimen, he said. Not a seed. Not lent, not due. He was from the pod, the Grey Moon and the road, and the road had brought him here with someone. The seal broke the way glass breaks.",
      "The Council had raised Lys. It asked her to bring him in. She climbed onto the wall beside him and did not look back. Then the sky filled with amber hulls coming down through the pods, and behind them ships with no light in them at all, and the Curator's voice, still polite, asking for what was his. He had grown the copies to sell the dark an answer. The dark does not buy. It took him first, through the hollow he had made.",
      "Two geckos held the last wall over the garden, and the loan lay in pieces under it. When the light came back, half the Wall-walker was dark above Meridian, and Nul was not in the wreckage. Somewhere above them, something with Kal's face turned toward Aurel.",
    ],
  },
  {
    slug: "seed-ship",
    numeral: "15",
    title: "Seed-ship",
    epigraph: "The Council's confession, and the long road back.",
    pages: [
      "The morning after, the Council of Seeds said what it had kept for an age. The Hush was theirs. Long ago the Sowers had grown a Gleaner — a hunger built to sweep stray light out of the dark between stars and carry it to their gardens — and it had got out, and it had never stopped being hungry. The mark grown into every seed says not for gleaning. That mark is Kal's gift. It is why the dark has never seen him: to the Gleaner he is not food. He is cargo.",
      "Lys took a seed-ship from the Council that raised her, and nobody stopped her; nobody on Meridian had ever refused anything either. Nul was a day ahead on the straight road to Aurel, with the Hush behind his eyes and the whole route in his head. So the two of them took the long road: back the way Kal had come, to every people who owed them light, and Lys drew the route in reverse on the cabin glass. Vireo. The Grey Moon. Vitra. The reef. The ash. The wrecks. Then Aurel.",
      "Where the hollow fleet had passed, the roots of the Rootway were dark inside. The Gleaner eats what it passes. It always has. A green world came up under a broken roof, and Kal, who had left it burning, saw that something had been living in the ashes.",
    ],
  },
  {
    slug: "the-tally",
    numeral: "16",
    title: "The Tally",
    epigraph: "A jungle through a broken roof, and an old keeper's ledger.",
    pages: [
      "Vireo's roof was open to the sky and the jungle had climbed through it. The creatures Kal had let out of the cages lived free in it now — the Tally, from a dozen skies, in a jungle none of them came from — and Marrow kept a ledger of them the way he had kept the Curator's, except this one had no column for due. A fish that hummed in the dark and swam in air. Something with rotor teeth that ate glass. Fireflies that still lit up in Kal's rhythm, because they had been grown to.",
      "The amber tower lay where it fell; nobody had moved a pane of it. One vat had never opened, and what had grown in it was not a gecko. It was the thing Marrow had meant when he said the Curator was not the only one feeding here, and it took five lives and a long time to put it down. Then Marrow said the useful thing: the mark could be grown into more than a gecko. Into light, if someone knew how to grow light. The Corallines did.",
      "The Tally followed the seed-ship up through the broken roof — a fleet with nothing in common but a cage they had been let out of, and a gecko who had opened it.",
    ],
  },
  {
    slug: "grey-moon",
    numeral: "17",
    title: "Grey Moon",
    epigraph: "The place it started, and a question with no good answer.",
    pages: [
      "Nothing had changed. The dust, the ring, the ringed giant filling half the sky, and a trail of small prints wandering away from the pod, made the morning he hatched. Lys put a claw on the hull and read the marks the way he never could. The lamp still pulsed in his rhythm. It had never been a call for help. It had been a return address. Kal knew now why the blue giant had made him sad: it was the first thing that ever looked like home and was not.",
      "Someone was standing on the pod. He had Kal's face and none of his light, and he had not come to fight. He had come to see where he should have hatched. A second trail crossed the first in the dust, made by feet that were never here; Nul had walked Kal's road backward to find him. He asked his question quietly, the way the Curator would have: which of us is the copy? Kal did not have an answer. He had a wall.",
      "The eye opened over the moon — through Nul, the Hush was looking at the one place in the sky it had never been able to see — and Nul took the lamp. The rhythm Kal had known since before he hatched went with him, into the dark, toward Aurel. The Grey Moon gave him a second sunrise. He left it a second time, and it was harder than the first, because this time he knew what he was leaving.",
    ],
  },
  {
    slug: "keepers",
    numeral: "18",
    title: "Keepers",
    epigraph: "Vitra with the lights on, and a fleet built to keep strangers out.",
    pages: [
      "Every window on Vitra was lit. The Keepers had kept them that way since the Lantern rose, for nobody, because Kal asked. They remembered him; they had never seen two geckos at once, and they circled Lys for a long time before they decided she counted. The Archive had one file left it had never shown him: the contract for the egg, in the Sowers' script, and under it Vitra's seal. His people had known what they were borrowing. Twelve cradles; eleven aimed at the fleet; the twelfth aimed somewhere else entirely, and now he knew where.",
      "Under the city, a yard of dark Lanterns in their cradles — the whole fleet his people built to keep strangers out. Kal asked for all of it. He had woken one Lantern wall by wall; the Keepers knew a faster way, one lamp lit and the light running along the deck to the rest. The Archive's picture of the day the suns flickered hung over the yard while they worked: one sun still burning, the other with the dark in its heart. The Gleaner's first meal here.",
      "Lys taught the Keepers the mark, and they grew it into the Lanterns' light pane by pane on the inside of the glass sky. The gate that had opened for keys once opened for a Vitran claw, and the whole fleet rose through the dome it had guarded, lit with a light the Hush could not see. The Keepers turned the city off behind them. It could wait.",
    ],
  },
  {
    slug: "reef-fleet",
    numeral: "19",
    title: "Reef Fleet",
    epigraph: "A pearl returned, and a sea that leaves the sea.",
    pages: [
      "The Corallines saw the seed-ship coming a day out, and the whole reef was glowing his name when it landed. The elders remembered the gecko who paid for a pearl with a story; he had a longer one now, and someone to tell half of it. Kal gave the pearl back. Nobody had ever returned a gift to the reef, and the Corallines did not have a color for it yet. Then Lys showed them the mark, and under the shallows the first light-seed that could not be gleaned took root.",
      "Bells of glass drifted up the current with the news: the Gnaw were coming early this year, and in numbers. The Hush's scouts came for the new light before it could grow and could not see it, so they chewed the reef around it instead. At dusk the big one came up from where the reef's light does not reach. Kal had stood on this wall before. Lys had not. She learned fast.",
      "The Corallines had ships of shell they had never had a reason to fly. They had one now. The reef came up off the sea floor with its light-seeds in its arms, and for the first time since the reef was a reef, the Corallines left their ocean. The water went dark behind them. They would come back to it.",
    ],
  },
  {
    slug: "candles-debt",
    numeral: "20",
    title: "The Candle's Debt",
    epigraph: "A queen who keeps accounts, and a map of the dark's edge.",
    pages: [
      "The Cindermoths saw the seed-ship's light before it landed, the way they had seen his the first time. The hall of fires had not gone out since the hoard spilled, and the Court did not kneel this time; it stood, which for moths is harder. The Candle keeps accounts. Kal had given the Court its light back and asked for nothing, and she had considered that a debt for a long time.",
      "The moths knew the one thing nobody else on the road knew: how to live where there is almost no light at all, at the edge of the Hush, where it has already fed. The Candle had mapped that edge for a hundred years. The Hush is not one thing, she said. It is a swarm with one heart, and the heart is where the light goes. Lys stared at the heart on the map a long time. The Gleaner was grown with a heart, she said. Everything the Sowers grow is.",
      "The Court lifted off in a storm of its own embers, the wardens who had beaten Kal back from her wall flying at his side now. The Candle paid her debt in the only coin she had: she came herself. The route, she said, ran through the wrecks, and something was waiting in them.",
    ],
  },
  {
    slug: "nul",
    numeral: "21",
    title: "Nul",
    epigraph: "A copy who learned the shape, and an eye that closes.",
    pages: [
      "The sky where the Ember Fleet had held the line was empty; the fleet was on Aurel. Something else had taken up the position: ships with no light in them, in formation, with Kal's face on every hull, waiting for him. Across the wrecks the pod's beacon played Kal's heartbeat. Nul had been listening to it since the Grey Moon. He said it was the only thing he had ever owned.",
      "Two geckos with one face, on one wall, and for once no dark between them. Nul knew which of them was the copy and had stopped caring. He drew the Wall-walker himself, the stars first, the way Lys told it; he had walked the whole road behind Kal, and hollow does not mean empty. He built a wall the way Kal would have — a good one — and Kal broke it, because that is what the two of them are for. The wardens, grown to obey the face, turned on their own fleet; they had never had to choose which face before.",
      "The Hush noticed its eye hesitating and turned in Nul's face to look at what he was doing, and for the first time Nul looked back. Then he shut the eye. The dark went blind in the wrecks; it had never been refused anything either. The hollow fleet parted, and the seed-ship and everything behind it went through. Kal did not stay to watch what the dark did to its eye. He would regret that.",
    ],
  },
  {
    slug: "siege-of-aurel",
    numeral: "22",
    title: "Siege of Aurel",
    epigraph: "Everyone on the wall, and a light the dark cannot see.",
    pages: [
      "One young sun, and a dome three panes from closed. Behind the seed-ship came a court, a reef, a fleet of Lanterns and a menagerie; Kal was home, and he had brought company. Sable had been on the dome since the beacon stopped. She read Lys's shell the way she had read his and went still a third time, and then she made room on the wall. Nobody on Aurel had a word for a fleet like this. Sable suggested one: a wall.",
      "The Corallines planted their marked seeds under the dome and the Lanterns hung over it, so that every light on Aurel said not for gleaning — except the geckos. Then the Hush arrived whole. Not a shadow, not scouts: the swarm and its heart, coming down on the dome like a tide, and the longest night Aurel had had began. The dark passed over the Lanterns as if they were not there. It could not see the light it had come for. It could see everyone standing in it.",
      "The Candle held the edge where only moths could fly and did not ask anyone to thank her. The heart of the swarm settled on the glass over the seedlings, could not see them, felt the geckos on the other side, and started on the dome, pane by pane, with every gecko who could climb on the inside of the sky holding it up. It held until dawn, barely, because a wall is what all of them are for. At sunrise the Hush was still there, and Kal understood there was one place left to go. Inside it.",
    ],
  },
  {
    slug: "into-the-hush",
    numeral: "23",
    title: "Into the Hush",
    epigraph: "A granary where he expected a monster.",
    pages: [
      "Kal walked across the line where the light stops the way he walks onto any wall, and the Hush did not notice; it never had. Lys went in behind him drawing a road of light the dark could see. She was the lure and the lantern, and the swarm turned to follow her instead of the dome. Inside, the dark was full of light: every glow it had ever taken, still moving, running in veins toward the center. None of it had been eaten. All of it had been kept.",
      "The Hush was not a monster. It was a granary. A Gleaner holds what it gathers for a garden to collect, and no garden had ever come. Among the stores were two lights larger than the rest, whole and warm, in a rhythm Kal knew from inside the egg: Vitra's twin suns. At the center, past the nest where the Gnaw are grown, was the throat that eats. It had swallowed suns. It had never once been shown what it was grown to carry.",
      "Kal did what the Sowers never did. Lys drew him in light, and for the first time in his life the Hush saw him: a seed. Not for gleaning. For planting. A Gleaner follows a seed to the garden. Kal turned and walked out the way he came, and the whole dark turned with him. Two geckos came out of the Hush at dawn, and the Hush came out behind them carrying everything it had ever taken, and Aurel watched a sunrise from the wrong direction.",
    ],
  },
  {
    slug: "name-for-the-moon",
    numeral: "24",
    title: "A Name for the Moon",
    epigraph: "The Gleaner follows the seed home.",
    pages: [
      "Kal led it back along the whole road, lit by Lys so it could see him — for the first time since the egg, the most visible thing in the sky, and he did not like it, and he kept walking. Nul was still in there, hollow and blind, the one thing the dark could not use, holding its eye shut from the inside so it could only follow the light it was shown. Past the wrecks, the ash, the reef. At Vitra a Gleaner did what it was grown to do at a garden: it delivered. The twin suns came back into the sky they were taken from, and the Keepers watched the glass warm.",
      "Then on, to the one place in the sky with nothing to eat: a cold grey moon under a ringed blue giant, where a pod fell short once. Lys planted a light-seed in the cradle where an egg had been, and something on the Grey Moon grew for the first time. A tool that had finished its work settled into the dust and went quiet — not dead; kept, the way it had kept everything — and Nul climbed out of it and sat down on the pod. Kal gave the moon its name, the one thing nobody had ever given it. Hush. A dark moon around a blue giant, and a small green light on it.",
      "Home. The dome over Aurel had been three panes from closed for a year, and Kal set the last one himself. Three geckos on the finished glass — one lit, one hollow, one who walks on light — and far off, two suns in a sky that used to be his. Home is where they are. He is home, and so is the road.",
    ],
  },
];

/** The book chapter for an episode slug, if the lore knows it. */
export function loreChapterFor(slug: string): LoreChapter | undefined {
  return LORE_BOOK.find((chapter) => chapter.slug === slug);
}
