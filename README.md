# Breeq

A brick breaker **built by players, for players**: you design a wall over your own photo from a kit of pieces, then dare everyone else to clear it.

## The core idea

Each player authors **levels** from a catalog (`game/breakout/engine/catalog.ts`) and a piece budget. Other players clear them with a paddle and one to five lives.

- **Bricks** — glass, hard, steel, explosive (chains through neighbors), ghost (blinks open), regen (comes back), magnet (pulls the ball), rotor (a slow blade), key and lock.
- **Zones** — the ball passes through them: slow / ×2 / ×3 speed, gravity and anti-gravity, paired portals and a fake portal, mirror, fog, split (a second ball), and paddle mods: shrink, grow, invert, ice, sticky.
- **Obstacles** — bumper, rail, fan, sweeping guard, trampoline, black hole.
- **Rules** — lives, a timer, a descending wall, a forced color order.

**Speed** follows the classic rule: every few paddle hits the ball gains a notch, and rapid rebounds build heat that adds more. Losing a life resets it.

**The publish rule:** you can only publish a level after clearing it yourself, and `proveClearable` (a flawless autopilot) has to beat it too. Validation also refuses the structurally broken: unpaired portals, sealed-in keys, pieces in the paddle lane, over-budget walls.

## Story — Kal's way home

The Story mode is a campaign of hand-placed walls with one thread running through it: **Kal, a small galactic gecko, wakes up on a world that is not his own and goes looking for where he came from.**

### The lore

Kal's people are wall-walkers. On **Vitra**, their home planet, the sky is a dome of tinted glass warmed by twin suns, and geckos live on it the way ours live on windows — clinging, climbing, chasing the light that comes through. Every Breeq wall is glass for that reason: breaking through it is what a Vitran gecko does.

Kal never saw Vitra. His egg left it inside a **pod** built to carry a single egg across the dark — why, and from what, the pod does not say. It fell on a cold, nameless **Grey Moon** under a ringed blue giant. Kal hatched there alone, with three things he could not explain: a warmth he remembered from inside the egg, a rhythm like a heartbeat he had never heard outside it, and a pull toward any light behind any window.

The pod holds the rest: a **star chart** etched on its inner shell with one star circled, and a beacon that still pulses in the rhythm Kal remembers. Out there, Vitra is guarded by the **Lanterns** — ships of light his own kind built to keep strangers out — and by a sky that does not let anyone through easily, not even its children. Kal is not a stranger. He has to prove it the only way a gecko can: wall by wall.

**What he finds when he gets there.** Nobody. Under the glass sky the city is dark, minded only by the **Keepers**, small drones left behind. The Archive opens for a Vitran claw and tells the rest: the twin suns flickered, something fed on the light between them — his people named it **the Hush** — and Vitra emptied in the **Long Migration**. Twelve pods carried the last eggs after the fleet. Eleven arrived. The twelfth fell short, on a Grey Moon. The Archive also keeps the migration's **route**: five worlds where the fleet meant to stop. Kal wakes a dark Lantern and follows it.

**The route.** First a world of light, the **Lumen Reef** — a shallow ocean lit from below whose reef is a people, the **Corallines**, who glow to speak and trade in light. They remember two fleets passing, a dark one and a hurried one, and keep a **pearl** the geckos left in thanks; Kal earns it by standing on the reef wall when **the Gnaw**, the Hush's scouts, come at dusk. Then a dark world: a burned-out star and the **Ashen Court** of the **Cindermoths**, who hoard what light is left under their queen, **the Candle**. The geckos paid for passage in light; Kal has only his glow, so the price is a cage, wardens, and a duel — one wall between him and the Candle. It falls, her hoard spills back into the ash, and she keeps her word. Then the battlefield: a sky of wrecks where the **Ember Fleet** — amber ships, his own kind — has held the line against the Hush for years. An old gecko with a scarred tail, **Sable**, reads the marks on his shell and goes very still; she knew the ship that launched his pod. Kal takes his place on the wall, faces the eye of the Hush, and turns his Lantern into a light it cannot swallow. And last, **Aurel**: one young sun, an unclaimed world the fleet chose before he was born, where a new glass sky is built pane by pane with the Corallines' light-seeds under it, and one shadow of the Hush to see off. Kal was never from Vitra. He is from the pod, the Grey Moon, and the road. Home is where they are.

**Season 2 — The Borrowed Egg.** The dome over Aurel is almost closed when a signal cuts through it: Kal's own heartbeat, played back by someone who knows the code. A quiet green ship lands with a courteous envoy and a document carrying the marks from his shell — *Specimen K-L. On loan. Due.* Sable goes still again: the cradle was already aboard when the Migration began, and nobody asked what it was. Kal goes, for the *why*. The ship takes him to **Vireo**, a jungle world under a glass roof, where cages hold creatures from a dozen skies — **the Tally** — and the last door closes behind him.

Under the jungle, a laboratory in cold light. **Marrow**, an old keeper with a grey tail, tells him what the twelfth pod was. The **Sowers of Meridian** grow living things between the stars and lend them out; Vireo was their vivarium. A generation ago, when Vitra's suns first flickered, they lent the Vitrans one egg, grown with one gift: *the Hush cannot see it*. Kal was the experiment. The twelfth pod was the Sowers' return cradle, launched in the panic of the Migration and lost. **The Curator** — Vireo's keeper, who never left when the Sowers did — has read the Ember Fleet's news and is growing copies in the vats. He is tall, thin, polite, and never raises his voice. The copies do not have the gift. One of them wakes anyway: **Nul**, hollow where Kal is lit, and the Hush, which could never see Kal, looks out of his own face.

Kal brings the glasshouse down and follows the Sowers' seed-map into the **Rootway**, living tunnels between stars, with Nul's hollow fleet behind him. In the fifth tunnel he meets **Lys**: the other egg, grown in the same vat, kept by the Sowers as the control and raised on Meridian as a scout who walks on light the way Kal walks on glass. She was sent to bring the loan home. She climbs onto the wall beside him instead. From there the sky is a story — **the Wall-walker**, a gecko drawn in stars across the whole night whose tail points the way the first geckos came — and they walk it together while the Hush, through Nul, learns the shape and tells it back in the dark. At the tail's tip, a star with a circle around it, the pod's circle, and **Meridian** rising: seed-pods the size of moons, the **Council of Seeds** who wrote the loan and have never had one refused. Kal refuses. Lys chooses him over the Council that raised her. The Curator's fleet comes down with Nul at its head; the dark he thought he was selling an answer to takes him first. Two geckos hold the last wall over the garden. Nul is not in the wreckage. Somewhere above Meridian, something with Kal's face turns toward Aurel.

**Season 3 — The Gleaner.** The morning after, the Council confesses what it kept for an age: the Hush is theirs. Long ago the Sowers grew a **Gleaner** — a hunger built to sweep stray light out of the dark between stars and carry it to their gardens. It got out and never stopped being hungry. The mark grown into every seed says *not for gleaning*; that mark is Kal's gift, and to the Gleaner he is not food but cargo. Nul is a day ahead on the straight road to Aurel, so Kal and Lys take a **seed-ship** down the long one — back along the route, to every people who owes them light. On Vireo the freed **Tally** and **Marrow** join them, and Marrow says the mark can be grown into light itself. On the **Grey Moon** Nul is waiting with one question — *which of us is the copy?* — and leaves with the pod's beacon while the eye of the Hush opens over the dust. On Vitra the **Keepers** wake the whole **Lantern** yard and grow the mark into its light; the Archive's last file is the contract for the egg, under Vitra's seal. The **Corallines** grow the mark into their light-seeds and, for the first time, leave their sea in ships of shell. The **Candle** pays her debt by coming herself, with the one thing the moths know — how to live at the dark's edge — and her map: the Hush is a swarm with one heart. In the wrecks the hollow fleet waits, and **Nul**, who learned the shape by watching, shuts the eye of the Hush and lets them pass; the dark turns on him for it. At **Aurel** everyone is on the wall when the Hush arrives whole. The marked light holds — the dark passes over the Lanterns and the seedlings as if they were not there — but it can see the geckos, and it starts on the dome. So Kal does the one thing left: he walks into the Hush, the one thing it cannot see, with Lys behind him drawing a road of light it can. Inside is not a monster but a **granary** — every light it ever took, kept, Vitra's twin suns among them, waiting for a garden that never came to collect. Kal lets it see him: Lys draws him in light, and the Gleaner, shown a seed for the first time, follows it out. Along the whole road back it delivers — the twin suns return to Vitra's sky — and at the Grey Moon, a place with nothing to eat, a tool that has finished its work settles into the dust and sleeps, with Nul, hollow and blind, holding its eye shut from inside. Kal names the moon **Hush**. He goes home to set the last pane, three geckos on the finished glass, and two suns far off in a sky that used to be his.

### The episodes

Each episode is ten walls. One new idea per chapter, the ball a little faster each time, and XP that climbs with the stakes. Episodes 4 to 8 are where the kit stops arriving and starts combining: every wall after Glass Sky mixes pieces the player already knows, and the black hole, the guards, ice and the timer come back in harder company. The difficulty rating (below) peaks at each episode's boss and finale — about 50 in Empty Nest and Lumen Reef, 40 in Ashen Court, and close to 60 for the last walls of The Hush and Second Sun. Season 3 (episodes 15 to 24) runs the ball from 432 to 477 and keeps the same shape: a black-hole wall in a steel throat as each episode's dark heart (rated 30 to 60), a finale on the clock, and a Seed-ship … Name for the Moon arc that revisits every world of the road.

**Episode 1 — Gecko Legacy** — Kal wakes up on a world that is not his own. Ten gentle walls, one idea each, the ball never above 305.

| # | Wall | Shape | What it brings | The story |
|---|------|-------|----------------|-----------|
| 1 | A light behind the window | a lit pane | glass, a slow zone | Something glows behind the glass of the pod. Kal does what every gecko does first: he climbs toward it. |
| 2 | Chasing the light | a light's trail | the first hard bricks | The light moves along the wall. Kal follows it, and the wall gives way under his feet. |
| 3 | A lizard is born | a cracked egg | steel | Grey dust, thin air, a sky he does not know. Kal is out of the shell, and he is alone. |
| 4 | Crispy party | clusters of bugs | the first ×2 zone | Bugs crackle around the pod's beacon, drawn by the same light. Kal eats. Tomorrow, he leaves. |
| 5 | First prints | a trail of prints | grow | Nobody has walked here before. Kal's prints in the dust are the first, and they wander. |
| 6 | The beacon | a lamp on a mast | two slow zones | The pod's lamp pulses in a rhythm Kal knows from inside the egg. He climbs it to be closer. |
| 7 | Grey dust | two dunes | the first bumper | Beyond the pod, dunes. Beyond the dunes, more dunes. The moon has nothing else to give him. |
| 8 | The ringed giant | a planet and its ring | a hard core | A blue world fills half the sky, wearing a ring of ice. Kal watches it all night and does not know why he is sad. |
| 9 | Cold night | scattered stars | a magnet | The stars come out sharp and close. One of them pulls at him, the way the light behind the window did. |
| 10 | The circled star | a star in a ring | hard amber in glass | Inside the pod, a chart of stars, and one of them circled. Kal puts a claw on it. Tomorrow, he leaves. |

**Episode 2 — Cold Orbit** — Kal leaves the Grey Moon and learns to read the sky.

| # | Wall | Shape | What it brings | The story |
|---|------|-------|----------------|-----------|
| 1 | The Grey Moon | a crescent and one star | glass, a slow zone | Kal has never seen a sunrise. This morning, the Grey Moon gives him one. |
| 2 | Shell fragments | three pieces of eggshell | hard cores | Pieces of the shell he hatched from lie in the dust. They are not from here. |
| 3 | The pod | a capsule with windows | steel hull, a grow zone | Half-buried in the regolith: a capsule the size of a house, built to carry one egg. |
| 4 | Star chart | a constellation | the first ×2 zone | Etched inside the pod, a map of stars. One of them is circled. |
| 5 | First lift-off | a rocket | ×2 under the flames | The pod still has a spark left. Kal points it at the circled star. |
| 6 | Asteroid belt | tumbling rocks | bumpers | Rocks the size of hills tumble past the window. Kal learns to bounce. |
| 7 | The dead satellite | panels, body, dish | a magnet | A silent relay hangs in the dark. Its dish still points somewhere. |
| 8 | Wormhole | a ring with an eye | a portal pair, sticky | The relay's last message is a door. Kal goes through it. |
| 9 | The Drift | a ship torn in two | mirror, a rail | On the far side, a ship torn in two. Its hull carries the same marks as his shell. |
| 10 | Signal from home | a radio dish | magnets, bumpers, a portal over the dish | The wreck's beacon still pulses, in a rhythm Kal has known since before he hatched. |

**Episode 3 — Glass Sky** — The way home.

| # | Wall | Shape | What it brings | The story |
|---|------|-------|----------------|-----------|
| 1 | Leaving orbit | a ringed planet | explosives, anti-gravity | A ringed giant blocks the road. Kal slings around it. |
| 2 | Comet tail | a comet | ghosts | A comet is going the same way. Kal rides its tail. |
| 3 | Ring storm | rings and debris | rotors, gravity | Ice and rock spin in the rings of a gas giant. Nothing here stays still. |
| 4 | The Maw | an accretion disk | a black hole in a steel throat, five lives | Something dark waits between the systems. It has swallowed ships before. |
| 5 | Sentinels | a fleet of ships | regen, a sweeping guard, ice, shrink | Ships of light bar the way. Kal's kind built them to keep strangers out. |
| 6 | Locked gate | two towers and a gate | keys and locks, a fan | The Lanterns' gate opens only for keys. Kal has to find them. |
| 7 | Solar wind | a sun and its corona | two fans, ×3, split, shrink | Twin suns. Kal remembers them from inside the egg. |
| 8 | Vitra's moons | three moons | fake portal, descend, order (pink first) | Three moons circle a planet with a glass sky. Home. |
| 9 | The storm | a tempest | ice, invert, fog, a trampoline, a timer | Vitra's sky does not let anyone through easily. Not even its children. |
| 10 | Glass Sky | six bands of sky under twin suns | everything, five minutes, a narrower paddle | One last wall. On the other side, everyone Kal has never met. |

**Episode 4 — Empty Nest** — Under the glass sky, nobody is home. Kal finds out why.

| # | Wall | Shape | What it brings | The story |
|---|------|-------|----------------|-----------|
| 1 | Under the glass | a skyline of dark towers | bumpers | The wall gives. Kal drops through the glass sky into a city with no lights on. |
| 2 | The dark streets | a street grid | hard blocks, ghosts, fog | Every window is dark. Kal has never been somewhere his own kind lived. |
| 3 | The Keepers | three drones | regen arms, magnet eyes, grow | Keepers, the drones left to mind an empty city. They have never seen a gecko. |
| 4 | The hatchery | a hall of eggs | ghosts (empty shells), one solid egg, sticky | Every shell empty but one. That one fits the fragments Kal carries. |
| 5 | The Archive | a tower of tablets | steel shelves, keys and locks | The Archive opens for a Vitran claw. Inside: the day the suns flickered. |
| 6 | The flicker | twin suns, one half dark | steel, invert, ×3, shrink | Something fed on the light between the suns. They named it the Hush. |
| 7 | The last pods | pods in their cradles | a portal into the empty cradle, mirror | One launch failed and fell short of the fleet. That one was Kal's. |
| 8 | Signal fire | a Lantern on its cradle | explosive core, rotors, two fans, ice | Kal climbs the dark Lantern's hull and wakes it wall by wall. |
| 9 | The route | a chart of five worlds | order (blue first), a decoy portal | Five worlds where the fleet meant to stop. The first is a world of light. |
| 10 | Lift from Vitra | a ship rising through the dome | a guard, shrink, ice, descend, four minutes | The Lantern rises through the sky it once guarded. The Keepers turn the lights back on. |

**Episode 5 — Lumen Reef** — A sea of living light, a people who sing in it, and Kal's first fight.

| # | Wall | Shape | What it brings | The story |
|---|------|-------|----------------|-----------|
| 1 | Shallows | three waves | hard crests, ice | A shallow ocean lit from below. Kal's Lantern skims the surface. |
| 2 | The Corallines | a coral fan | regen tips, grow | The reef is alive, and it is a people. The Corallines glow to speak. |
| 3 | Jellies | three bells with tentacles | ghosts, anti-gravity | Bells of glass drift up the current, carrying news of a gecko to the elders. |
| 4 | The shell market | spiral shells | keys and locks, sticky | The Corallines trade in light. Kal offers the only thing he has: a story. |
| 5 | Reef song | sound waves | two rails, shrink | A dark fleet passed here once, they sing — and after it, a fleet of geckos. |
| 6 | Lighthouse coral | a tower with a beacon | explosive beacon, two fans | The geckos left a light on the tallest coral, and their claw marks in the glass. |
| 7 | The Gnaw | a worm's mouth | rotor teeth, a black hole in a steel throat, five lives | Something has been chewing the light out of the reef. The Hush has scouts. |
| 8 | Tide of teeth | a wall of teeth | explosives, a guard, ×3, shrink | The Gnaw come at dusk. Kal and the Corallines stand on the reef wall. His first fight. |
| 9 | The deep | a narrowing descent | gravity, fog, a portal back up | Kal follows the Gnaw down, past where the reef's light reaches. |
| 10 | Pearl | a clam | steel jaws, a ring of locks, split, descend, timer | A map-stone the geckos left in thanks. It shows the next world. It is dark. |

**Episode 6 — Ashen Court** — A dead star, a court of moths, and a price for the way on.

| # | Wall | Shape | What it brings | The story |
|---|------|-------|----------------|-----------|
| 1 | Cinder | a burned-out star | hard core, fog | Ash the size of continents. Kal lands in the dark. |
| 2 | Moth wings | a moth | ghosts in the wings, mirror | The Cindermoths hoard what light is left, and they have seen his. |
| 3 | The Candle | a candle | explosive flame, magnet wick, steel holder | Their queen asks what he wants. The way to his people, he says. |
| 4 | The hive | a honeycomb | locks, three keys | The geckos paid for passage in light. Kal's glow is not for sale. |
| 5 | Cage | steel bars | steel, invert, ice | The Candle's answer is a cage. Kal has been inside a shell before. Shells break. |
| 6 | The wardens | two moth wardens | rotor wings, two guards, ×3 | Wardens with wings of ash beat him back. Kal learns to hit what will not stay still. |
| 7 | Ash storm | a swirl of ash | rotors, ghosts, two fans, fog | Kal cannot see the wall, so he listens for it. |
| 8 | The duel | the Candle's face | explosive eyes, a black-hole mouth, descend, five lives | One wall between them. If it falls, he goes on. |
| 9 | Embers | a hall of fires | regen embers, order (pink first), trampoline, mirror | Light pours back into the ash. The Court kneels — not to Kal, to the light. |
| 10 | The way out | a tunnel | steel walls, ghosts, a guard, a portal, ice, invert, four minutes | The route: a battlefield, then a dawn. Your people are still fighting, she says. |

**Episode 7 — The Hush** — The Ember Fleet, the dark that hunts light, and a gecko who has come a long way.

| # | Wall | Shape | What it brings | The story |
|---|------|-------|----------------|-----------|
| 1 | Battlefront | wrecks | steel debris, bumpers | Somewhere in the wrecks, a fleet of geckos has held the line for years. |
| 2 | Ember Fleet | ships in formation | regen engines, split | The Ember Fleet has not seen a Lantern in a lifetime. They almost fire. |
| 3 | Old Sable | a gecko in profile | locks (claw marks) and a key, magnet | She knew the ship that launched his pod. |
| 4 | Shield wall | a phalanx | steel posts, a wide guard | The Hush comes in waves. Kal takes his place on the wall. |
| 5 | The breach | a broken wall | ghosts in the gap, a black hole in the corner of the sky | The dark pours through the gap, and Kal is the smallest thing in it. |
| 6 | Torchbearers | torch ships | explosive chains, rotors, ×3, invert | The torchbearers light the dark so the rest can aim. Their fuel is running out. |
| 7 | The eye | an eye | a black-hole pupil in steel, ice, five lives | A thing with no light in it at all. The Hush looks at Kal. Kal looks back. |
| 8 | Counterstrike | a spearhead | rails, trampoline, invert, ×3, ice | Hit the Hush where it feeds. Kal knows walls. He goes first. |
| 9 | The Lantern's light | the Lantern as a bomb | steel hull, explosive core, a guard, shrink, descend, timer | Kal turns the Lantern into a light the Hush cannot swallow. |
| 10 | Dawn over the wrecks | a sunrise | key and locks, bumpers, ×3, shrink, narrow paddle, five minutes | The Ember Fleet counts what it has left, and what it has gained: one small gecko. |

**Episode 8 — Second Sun** — A young world, one sun, and a glass sky that has to be built.

| # | Wall | Shape | What it brings | The story |
|---|------|-------|----------------|-----------|
| 1 | Aurel | a young planet | bumpers, ice | One sun, young, unclaimed. The fleet chose it before Kal was born. |
| 2 | Landing | ships coming down | regen, gravity, ice, shrink | For the first time, Kal walks among more geckos than he can count. |
| 3 | The first pane | one pane in a steel frame | steel, sticky, grow | Kal, who broke through a glass sky, learns to set one. |
| 4 | Seedlings | light-seeds on stems | regen buds, anti-gravity, split | The Corallines' light-seeds take root under Aurel's sun. |
| 5 | The Hush's shadow | a hollow shadow | a black hole in steel, mirror, fog, five lives | One shadow followed the fleet here. It goes for the seedlings first. |
| 6 | The dome | a half-built arc | steel ribs, locks and keys, two fans, shrink | Every gecko who can climb is on the dome. Kal is fastest. |
| 7 | The last wave | a wave of dark | rotors, explosives, two guards, invert, ×3, shrink | The fleet's last wall is the half-finished sky. |
| 8 | Sable's tale | a scroll of pods | order (pink first), a portal and a decoy, mirror, descend | Twelve eggs. Eleven arrived. The twelfth was Kal. |
| 9 | Twin suns remembered | a dark sun and a bright one | a black hole where the old sun's heart was, bumpers, timer, five lives | Under Aurel's one sun, the geckos light a second: the dome, glowing from inside. |
| 10 | Home | a family on the glass | everything: key and locks, explosives, regen, bumpers, a guard, shrink, ice, ×3, three lives, the narrowest paddle, four minutes | Home is where they are. He is home. |

**Episode 9 — Green Static** — A signal in Kal's own heartbeat, a polite envoy, and a loan that has come due.

| # | Wall | Shape | What it brings | The story |
|---|------|-------|----------------|-----------|
| 1 | The signal | a heartbeat waveform | a magnet, bumpers | The dome is nearly closed when a signal cuts through it: Kal's heartbeat, played back by someone who knows the code. |
| 2 | The green ship | a leaf on its side | steel keel, sticky, grow | It lands without a sound, the color of a leaf. Nobody on Aurel has seen a ship like it. Sable has. |
| 3 | The loan | a sealed document | keys and locks, mirror | The envoy is courteous. The document carries the marks from Kal's shell. Specimen K-L, it says. On loan. Due. |
| 4 | Vireo | a green world | ghosts in the clouds, anti-gravity | Kal goes, because the envoy has the one thing he has wanted since the Grey Moon: the why. |
| 5 | Canopy | layers of leaves | regen leaves, two fans | Leaves the size of sails, and a warm wind that never stops. Everything here grows back. |
| 6 | Vines | hanging vines | rails, gravity | Kal climbs the way he always has. The vines are the first wall that climbs back. |
| 7 | Fireflies | sparks in the dark | explosives, fog, split | At night the jungle lights up in his rhythm. Every firefly here pulses the way his beacon did. |
| 8 | The glass roof | panes in steel ribs | locks and keys, ice | Above the canopy, panes in steel ribs. Vireo is not a world. It is a greenhouse. |
| 9 | The Tally | a row of cages | magnets in steel, a guard, shrink | A corridor of cages, something bright in every one, from a dozen skies. The Tally. On loan. |
| 10 | The cage | Kal's cage | rotor hinges, a lock, descend, four minutes, five lives | The last cage is empty and the right size. The door closes behind him. Kal has been inside a shell before. |

**Episode 10 — The Vivarium** — Under the jungle, a laboratory — and the truth about the twelfth pod.

| # | Wall | Shape | What it brings | The story |
|---|------|-------|----------------|-----------|
| 1 | Cold light | ceiling lamps | hard bars, ice | Under the jungle, a floor that hums. Lamps in a row, cold and even. Nothing here was grown by accident. |
| 2 | Specimen tanks | three cylinders | ghosts, anti-gravity | Cylinders of glass, and in them, things that are only half there. One of them has a tail. |
| 3 | Marrow | a gecko in profile | a magnet eye, a key, sticky | An old gecko with a grey tail opens the cage. Not to free him. He has waited a long time to tell someone. |
| 4 | The Tally's ledger | a grid of entries | keys and locks, order (cyan first), mirror | One line reads: Vitra. One egg. Not returned. |
| 5 | Sap lines | pipes | regen joints, rails, fans | Vireo was never a world. It was the Sowers' vivarium, and the Curator kept it when they left. |
| 6 | The vats | three vessels | explosive cores, gravity, fog | Three vessels, warm, in his rhythm. The Curator is growing more. |
| 7 | Copies | rows of small geckos | regen tails, split, mirror, shrink | Rows of them, with his face. Whatever made Kal invisible to the Hush, the copies do not have it. |
| 8 | Lights out | a dark room | ghosts, fog, ice, invert | Kal cuts the power the only way he knows: wall by wall. |
| 9 | Freeing the Tally | locked cages | locks, keys, two guards | Every cage opens the same way. The Tally pours out into the jungle. |
| 10 | Marrow's truth | a seed in a shell | a black hole in a steel throat, mirror, five lives, four minutes | The twelfth pod was a return cradle. Kal was lent to Vitra as a seed the Hush could not see. |

**Episode 11 — Glasshouse** — The Curator's tower, a polite offer, and a copy that wakes up hollow.

| # | Wall | Shape | What it brings | The story |
|---|------|-------|----------------|-----------|
| 1 | The spire | a spire of amber | steel spine, bumpers | Above the canopy, a tower of amber glass. Someone has been watching from it for a generation. |
| 2 | The Curator | a tall thin figure | magnet eyes, a ghost robe, mirror | He is polite, and he never raises his voice. He has waited a long time for his experiment to come home. |
| 3 | The offer | a balance | keys and locks on rails | A place, he says. All Kal has to do is stand still. Kal has never stood still in his life. |
| 4 | Wardens of glass | two wardens | rotor wings, two guards, ×3 | Wings that spin and eyes that do not blink. Kal hits what will not stay still. |
| 5 | The hatching | opening vats | explosive seams, regen, split | The vats open early. Most of the copies do not wake. |
| 6 | Nul | a hollow gecko | a black hole in a steel throat, fog, five lives | One wakes. It has Kal's face and none of his light, and the Hush looks out of its eyes. |
| 7 | Shatter | breaking panes | explosives, descend, ice | The Curator finally raises his voice. The glasshouse answers: every pane at once. |
| 8 | The seed-map | a constellation | order (cyan first), a portal and a decoy | Meridian, where the loan was written. Where it can be unwritten. |
| 9 | The fall | floors giving way | rotors, gravity, a portal, shrink | Kal has fallen before — a whole sky, once. He knows how to land. |
| 10 | Out of the glass | the tower as a bomb | steel hull, explosive core, a guard, narrow paddle, four minutes | Behind him the tower comes down, and something hollow climbs out of it. |

**Episode 12 — Rootway** — Living tunnels between the stars, something hollow behind, and someone ahead.

| # | Wall | Shape | What it brings | The story |
|---|------|-------|----------------|-----------|
| 1 | Roots | arcs of root | hard knots, gravity | The Sowers do not fly between stars. They grow there. |
| 2 | Sap light | pulses in the roots | regen beads, rails | Light runs through the walls in pulses. Not his rhythm. Close. |
| 3 | Knots | a tangle | rotors, mirror | Where roots cross, the tunnel turns on itself. Kal climbs. Kal always climbs. |
| 4 | Something following | shapes in fog | ghosts, explosives, fog, ×2 | Nul has learned the road by watching him walk it. |
| 5 | Lys | two geckos facing | a portal between them, sticky | In the fifth tunnel, another gecko, waiting. The other egg. She looks at him a long time. |
| 6 | Two on the wall | twins | split, grow | She climbs beside him, and for the first time since the Grey Moon, Kal is not the only one on the wall. |
| 7 | The wardens' hunt | wardens in the tunnel | rotors, two guards, two fans, shrink, invert | Nul's wardens come with the Curator's patience and none of his manners. |
| 8 | The burrow | a narrowing throat | a black hole in steel, mirror, five lives | Something in the throat has been eating the sap light. The Hush is in the roots too. |
| 9 | Lys's light | crossed beams | rails, anti-gravity, ice, ×3 | She walks on light the way he walks on glass. Where the roots go dark, she draws a road. |
| 10 | Out of the roots | the tunnel's mouth | keys and locks, a guard, descend, four minutes | The tunnel opens on stars. Lys points: a gecko drawn in stars, its tail pointing the way. |

**Episode 13 — The Wall-walker** — A gecko drawn in stars across the whole sky, and two who walk it together.

| # | Wall | Shape | What it brings | The story |
|---|------|-------|----------------|-----------|
| 1 | First stars | the gecko's head | hard stars, bumpers | Every Vitran hatchling was shown it once. Nobody showed Kal. Lys shows him now. |
| 2 | The tail | a curling tail | rails, anti-gravity | The tail points the way the first geckos came, before Vitra, before the glass. |
| 3 | Four feet | four clusters | split, grow | Four feet on the sky. Two geckos climbing. Kal has never had this much room. |
| 4 | Nul's eye | an eye | a black hole in steel, fog, five lives | Through Nul's eye, for the first time, the Hush sees where the road goes. |
| 5 | Sky-story | the whole Wall-walker | order (amber first), ghosts | The stars first, then the lines, the way the story is told on Meridian. |
| 6 | Lantern light | a beam | rails, ice, two fans | Lys walks a Lantern's beam as if it were a floor. Kal learns what light is for. |
| 7 | The chase | the hollow fleet | rotors, two guards, ×3, invert | Every ship has his face on the hull. |
| 8 | Where the tail points | a circled star | a portal and a decoy, mirror | The last star has a circle drawn around it. Kal knows the circle. It was etched inside the pod. |
| 9 | The Hush learns | a dark twin | a black hole, explosives, descend, five lives | Behind them the sky goes dark in the shape of a gecko. The Hush is telling the story back. |
| 10 | Meridian rising | a garden world | keys and locks, regen, a guard, shrink, five minutes | Where the tail points, a green world comes up over the dark. |

**Episode 14 — Meridian** — The garden world where the loan was written, and the wall where it is torn up.

| # | Wall | Shape | What it brings | The story |
|---|------|-------|----------------|-----------|
| 1 | The garden | drifting seed-pods | regen blossoms, bumpers | Seed-pods the size of moons drift in a warm sky. Everything here was grown on purpose. |
| 2 | The Council of Seeds | a council ring | keys and locks, grow | They have lent out a thousand things. They have never had one refused. |
| 3 | The loan | a scale | order (blue first), mirror | They weigh him. Kal has been weighed before, by a queen. |
| 4 | Not property | a sealed document | an explosive seal, two fans | Not a specimen. Not a seed. Not lent, not due. The seal breaks the way glass breaks. |
| 5 | Lys's choice | two geckos | a portal, sticky, split | The Council raised her. She climbs onto the wall beside him and does not look back. |
| 6 | The Curator's fleet | ships descending | rotors, two guards, descend | Amber hulls come down through the pods, and the Curator's voice, still polite, asks for what is his. |
| 7 | The hollow fleet | ships with no light | ghosts, magnets, fog, ×3, invert | Nul leads them. The Hush rides every hull. |
| 8 | The Curator's end | the Curator | a black hole in his chest, mirror, five lives, four minutes | The dark does not buy. It takes him first, through the hollow he made. |
| 9 | Nul's escape | a broken constellation | mirror, rails, ice, shrink | When the light comes back, Nul is not in the wreckage. |
| 10 | Two lights | two geckos on the wall | everything: locks and a key, explosives, regen, bumpers, a guard, shrink, ice, ×3, three lives, the narrowest paddle, five minutes | Somewhere above them, something with Kal's face turns toward Aurel. |

**Episode 15 — Seed-ship** — The Council's confession, a hunger with a name, and the long road back.

| # | Wall | Shape | What it brings | The story |
|---|------|-------|----------------|-----------|
| 1 | The confession | a council ring with a dark heart | bumpers, fog | The morning after, the Council of Seeds says what it has kept for an age: the Hush is theirs. |
| 2 | The Gleaner | a sickle | ghosts, anti-gravity | A Gleaner, built to sweep stray light out of the dark and carry it to the gardens. It got out. |
| 3 | The mark | a seed with a chevron | order (pink first), sticky | Every seed carries a mark that says: not for gleaning. That mark is Kal's gift. |
| 4 | Seed-ship | a pod-ship | steel hull, a regen sprout, grow | Lys takes a seed-ship from the Council that raised her. Nobody stops her. |
| 5 | Launch | pods parting | rails, split | Two geckos on the hull, and for the first time the road ahead is one they chose. |
| 6 | Two roads | a fork | a portal, mirror | Nul is a day ahead on the straight road. They take the long one, back along the route. |
| 7 | The Rootway again | root arcs | rotors, gravity | The roots know them now. The sap light runs ahead of the ship. |
| 8 | Sap dark | a root eaten from inside | a black hole in a steel throat, five lives | Where the hollow fleet passed, the roots are dark inside. The Gleaner eats what it passes. |
| 9 | Lys's chart | the route in reverse | keys and locks, two fans | Vireo, the Grey Moon, Vitra, the reef, the ash, the wrecks. Then Aurel. |
| 10 | Green world behind | a green world under a roof | explosives, a guard, ice, descend, four minutes | Kal left Vireo burning. Something has been living in the ashes. |

**Episode 16 — The Tally** — A jungle through a broken roof, an old keeper's ledger, and a fleet with nothing in common but a cage.

| # | Wall | Shape | What it brings | The story |
|---|------|-------|----------------|-----------|
| 1 | Broken roof | steel ribs, fallen panes | bumpers | Vireo's roof is open to the sky and the jungle has climbed through it. |
| 2 | Marrow's ledger | a grid of entries | keys and locks, mirror | Marrow keeps a ledger of the Tally. This one has no column for due. |
| 3 | The Tally free | five creatures | regen tails, grow | Creatures from a dozen skies. They remember who opened the cages. |
| 4 | The lantern-fish | a fish | a magnet eye, fog | A fish that hums in the dark and swims in air. It has decided Kal is worth pulling toward. |
| 5 | The glass-eater | a jaw | rotor teeth, ×3 | Something with rotor teeth that eats glass. Lys says it is exactly what a wall-walker's road needs. |
| 6 | Fireflies again | sparks | explosives, split | At night the jungle still lights up in his rhythm. It was grown to. |
| 7 | The Curator's grave | a fallen tower | ghosts, gravity | The amber tower lies where it fell. Nobody has moved a pane of it. |
| 8 | Vat-dark | a vessel | a black hole in a steel throat, mirror, five lives | One vat never opened. What grew in it is not a gecko. |
| 9 | Marrow's gift | a shell with a mark | order (cyan first), a key, locks, two fans | The mark can be grown into light, if someone knows how to grow light. The Corallines do. |
| 10 | Menagerie fleet | ships of every color | regen, a guard, shrink, four minutes | A fleet with nothing in common but a cage they were let out of. |

**Episode 17 — Grey Moon** — The place it started, a question with no good answer, and the eye opening over the dust.

| # | Wall | Shape | What it brings | The story |
|---|------|-------|----------------|-----------|
| 1 | Old prints | a wandering trail | slow, grow | Nothing has changed. A trail of small prints wanders away from the pod. |
| 2 | The pod again | a capsule | steel hull, sticky, grow | Lys puts a claw on the hull and reads the marks the way he never could. |
| 3 | The beacon | a lamp on a mast | explosives, a steel mast | The lamp still pulses in his rhythm. It was never a call for help. It was a return address. |
| 4 | Ring shadow | the ringed giant | anti-gravity, rails | The first thing that ever looked like home and was not. |
| 5 | Nul on the dust | a hollow gecko | ghosts, a magnet eye | He has Kal's face and none of his light, and he did not come to fight. |
| 6 | The question | two geckos | mirror, a portal | Which of us is the copy? Kal does not have an answer. He has a wall. |
| 7 | Hollow prints | a second trail | ghosts, fog, ice | Prints made by feet that were never here. Nul walked Kal's road backward to find him. |
| 8 | Nul's eye | an eye | a black hole in a steel throat, ice, five lives | Through Nul, the Hush is looking at the one place it has never been able to see. |
| 9 | The stolen beacon | a locked lamp | locks and a key, rotors, invert | Nul takes the lamp. The rhythm goes with him, toward Aurel. |
| 10 | Cold dawn | a crescent and one star | a guard, shrink, descend, four minutes | The Grey Moon gives him a second sunrise. He leaves it a second time. |

**Episode 18 — Keepers** — Vitra with the lights on, the Archive's last file, and a fleet built to keep strangers out.

| # | Wall | Shape | What it brings | The story |
|---|------|-------|----------------|-----------|
| 1 | Lights on | a lit skyline | bumpers | Every window on Vitra is lit. The Keepers kept them that way for nobody, because Kal asked. |
| 2 | Keepers' welcome | three drones | regen arms, magnet eyes, grow | They have never seen two geckos at once. They decide Lys counts. |
| 3 | The Archive's last file | shelves of tablets | keys and locks, mirror | The contract for the egg, in the Sowers' script, under Vitra's seal. His people knew. |
| 4 | The cradles | twelve cradles | a portal into the empty one | The twelfth was aimed somewhere else entirely, and Kal finally knows where. |
| 5 | The Lantern yard | six Lanterns | explosive lamps, rotors | The whole fleet his people built to keep strangers out. Kal asks for all of it. |
| 6 | Waking the fleet | one hull | an explosive chain, two fans | Light one lamp and let the light run along the deck to the rest. |
| 7 | Twin suns dark | two suns, one dark | a black hole in a steel throat, five lives | The Archive's picture of the day it happened. The Gleaner's first meal here. |
| 8 | The gate opens | two towers and a gate | a guard in the gap, ice | The gate opened for keys once. Today it opens for a Vitran claw. |
| 9 | Keepers on the dome | a dome with Keepers on it | order (violet first), split, trampoline | The Keepers grow the mark into the Lanterns' light, on the inside of the glass sky. |
| 10 | Lanterns rising | ships through the dome | bumpers, shrink, descend, four minutes | The fleet rises lit with a light the Hush cannot see. The Keepers turn the city off behind them. |

**Episode 19 — Reef Fleet** — A pearl returned, a mark grown into light, and a sea that leaves the sea.

| # | Wall | Shape | What it brings | The story |
|---|------|-------|----------------|-----------|
| 1 | Return to the shallows | waves | hard crests, ice | The whole reef is glowing his name when the seed-ship lands. |
| 2 | The elders | a coral fan | regen tips, grow | He paid for a pearl with a story once. He has a longer one now. |
| 3 | The pearl returned | a clam | steel jaws, a ring of locks, sticky | Nobody has ever returned a gift to the reef. The Corallines do not have a color for it yet. |
| 4 | Growing the mark | a seedling | regen buds, anti-gravity | Under the shallows, the first light-seed that cannot be gleaned takes root. |
| 5 | Bells of war | three bells | ghosts, split | The Gnaw are coming early this year, and in numbers. |
| 6 | The Gnaw return | teeth | rotors, ×3 | The scouts cannot see the new light. They chew the reef around it instead. |
| 7 | Dusk tide | a worm's mouth | a black hole in a steel throat, ice, five lives | The big one comes up from where the reef's light does not reach. Lys learns fast. |
| 8 | Shell ships | spiral shells | bumpers, rails | Ships of shell they never had a reason to fly. They have one now. |
| 9 | Lifting the reef | a reef rising | two fans, gravity | The reef comes up off the sea floor with its light-seeds in its arms. |
| 10 | Sea leaves the sea | ships over waves | a guard, shrink, descend, four minutes | For the first time since the reef was a reef, the Corallines leave their ocean. |

**Episode 20 — The Candle's Debt** — A queen who keeps accounts, a map of the dark's edge, and a court that comes to pay.

| # | Wall | Shape | What it brings | The story |
|---|------|-------|----------------|-----------|
| 1 | Ash again | a dead star | hard core, fog | The Cindermoths saw the seed-ship's light before it landed. |
| 2 | The Court lit | a hall of fires | regen embers, mirror | The Court does not kneel this time. It stands, which for moths is harder. |
| 3 | The debt | a scale | order (pink first), sticky | Kal gave the Court its light back and asked for nothing. She has considered that a debt. |
| 4 | Moth fleet | moths | ghost wings, anti-gravity | The moths know how to live where there is almost no light at all. |
| 5 | Wardens at his side | two wardens | rotor wings, two guards, ×3 | The wardens who beat him back fly at his side now. |
| 6 | The Candle's map | a swarm with one heart | ghosts, a magnet | The Hush is not one thing. It is a swarm with one heart, and the heart is where the light goes. |
| 7 | Ember storm | embers thrown | rotors, two fans, ×3, invert | Kal cannot see the wall. He has listened for one here before. |
| 8 | The heart | a heart | a black hole in a steel throat, mirror, five lives | The Gleaner was grown with a heart, Lys says. Everything the Sowers grow is. |
| 9 | Wax and wick | a candle | explosive flame, magnet wick, steel holder, trampoline | The Candle pays her debt in the only coin she has. She comes herself. |
| 10 | Leaving the ash | a tunnel | steel walls, ghosts, a guard, a portal, ice, four minutes | The route: the wrecks. Something is waiting in them. |

**Episode 21 — Nul** — The hollow fleet in the wrecks, a copy who learned the shape, and an eye that closes.

| # | Wall | Shape | What it brings | The story |
|---|------|-------|----------------|-----------|
| 1 | Wreck field again | wrecks | steel debris, bumpers | The fleet is on Aurel. Something else has taken up the position. |
| 2 | The hollow fleet waits | ghost ships | magnets, fog | Ships with no light in them, waiting for him. |
| 3 | The beacon's rhythm | a heartbeat | rails, sticky | Nul has been listening to it since the Grey Moon. The only thing he has ever owned. |
| 4 | Same face | two geckos | mirror, a portal | Nul knows which of them is the copy. He has stopped caring. |
| 5 | What Nul learned | the Wall-walker | order (blue first) | He draws it himself, the stars first. Hollow does not mean empty. |
| 6 | Wardens turn | a warden flight | rotors, two guards, ×3 | Grown to obey the face, they have never had to choose which one. |
| 7 | The eye turns | an eye | a black hole in a steel throat, ice, five lives | The Hush turns in Nul's face to look at what he is doing. Nul looks back. |
| 8 | Nul's wall | an arch | steel, explosives, invert | A good wall. Kal breaks it anyway, because that is what the two of them are for. |
| 9 | The eye closes | closing lids | hard lids, split, shrink | Nul shuts the eye. The Hush goes blind in the wrecks. |
| 10 | Let them pass | a gap in the fleet | a guard, shrink, descend, narrow paddle, four minutes | Kal does not stay to watch what the dark does to its eye. He will regret that. |

**Episode 22 — Siege of Aurel** — Everyone on the wall, the dark arriving whole, and a light it cannot see.

| # | Wall | Shape | What it brings | The story |
|---|------|-------|----------------|-----------|
| 1 | Aurel in sight | a young planet | bumpers | Kal is home, and he brought company. |
| 2 | Sable on the dome | a gecko on a dome | locks and a key, a magnet eye, sticky | Sable reads Lys's shell and goes still a third time. Then she makes room on the wall. |
| 3 | Every people | six colors in formation | regen, grow | Nobody has a word for a fleet like this. Sable suggests one: a wall. |
| 4 | Marked light | seedlings | order (lime first), anti-gravity | Every light on Aurel now says: not for gleaning. Except the geckos. |
| 5 | The dark arrives | a wave | ghosts, fog | Not a shadow. Not scouts. The swarm and its heart. |
| 6 | Lanterns hold | a lantern wall | explosives, two fans | The Hush passes over the Lanterns as if they were not there. It can see everyone standing in them. |
| 7 | Moths at the edge | moths | rotors, two guards, ×3 | Where the dark has already fed, only the moths can fly. |
| 8 | Shadow on the dome | a dome with a shadow | a black hole in a steel throat, mirror, five lives | The heart settles on the glass over the seedlings and starts on the dome. |
| 9 | The dome cracks | breaking panes | explosives, ice, descend | Kal is fastest. Lys is second. It is not enough. |
| 10 | Held | the dome held | everything: locks and a key, explosives, regen, bumpers, a guard, shrink, ice, ×3, three lives, five minutes | At sunrise the Hush is still there. One place left to go: inside it. |

**Episode 23 — Into the Hush** — The one thing it cannot see walks in, and finds a granary where it expected a monster.

| # | Wall | Shape | What it brings | The story |
|---|------|-------|----------------|-----------|
| 1 | The edge | a wall of dark | ghosts, hard rim, slow | Kal walks across the line. The Hush does not notice. It never has. |
| 2 | Lys's road | a beam | rails, ice | She is the lure and the lantern. The swarm follows her instead of the dome. |
| 3 | Swallowed light | veins | regen, a magnet | Every glow it ever took, still moving. None of it was eaten. All of it was kept. |
| 4 | The granary | steel bins | keys and locks | A Gleaner holds what it gathers for a garden to collect. No garden ever came. |
| 5 | Vitra's suns | two suns held in dark | explosives, ×3 | Two lights larger than the rest, whole, in a rhythm Kal knows from inside the egg. |
| 6 | The Gnaw's nest | teeth | rotors, fog | Even a granary has to keep the vermin out. |
| 7 | The heart's throat | a throat | a black hole in a steel throat, ice, five lives | It has swallowed suns. It has never been shown what it was grown to carry. |
| 8 | Kal seen | a gecko in light | order (amber first), invert, sticky | For the first time in his life, the Hush sees him: a seed. Not for gleaning. For planting. |
| 9 | The delivery | a beam out | a portal, two fans, split | A Gleaner follows a seed to the garden. The whole dark turns with him. |
| 10 | Out with the light | a sunrise from inside | a guard, shrink, descend, four minutes | Aurel watches a sunrise from the wrong direction. |

**Episode 24 — A Name for the Moon** — The Gleaner follows the seed home, two suns come back, and a nameless moon gets a name.

| # | Wall | Shape | What it brings | The story |
|---|------|-------|----------------|-----------|
| 1 | The long road | the route as stars | bumpers | Kal leads it back along the whole road, lit by Lys so it can see him. |
| 2 | Seed in light | a seed in a ring of light | order (cyan first), sticky | The most visible thing in the sky. He does not like it. He keeps walking. |
| 3 | Nul's eye shut | a closed eye | hard lids, mirror | Nul holds the eye shut from the inside, so the dark can only follow the light it is shown. |
| 4 | Vitra relit | twin suns | explosives, two fans, ×2 | At Vitra a Gleaner delivers. The Keepers watch the glass warm. |
| 5 | The Grey Moon | a crescent | ice | The one place in the sky with nothing to eat. |
| 6 | The pod's cradle | the pod | steel, a regen sprout, grow | Lys plants a light-seed where an egg was. Something on the Grey Moon is growing. |
| 7 | Gleaner's rest | a dark moon | a black hole in a steel throat, five lives | A tool that has finished its work settles into the dust and goes quiet. |
| 8 | A name | a moon in a ring of stars | keys and locks, rails | Kal gives the moon its name. Hush. |
| 9 | The last pane | one pane in a steel frame | sticky, descend | The dome has been three panes from closed for a year. Kal sets the last one. |
| 10 | Two suns, three geckos | three geckos on the glass | everything: locks and a key, explosives, regen, bumpers, a guard, shrink, ice, ×3, three lives, the narrowest paddle, five minutes | Home is where they are. He is home, and so is the road. |

### Authoring the campaign

Every episode lives in code, in `game/breakout/levels/story/` (Gecko Legacy included since its ten-wall rewrite; its first four chapter slugs were kept so early clears survive). Each wall is an ASCII map plus a legend (`wall(map, legend, top)` in `shape.ts`; the brick width follows the column count, so 8 to 11 columns all span the field). `pnpm story:seed` validates every wall, proves it with the flawless autopilot, rates its difficulty, uploads the episode photo to Cloudinary when configured, and upserts episodes and chapters by slug. Seeded episodes are owned by the code; `--dry-run` only proves and rates, `--retire <slug>` backs up and removes a hand-made episode. Episode covers are the same-origin JPEGs in `public/backgrounds/`; the Season 2 and 3 covers were derived from the Season 1 art with Cloudinary's generative background replacement (`e_gen_background_replace`), so Kal keeps the same silhouette from one sky to the next.

### Difficulty rating

`rateDifficulty(level)` (`game/breakout/engine/difficulty.ts`) measures a wall instead of guessing: the flawless autopilot proves it, then fallible pilots (skill 0.97 — a good player who still fumbles — and 0.94, an average one) play a fixed set of seeded games. Their clear rate and mean clear time become a 0–100 score and a tier: Gentle, Easy, Fair, Hard, Brutal — or Unproven when the flawless pilot cannot clear it. Deterministic everywhere. The admin editor shows it live (`components/difficulty-meter.tsx`), computed in a Web Worker half a second after the last edit. Cold Orbit runs from about 7 to 40, Glass Sky from 20 to 45, and the later episodes climb to the high fifties on their boss and finale walls; the pilots do not see fog, do not misread mirrors or decoy portals, and undo inverted controls, so the late walls play harder for people than the number says.

## Showcase site

This repo starts as a **marketing site** for the game, not the game itself. It should feel like the product: a light glass page with one dark, glowing board on it, then a clear path to play.

**Light Glass, Neon Bricks** is the design system — Apple frost and soft color blooms, Airbnb editorial space, Revolut confidence — with the neon reserved for the bricks and the board aura. The same tokens drive the game UI so we do not redesign later.

Cheap on purpose: CSS/SVG, one Canvas 2D element for the board, Geist, one accent, six neons, no paid assets. See `AGENTS.md` for the full policy.

## Game engine

The board on the home page is not a video. It is the real engine playing real levels in `game/breakout/`, rotating through the showcase set, with an autopilot on the paddle until you move over the board and take it (`?level=n` opens a given level):

- `game/breakout/engine` — deterministic, fixed-step (240 Hz) game with a seeded PRNG: `Game` owns lives, score, multi-ball, every piece's behavior, the rules, and the speed model (`bonus × ramp × heat`). `Autopilot` is a seeded paddle AI used for demos; `proveClearable` runs it flawlessly as the publish gate.
- `game/breakout/engine/catalog.ts` — the piece catalog: names, blurbs, glyphs, costs. The editor and the site read it; the validator prices levels with it.
- `game/breakout/engine/level.ts` — the level API the editor will call: `createLevel({...}).background("/photo.jpg").brickRows({...}).zone("gravity", x, y).portal(x1, y1, x2, y2).bumper(x, y).rules({ timer: 240 }).build()`. Validation runs on `build()`.
- `game/breakout/levels/` — the showcase levels: *First Light* (the classic wall), *Undertow* (portals, magnets, ghosts, a fan, a descending wall), *Lockdown* (keys and locks, explosives, regen, rotors, a guard, a split zone, a black hole, a timer). `levels/story/` holds the Story episodes authored in code (see above).
- `game/breakout/engine/difficulty.ts` — `rateDifficulty`: proof plus fallible-pilot sampling, one 0–100 score and a tier. `preview/difficulty.ts` runs it in a Web Worker for the editor.
- `game/breakout/render` — Canvas 2D: photo + frame painted once per resize, neon glass bricks as cached glow sprites (one per kind), zones and obstacles drawn as shapes, balls with trails and speed auras, glass paddle with mod colors, particles.
- `game/breakout/preview` — browser mount: DPR cap, resize, off-screen and hidden-tab pause, reduced motion, and pointer/touch paddle control.
- `game/plinko` — the earlier vertical trap-board engine, kept intact and unmounted.
- `game/shared` — PRNG and color helpers shared by every engine.

Zero runtime dependencies beyond React.

## Earn — walls built by players

Earn is the second mode after Story, unlocked at player level 5. Any player can publish a wall: name it, pick a sky (their own photo or one of twenty gradients), build it in the same editor the Story chapters use, and put it on sale once the robot has proved it clearable and rated it 0–100. Every wall carries a ticket price in **gems**, the game's currency; a player pays the ticket to try it, and bringing the wall down pays a pot in **ETH** to their balance — 150% of the ticket's value, once per wall, never on their own map. ETH accrues until the withdrawal threshold and is sent by hand from the admin space.

The store is a Netflix-style floor: a sticky strip with the wallet and "Create my map", the admins' featured shelf, the most played, and every wall in an infinite grid you can sort by plays, date, pot, or difficulty. Each card is the live board playing itself, with the difficulty tier, the play count, the ticket, and the pot. Both balances sit in the game header as a bag pill beside the level; its "+" (and every "Top up gems" button) slides the gem shop up as a sheet over the current page — packs from 100 to 10,000 with degressive discounts set by the admin, paid through Stripe Checkout, which sends the player back to the same page where the pack lands with a counter and a fanfare. The admin space (`/admin/dashboard`) has the stats, the economy form (gem price, ETH reference, multiplier, thresholds, packs), map curation, players, and withdrawals.

The store has its own music (Arcade — a driving anthem) and a run has its own (Pursuit — a chase in the level's key that tightens as lives go and heat climbs); both are synthesized live like everything else, no samples.

## Getting started

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Sign in with Google

Auth is Auth.js with the Prisma adapter on MongoDB. "Continue with Google" is one button for new and returning players: the adapter creates the `User` (plus a `google` `Account`) on first use and finds the same player by Google account afterwards. An existing email/password account with the same verified email is linked instead of duplicated. The button only renders when both `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` are set.

To register the app on Google's side: in [Google Cloud Console](https://console.cloud.google.com/) create a project, set up the **OAuth consent screen** (External, scopes `email` / `profile` / `openid`), then add an **OAuth client ID** of type **Web application** with the authorized redirect URI `{AUTH_URL}/api/auth/callback/google`. Google only allows plain `http://` on `localhost`, so develop on `http://localhost:3333` (not a `*.local` host) and add the `https://` production URI as a second entry. Copy the client ID and secret into `.env`. While the consent screen is in "Testing", only the listed test users can sign in; publish it to open it to everyone.

Engine checks live outside the repo; the pre-commit hook runs `pnpm build`. `pnpm story:seed --dry-run` proves and rates every Story wall without touching the database.
