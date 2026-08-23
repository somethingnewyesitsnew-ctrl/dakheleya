# TASK QUEUE

## Parent Request

No substantial multi-phase feature request has been made yet. The only work performed so far is
workflow infrastructure (TASK-001) and one small standalone change made before the workflow existed
(see Git history, commit `4fcb868` "Add current date to header" — not tracked as a task ID since it
predates this system).

## Implementation Plan

N/A — no active parent request with sub-task decomposition yet. When the user gives a substantial
request, it will be broken down here into `TASK-0NN.1`, `TASK-0NN.2`, ... sub-tasks per CLAUDE.md's
"Task Decomposition" section, each with its own acceptance criteria.

## Execution Status

TASK-001 (workflow installation) is COMPLETED. No other tasks are open.

---

## Record format for future tasks/sub-tasks

Use this format for every new entry (parent tasks and dotted sub-tasks alike):

```markdown
## TASK-0NN[.M] — Title

Parent Request:
TASK-0NN (if this is a sub-task) — or "—" if this task IS the parent/top-level request

Status:
PENDING | IN_PROGRESS | COMPLETED | BLOCKED | CANCELLED

Priority:
HIGH | MEDIUM | LOW

Description:

Acceptance Criteria:
-
-

Completed:
-

Validation:

Checkpoint:

Next:
```

---

## TASK-001
Title: Install persistent, interruption-safe Claude Code workflow
Status: COMPLETED
Priority: High (infrastructure)
Description: Create CLAUDE.md, `.claude/` state files, and `scripts/checkpoint.{sh,ps1}` so any
future Claude session can resume work in this repository from repository state alone, without
relying on conversation memory. No application code modified. Later extended in the same session
(see DECISION-002 in `.claude/decisions.md`) with GitHub-based task planning/decomposition rules,
dotted sub-task IDs, acceptance-criteria requirements, milestone-level checkpointing, a "protect
completed work" rule, and a full cross-session/cross-account Project Recovery procedure including
the "continue" command behavior.
Acceptance Criteria:
- CLAUDE.md exists and documents only verified project facts.
- `.claude/project-state.md`, `current-task.md`, `handoff.md`, `tasks.md`, `decisions.md`,
  `checkpoints/README.md`, `README.md` all exist.
- `scripts/checkpoint.sh` and `scripts/checkpoint.ps1` exist and are executable/functional.
- No file under `index.html`, `css/`, or `js/` was modified.
- Work committed to Git.

---

## TASK-002
Title: Remove the notification system and icon from the header
Status: COMPLETED
Priority: Normal (UI change)
Description: Remove the bell icon, its badge, and its dropdown from the top header
(`renderShell()` in `js/app.js`), along with the `updateNotifications()` function that populated
it and its call site in `router()`. Remove the now-unused `.notif-badge` CSS rule.
Acceptance Criteria:
- No bell icon/dropdown/badge remains in the header markup.
- `updateNotifications()` function and its call in `router()` are removed.
- `.notif-badge` CSS rule removed from `css/style.css`.
- Dashboard's separate "يحتاج انتباهك" (attention items) section on the Overview tab is
  untouched — it's a different feature built on the same `DataService.getAttentionItems()` data,
  not part of the header, and was out of scope for this task.
- `bi-bell` icon used elsewhere (vacation alerts card in `js/vacations.js`) is untouched — unrelated
  icon usage, not part of the header notification system.
- No other application files modified.
- Work committed to Git.

---

## TASK-003
Title: Make the workflow (CLAUDE.md) work correctly in a browser-based Claude Project without a local Git CLI
Status: COMPLETED
Priority: High (infrastructure / workflow)
Description: Update `CLAUDE.md` so the workflow no longer assumes a local `.git` directory or Git
CLI is always available. Added a new "Browser Project / Git Availability" section and made every
Git-dependent step elsewhere in the document (startup procedure, task completion criteria,
checkpoint system, interruption safety, new session protocol, Git workflow, session limit protocol)
explicitly conditional: use Git normally when available, and when unavailable, work from the
`.claude/` state files instead without ever fabricating Git status, commit SHAs, branches, or push
results. Also added an explicit `.claude/handoff.md` field format and a "Final Task Checkpoint
Report" format for reporting back to the user at the end of a task.
Acceptance Criteria:
- All pre-existing project-specific instructions in `CLAUDE.md` preserved (nothing removed).
- No application/business code (`index.html`, `css/`, `js/`) modified.
- No existing file deleted.
- No Git commit/SHA/branch/push information fabricated anywhere in the updated file.
- `.claude/` state files remain the primary persistent handoff mechanism regardless of Git
  availability.
- CLAUDE.md now documents: Git-available vs Git-unavailable behavior; mandatory persistent state
  read order; checkpoint behavior in both cases; task completion rules in both cases; interruption
  safety in both cases; a handoff.md field format; and a "Final Task Checkpoint" report format.
- Work committed to Git (this session had a working Git CLI against the cloned repository).

---

## TASK-004
Parent Request: REQ-001
Title: Finalize universal cross-session project continuity (request ledger, session log, session
recovery/health-check formalization)
Status: COMPLETED
Priority: High (infrastructure)
Description: Extend the existing workflow (without rebuilding or replacing it) by adding
`.claude/requests.md` (request ledger linking USER REQUEST → TASKS → CHECKPOINTS → FINAL RESULT),
`.claude/session-log.md` (one entry per Claude session that did meaningful work), and
`.claude/sessions/` (placeholder for larger per-session artifacts). Extend `CLAUDE.md` with: the
fuller `PROJECT RECOVERY` report format (Active Request / State Consistency fields) and a
STOP-on-contradiction rule; a "Cross-Account Continuation" section (detect/merge another session's
work, never force-push, never discard valid work); a "Checkpoint Frequency" section with a worked
example; a "Project Health" check format (HEALTHY/WARNING/BLOCKED); an "Authentication / Secrets"
section (never write tokens to any file); and an extended "Final Task Checkpoint Report" format
matching the new minimum persistent-information fields. No application code modified.
Acceptance Criteria:
- `.claude/requests.md`, `.claude/session-log.md`, `.claude/sessions/` all exist and are populated
  with real (not placeholder-only) content reflecting this repository's actual history.
- All pre-existing workflow files and instructions preserved — nothing deleted, only extended.
- No application/business code (`index.html`, `css/`, `js/`) modified.
- No secrets/tokens written to any tracked file.
- `CLAUDE.md` documents: request ledger usage, session log usage, the full session-recovery
  procedure with state-consistency checking, cross-account continuation rules, checkpoint frequency
  expectations, a project health check format, and authentication/secrets handling.
- A project health check was performed before starting implementation.
- Work committed to Git (if available) and pushed only if a token was supplied and the push
  actually succeeded.
Completed:
- All files above created/extended as described.
- Retroactively recorded REQ-001 (linking TASK-001–004) and SESSION-001 through SESSION-004 in the
  new ledger/log, since this history existed before the ledger did.
Validation:
- Manual: confirmed via `git status --short -- index.html css/ js/` that no application file was
  touched.
- Manual: grepped `CLAUDE.md` for leftover conflict markers / structural review of all section
  headers to confirm no duplication or contradiction was introduced.
- Manual: re-read `.claude/README.md`, `.claude/requests.md`, `.claude/session-log.md` for internal
  consistency with `tasks.md` and `current-task.md`.
Checkpoint: TASK-004 (this entry)
Next: Await the next user request; assign it a new `REQ-xxx` if substantial.

---

## TASK-005
Parent Request: REQ-001
Title: Document and standardize the confirmed browser-session git push method (session token, asked
once per chat)
Status: COMPLETED
Priority: High (infrastructure / workflow)
Description: Verify and formally document in `CLAUDE.md` that a Claude.ai browser chat session with
the code-execution sandbox enabled can clone/commit/push to this repo directly, using a GitHub token
supplied by the user once per chat session (not once per commit), used only transiently inside the
sandbox and never persisted to any tracked file. Added a "Confirmed working method" subsection under
"Browser Project / Git Availability" and updated "Authentication / Secrets" accordingly. Recorded as
DECISION-004.
Acceptance Criteria:
- CLAUDE.md documents the exact procedure: ask once per session, clone with token, do the work,
  commit, push, mask the token in all shown output, reuse for the rest of that session, remind the
  user to revoke/rotate the token at session end.
- No instruction anywhere claims a token should be re-requested on every commit within one session.
- No instruction anywhere claims this capability doesn't exist (superseding the earlier, incomplete
  answer given earlier in this same session's conversation).
- Token itself never written to any tracked file, commit, or `.claude/*` entry.
- `.claude/decisions.md` has DECISION-004 explaining the why or this change.
- Work committed and pushed to `origin/main` using the session-supplied token, verified via the
  push command's actual output.
Completed:
- Verified `git` + `api.github.com` reachability directly in the sandbox.
- Cloned the repo with the user-supplied token; confirmed history matches `session-log.md`.
- Updated `CLAUDE.md` (two sections) and added `DECISION-004`.
- This task entry, `current-task.md`, `handoff.md`, `project-state.md`, `session-log.md` updated.
Validation:
- Manual: re-read both edited `CLAUDE.md` sections for internal consistency with the rest of the
  document; confirmed no existing instruction was deleted, only extended.
- Manual: confirmed `git clone` succeeded and matched known commit history before proceeding.
Checkpoint: TASK-005 (this entry)
Next: Await the next real feature/bug request; the next session should reuse this confirmed method
without re-litigating whether it's possible.

---

<!--
  Add new tasks below using the same format. Keep them small enough that another Claude session
  could pick one up cold and finish it using only the repository + this file + current-task.md +
  handoff.md. When unrelated work is discovered mid-task, log it here as a new PENDING task instead
  of implementing it immediately. If the task belongs to a tracked user request, link it via
  "Parent Request: REQ-0NN" and make sure that REQ's entry in requests.md lists this task ID too.
-->
