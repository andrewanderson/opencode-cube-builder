---
name: git-operations
description: Use when performing any git operation — committing changes, pushing to remote, checking repo status, reviewing diffs, staging files, or verifying what is or isn't tracked.
---

# Git Operations

Perform git tasks with the **minimum number of commands** — every extra command costs tokens. Batch independent checks into a single parallel call. Never explore the repo beyond what the operation requires.

## Golden Rules

- Never commit without explicit user approval for THAT commit — there is no
  auto-commit exception. When a commit is approved, push it.
- One command per operation. Do not re-run commands to "confirm" — trust git's output.
- Use `--short` and `--stat`: full `git diff` and full `git status` output waste tokens.
- Never read file contents to decide a commit message — the diff stat plus filenames is enough.
- Never run exploratory commands (`git ls-files`, `git branch -a`, `git config`, `git log` past the last few commits) unless the task explicitly needs them.
- PowerShell shows git's stderr in red even on success. Red text ≠ failure. Judge by the actual output, not the color.

## Command Recipes

### Check what changed (1 call, batched)
```powershell
git status --short; git diff --stat; git remote -v
```
Run these three together in a single parallel bash call. `git status --short` shows changed/new files; `--stat` summarizes hunks per file; `git remote -v` tells you if a push is even possible.

### Commit and push (3 commands total)
```powershell
git add -A
git commit -m "short imperative summary"
git push -u origin <branch>   # only if git remote -v showed a remote
```
Commit message style: imperative mood, ≤50 chars, matches repo conventions (e.g. `Add archivist agent config`). Skip `git push` entirely if there is no remote.

### Inspect recent history (1 call)
```powershell
git log --oneline -5
```
Only run this if the task requires knowing commit history.

## When Not To Use

- When you need to interactively resolve merge conflicts with editorial judgment — those need the full workflow, not the shortcut.
- This skill is for routine commits/pushes. Any deviation (force-push, amend, rebase, partial staging) requires asking first.
