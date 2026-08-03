---
name: memory-bank
description: Use when working with the persistent cube memory bank in `memory/` — loading a cube's context for a work session, starting a new cube, or recording design decisions, package changes, stats digests, and backburner ideas. Use whenever the user names a cube to work on or says they're starting a new cube.
---

# Memory Bank

The memory bank persists knowledge about each cube across opencode sessions.
The cube list itself lives on CubeCobra; the bank holds everything else —
identity, constraints, packages, decisions, stats digests, and backburner
ideas.

## Storage layout

```
memory/
  INDEX.md                  # manifest: cube → shortId → dir, one-line identity, bootstrap date, last modified
  <cube-dir>/
    identity.md             # identity, philosophy, size/format, constraints, CubeCobra link
    packages.md             # package matrix (play patterns, support, pairing)
    decisions.md            # chronological cut/add/design decisions with rationale
    stats.md                # dated record/stats analysis digests
    backburner.md           # pending card ideas, candidate swaps, experiments
```

- `<cube-dir>` is a slug of the cube's name.
- The CubeCobra `shortId` is the durable key for fetching and resolution; the
  human-readable name in INDEX is only a convenience label.

## File templates

Each file follows a fixed template. Preserve these headings and field names
exactly so the bank stays consistent across sessions.

### INDEX.md

```markdown
| Cube | shortId | Dir | Identity | Bootstrapped | Last modified |
|------|---------|-----|----------|--------------|---------------|
| <Name> | <shortId> | <slug> | <one-line identity> | <YYYY-MM-DD> | <YYYY-MM-DD> |
```

### identity.md

```markdown
# <Cube Name>

- **CubeCobra shortId:** <shortId or "not on CubeCobra yet">
- **CubeCobra link:** <https://cubecobra.com/cube/list/<shortId> or "—">
- **Size:** <360/540/720/...>
- **Format:** <draft/sealed/...>

## Identity

<1-3 sentence elevator pitch>

## Power level & philosophy

<peasant / mid-power / legacy-lite / powered / custom; bans and brackets>

## Design constraints

- <anything that tightens Scryfall searches: set/era restrictions, budget
  ceiling, color-pair rules, no infinite combos, ...>

## Hard no's

- <cards or patterns never wanted>
```

### packages.md

```markdown
# Packages

A package is a self-contained bundle of cards that supports a specific play
pattern without committing to a full archetype. Decks blend packages.

| Package | Play pattern | Colors | Enablers | Payoffs | Support level | Pairs with | Competes with |
|---------|--------------|--------|----------|---------|---------------|------------|---------------|
| <name> | <play pattern> | <colors> | <cards> | <cards> | <strong/moderate/weak> | <packages> | <packages> |
```

New cubes start with only the header and the empty table; rows are added as
packages are discovered during design work.

### decisions.md

```markdown
# Decisions

Newest first. Each entry: date, change, rationale.

## <YYYY-MM-DD>
- <change> — <rationale>
```

### stats.md

```markdown
# Stats & Record Digests

<new cubes: "No records analyzed yet.">

## <YYYY-MM-DD>
<digest of draft records / per-card stats analysis, referencing packages by name>
```

### backburner.md

```markdown
# Backburner

Pending ideas, candidate swaps, experiments. Move to decisions.md when acted on.

## <YYYY-MM-DD>
- <idea>
```

## Three workflows

### LOAD

Trigger: the user names a cube (by name or short ID) to work on.

1. Read `memory/INDEX.md`.
2. Resolve the cube — by `shortId` first, then by name.
3. Read only that cube's five files.
4. Report a 2–3 line state summary: identity, active packages, open questions.

Never load any other cube's files. If no cube is directed at session start,
load nothing — the bank sits idle. LOAD never edits the bank, so it does not
bump the cube's `Last modified` date in INDEX.

### START NEW CUBE

Trigger: the user says they're starting a new cube.

1. Run the bootstrap questionnaire below, one question at a time.
2. Create `<cube-dir>` with the five files from the answers. `packages.md`
   gets the header-only template, `stats.md` gets "No records analyzed yet.",
   `backburner.md` starts empty.
3. Add the cube's row to `INDEX.md` with `Last modified` set to today's date.
4. Dispatch `git-executor` to commit the new cube (working dir `D:\Cube`).

The cube is banked; nothing is loaded until the user names it for work.

### UPDATE

Trigger: a design decision point (a change agreed, an analysis completed) or
an explicit user request to record something.

1. Edit the relevant file: a package added/promoted/demoted in `packages.md`,
   a decided swap in `decisions.md`, a dated digest appended to `stats.md`, a
   backburner item added or moved.
2. Bump the cube's `Last modified` date in `INDEX.md` to today's date.
3. Keep each change small and scoped to the file it belongs in.
4. Dispatch `git-executor` to commit the change (working dir `D:\Cube`).

## Bootstrap questionnaire

Six questions, asked one at a time. Do NOT collect initial packages at
bootstrap — packages are discovered organically during design work.

1. **Name & link** — cube name and CubeCobra short ID, or "not on CubeCobra
   yet" (bank entry created; link added later).
2. **Size & format** — 360/540/720, draft or sealed, anything special about
   play.
3. **Identity / elevator pitch** — 1–3 sentences (feeds identity.md and the
   one-line INDEX entry).
4. **Power level & philosophy** — peasant, mid-power, legacy-lite, powered,
   or custom; bans/brackets (no Companions, no Planeswalkers, etc.).
5. **Design constraints** — anything that should tighten future Scryfall
   searches: set/era restrictions, budget ceiling, color-pair rules, no
   infinite combos.
6. **Out of scope / hard no's** — patterns or cards never wanted.

## Edge cases & policy

- **Named cube not in INDEX** — check CubeCobra (search or short ID) before
  assuming anything. If it exists but is unbanked, run a shortened bootstrap
  (identity + constraints) and bank it. If it does not exist, tell the user —
  never guess.
- **Rename on CubeCobra** — resolution is by short ID. Fix the INDEX label
  when a mismatch is noticed.
- **Ambiguous name** — list the INDEX candidates (name + short ID) and ask;
  never guess.
- **No cube directed at session start** — load nothing.
- **Git** — bank updates commit via `git-executor`. This is the sanctioned
  exception to "commit only when asked"; do not second-guess bank commits.
- **Scope** — never create new agents or MCP servers. Use the existing
  `archivist` and `git-executor` only.
