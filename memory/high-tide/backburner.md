# Backburner

Pending ideas, candidate swaps, experiments. Move to decisions.md when acted on.

## 2026-08-03

### Archetypes

**High-priority:**
- **High Tide storm** — namesake archetype. High Tide + untap spells (Turnabout, Frantic Search, Palinchron) + cantrips → storm kill (Brain Freeze) or infinite turns (Time Walk, Temporal Manipulation). Mono-U combo that rewards drafting Islands.
- **Tinker / artifact ramp** — cheat colorless fatties (Blightsteel Colossus, Portal to Phyrexia, Cityscape Leveler) via Tinker, Urza, Emry. Mono-U or Ux, doesn't need off-blue lands.

- **Standstill / Blueggro** — drop 1-drop (Delver, Ledger Shredder, creature-land), cast Standstill, ride to victory with free counterspells (Force of Will, Daze). Mono-U or Ux tempo.
- **Ninjas** — UB ninjutsu package. Classic evasion-into-value loop. Strong overlap with black.
- **Spell slinger** — cast-matters payoffs; overlaps naturally with storm. Ux or mono-U.
- **Draw-go control** — counterspells, card draw, bounce. Win cons should be shared with other archetypes (Tinker targets, reanimator payoffs, theft targets).
- **Self-mill** — Laboratory Maniac / Thassa's Oracle + self-mill engines (Mesmeric Orb, Thought Scour, Hedron Crab). UB or mono-U. Overlaps with mill on enablers.
- **Mill** — aggressive mill as a burn-style deck, not slow control. Glimpse the Unthinkable, Maddening Cacophony, Tasha's Hideous Laughter. UB.

**High-priority (theme, not full archetype):**
- **Island-matters / Islandwalk** — because Islands are the only basic and nearly every deck plays some, Islandwalk creatures are functionally unblockable against the whole table (not the usual narrow niche). Merfolk tribal, old Islandwalk creatures, and other Island-count payoffs (Vedalken Shackles) scale for free. Genuinely cube-specific strength — worth building out deliberately, not just a passing theme.

**Medium-priority:**
- **Reanimator** — UB. Self-mill and looting fill the yard; black reanimates fatties (Reanimate, Animate Dead, Necromancy). Shares finishers with Tinker; overlaps with self-mill on enablers.
- **Opposition / tokens** — Opposition + token generators (Sai, Third Path Iconoclast, Hard Evidence) to tap down opponent lands/creatures. Ux midrange/control lock. Overlaps with Polymorph on token enablers.
- **Polymorph** — token generators that aren't creatures (Hard Evidence, Shark Typhoon, planeswalkers) + Polymorph/Proteus Staff → flip into sole fatty. Payoffs should overlap with other archetypes (reanimator, ramp).
- **Upheaval** — float mana, bounce everything, redeploy threat. Anti-synergy with Islands (bounces your lands); only works if floating artifact mana. Needs testing or cut.
- **Steal / cast opponent's stuff** — one-shot theft as UB value, not a lock. Bribery, Control Magic, Treachery, Gilded Drake. Not Vedalken Shackles as the centerpiece (repeatable theft is oppressive; blue can't answer resolved artifacts).

**Skip:**
- **Stasis lock** — miserable to play against, requires heavy setup (Chronatog, Forsaken City, Capsize).
- **Stifle-Nought** — too narrow without fetchlands; Dress Down is fine as a card, not an archetype.
- **Donate / Illusions** — cute 1-of, not a pillar.
- **Boggles** — hexproof creatures are off-color; aura voltron is parasitic and you hate hexproof.

### Lands

- **High-value nonbasic lands** — lands that tap for 2+ mana (bounce lands: the four Ux guild bounce lands — Azorius Chancery, Dimir Aqueduct, Izzet Boilerworks, Simic Growth Chamber — fit the "must touch blue" constraint cleanly) and lands you can "pick up for value" (MDFCs already allowed per constraints; also cards where returning/picking up a land is part of a cost — needs sharpening once the land package is built).

### Card candidates

- **Tetsuko Umezawa, Fugitive** — consider for Ninja package (enables ninjutsu triggers, makes small creatures unblockable).
- **Traxos, Scourge of Kroog** — colorless beater for Tinker/artifact package. Caveat: enters tapped, only untaps by casting a historic spell that turn — needs enough artifact/legendary/Saga density to not be a brick.
- **Shipwreck Dowser** — Merfolk that recurs instants/sorceries on combat damage. Fits spellslinger/tempo, also ties into Island-matters (Merfolk).
- **Paradoxical Outcome** - Because it's cool
- **Electrostatic Infantry** - Spell slinging

### To procure

Named/flagged in analysis but not yet found in the physical stack or maybeboard — need to track these down.

- **High Tide** — the namesake card itself. Not yet in the maybeboard.
- **Standstill** — Standstill/Blueggro's namesake card.
- **Force of Will, Daze** — free counterspells the Standstill/Blueggro plan needs.
- **Glimpse the Unthinkable, Maddening Cacophony, Tasha's Hideous Laughter** — the named aggressive-mill payoffs.
- **Opposition** — the tap-lock namesake for Opposition/tokens; without it that package is just "a deck with tokens."
- **Polymorph, Proteus Staff** — the actual flip-into-a-fatty enablers for the Polymorph package.
- **Upheaval** — namesake card, still unresolved whether to keep or cut given the land anti-synergy already noted.
- **Bribery, Control Magic, Treachery, Gilded Drake** — the named one-shot theft payoffs for the Steal package.

### Structural questions (not decided)

- **Collect-'em-all / break singleton** — allow multiples of specific payoff cards (Rat Colony, Relentless Rats, Nagas, etc.)? Bigger structural call than a normal backburner item — affects draft-pack math and deckbuilding for anyone who opens those slots. Needs a dedicated conversation before deciding scope, not a quick yes/no.

## 2026-08-06

### Card-count-per-color budget (not decided — two options in play)

Working from the 292-nonland budget (432 total − 140 lands). Two real comparable cubes anchor two different hub:spoke ratios; need to pick one (or a point between) before locking color counts.

- **Option A — Drought ratio (~2:1 hub:spoke).** Modeled on [Desert Cube - Drought](https://cubecobra.com/cube/list/drought) (480 cards, 5c desert cube, Mountain-only basics): hub R=111 vs W60/U51/B53/G50 (avg ~53.5), ratio ≈2.1:1. Applied to our budget: **Blue ~100–110, each spoke (W/B/R/G) ~40–45, colorless ~25**.
- **Option B — parity ratio (~1.5:1 or less).** Modeled on two comparables: [Desert Island Cube [432]](https://cubecobra.com/cube/list/desertisland) (432 cards, U/B/R/G desert cube, no white, Island-only basics) where the hub color U=79 is actually the *smallest* color (B77/R84/G87) — near parity, no spell-count premium at all; and [Red vs. Blue Desert](https://cubecobra.com/cube/list/IzzRvBDes) (513 cards, dual-basic desert cube) where the two hub colors are exactly even (U=132, R=133). Both suggest the "everyone must draft this basic" effect comes entirely from the land base, not spell density. Applied to our budget: **Blue ~75–90, each spoke ~40–45, colorless ~20–25**.
- **Ruled out (not a candidate, kept as reference):** [Blue Cube "Islands-Only"](https://cubecobra.com/cube/list/Islands-Only) (382 cards) runs U=326 (~85%+), essentially mono-blue with a garnish of splash gold (a handful of BU/RU/GU cards, almost no mono off-color). Real precedent for max hub-dominance, but that cube's goal is a mono-color cube, not "4 real Ux archetype pairs with genuine off-color depth" — doesn't match High Tide's `packages.md`. Useful only as "what the extreme looks like," not a target.
- **Purged from consideration:** "Into the North: A Snow Desert Cube" (432, snow desert cube) — evenly balanced W53/U54/B54/R54/G57 with no dominant color at all. Not a hub design; not a useful comparable for this question. (Was mentioned in a prior session pass, never persisted to this file — flagging here only so it isn't reconsidered later.)
- **Demand-side sanity check (not a target, just context):** modeling pod composition directly from `identity.md`'s stated targets (1.5/8 mono-U, 6.5/8 split across the four Ux pairs, ~60/40 blue/off-color split within a Ux deck) implies blue should be ~67% of all colored spells played at a table — an ~8:1 ratio. Both real comparables above land far below this. The gap exists because a cube isn't dealt to one deck — packs are shared across 8 drafters, so sizing spell counts to raw play-rate starves spoke colors of the depth/variety needed for real archetype support and makes packs monotonous. Treat this 8:1 figure as a cautionary upper bound, not a candidate.
