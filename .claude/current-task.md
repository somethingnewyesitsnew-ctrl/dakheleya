# CURRENT TASK

## Task ID
TASK-003

## Title
Make the workflow (CLAUDE.md) work correctly in a browser-based Claude Project without a local Git CLI

## Status
COMPLETED

## Priority
High (infrastructure / workflow)

## Description
The workflow previously assumed a local Claude Code terminal with Git CLI always available
(`git status`, `git log`, commits, checkpoint scripts, etc. at every step). This task updates
`CLAUDE.md` so the same workflow works correctly when Claude is operating in a browser-based
Claude Project connected to this GitHub repository, where no local `.git` directory or Git CLI
may be present.

## Completed Work
- Added a new top-level `## Browser Project / Git Availability` section to `CLAUDE.md`, directly
  after the introduction, establishing the core rule: check whether Git CLI actually works before
  relying on it; if available use it normally; if unavailable, never claim the repo is missing or
  fabricate Git status/SHAs/branches/pushes — treat `.claude/*` as the persistent, authoritative
  state instead, and say explicitly that Git operations can't be performed.
- Made the following existing sections explicitly conditional on Git availability, without removing
  any pre-existing instruction:
  - Mandatory Startup Procedure (step 7: git status/log only if available)
  - Task Lifecycle / COMPLETED criteria (Git commit requirement now conditional)
  - Checkpoint System (checkpoint script only if Git available; `.claude/` files always updated)
  - Interruption Safety (commit/push only if Git available; `.claude/` files are the fallback)
  - New Session Protocol (git status/log only if available)
  - Git Workflow (whole section now scoped explicitly to "only when Git CLI is available")
  - Session Limit Protocol (commit/push steps now conditional)
- Added a new `## Handoff File Format` section specifying the exact fields `.claude/handoff.md`
  must contain at every checkpoint (Current Task, Status, Completed, Currently Working On, Last
  Completed Step, Files Changed, Validation, Known Issues, Blockers, Latest Git Information [only
  if verified], Exact Next Action).
- Added a new `## Final Task Checkpoint Report` section at the end of the file specifying the exact
  report format to give the user at the end of a task/checkpoint, including the requirement to
  explicitly say "Git CLI is unavailable in this Claude Project environment" rather than inventing
  a SHA when Git isn't available.
- Updated `.claude/tasks.md` with this TASK-003 entry.
- Updated `.claude/project-state.md` and `.claude/handoff.md` to reflect this checkpoint.

## Current Work
None — task complete as of this commit.

## Remaining Work
None for this task. Note: this task only updated the workflow documentation (`CLAUDE.md`) and
`.claude/*` state files — it did not change `.claude/README.md`, `.claude/decisions.md`, or the
checkpoint scripts, since the user's instructions didn't require changes there and the existing
Git-based checkpoint scripts (`scripts/checkpoint.sh`/`.ps1`) are still valid for the "Git available"
case as documented.

## Changed Files
- `CLAUDE.md` (modified — added Browser Project / Git Availability section; made Git-dependent
  steps throughout conditional; added Handoff File Format and Final Task Checkpoint Report sections)
- `.claude/tasks.md` (modified — added TASK-003 entry)
- `.claude/current-task.md` (this file — updated for TASK-003)
- `.claude/project-state.md` (updated for TASK-003)
- `.claude/handoff.md` (updated for TASK-003)

## Tests / Validation
This is a documentation/workflow change with no runtime behavior to exercise in a browser. Manual
validation performed:
- Re-read the full updated `CLAUDE.md` top to bottom to confirm every pre-existing instruction is
  still present (nothing was deleted, only extended/made conditional).
- Confirmed via `git diff --stat` that only `CLAUDE.md` was modified in that step (no application
  file under `index.html`, `css/`, or `js/` touched).
- Confirmed no file was deleted (`git status --short` shows only modifications, no deletions).
- Grepped the updated file to confirm no fabricated commit SHAs, branch names, or push claims were
  introduced.
- Git CLI **was** available in this working session (repository was cloned locally and worked with
  via a real `git` installation), so this checkpoint's own Git information below is verified, not
  assumed.

## Known Problems
None introduced by this task. Pre-existing known issues (no `.gitignore`, stray
`New Text Document (2).txt`, a defensive-code note in `residents.js`) remain unaddressed as they are
out of scope for this task.

## Blockers
None.

## Latest Commit
See `git log --oneline -5` at handoff time (this session had a working Git CLI; the commit for this
task follows the message `docs(TASK-003): make CLAUDE.md work in browser-based Claude Project
without local Git CLI`).

## Exact Next Action
Await the user's next feature/bug/workflow request. When given, create TASK-004 (or BUG-00X) in
`.claude/tasks.md`, set it here as the active task, and follow the standard lifecycle — including
checking Git CLI availability first per the new "Browser Project / Git Availability" section of
`CLAUDE.md`.
