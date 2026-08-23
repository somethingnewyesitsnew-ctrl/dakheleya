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

### Confirmed working method: committing/pushing from a Claude.ai browser session

Claude.ai chat sessions with the code-execution/bash tool enabled run inside a sandboxed container
that has `git` installed and network egress allowed to `github.com` / `api.github.com` /
`codeload.github.com`. This means Claude **can** clone this repo, make changes, commit, and push —
even though the browser chat interface itself has no persistent local checkout and no stored GitHub
credential. This has been verified working (see `.claude/session-log.md` and `.claude/decisions.md`
DECISION-004).

The procedure, once per chat session that needs to push:

1. **Ask the user for a GitHub token once, at the point a push is actually needed** — not before,
   and not more than once per chat session. Prefer a fine-grained Personal Access Token scoped to
   only this repo (`somethingnewyesitsnew-ctrl/dakheleya`), Contents: Read & Write, short expiry.
2. Clone using the token: `git clone https://<TOKEN>@github.com/somethingnewyesitsnew-ctrl/dakheleya.git`
   into the sandbox's working directory (e.g. `/home/claude/repo`).
3. Do the task's work inside that clone.
4. Commit with a proper `checkpoint(TASK-xxx): ...` / `feat(TASK-xxx): ...` message per "Git
   Workflow" below.
5. Push: `git push origin <branch>`.
6. **Mask the token in every tool-call/log line shown back to the user** (e.g. pipe through
   `sed 's/<TOKEN>/***TOKEN***/g'`) — never print it in the clear after the initial paste, and never
   write it into any file that gets committed.
7. Reuse the same token for the rest of that chat session (don't re-ask on every single commit) —
   but **do ask again in a new chat session**, since the token only exists in that session's
   sandbox and does not persist across sessions.
8. At the end of the session, remind the user the token was pasted in plaintext into the chat
   transcript and should be treated as no longer secret — recommend they revoke/rotate it once the
   session's work is done.

This does **not** contradict the "never persist a token" rule below — the token still never gets
written to a tracked file, a commit, or `.claude/*`; it only ever exists transiently in the sandbox
process/environment for that one session.

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
3. Read `.claude/requests.md`.
4. Read `.claude/tasks.md`.
5. Read `.claude/current-task.md`.
6. Read `.claude/handoff.md`.
7. Read `.claude/session-log.md`.
8. Read `.claude/decisions.md` when architectural decisions are relevant.
9. Check whether Git CLI is available (see "Browser Project / Git Availability" above).
   - If available, run:
     ```bash
     git status --short
     git log --oneline -10
     ```
     and inspect the remote state when possible (e.g. `git fetch` + compare to `origin/main`) —
     see "Cross-Account Continuation" below.
   - If unavailable, skip this step and rely on `.claude/*` state files instead. Do not fabricate
     Git output.
10. Inspect the current task and the relevant existing code.
11. Perform a lightweight Project Health check (see "Project Health" below) before starting
    substantial new work.

Then briefly report using the full Project Recovery format — see "Session Recovery" below, which
supersedes the short-form report previously used here.

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

### User request history

`.claude/requests.md` is the primary request ledger: every substantial user request gets a
`REQ-xxx` entry there (Request ID, date, summary, objective, status, related task IDs, completed/
current/remaining tasks, final outcome). `.claude/tasks.md` maintains the task/sub-task breakdown
itself, each task linked back to its `REQ-xxx` when one exists. Together these preserve the chain:

```text
USER REQUEST → TASKS → CHECKPOINTS → FINAL RESULT
```

This prevents a future session from seeing only isolated technical tasks without understanding the
original objective they serve. See `.claude/requests.md` for the exact record format.

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
Work, Changed Files, Tests/Validation, Known Problems, Blockers, Latest Commit (only if verified via
Git), Exact Next Action — persisted into `.claude/current-task.md`, `.claude/project-state.md`, and
`.claude/handoff.md`. These `.claude/*` files are updated at every checkpoint **regardless of
whether Git is available**.

**If Git CLI is available**, additionally use `scripts/checkpoint.sh` (or `scripts/checkpoint.ps1`
on Windows) to create a checkpoint commit:
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
8. If Git CLI is available: commit the checkpoint, and push when appropriate.

**If Git CLI is unavailable** (e.g. browser-based Claude Project with no local `.git`), still update
all four state files listed above. Do not run and do not claim to have run the checkpoint scripts,
and do not claim a commit occurred — record `Git Status: UNAVAILABLE IN CURRENT ENVIRONMENT` instead
of fabricating a commit/push. **Never claim a commit or push occurred unless it was actually
performed.**

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

## Session Recovery (Project Recovery Protocol)

This applies to **any** new Claude session opening this repository, including a different Claude
account. The FIRST action must be project recovery, before asking the user what to do.

1. Read `CLAUDE.md`.
2. Read `.claude/project-state.md`.
3. Read `.claude/requests.md`.
4. Read `.claude/tasks.md`.
5. Read `.claude/current-task.md`.
6. Read `.claude/handoff.md`.
7. Read `.claude/session-log.md`.
8. Read `.claude/decisions.md` when relevant.
9. Inspect the latest available project state (the files above, plus a quick look at relevant
   application files if the next task requires it).
10. If Git CLI is available: inspect current branch, `git status --short`, `git log --oneline -10`,
    and — when possible — the remote state (e.g. `git fetch` and compare local `main` to
    `origin/main`; see "Cross-Account Continuation" below). If Git CLI is unavailable, skip this
    step, rely on the `.claude/*` files read above, and state plainly that Git information could not
    be verified — do not fabricate branch names, commit SHAs, or push results.

Then report using this structure:

```text
PROJECT RECOVERY

Active Request:
Active Task:
Current Status:
Completed:
Last Checkpoint:
Current Work:
Remaining:
Exact Next Action:
Git Status: (verified branch/commit/remote info, or "UNAVAILABLE IN CURRENT ENVIRONMENT")
State Consistency: (CONSISTENT, or a description of the contradiction found — see below)
```

**Do not ask the user to explain what happened in the previous session** unless the persisted project
state is genuinely insufficient to determine the next action.

### If state files contradict each other

**STOP.** Do not guess and do not proceed with implementation. Examples of a contradiction: two
files name different tasks as "active"; a task is marked COMPLETED in `tasks.md` but `current-task.md`
describes it as still IN_PROGRESS; the latest Git commit doesn't match what `handoff.md` claims was
last done. When this happens:
1. Identify the specific inconsistency explicitly (name the files/fields that disagree).
2. Resolve it using the most recent verified project information — Git history (when available) is
   generally the strongest signal, since commits are timestamped and immutable; a state file that
   wasn't updated to match the latest commit is the more likely error.
3. Correct the state files to restore consistency before continuing.
4. Report the inconsistency and its resolution to the user rather than silently fixing it.

### The "continue" command

If the user says "continue", "continue the project", or "continue from the last checkpoint": run the
Session Recovery procedure above automatically.
- Do not start a new task.
- Do not restart completed work.
- Do not redo completed milestones.
- Continue from the exact documented "Exact Next Action" in `handoff.md`.

If Git is available and uncommitted changes exist, inspect them before modifying anything.

---

## Cross-Account Continuation

Assume another Claude account may have worked on this project immediately before the current
session. **Never assume this session is the only active session.**

Before modifying anything:
- Inspect the latest persisted state (`.claude/*`).
- Inspect recent Git history when available.
- Detect changes made by another session (new commits, new task entries, updated state files you
  didn't write).
- Preserve valid work — never overwrite another session's work blindly.

If remote Git contains commits not present locally (a real divergence, as has already happened once
in this repository's history — see `.claude/session-log.md` SESSION-003):
1. Inspect the divergence (`git fetch`, then compare `git log local..origin` and
   `git log origin..local`, and `git show --stat` on the unfamiliar commits).
2. Determine what each side changed.
3. Merge carefully (`git merge`, not a blind overwrite).
4. Resolve conflicts **semantically** — combine both sides' intent where they're complementary,
   rather than mechanically picking one side or the other.
5. Validate the resulting state (re-read merged files for coherence; confirm no leftover conflict
   markers; confirm application code wasn't accidentally altered if the task didn't call for it).
6. **Never force-push.**
7. **Never discard another session's valid work.**

---

## Checkpoint Frequency

Create a checkpoint after every meaningful milestone — do **not** wait until an entire parent
request (`REQ-xxx`) is fully complete. Example:

```text
REQ-005
├── TASK-021 ✓
├── TASK-022 ✓
├── TASK-023 IN_PROGRESS
└── TASK-024 PENDING
```

After `TASK-022` is completed, persist the state:
```text
TASK-021 ✓
TASK-022 ✓
TASK-023 IN_PROGRESS
```
and create a checkpoint (update state files; commit if Git is available) — before starting
`TASK-023`, not after `TASK-024` also finishes.

---

## Project Health

At session recovery, and before starting major work, perform a lightweight project health check.
Check only what is actually available/applicable to this project — do not invent checks it can't
support (e.g. this project has no package manager or build config, so don't "check" for one beyond
confirming that fact):

- repository/project accessibility
- `.claude/` state files present and internally consistent
- task consistency (`tasks.md` vs `current-task.md` vs `handoff.md`)
- application structure (`index.html`, `css/`, `js/` present as expected)
- package/dependency configuration (none exists in this project — confirming that is the check)
- build configuration (none exists — confirming that is the check)
- test configuration (none exists — confirming that is the check)
- obvious broken references (e.g. a route registered in `js/app.js` with no matching `Pages.xxx`
  function, a script tag in `index.html` for a file that doesn't exist)
- unfinished migrations, when detectable (none expected in a project this size, but check state
  files for anything marked IN_PROGRESS with no corresponding recent activity)
- Git state, if available (clean working tree, in sync with the remote or divergence understood)

Report:

```text
PROJECT HEALTH

State: HEALTHY / WARNING / BLOCKED
Issues:
Recommended action:
```

Do not start major implementation while the project state is BLOCKED unless explicitly instructed
by the user.

---

## Authentication / Secrets

GitHub authentication is an environment concern, not something to embed in the project.

**In a Claude.ai browser session with code execution enabled**, see "Confirmed working method"
above — ask the user for a token **once per chat session**, right when a push is actually needed,
use it only inside that session's sandbox, and never write it to a tracked file.

Never:
- request a token unnecessarily (only ask when a push is actually needed and Git is available)
- ask for a token more than once in the same chat session — reuse the one already supplied
- write tokens to any file, including `CLAUDE.md` or anything under `.claude/`
- commit credentials
- print credentials in the clear in tool output/logs after the initial paste — mask them
- include credentials in task descriptions, the request ledger, or the session log

If Git authentication is already available in the environment, use it normally. If authentication is
unavailable (no code-execution/bash tool, or no token supplied), continue all work that does not
require it and clearly report the limitation — do not block unrelated work on it.

**Never claim a push succeeded unless it actually succeeded** — always verify via the command's
actual output (e.g. a `<old-sha>..<new-sha> branch -> branch` line), never assume.

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
checkpoint(TASK-010.2): complete floor management
checkpoint(TASK-010.3): complete room management
feat(TASK-010.7): integrate room and bed UI
fix(TASK-010.8): fix room validation
```
The commit message must identify the task or sub-task it belongs to.

### GitHub as persistent project memory

`.claude/project-state.md`, `.claude/requests.md`, `.claude/current-task.md`, `.claude/handoff.md`,
`.claude/tasks.md`, `.claude/session-log.md`, and `.claude/decisions.md` are **not temporary notes**
— they are persistent project state and part of the repository's execution history. When Git is
available, meaningful state changes must be committed (and pushed when appropriate). When Git is
unavailable, update the files anyway and never fabricate a Git operation.

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

REQUEST:
TASK:
STATUS:

COMPLETED:
- ...

CURRENT WORK:
- ...

FILES CHANGED:
- ...

VALIDATION:
- ...

KNOWN ISSUES:
- ...

BLOCKERS:
- ...

LAST CHECKPOINT:
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
- requests.md updated (if this task belongs to a tracked REQ-xxx)
- session-log.md updated with this session's entry
```

`REQUEST:` refers to the `REQ-xxx` ID from `.claude/requests.md` this task belongs to, if any (small
untracked tasks may omit it). `LAST CHECKPOINT:` should name the most recent checkpoint (task,
sub-task, or milestone) and its commit if Git is available.

If Git CLI is available and a commit was actually made, also provide the verified commit SHA.

If Git CLI is unavailable, explicitly say:

> "Git CLI is unavailable in this Claude Project environment."

Do not invent a SHA, and do not imply a commit or push happened when it did not.

This is the same minimum information required by "Session Recovery" and "Session Log" below —
this report is simply that information surfaced to the user at the moment of checkpoint.
