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

## New Session Protocol

When a new session starts and the user says "continue" or "continue the project":

**Do not ask "what were we working on?"**. Instead:
1. Read `CLAUDE.md`.
2. Read `.claude/project-state.md`.
3. Read `.claude/current-task.md`.
4. Read `.claude/handoff.md`.
5. Read `.claude/tasks.md`.
6. Run `git status` and `git log`.
7. Inspect the latest commit and relevant changed files.
8. Continue from the "Exact Next Action" in `handoff.md`.

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
```

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
