# CLAUDE.md — Project Workflow (dakheleya)

This file establishes a persistent, interruption-safe development workflow.

> If a Claude session stops unexpectedly at any moment, another Claude session must be able to
> enter this repository and continue the work without needing the previous conversation.
>
> The repository and Git history are the source of truth when Git is available. When Git is not
> available, the `.claude/` state files are the source of truth. Do not depend on conversation
> memory in either case.

---

## Browser Project / Git Availability

This project may run inside a browser-based Claude Project (files provided via a connected GitHub
repository) rather than a local Claude Code terminal. In that environment there is no local `.git`
directory and no Git CLI by default.

**Do not assume Git CLI is available.** At the start of a session, check whether Git commands
actually work before relying on them.

**If Git CLI is available** (e.g. a local checkout or a sandbox with `git` installed):
- Inspect `git status` and `git log` as normal.
- Use Git normally for validation, commits, and pushes per the rest of this document.

**If Git CLI is unavailable:**
- Do **not** claim the repository is missing — the project files are still available through the
  Claude Project's connected GitHub repository, even without a local `.git` directory.
- Do **not** fabricate Git status, commit SHAs, branch names, or push results.
- Work directly with the files as provided in the Claude Project.
- Treat `.claude/*` as the persistent, authoritative session state instead of Git history.
- Clearly and explicitly state that Git operations cannot be performed in this environment, rather
  than staying silent about it or working around it with invented information.

**The absence of a local `.git` directory does NOT mean the project files are unavailable.** It
only means Git-based inspection/commit/push are unavailable; the `.claude/` files and project files
themselves are still the source of truth for continuing work.

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
7. Check whether Git CLI is available (see "Browser Project / Git Availability" above).
   - If available, run:
     ```bash
     git status --short
     git log --oneline -10
     ```
   - If unavailable, skip this step and rely on `.claude/*` state files instead. Do not fabricate
     Git output.
8. Inspect the current task and the relevant existing code.

Then briefly report:

```text
Current Task:
Status:
Last Checkpoint:
Latest Commit: (only if verified via Git; otherwise state "Git CLI unavailable in this environment")
What is already completed:
What remains:
Exact next action:
```

Do not ask the user to explain previous work if the repository or `.claude/*` state files already
contain enough information.

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
- relevant validation was performed (see "Validation"), or, if validation could not be performed,
  that fact is explicitly stated
- known problems are documented
- state files (`current-task.md`, `project-state.md`, `handoff.md`, `tasks.md`) are updated
- work is committed to Git **if Git CLI is available in this environment**; if Git CLI is
  unavailable, the state files themselves stand in as the completion record, and this must be
  stated explicitly rather than implying a commit occurred

Never mark a task COMPLETED merely because code was written. Never claim a commit or push occurred
if it did not actually happen.

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
Work, Changed Files, Tests/Validation, Known Problems, Blockers, Latest Commit (only if verified via
Git), Exact Next Action — persisted into `.claude/current-task.md`, `.claude/project-state.md`, and
`.claude/handoff.md`. These `.claude/*` files are updated at every checkpoint **regardless of
whether Git is available**.

**If Git CLI is available**, additionally use `scripts/checkpoint.sh` (or `scripts/checkpoint.ps1`
on Windows) to create a checkpoint commit:
```bash
./scripts/checkpoint.sh TASK-001 "short checkpoint description"
```

**If Git CLI is unavailable** (e.g. browser-based Claude Project with no local `.git`), still update
all four state files listed above. Do not run and do not claim to have run the checkpoint scripts,
and do not claim a commit occurred.

---

## Interruption Safety

- Never keep critical information only in conversation.
- Never assume you will be able to continue the current conversation.
- Persist important state to `.claude/` files — this applies whether or not Git is available.
- If Git is available: commit meaningful completed work, and push checkpoints when appropriate —
  **never claim a push succeeded unless the command actually succeeded.**
- If Git is unavailable: rely on the `.claude/` state files as the persistence mechanism instead,
  and explicitly say that no commit/push occurred rather than staying silent about it.
- Never delete existing work just to make the repository clean.

If uncommitted changes already exist when a session starts (Git available case):
1. Inspect them.
2. Determine whether they belong to the current task.
3. Preserve them — do not reset or stash them automatically.
4. Report them.

Recovery for the next session:
- If Git is available: `git status` + `git log` + `project-state.md` + `current-task.md` +
  `handoff.md` + `tasks.md`.
- If Git is unavailable: `project-state.md` + `current-task.md` + `handoff.md` + `tasks.md` alone
  are the full recovery record.

---

## New Session Protocol

When a new session starts and the user says "continue" or "continue the project":

**Do not ask "what were we working on?"**. Instead:
1. Read `CLAUDE.md`.
2. Read `.claude/project-state.md`.
3. Read `.claude/current-task.md`.
4. Read `.claude/handoff.md`.
5. Read `.claude/tasks.md`.
6. If Git CLI is available, run `git status` and `git log`, and inspect the latest commit and
   relevant changed files. If Git CLI is unavailable, skip this step, rely on the `.claude/*` files
   read above, and state plainly that Git information could not be verified.
7. Continue from the "Exact Next Action" in `handoff.md`.

If Git is available and uncommitted changes exist, inspect them before modifying anything.

---

## Handoff File Format

At every checkpoint, `.claude/handoff.md` must contain at least the following fields (existing
additional fields in that file, such as "Current Position" or "Important Notes", may be kept):

```text
Current Task:
Status:
Completed:
Currently Working On:
Last Completed Step:
Files Changed:
Validation:
Known Issues:
Blockers:
Latest Git Information (only if verified — omit or mark "unavailable" otherwise):
Exact Next Action:
```

The "Exact Next Action" must be specific enough that another Claude session — with or without Git
access — can immediately continue without asking what happened previously.

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

This entire section applies **only when Git CLI is available** in the current environment (see
"Browser Project / Git Availability" above). When Git CLI is unavailable, skip Git operations
entirely and rely on the `.claude/` state files as the record of work instead — do not fabricate
any of the information described below.

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
2. Perform relevant manual validation (or explicitly state that it could not be performed).
3. Update `.claude/current-task.md`, `.claude/project-state.md`, `.claude/handoff.md`.
4. Create a checkpoint (state-file update always; Git checkpoint commit only if Git is available).
5. If Git is available: commit completed work.
6. If Git is available and a token is available: push when appropriate.
7. If Git is unavailable: skip steps 5–6 and state plainly that no commit/push occurred — the
   updated `.claude/` files are the record of the work instead.
8. Stop.

The handoff must clearly tell the next session exactly where to continue, regardless of whether
Git is available.

---

## Final Task Checkpoint Report

At the end of every completed task (or checkpoint), report back to the user in this format:

```text
TASK CHECKPOINT

TASK:
STATUS:

COMPLETED:
- ...

FILES CHANGED:
- ...

VALIDATION:
- ...

KNOWN ISSUES:
- ...

NEXT TASK:
- ...

NEXT ACTION:
- ...

PERSISTENT STATE:
- project-state.md updated
- current-task.md updated
- handoff.md updated
- tasks.md updated
```

If Git CLI is available and a commit was actually made, also provide the verified commit SHA.

If Git CLI is unavailable, explicitly say:

> "Git CLI is unavailable in this Claude Project environment."

Do not invent a SHA, and do not imply a commit or push happened when it did not.
