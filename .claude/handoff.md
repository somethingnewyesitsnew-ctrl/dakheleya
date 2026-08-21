# HANDOFF

## Session Status
Complete — TASK-003 implemented and committed (this session had a working Git CLI).

## Active Task
None (TASK-003 completed; no new task queued)

## Task Status
COMPLETED

## Completed
- Added `## Browser Project / Git Availability` section to `CLAUDE.md`: check Git CLI availability
  at session start; use Git normally when available; when unavailable, never claim the repo is
  missing or fabricate Git status/SHAs/branches/pushes, and treat `.claude/*` as the persistent,
  authoritative state instead.
- Made every Git-dependent step elsewhere in `CLAUDE.md` explicitly conditional on Git availability:
  Mandatory Startup Procedure, Task Lifecycle completion criteria, Checkpoint System, Interruption
  Safety, New Session Protocol, Git Workflow (whole section scoped), Session Limit Protocol.
- Added `## Handoff File Format` section defining the required fields for `.claude/handoff.md`.
- Added `## Final Task Checkpoint Report` section defining the exact report format to give the user
  at the end of a task, including the required explicit statement when Git is unavailable.
- Updated `.claude/tasks.md`, `.claude/current-task.md`, `.claude/project-state.md` for TASK-003.
- Preserved all pre-existing instructions in `CLAUDE.md` — nothing removed, only extended.
- No application/business code modified. No files deleted.

## Currently Working On
Nothing — session complete.

## Last Completed Step
Committed TASK-003 changes to Git on `main` (Git CLI was available and used in this session).

## Current File
N/A

## Current Position
N/A

## Remaining
Nothing for TASK-003. Next session should wait for a new task from the user, and should first
check Git CLI availability per the new "Browser Project / Git Availability" section before assuming
Git commands will work.

## Changed Files
- `CLAUDE.md` (workflow doc updated — see current-task.md for full list of additions)
- `.claude/tasks.md`, `.claude/current-task.md`, `.claude/project-state.md`, `.claude/handoff.md`
  (state updated for TASK-003)

## Files Changed
Same as above — `CLAUDE.md` plus the four `.claude/` state files.

## Validation
Documentation-only change; no runtime behavior to test in a browser. Verified: full re-read of
`CLAUDE.md` to confirm nothing pre-existing was deleted; `git diff --stat` confirmed only
`CLAUDE.md` changed in that step (no `index.html`/`css/`/`js/` file touched); `git status --short`
confirmed no deletions; manually checked the new text for fabricated Git information (there is
none — all Git-specific claims are conditioned on "if available/if verified").

## Known Issues
- No `.gitignore` in the repo (not addressed — out of scope).
- Minor leftover-looking defensive code in `js/residents.js` (`openAddResidentModal`'s rent autofill
  handler) — still unresolved, noted previously, not part of this task.
- Stray empty `New Text Document (2).txt` in repo root — harmless, noted for possible cleanup.
- `scripts/checkpoint.sh`/`.ps1` still assume Git CLI is present when invoked; they are correctly
  scoped as "use only if Git is available" per the updated `CLAUDE.md`, but were not themselves
  modified to detect Git absence — if desired, a future task could make them fail gracefully with a
  clear message instead of a raw Git error when run without Git.

## Failures
None.

## Blockers
None.

## Latest Git Information
Git CLI was available in this working session (repository cloned locally via a real `git`
installation). Local `main` and `origin/main` were in sync at commit `fce3c8b` before this task's
changes were committed and pushed. See `git log --oneline -5` for the exact current state.

## Exact Next Action
When the user requests new work:
1. Read this file, `project-state.md`, `current-task.md`, `tasks.md`, `decisions.md`.
2. Check whether Git CLI is available in the current environment (per `CLAUDE.md`'s "Browser
   Project / Git Availability" section) before assuming `git status`/`git log` will work.
3. Create the new task entry in `.claude/tasks.md` (TASK-004, ... or BUG-001, ...).
4. Set it as the active task in `.claude/current-task.md`.
5. Implement only what that task requires.
6. Manually validate per CLAUDE.md's "Validation" section (no automated tests exist).
7. Update state files; commit/checkpoint/push only if Git is available, and say so explicitly
   either way.

## Important Notes
- This project has no build step, no package manager, no test suite.
- GitHub push requires a token supplied by the user for that session; never persist it anywhere.
- `CLAUDE.md` now explicitly supports both a local Git-CLI environment and a browser-based Claude
  Project environment without a local `.git` directory — always check which one applies before
  assuming Git commands will work.

## Updated
At TASK-003 completion commit — see `git log` for exact commit/date.
