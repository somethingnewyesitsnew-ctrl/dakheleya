# ARCHITECTURAL DECISIONS

Do not store secrets in this file.

---

## DECISION-001 — Adopt persistent Claude Code workflow scaffold without altering existing architecture

Date: See commit history (workflow installation commit)

Status: Accepted

### Decision
Install the CLAUDE.md + `.claude/` + `scripts/` workflow scaffold as pure additive documentation and
tooling. Do not introduce a build system, package manager, framework, or test runner as part of this
change, even though their absence limits automated validation.

### Why
The existing project is a working static HTML/CSS/vanilla-JS app with no build tooling. The task was
to add an interruption-safe workflow, not to re-architect the app. Introducing tooling not requested
by the user would violate the "do not modify application code / do not upgrade dependencies during
setup" rule in the workflow instructions themselves.

### Alternatives Considered
- Adding a lightweight test runner (e.g. plain Node scripts) to give "Validation" more teeth.
  Rejected for this task: out of scope, and no task required it.
- Adding a `.gitignore`. Rejected for this task: not required by the workflow instructions and not
  requested; noted as a known gap in `project-state.md` instead of silently fixed.

### Consequences
- Validation for all future tasks in this repo will remain manual (documented explicitly in
  CLAUDE.md) unless a future task explicitly adds tooling — which should itself be logged here as a
  new decision before implementation.

---

## DECISION-002 — Extend workflow with task planning, decomposition, and cross-session/cross-account recovery

Date: See commit history (workflow extension commit, after 5e10b47)

Status: Accepted

### Decision
Extend `CLAUDE.md` and `.claude/tasks.md` (additively — nothing removed) to add:
- A mandatory plan-before-coding step for substantial requests, persisted to `.claude/` before
  implementation starts.
- Dotted sub-task decomposition (`TASK-0NN.M`) for large requests, each with explicit acceptance
  criteria.
- Milestone-level checkpoint discipline (validate → update state files → commit/push) instead of
  only end-of-task checkpoints.
- A "protect completed work" rule requiring verification (not blind trust) of prior COMPLETED
  milestones before building on them.
- A full Project Recovery procedure for any new Claude session or Claude account opening this repo,
  plus explicit "continue" command behavior.
- A "Parent Request / Implementation Plan / Execution Status" framing at the top of `.claude/tasks.md`
  so a new session understands the original objective, not just isolated technical tasks.

### Why
The user supplied an explicit additional-requirements document mandating GitHub-based task planning
and reliable cross-session/cross-account continuation. This project has no other persistence layer
(no backend, no database — see DECISION-001), so the Git repository itself, via `.claude/`, is the
only viable place to store this execution state.

### Alternatives Considered
- Keeping planning entirely conversational (in-chat only). Rejected: violates the explicit
  requirement and the project's own "never depend on conversation memory" principle already
  established in DECISION-001's context.
- Creating a separate planning-only file outside `.claude/`. Rejected: the requirement explicitly
  names `.claude/tasks.md`, `.claude/project-state.md`, `.claude/current-task.md`,
  `.claude/handoff.md`, and `.claude/decisions.md` as the canonical persistent state; splitting
  planning elsewhere would fragment recovery.

### Consequences
- Future substantial requests will produce a visible task plan (with IDs and acceptance criteria)
  in `.claude/tasks.md` before any code is written, and that plan must be kept current as work
  progresses.
- Every meaningful implementation milestone — not just full task completion — now requires a state
  file update, and a commit when Git is available.
- Any future Claude session (or account) is expected to run the Project Recovery procedure first and
  report using the standardized `PROJECT RECOVERY` block before doing anything else.

---

## DECISION-003 — Add request ledger + session log; formalize state-consistency and cross-account rules

Date: See commit history (TASK-004 commit)

Status: Accepted

### Decision
Extend the workflow (additively, per an explicit "do not rebuild or replace" instruction) with:
- `.claude/requests.md` — a request ledger giving every substantial user request a `REQ-xxx` ID,
  linking it to the tasks it produced and their outcome.
- `.claude/session-log.md` — one `SESSION-xxx` entry per Claude session that did meaningful work,
  recording environment, starting checkpoint, work done, files changed, validation, and ending
  status — explicitly excluding any secrets/credentials.
- `.claude/sessions/` — a placeholder directory for per-session artifacts too large for the log.
- `CLAUDE.md` additions: a `State Consistency` field and explicit **STOP-on-contradiction** rule in
  the recovery report; a `Cross-Account Continuation` section (never assume sole-session status,
  never force-push, never discard another session's valid work); a `Checkpoint Frequency` section
  with a worked example showing checkpoints happen per-milestone, not per-request; a `Project Health`
  check format scoped to what this specific project actually has; an `Authentication / Secrets`
  section codifying the token-handling discipline already used in practice; and an extended
  `Final Task Checkpoint Report` with `REQUEST:`, `CURRENT WORK:`, `BLOCKERS:`, and
  `LAST CHECKPOINT:` fields.

### Why
This repository has already experienced a real cross-session divergence (SESSION-003's merge of
TASK-002/TASK-003 into TASK-001's extension) and a real cross-token-lifecycle push workflow (a fresh
token requested and stripped after every push). Both of those *ad hoc* behaviors are now made
explicit, repeatable rules rather than something each session has to rediscover. The request ledger
also closes a real gap: `.claude/tasks.md` tracks tasks, but nothing previously tracked the
*original user requests* those tasks came from, especially across the boundary of multiple sessions
worked on by different accounts.

### Alternatives Considered
- Folding request-tracking directly into `tasks.md` instead of a separate `requests.md`. Rejected:
  the instructions explicitly asked for a separate file, and keeping requests (the "why") separate
  from tasks (the "what"/"how") makes both easier to scan independently.
- Skipping the session log and relying on Git commit messages alone as the session record. Rejected:
  commit messages describe *what* changed, not environment/validation/ending-status context useful
  for a completely new session or account trying to understand *how* prior work was carried out —
  which was the explicit purpose given for this file.

### Consequences
- Every substantial future request should get a `REQ-xxx` entry before implementation starts, and
  every session that does meaningful work should get a `SESSION-xxx` entry before or as it ends.
- Recovery reports now include an explicit consistency check; a future session encountering
  contradictory state files must stop, resolve using the most recently verified evidence (Git
  history when available), and report the resolution rather than silently picking a side.
- Any future divergence with a remote/another session must be merged semantically, never force-pushed
  or blindly overwritten — this repository has already needed that once and is expected to again as
  multiple sessions/accounts continue to touch it.
