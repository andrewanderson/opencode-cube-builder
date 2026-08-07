# High Tide

- **CubeCobra shortId:** hightide
- **CubeCobra link:** https://cubecobra.com/cube/list/hightide
- **Size:** 432
- **Format:** draft (8 players, 18-card packs)

## Identity

A blue-prison desert cube where Islands are the only basic lands in packs. Blue mages swim in mana while other colors navigate dry land, scraping together blue-touched duals or colorless sources. Splashing blue is free; escaping it requires discipline and sacrifice.

## Vocabulary

- **desert cube** (see `memory/glossary.md`) — must draft your lands; no basic-land station after the draft
- **blue-prison** (see `memory/glossary.md`) — all basics are one color; other colors rely on that color's duals or colorless fixing

## Power level & philosophy

Mid-power in general, with some peaks. The most powerful cards live at non-blue (but blue is allowed power).

## Design philosophy: Blue as oxygen

**Blue is not one color among five — it is the default.** In a typical 8-player draft, 7–8 decks should touch blue. Non-blue decks are not explicitly supported; they may emerge as edge cases for expert drafters who navigate the scarce colorless fixing, but they are the exception, not the rule.

**Every archetype is Ux or mono-U.** The color pairs (WU, UB, UR, UG) define the *strategy*, not the mana base. Blue provides the mana (Islands are free), interaction (counterspells, bounce, card draw), and glue. The second color provides the *payoffs* — the most powerful threats and win conditions live at WU, UB, UR, UG, pulling drafters into those pairs.

**Islands are abundant; spells are contested.** Blue drafters don't fight over mana; they fight over *spells*. The draft tension is in the payoffs (bombs, synergy pieces, interaction), not the fixing. Islands wheel forever; the question is what you *do* with all that blue mana.

**Mono-blue is the exception, not the norm.** Target calibration: in an 8-player pod, only 1–2 drafters should end up truly mono-blue. The other 6–7 should each reach into at least one second color for payoffs — blue supplies the mana and interaction, but staying mono-blue forfeits the color pair's payoffs (the best threats/win-cons live at WU/UB/UR/UG, not mono-U). This is a quantitative target, not just a vibe — it will directly drive color density and manabase decisions (how many blue-touched duals per pair vs. mono-U playables) once the land package is built. Revisit this number when tuning fixing density.

## Removal philosophy

**Non-blue holds the premium removal.** Blue is intentionally weak at answering resolved threats — it leans on tempo (bounce, tap-down), card advantage, and counterspells instead of clean removal. Counterspell density should stay moderate; a deck that's all counterspells is un-fun for the opponent, so counters are a tool in blue's kit, not the whole kit.


## Mana cost equivalence (off-blue color count)

Because all non-basic fixing touches blue or is colorless — there is no WB, WR, WG, BR, BG, or RG dual anywhere in the format — casting difficulty is driven by the count of **distinct non-blue colors** in a card's cost, not its total color count:

- **0 non-blue colors** (mono-U): trivial, playable by any deck.
- **1 non-blue color** (mono-W/B/R/G, or any Ux gold card): identical difficulty. A Ux gold card needs exactly the same dual(s) as the mono-colored card of its off-blue color, since blue is already free (80 Islands + every dual taps for U). Treat Ux gold cards as full-strength playables of their off-blue color when counting color depth — not a discount, not a premium.
- **2 non-blue colors** (a non-blue gold pair like WB/WR/WG/BR/BG/RG, OR any 3-color card that includes U, e.g. WUB): the real stretch tier. Needs two distinct duals (e.g. UW + UB) regardless of whether U is in the cost — a WUB card is **not** harder to cast than a WB card in this land base; they are the same difficulty tier. This is the tier that should stay rare and be treated as the "expert edge case" territory the identity already calls out.
- **3 non-blue colors**: hardest tier, near-unplayable for most decks — needs 3 distinct duals.

Caveats: double/triple colored pips (e.g. 1WW) are a separate color-intensity issue, orthogonal to this — track per-card, not per-category. Ephemeral multicolor fixing (Treasures, one-shot search — already allowed under Design constraints) is a release valve at the 2-non-blue-color tier, softening it, not eliminating it.

## Design constraints

- No Universes Beyond cards (`-is:universesbeyond` in Scryfall searches)
- No UB-adjacent sets: AFR, ARN, MAT
- No funny sets (`-st:funny`)
- No double-faced cards (`-is:dfc`) except lands (MDFCs that are half land are fine)
- Land base: Islands only for basics; all other duals/fixing must touch blue or tap for colorless
- Multicolor/5-color fixing must be ephemeral (Treasures, one-shot search effects), never a permanent all-color land — reinforces land-drafting discipline as a core skill

## Hard no's

- None beyond the constraints above
