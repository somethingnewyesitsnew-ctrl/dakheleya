# CLAUDE.md — Project Workflow (dakheleya)

This file establishes a persistent, interruption-safe development workflow.

> If a Claude session stops unexpectedly at any moment, another Claude session must be able to
> enter this repository and continue the work without needing the previous conversation.
>
> The repository and Git history are the source of truth. Do not depend on conversation memory.

---

## Project Facts (verified from repository)

- **Name:** dakheleya — نظام إدارة الشراكة والداخلية (Partnership & Student-Housing Management System)
- **Type:** Static client-side web app. No build step, no bundler, no package manager, no backend, no database.
- **Language/UI:** Arabic (RTL), single-page app.
- **Entry point:** `index.html`
- **Stack:**
  - Bootstrap 5.3.3 (RTL) + Bootstrap Icons — loaded via CDN
  - Chart.js 4.4.4 — loaded via CDN
  - Google Fonts (Cairo) — loaded via CDN
  - Vanilla JavaScript (no framework, no TypeScript, no JSX)
- **Persistence:** Browser `localStorage` only, via `StorageService` in `js/data.js`. No server, no API, no real database.
- **File layout:**
  - `index.html` — shell, script tag load order
  - `css/style.css` — all styling
  - `js/data.js` — `StorageService` (localStorage abstraction) + `DataService` (business logic) + demo seed data
  - `js/app.js` — router, sidebar, header, shared modals/utilities (toast, kpiCard, confirmAction, etc.)
  - `js/dashboard.js` — dashboard tabs + Chart.js visualizations
  - `js/partners.js`, `js/residents.js`, `js/guests.js`, `js/services.js`, `js/vacations.js`,
    `js/expenses.js`, `js/assets.js`, `js/recurring.js`, `js/transactions.js`, `js/dormitory.js`,
    `js/reports.js`, `js/settings.js`, `js/tools.js`, `js/hubs.js` — feature pages, each registering
    functions on the global `Pages` object (e.g. `Pages.residents = function(container) {...}`)
- **Routing:** Hash-based router in `js/app.js` (`ROUTES` array + `router()`), with `LEGACY_ALIASES`
  redirecting old hashes to the consolidated tabbed pages.
- **No test suite, no linter, no type-checker, no build/deploy scripts exist in this repository.**
  Do not invent commands. Validation for this project means manually verifying the page loads and
  the relevant feature works (see "Validation" below).

---

## Mandatory Startup Procedure

Before starting any task, in this order:

1. Read `CLAUDE.md` (this file).
2. Read `.claude/project-state.md`.
3. Read `.claude/current-task.md`.
4. Read `.claude/handoff.md`.
5. Read `.claude/tasks.md`.
6. Read `.claude/decisions.md` when architectural decisions are relevant.
7. Run:
   ```bash
   git status --short
   git log --oneline -10
   ```
8. Inspect the current task and the relevant existing code.

Then briefly report:

```text
Current Task:
Status:
Last Checkpoint:
Latest Commit:
What is already completed:
What remains:
Exact next action:
```

Do not ask the user to explain previous work if the repository already contains enough information.

---

## Task System

Every meaningful unit of work has a unique ID: `TASK-001`, `TASK-002`, ... Bugs use `BUG-001`, `BUG-002`, ...

Tasks must be small enough that another session can continue them safely. Do not turn one task into
an uncontrolled multi-feature operation.

If unrelated work is discovered while working on a task:
1. Record it in `.claude/tasks.md`.
2. Do not implement it unless it is required for the current task.

### User request history

`.claude/tasks.md` must maintain the relationship between the original user request and the
implementation tasks it produced, via:
- **Parent Request** — the user's original request, summarized accurately.
- **Implementation Plan** — the task/sub-task breakdown.
- **Execution Status** — current progress against that plan.

This prevents a future session from seeing only isolated technical tasks without understanding the
original objective they serve.

## Task Lifecycle

```text
PENDING → IN_PROGRESS → CHECKPOINT → IN_PROGRESS → COMPLETED
```
or `BLOCKED` when progress cannot continue.

A task is **COMPLETED** only when:
- implementation exists
- relevant validation was performed (see "Validation")
- known problems are documented
- state files (`current-task.md`, `project-state.md`, `handoff.md`, `tasks.md`) are updated
- work is committed to Git

Never mark a task COMPLETED merely because code was written.

---

## User Request → Task Plan (for substantial requests)

Whenever the user gives a **substantial development request**, do not immediately start coding.

First:
1. Understand the user's request.
2. Determine the scope.
3. Inspect the existing implementation.
4. Break the request into logical implementation phases.
5. Create a task plan with unique IDs (see "Task Decomposition" below).
6. Define acceptance criteria for each phase.
7. Identify dependencies between phases.
8. Save the plan to `.claude/tasks.md` (including the "Parent Request" summary — see
   "User Request History" below).
9. Save the overall plan/state to `.claude/project-state.md`.
10. Set the first active task in `.claude/current-task.md`.
11. Update `.claude/handoff.md`.

Then show the user the plan briefly. **Only start implementation after the plan has been persisted
to these files** — not just described in chat.

Small requests (a single clear bug fix, a one-line change, a well-scoped small feature) do not need
this full planning ritual — just log them as a single task and proceed. Use judgment: if a request
would naturally take one sitting and touches one coherent area, one task is enough.

## Task Decomposition

Large requests must be divided into small, independently recoverable milestones using dotted sub-task
IDs under a parent task, e.g.:

```text
TASK-010 — Room & Bed Management            (parent)
TASK-010.1 — Data model
TASK-010.2 — Floor management
TASK-010.3 — Room management
TASK-010.4 — Room types
TASK-010.5 — Bed management
TASK-010.6 — Pricing
TASK-010.7 — UI integration
TASK-010.8 — Validation
TASK-010.9 — Final integration
```

The exact breakdown must depend on the actual project and request — do not invent sub-tasks merely to
increase the task count. Each sub-task must represent a meaningful implementation milestone with its
own acceptance criteria (see the record format in `.claude/tasks.md`).

## Task Acceptance Criteria

Every task (and every sub-task) must contain explicit, checkable acceptance criteria, e.g.:

```text
TASK-010.3 — Room Management
Acceptance Criteria:
- User can create a room.
- User can edit a room.
- User can delete a room when safe.
- Room has a unique identifier.
- Room belongs to a floor.
- Existing data is not corrupted.
- Relevant validation succeeds.
```

Do not mark a task COMPLETED until its acceptance criteria have been verified (per this project's
manual validation procedure — see "Validation").

## Checkpoint System

Assume this session may stop unexpectedly at any moment. Create checkpoints:
- before risky changes
- after meaningful implementation milestones
- after important bug fixes
- before handing work to another session
- when the user asks for a checkpoint
- whenever the session appears close to its usage limit
- before ending a long task

A checkpoint must preserve: Current Task, Current Status, Completed Work, Current Work, Remaining
Work, Changed Files, Tests/Validation, Known Problems, Blockers, Latest Commit, Exact Next Action —
persisted into `.claude/current-task.md`, `.claude/project-state.md`, and `.claude/handoff.md`.

Use `scripts/checkpoint.sh` (or `scripts/checkpoint.ps1` on Windows) to create a checkpoint commit:
```bash
./scripts/checkpoint.sh TASK-001 "short checkpoint description"
```

### After every meaningful implementation milestone

Do not wait until an entire (possibly multi-part) user request is fully completed before saving
progress. After each milestone/sub-task:
1. Validate the work (per this project's manual "Validation" procedure).
2. Update the task's status.
3. Update `.claude/current-task.md`.
4. Update `.claude/project-state.md`.
5. Update `.claude/handoff.md`.
6. Update `.claude/tasks.md` (mark the sub-task COMPLETED, note what's next).
7. Record what was completed, what remains, and the exact next action.
8. If Git is available: commit the checkpoint, and push when appropriate.

If Git functionality is unavailable in the environment, still update all state files — record
`Git Status: UNAVAILABLE IN CURRENT ENVIRONMENT` rather than fabricating a commit/push.
**Never claim a commit or push occurred unless it was actually performed.**

### Protect completed work

Before starting a new milestone:
1. Verify the previous milestone's work actually exists in the repository (don't just trust its
   status label).
2. Do not recreate or rewrite completed functionality unnecessarily.
3. If a previous milestone is marked COMPLETED but the implementation is missing or broken:
   - Do not silently mark it complete / do not silently "fix" it without saying so.
   - Report the inconsistency to the user.
   - Create a bug task (`BUG-xxx`) if necessary.
   - Fix it before depending on it for further work.

---

## Interruption Safety

- Never keep critical information only in conversation.
- Never assume you will be able to continue the current conversation.
- Persist important state to files.
- Commit meaningful completed work.
- Push checkpoints when appropriate — **never claim a push succeeded unless the command actually succeeded.**
- Never delete existing work just to make the repository clean.

If uncommitted changes already exist when a session starts:
1. Inspect them.
2. Determine whether they belong to the current task.
3. Preserve them — do not reset or stash them automatically.
4. Report them.

Recovery for the next session = `git status` + `git log` + `project-state.md` + `current-task.md`
+ `handoff.md` + `tasks.md`.

---

## New Session / New Account Protocol (Project Recovery)

This applies to **any** new Claude session opening this repository, including a different Claude
account. The FIRST action must be project recovery, before asking the user what to do.

1. Read `CLAUDE.md`.
2. Read `.claude/project-state.md`.
3. Read `.claude/current-task.md`.
4. Read `.claude/handoff.md`.
5. Read `.claude/tasks.md`.
6. Read `.claude/decisions.md` when relevant.
7. Inspect the available repository files.
8. If Git CLI is available:
   - inspect current branch
   - inspect `git status --short`
   - inspect `git log --oneline -10`
9. Determine the latest completed milestone.
10. Determine the active task.
11. Determine the exact next action.

Then report using this structure:

```text
PROJECT RECOVERY

Parent Request:
Current Task:
Completed:
Current Progress:
Last Checkpoint:
Remaining:
Next Action:
Git Status:
```

**Do not ask the user to explain what happened in the previous session** unless the persisted project
state is genuinely insufficient to determine the next action.

### The "continue" command

If the user says "continue", "continue the project", or "continue from the last checkpoint": run the
Project Recovery procedure above automatically.
- Do not start a new task.
- Do not restart completed work.
- Do not redo completed milestones.
- Continue from the exact documented "Exact Next Action".

If uncommitted changes exist, inspect them before modifying anything.

---

## Application Safety

During workflow setup (already done as of this commit): do not modify application code, refactor,
change styling behavior, or delete files beyond adding the workflow scaffold.

During normal development:
- Modify only what the current task requires.
- Avoid unrelated refactoring.
- Preserve existing behavior unless the task explicitly changes it.
- This app has no database schema and no dependency manifest to "upgrade" — but do not introduce a
  build step, package manager, or framework without an explicit task/decision requiring it
  (record such a decision in `.claude/decisions.md` first).

---

## Git Workflow

Small, meaningful commits. Preferred formats:
```text
feat(TASK-001): implement user management
fix(BUG-001): fix authentication redirect
checkpoint(TASK-001): save project state
docs: update project state
checkpoint(TASK-010.2): complete floor management
checkpoint(TASK-010.3): complete room management
feat(TASK-010.7): integrate room and bed UI
fix(TASK-010.8): fix room validation
```
The commit message must identify the task or sub-task it belongs to.

### GitHub as persistent project memory

`.claude/project-state.md`, `.claude/current-task.md`, `.claude/handoff.md`, `.claude/tasks.md`, and
`.claude/decisions.md` are **not temporary notes** — they are persistent project state and part of
the repository's execution history. When Git is available, meaningful state changes must be committed
(and pushed when appropriate). When Git is unavailable, update the files anyway and never fabricate a
Git operation.

### Execution log

Git history should let another session understand the progression of work. State files must record
the latest verified commit, e.g.:
```text
Last Checkpoint: TASK-010.3
Commit: abc1234
Description: Room management completed.
Next: TASK-010.4 — Room types
```
If Git is unavailable, use `Git Status: UNAVAILABLE IN CURRENT ENVIRONMENT` and continue relying on
the state files alone.

Before committing:
1. Run relevant validation (see below).
2. Update state files.
3. Inspect `git diff` and `git status`.
4. Commit.

Push when appropriate. Never claim a push succeeded unless the command actually succeeded.
Never automatically rewrite history. Never force push unless explicitly authorized.

**Credentials:** This environment has no stored GitHub credentials/remote auth by default. Pushing
requires a token to be supplied explicitly by the user for that session. Never persist a token in
any tracked file, `.claude/` file, or commit. Strip any token from the git remote URL immediately
after use.

---

## Validation

This repository has **no test suite, no build system, no linter, and no type-checker**. That is a
verified fact, not an oversight to "fix" silently. Validation for this project means:

1. Open `index.html` in a browser (or serve the directory with any static file server) and confirm
   the app loads without console errors.
2. Manually exercise the specific feature/page touched by the task (e.g. open the relevant route,
   interact with the relevant modal/table) and confirm expected behavior.
3. Check `js/app.js`'s `router()` and `ROUTES`/`LEGACY_ALIASES` if a new page or route was added, to
   ensure routing still resolves correctly.

Never claim "tests passed" — there are none. State plainly what manual verification was performed.

---

## Session Limit Protocol

If a session appears close to its usage limit:
1. Finish the smallest safe unit of work.
2. Perform relevant manual validation.
3. Update `.claude/current-task.md`, `.claude/project-state.md`, `.claude/handoff.md`.
4. Create a checkpoint.
5. Commit completed work.
6. Push when appropriate (and a token is available).
7. Stop.

The handoff must clearly tell the next session exactly where to continue.
