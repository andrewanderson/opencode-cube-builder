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
| Compact per-board card rows | `get_cube_board` (board=mainboard/maybeboard/basics, optional `fields`) | small (~70KB worst case, defaults much smaller) |
| Just names, one line per card | `get_cube_list` | tiny |
| Cube metadata, no cards | `get_cube_metadata` | small |
| Board-labeled text export | `get_cube_plaintext` | medium |
| Per-card games/wins | `compute_card_stats_for_cube` | small-to-medium, pre-aggregated |
| Full unfiltered JSON | `get_cube_json` | ~2.7MB — **avoid; never route into context** |

`get_cube_board` is the workhorse. Default fields are name, type, cmc, colors,
color_identity, rarity, scryfall_uri. Add `oracle_text` only when rules text is
actually needed — it roughly triples the payload. Use `limit` for a quick peek.

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

## Cardinal rules

- **Never** return full raw `get_cube_json` output in any digest — 2.7MB is
  context poison.
- Keep digests small: counts, names, URLs, and per-card rows only.
- Sanity-check counts: if a board has N cards and your output has N rows, say
  so. A dropped row is a silent error.
- Cache files are throwaway: no need to keep them in git; refresh when the cube
  changes.
