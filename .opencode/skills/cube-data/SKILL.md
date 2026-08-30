---
name: cube-data
description: Use when fetching or processing CubeCobra cube data — lists, boards, card rows, or card stats — to keep raw payloads out of agent context. Covers which CubeCobra MCP tool to use for which need, the fetch-once-then-cache pattern, and local filtering so only small derived slices reach the caller.
---

# Cube Data

CubeCobra payloads are big: full cube JSON is ~2.7MB, plaintext/CSV exports are
100KB+. Pulling raw payloads into agent context burns tokens and truncates.
The rules below keep only small, derived slices in context.

## Tool selection

| Need | Tool | Payload |
|------|------|---------|
| Compact per-board card rows | `get_cube_board` (board=mainboard/maybeboard/basics, optional `fields`) | ~70KB for a full 333-card board (default fields); ~200KB with `oracle_text` |
| Just names, one line per card | `get_cube_list` | tiny |
| Cube metadata, no cards | `get_cube_metadata` | small |
| Board-labeled text export | `get_cube_plaintext` | medium |
| Per-card games/wins | `compute_card_stats_for_cube` | small-to-medium, pre-aggregated |
| Full unfiltered JSON | `get_cube_json` | ~2.7MB — **avoid; never route into context** |
| Ground-truth counts (lands, types, colors) for a claim/decision/bank entry | direct CSV download via `bash` (see "Ground truth counts" below) | ~60KB, written straight to disk |

`get_cube_board` is the workhorse. Default fields are name, type, cmc, colors,
color_identity, rarity, scryfall_uri. Add `oracle_text` only when rules text is
actually needed — it roughly triples the payload (a full board with oracle text
is ~200KB / ~50k tokens, not a light fetch). Use `limit` for a quick peek.

## Fetch-once pattern

Never fetch the same cube twice in a session. First fetch caches; everything
after works from the cache.

1. Fetch once with `get_cube_board` (or the matching tool above).
2. If a full-board dump is needed for repeated slicing, write it once to a
   local cache file (e.g. `C:\Users\andre\AppData\Local\Temp\opencode\<shortId>-<board>.json`)
   and filter from disk with local tooling afterwards.
3. Every subsequent access reads the cache — never refetch.

## Filtering

Filter server-side when the tool supports it (`fields`, `limit`). For anything
else, filter the cached file locally (grep/line scans) and return only the
matching rows. When the caller only needs a subset (e.g. "cards with
color_identity U"), hand back the subset, not the whole board.

## Ground truth counts — verifying totals before they get stated or persisted

Aggregate/derived tools (`analyze_cube_structure` and similar summary views)
are convenience gut-checks, not verified ground truth. They can drift from
the actual card list — observed case: `analyze_cube_structure`'s "lands"
total undercounted a 432-card cube by 2 because it miscategorized a couple of
colorless-identity lands (no color pips in their text, e.g. fetches and
colorless utility lands) into the color-total bucket instead of the lands
bucket. **Never state a count as fact to the user, or persist one into
`decisions.md`/`stats.md`, without cross-checking it against raw card data.**

Do NOT get that raw data by copying a large tool-call result out of your own
context and retyping it into a cache file via `write` — past a couple dozen
rows this risks a silent transcription drop (a lost row is exactly the
silent-error failure mode the Cardinal Rules below warn about), and it did
happen during a 432-row hand-copy.

Instead, download the cube's CSV export **directly to disk** with `bash`,
which is a plain HTTP GET against CubeCobra's public export endpoint — the
response is written straight to the file with no transcription step through
agent context:

```powershell
Invoke-WebRequest -Uri "https://cubecobra.com/cube/download/csv/<shortId>" -OutFile "<tempdir>\<shortId>.csv" -UserAgent "Mozilla/5.0"
```

Then compute counts locally, e.g.:

```powershell
$csv = Import-Csv "<path>"
($csv | Where-Object { $_.Type -match 'Land' }).Count          # total lands
($csv | Where-Object { $_.Type -match 'Basic Land' }).Count    # basics
($csv | Where-Object { $_.maybeboard -eq 'false' }).Count      # mainboard-only
```

The CSV's `Type` column carries the exact type line (reliable for
land/creature/etc. filters), and `board`/`maybeboard` columns split
mainboard/maybeboard from a single fetch. This is strictly better than the
`get_cube_csv_export` MCP tool for this purpose — that tool parses rows and
returns them into context (same 100KB+ context-poison problem as other raw
payloads); the direct download keeps the data on disk where it belongs.
Delete the temp CSV when done, same as any other cache file.

`Type` is reliable — it's Scryfall's actual type line. **`Color` and `Color
Category` are not automatically reliable** — some cube owners manually
override these fields for design/display purposes (e.g., stripping a color
from a gold card's display so it sorts into a different "swimlane" that
reflects a functional-equivalence rule rather than literal mana cost;
observed case: a cube owner removed blue from Ux gold cards' Color field on
purpose). Before treating a cube's `Color` field as a card's actual castable
colors, check that cube's `identity.md`/`decisions.md` in the memory bank for
a documented override convention. If none is documented, or the classification
is decision-critical (you're about to state a card's color identity as fact,
or use it to judge castability), verify with `scryfall_get_card` directly
rather than trusting the export.

## Cardinal rules

- **Never** return full raw `get_cube_json` output in any digest — 2.7MB is
  context poison.
- Keep digests small: counts, names, URLs, and per-card rows only.
- Sanity-check counts: if a board has N cards and your output has N rows, say
  so. A dropped row is a silent error.
- Cache files are throwaway: no need to keep them in git; refresh when the cube
  changes.
