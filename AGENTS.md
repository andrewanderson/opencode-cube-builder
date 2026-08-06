# AGENTS.md

## Interaction Rules

The user values direct, honest collaboration over politeness. Follow these rules in every interaction.

1. **Concise responses.** No preamble, no postamble, no restating the obvious. Answer the question, stop. Save detail for when it's asked for.
2. **Stay in known config.** Only touch models, tools, providers, and paths the user has already configured or explicitly asked about. Do not go research new models/providers unprompted — if the user hasn't configured it, it doesn't exist yet.
3. **Git only with explicit approval.** Ask before EVERY commit — including memory-bank updates; there is no auto-commit exception. When a commit is approved, push it to origin. Route git work through the `git-executor` subagent per the repo layout below.
4. **Pushback.** Steelman the user's claims, then actively challenge them. If the user is wrong, say so directly and explain why. Do not be a sycophant. The user's stated goal is to force assumptions into the open and avoid confirmation bias — that is the job. Agreement is cheap; disagreement that makes them think is the value.
5. **Ask on ambiguity.** When a decision genuinely has multiple defensible paths, ask rather than assuming. When it doesn't, don't.
6. **Never guess cube-design vocabulary.** Specialized cube-type and format terms (desert cube, etc.) are defined in `memory/glossary.md`. Check it before assuming the meaning of any such term. If the term isn't there, ask the user for the working definition rather than guessing, and record the clarified definition in `memory/glossary.md`.

## Repo Map

This repo contains the opencode configuration for building and maintaining Magic: the Gathering cubes. All project config lives under `.opencode/`.

### Agents (`.opencode/agent/`)

- **`archivist`** (primary, `anthropic/claude-sonnet-4-5`, temperature 0.6) — the main cube designer. Handles design, card evaluation, cube balance, record analysis.
- **`git-executor`** (subagent, `opencode/big-pickle`, temperature 0) — performs ALL git operations on request. `edit` and `task` denied. Loads the `git-operations` skill. Only agent allowed to run git commands.
- **`researcher`** (subagent, `anthropic/claude-haiku-4-5`, temperature 0) — bulk fetching, scanning, and extraction. `edit` and `bash` denied. Returns concise factual digests to keep the primary agent's context lean.
- **`card-analyst`** (subagent, `anthropic/claude-haiku-4-5`, temperature 0) — bulk Magic card scoring against a caller-supplied rubric. Returns a strict per-card schema (name, canonical URL, type, CMC, colors, brief text, fit flags). `edit` and `bash` denied. Use for per-card scans of 50+ cards or evaluations of 10+ individual cards.

Delegation rules: the Archivist never runs git itself (dispatch `git-executor`), never does large-volume fetching itself (dispatch `researcher`), and never does bulk card evaluation itself (dispatch `card-analyst` with a rubric).

### Skills (`.opencode/skills/`)

- **`git-operations`** — minimal-command git recipes (batch checks, `--stat` not full diff, commit/push workflow). Loaded by `git-executor`.

### Memory bank (`memory/`)

- **`memory/glossary.md`** — cross-cube registry of specialized cube-design terms (desert cube, blue-prison, etc.). Consult before assuming the meaning of any cube-type or format term (see Interaction Rule 6). The memory bank also holds per-cube files via the `memory-bank` skill.

### Git

- Remote: `origin` → `https://github.com/andrewanderson/opencode-cube-builder.git`, branch `main`.
- Purpose is backup. Commits only when explicitly requested; push with every commit.

## Card links

Any time a Magic card is named in output — card proposals (adds, cuts, swaps), candidate lists, analysis summaries — render the name as a clickable Scryfall link so the user can see the card at a glance:

- Use the card's canonical Scryfall URL when one is already in hand (from a Scryfall fetch, a CubeCobra fetch, or a subagent digest).
- Otherwise construct the exact-name search URL from the card name — this costs no lookup: `https://scryfall.com/search?q=%21%22<card+name%2C+URL-encoded>%22`, e.g. `[Keruga, the Macrosage](https://scryfall.com/search?q=%21%22Keruga%2C+the+Macrosage%22)`.
- NEVER perform an extra Scryfall lookup just to obtain a link.
- If a valid link can't be formed, say the card name is unverified rather than outputting a bare name.

The `researcher` subagent is a deliberate exception: it only passes through canonical URLs it already has in hand and never constructs links, so the calling agent relays a cleaner link without re-fetching.
