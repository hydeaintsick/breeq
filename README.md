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

### The episodes

Each episode is ten walls. One new idea per chapter, the ball a little faster each time, and XP that climbs with the stakes. Episodes 4 to 8 are where the kit stops arriving and starts combining: every wall after Glass Sky mixes pieces the player already knows, and the black hole, the guards, ice and the timer come back in harder company. The difficulty rating (below) peaks at each episode's boss and finale — about 50 in Empty Nest and Lumen Reef, 40 in Ashen Court, and close to 60 for the last walls of The Hush and Second Sun.

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

### Authoring the campaign

Every episode lives in code, in `game/breakout/levels/story/` (Gecko Legacy included since its ten-wall rewrite; its first four chapter slugs were kept so early clears survive). Each wall is an ASCII map plus a legend (`wall(map, legend, top)` in `shape.ts`; the brick width follows the column count, so 8 to 11 columns all span the field). `pnpm story:seed` validates every wall, proves it with the flawless autopilot, rates its difficulty, uploads the episode photo to Cloudinary when configured, and upserts episodes and chapters by slug. Seeded episodes are owned by the code; `--dry-run` only proves and rates, `--retire <slug>` backs up and removes a hand-made episode. Episode covers are the same-origin JPEGs in `public/backgrounds/`; the Season 2 covers were derived from the Season 1 art with Cloudinary's generative background replacement (`e_gen_background_replace`), so Kal keeps the same silhouette from one sky to the next.

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

## Getting started

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Sign in with Google

Auth is Auth.js with the Prisma adapter on MongoDB. "Continue with Google" is one button for new and returning players: the adapter creates the `User` (plus a `google` `Account`) on first use and finds the same player by Google account afterwards. An existing email/password account with the same verified email is linked instead of duplicated. The button only renders when both `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` are set.

To register the app on Google's side: in [Google Cloud Console](https://console.cloud.google.com/) create a project, set up the **OAuth consent screen** (External, scopes `email` / `profile` / `openid`), then add an **OAuth client ID** of type **Web application** with the authorized redirect URI `{AUTH_URL}/api/auth/callback/google`. Google only allows plain `http://` on `localhost`, so develop on `http://localhost:3333` (not a `*.local` host) and add the `https://` production URI as a second entry. Copy the client ID and secret into `.env`. While the consent screen is in "Testing", only the listed test users can sign in; publish it to open it to everyone.

Engine checks live outside the repo; the pre-commit hook runs `pnpm build`. `pnpm story:seed --dry-run` proves and rates every Story wall without touching the database.
