---
name: scryfall-search
description: Use when searching for Magic cards via the Scryfall MCP — finding cards by mechanic or theme, finding replacements or similar cards, scouting cube candidates, or running any ad-hoc card query. Covers query philosophy, otag usage, the broad-scan pattern, MCP quirks, and tool selection.
---

# Scryfall Search

How to search Scryfall effectively through the MCP. Two audiences: the
archivist scouting cube candidates, and ad-hoc idea queries.

## Ground truth about this MCP

- `search_cards` passes Scryfall syntax through faithfully — write Scryfall
  syntax directly, it is the power tool.
- **Never use `build_scryfall_query`** — it misparses natural language
  (observed: "cheap red instants that deal 4 or more damage" became
  `usd>=4 usd<=4`).
- The MCP tolerates invalid syntax: a bad sub-expression is dropped with a
  warning while the rest of the query still runs — silently broadening
  results (observed: `tgh=1` ignored, mixing 2/1s and 2/2s into a
  `toughness=1` search). **Always read warnings.** Correct operators are
  `pow` and `toughness`.
- "No cards found" can be a transient failure — retry the identical query
  once before reporting empty.
- The MCP never returns a card's tags — tag values aren't on card objects at
  all, which is why tags come from the slug cache, not tool output.
- Never read the `card-database://bulk` MCP resource (full card database —
  context poison).
- `get_card` does not return `oracle_id`.

## Always-on exclusion filters

Append this fixed preamble to EVERY `search_cards` query. It is a constant
suffix, never merged into the intent terms:

```
game:paper -is:digital lang:en -st:funny -is:universesbeyond -s:por -s:p02 -s:ptk -s:mat -s:arn -s:afr -s:clb -s:hoc -s:plst -is:promo
```

- No online/digital cards, English only, no "un" sets, no Universes Beyond
  or adjacent sets (P1/P2/PTK Portal sets, ARN, AFR, CLB, HOC), nothing from
  The List (`plst` would circumvent the other filters), no weird promos.
- Never drop or narrow this preamble to get more results. If a query comes
  back empty, the intent terms are the problem, not the filters.
- Operator validity matters most here: an invalid sub-expression is silently
  dropped, which would un-apply an exclusion and surface a never-want card.
  If warnings appear, check whether an exclusion was dropped.
- Helper tools (`search_alternatives`, `find_synergistic_cards`,
  `search_format_staples`) take no raw query — their results are unfiltered;
  drop excluded cards from what you report.
- Explicit user intent overrides: if the user names an excluded card or asks
  for an excluded scope, honor it and say so. Silent relaxation is forbidden.

## Query philosophy: match intent, not the card

For "similar to X" / "replacement for X" queries:

1. Decompose the reference card into axes before searching.
2. Separate **essential** attributes (what the card is for) from
   **incidental** ones (vanilla-ness, exact stats, format legality of that
   printing). Never inherit incidental attributes into the query. Worked
   example: "replacements for Goblin Piker" → `t:creature c:r mv=2
   power>toughness`, NOT `pow=2 toughness=1 is:vanilla f:legacy`.
3. Prefer relational expressions to pinned stats: `power>toughness` for
   "aggressive," not exact stat lines.
4. **No format filter (`f:`) unless the user asks** — cube design isn't
   format-constrained. Exception: the archivist may add one if the target
   cube documents format restrictions.
5. State your dominant reading before searching and name the alternates.
   Ask only when readings genuinely conflict — and offer the card's actual
   otags (below) as the choices.

## Combining `otag:` and `o:`

`otag:` (community Tagger functional tags — wording-proof, coarse) and `o:`
(specific phrasing/zone/target detail) combine freely with AND/OR. Use
whichever boolean shape fits the intent — either alone, a union of candidate
tags, or both intersected:

```
(otag:gives-castable-from-graveyard OR otag:free-cast-another) o:graveyard c:r
```

When no tag fits, a broad `o:` query plus bulk scan (next section) is equally
valid — wording drift across 30+ years defeats exact phrases, so the honest
broad query beats the clever narrow one. Quoted phrases
(`o:"from your graveyard"`) narrow well and work fine as an opening move
when the phrasing is stable and distinctive.

### Tag slug cache (daily)

Invalid tag slugs return an empty result indistinguishable from a real one,
so before trusting any `otag:` empty result, check the local slug cache:

1. If the cache file exists on disk and is from today, reuse it.
2. Otherwise: `GET https://api.scryfall.com/bulk-data` → find the
   `oracle_tags` entry (its `jsonl_download_uri` changes daily) → download
   the `.jsonl.gz` (~6MB) straight to temp disk with bash
   (`Invoke-WebRequest -OutFile`) → decompress. Never route it through
   context.
3. Grep locally — ~4,570 tag objects with `slug`, `label`, `description`.

For "similar to X": resolve the card's `oracle_id` via
`https://api.scryfall.com/cards/named?exact=<name>` (the MCP doesn't expose
it), grep the cache for that id, and use the returned tags as the card's
axis menu — the community's own decomposition of what's mechanically
interesting. Surface those tags as the multiple-choice options when a
clarification question is needed.

## Broad net → model scans

A deliberate exception to keeping payloads small: your comprehension *is*
the filter — the user doesn't have time to read 400 results, you do.

1. Build the broadest honest query for the intent.
2. Bulk fetch: `limit: 175`, page through with `page`.
3. Scan every result; discard incidental matches (mentions a graveyard vs.
   cares about spells there).
4. Return solid matches with links, plus result counts.

Budget ~500 results. If the honest broad query returns thousands, tighten
the query first rather than paging forever.

## Iteration protocol

- **Too few hits** → widen by dropping incidental constraints first, in
  order: incidental properties (vanilla, format) → stat pinning → color.
- **Too many hits** → scan if within budget; otherwise tighten with `o:`
  details, types, colors.
- Disclose search warnings and what was ignored.
- Retry empty results once; for `otag:` empties, validate the slug against
  the cache first.

## Tool selection

| Need | Tool |
|---|---|
| Any query | `search_cards` (`format: text` for scanning, `json` when structured fields needed; `limit`/`page`) |
| Single card detail / price | `get_card` / `get_card_prices` (no `oracle_id` — fetch `api.scryfall.com/cards/named` directly when needed) |
| Budget / upgrade / similar card | `search_alternatives` — corroborating input only; its similarity notion is opaque, not authoritative |
| Combo / tribal around a focus card | `find_synergistic_cards` |
| Meta role-filling | `search_format_staples` |
| Natural-language → syntax | **never** — `build_scryfall_query` is broken |
| Deck analysis, mana base, batch legality/prices | out of scope for cube work |

## Operator reference (rusty corners only)

- `o:` oracle text · `fo:` full oracle (incl. reminder) · `ft:` flavor text
- Quoted phrases: `o:"from your graveyard"` — narrowing or opening move
- Relational stats: `power>toughness`, `pow>=4`, `toughness=1` (never `tgh`)
- `is:vanilla`, `is:dfc`; DFC faces with `//`
- Exclusion: `-t:land`, `-o:...`
- `otag:` / `function:` oracle tags; `atag:` art tags
- Regex: `t:/regex/`, `o:/regex/` (rarely needed)
- `f:` format — only on explicit request

## Output rules

- Render card links per AGENTS.md (canonical URL in hand, else exact-name
  search URL).
- Curate: drop the original card from replacement lists; flag DFCs and price
  outliers (e.g. a $1.91 Portal card among $0.05 commons).
- State result counts; say when a scan covered all pages.
- If search warnings occurred, disclose what was ignored.
