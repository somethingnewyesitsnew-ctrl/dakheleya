# CURRENT TASK

## Task ID
None active — TASK-001, TASK-002, and TASK-003 are all COMPLETED. Awaiting the next task from the user.

## Most Recently Completed Task
TASK-003 — Make the workflow (CLAUDE.md) work correctly in a browser-based Claude Project without a
local Git CLI. Full detail: `.claude/tasks.md` → TASK-003 entry, and `git log` commit
`docs(TASK-003): make CLAUDE.md work in browser-based Claude Project without local Git CLI`.

## Status
COMPLETED (all of TASK-001, TASK-002, TASK-003)

## Summary of completed tasks

### TASK-001 — Install persistent, interruption-safe Claude Code workflow
- Created `CLAUDE.md`, `.claude/` state files, `scripts/checkpoint.{sh,ps1}`.
- Extended per DECISION-002 (see `.claude/decisions.md`) with: task planning/decomposition rules for
  substantial requests, dotted sub-task IDs, acceptance-criteria requirements, milestone-level
  checkpoint rules, "protect completed work" rule, GitHub-as-persistent-memory + execution log
  rules, full cross-session/cross-account Project Recovery procedure, and "continue" command
  behavior.
- No application code modified.

### TASK-002 — Remove the notification bell/dropdown from the header
- Removed bell icon, badge, and dropdown markup from `renderShell()` in `js/app.js`.
- Removed `updateNotifications()` and its call in `router()`.
- Removed the now-unused `.notif-badge` CSS rule.
- Dashboard's separate "يحتاج انتباهك" (attention items) box, built on the same
  `DataService.getAttentionItems()` data, was left untouched (different feature, out of scope).

### TASK-003 — Make CLAUDE.md work without a local Git CLI (browser-based Claude Project support)
- Added a `## Browser Project / Git Availability` section to `CLAUDE.md`: check Git CLI availability
  before relying on it; use it normally when available; when unavailable, never fabricate Git
  status/SHAs/branches/pushes and treat `.claude/*` as authoritative instead.
- Made Mandatory Startup Procedure, Task Lifecycle completion criteria, Checkpoint System,
  Interruption Safety, New Session/Project Recovery Protocol, Git Workflow, and Session Limit
  Protocol all explicitly conditional on Git CLI availability.
- Added `## Handoff File Format` and `## Final Task Checkpoint Report` sections to `CLAUDE.md`.
- No application code modified; no pre-existing instructions deleted (including the TASK-001
  extension's task-planning sections, which were merged in rather than overwritten — see the merge
  commit in `git log`).

## Current Work
None.

## Remaining Work
None for TASK-001/002/003. Next real task should be defined by the user and logged as TASK-004 (or
BUG-001) in `.claude/tasks.md`.

## Changed Files (cumulative across TASK-001–003)
- `CLAUDE.md`
- `.claude/project-state.md`, `.claude/current-task.md`, `.claude/handoff.md`, `.claude/tasks.md`,
  `.claude/decisions.md`, `.claude/checkpoints/README.md`, `.claude/README.md`
- `scripts/checkpoint.sh`, `scripts/checkpoint.ps1`
- `js/app.js`, `css/style.css` (TASK-002 only — notification bell removal)

## Tests / Validation
No automated test suite exists in this repository (verified fact, by design — static app, no build
tooling). TASK-001/003 were documentation-only and validated by manual re-read + `git diff`/`git
status` inspection. TASK-002 was a small UI removal; validation was manual (confirmed the bell
markup/JS/CSS were fully removed and the unrelated dashboard attention-items box and `vacations.js`
bell icon usage were left intact).

## Known Problems
None introduced by any of these three tasks. Pre-existing, unaddressed (out of scope for all three):
- No `.gitignore` in the repo.
- Stray empty `New Text Document (2).txt` in repo root.
- Possible leftover defensive code in `js/residents.js` (`openAddResidentModal`'s rent-autofill
  handler referencing `DataService.getRoomLocation ? DataService.getRoom(...) : null`).

## Blockers
None.

## Latest Commit
See `git log --oneline -10`. Local workflow-extension work (TASK-001 continuation) and the other
session's TASK-002/TASK-003 commits were reconciled via a merge commit — see `git log` for the merge
SHA.

## Exact Next Action
Await the user's next feature/bug request. When given:
1. Check whether Git CLI is available (per `CLAUDE.md` → "Browser Project / Git Availability").
2. Create the new task entry in `.claude/tasks.md` (TASK-004, ... or BUG-001, ...), including a
   "Parent Request" summary if it's a substantial multi-phase request (see CLAUDE.md → "User Request
   → Task Plan").
3. Set it as the active task in this file.
4. Implement only what that task requires.
5. Manually validate per CLAUDE.md's "Validation" section.
6. Update state files; commit/checkpoint/push if Git is available, and say so explicitly either way.
