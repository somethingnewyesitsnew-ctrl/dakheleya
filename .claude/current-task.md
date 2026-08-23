# CURRENT TASK

## Task ID
None active — TASK-001 through TASK-005 are all COMPLETED. Awaiting the next request from the user.

## Most Recently Completed Task
TASK-005 — Document and standardize the confirmed browser-session git push method (session token,
asked once per chat, DECISION-004). Parent Request: REQ-001.

## Status
COMPLETED (all of TASK-001 through TASK-005)

## Summary of completed tasks

### TASK-001 — Install persistent, interruption-safe Claude Code workflow
Created `CLAUDE.md`, `.claude/` state files, `scripts/checkpoint.{sh,ps1}`. Extended in the same
session (DECISION-002) with task planning/decomposition rules, dotted sub-task IDs, acceptance
criteria, milestone-level checkpointing, "protect completed work", and a first version of the
cross-session/cross-account Project Recovery procedure. No application code modified.

### TASK-002 — Remove the notification bell/dropdown from the header
Removed bell icon, badge, and dropdown markup from `renderShell()` in `js/app.js`; removed
`updateNotifications()` and its call in `router()`; removed the unused `.notif-badge` CSS rule.
Dashboard's separate attention-items box, built on the same `DataService.getAttentionItems()` data,
was left untouched.

### TASK-003 — Make CLAUDE.md work without a local Git CLI
Added a "Browser Project / Git Availability" section to `CLAUDE.md`; made every Git-dependent
workflow step conditional on Git CLI availability; added "Handoff File Format" and an initial
"Final Task Checkpoint Report" section. No application code modified.

A real branch divergence between TASK-001's extension and TASK-002/TASK-003 (pushed by a different
session) was reconciled via a merge commit (`f923a1d`), combining both sides rather than discarding
either — see `.claude/session-log.md` SESSION-003 for the full detail.

### TASK-004 — Finalize universal cross-session project continuity
- Created `.claude/requests.md` (request ledger: `REQ-xxx` → tasks → checkpoints → outcome),
  `.claude/session-log.md` (one `SESSION-xxx` entry per session that did meaningful work), and
  `.claude/sessions/` (placeholder dir for larger per-session artifacts). Both new files were
  populated with real, retroactive content for REQ-001 and SESSION-001 through SESSION-004, not
  left as empty stubs.
- Extended `CLAUDE.md`:
  - Startup procedure now reads `requests.md` and `session-log.md` too.
  - "New Session / New Account Protocol" renamed/expanded to "Session Recovery (Project Recovery
    Protocol)" with `Active Request` / `State Consistency` fields in the report format, plus an
    explicit **STOP-on-contradiction** rule (identify the inconsistency, resolve using the most
    recently verified information — Git history when available — then report the resolution).
  - New "Cross-Account Continuation" section: never assume this session is the only active one;
    detect/merge another session's work; never force-push; never discard valid work.
  - New "Checkpoint Frequency" section with a worked `REQ-005` example showing checkpoints happen
    after each sub-task, not only at full-request completion.
  - New "Project Health" section defining a `HEALTHY / WARNING / BLOCKED` check format scoped to
    what this project actually has (no build/test tooling — confirming that absence *is* the check).
  - New "Authentication / Secrets" section codifying rules already being followed in practice
    (never write tokens to any file, never commit credentials, never claim a push succeeded without
    verifying the command's actual output).
  - "Final Task Checkpoint Report" extended with `REQUEST:`, `CURRENT WORK:`, `BLOCKERS:`,
    `LAST CHECKPOINT:` fields to match the new minimum persistent-information set.
- Updated `.claude/README.md`'s file table to include the three new entries.
- No application/business code (`index.html`, `css/`, `js/`) modified. No existing workflow file or
  instruction deleted — everything was additive or reorganized without loss of content.

### TASK-005 — Confirmed browser-session git push method
Verified the Claude.ai browser sandbox has a working `git` binary and network access to
`github.com`/`api.github.com`; cloned this repo using a user-supplied token; documented the
procedure (ask once per chat session, reuse for that session, mask the token in output, remind the
user to revoke it afterward) in `CLAUDE.md`'s "Browser Project / Git Availability" and
"Authentication / Secrets" sections; recorded `DECISION-004`. This corrects an earlier, incomplete
answer given mid-session that wrongly implied browser chat could never push to GitHub at all.

## Current Work
None.

## Remaining Work
None for TASK-001–005. The next real request should be logged as `REQ-002` (if substantial, with
its own task breakdown) or a standalone `TASK-006`/`BUG-001` (if small) — see `.claude/requests.md`
and `CLAUDE.md` → "User Request → Task Plan" for which applies.

## Changed Files (TASK-004 only)
- `.claude/requests.md` (new)
- `.claude/session-log.md` (new)
- `.claude/sessions/README.md` (new)
- `CLAUDE.md` (extended: Session Recovery, Cross-Account Continuation, Checkpoint Frequency,
  Project Health, Authentication/Secrets, extended Final Task Checkpoint Report, updated startup
  procedure read order)
- `.claude/README.md` (file table updated)
- `.claude/tasks.md` (TASK-004 entry added)
- `.claude/current-task.md` (this file)
- `.claude/handoff.md`
- `.claude/project-state.md`
- `.claude/decisions.md` (DECISION-003 added)

## Tests / Validation
No automated test suite exists in this repository (verified, unchanged fact). Manual validation
performed for TASK-004:
- `git status --short -- index.html css/ js/` returned empty — confirmed no application file touched.
- Reviewed all `CLAUDE.md` section headers (`grep -n "^## \|^### "`) to confirm no duplicate or
  contradictory sections were introduced and the document still reads coherently top to bottom.
- Re-read `.claude/requests.md`, `.claude/session-log.md`, `.claude/README.md` for internal
  consistency with `tasks.md`/`current-task.md`.
- Confirmed no secrets/tokens appear anywhere in the new or modified files.
- Performed the "Project Health" check itself (per the newly-added procedure) before starting
  implementation — reported HEALTHY.

## Known Problems
None introduced by TASK-004. Pre-existing, still unaddressed (out of scope for this task):
- No `.gitignore` in the repo.
- Stray empty `New Text Document (2).txt` in repo root.
- Possible leftover defensive code in `js/residents.js` (`openAddResidentModal`'s rent-autofill
  handler).
- `scripts/checkpoint.sh`/`.ps1` don't themselves detect Git's absence gracefully.

## Blockers
None.

## Latest Commit
See `git log --oneline -10` for the TASK-004 commit (and, if a token was supplied, confirmation that
it was pushed to `origin/main`).

## Exact Next Action
Await the user's next request. When given:
1. Check Git CLI availability and run the Session Recovery procedure if this is a new session.
2. If substantial: create a new `REQ-xxx` in `.claude/requests.md`, break it into tasks in
   `.claude/tasks.md` (linked back to the REQ), and persist the plan before implementing.
3. If small: log a single task/bug directly in `.claude/tasks.md`.
4. Set it as the active task in this file.
5. Implement only what that task requires.
6. Validate manually per `CLAUDE.md` → "Validation".
7. Update all state files at each meaningful milestone (not just at the end); commit/checkpoint/push
   when Git is available, and say so explicitly either way; add a `SESSION-xxx` entry to
   `.claude/session-log.md` for this session's work.
