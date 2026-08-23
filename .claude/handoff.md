# HANDOFF

## Active Project
dakheleya — نظام إدارة الشراكة والداخلية (Partnership & Student-Housing Management System)

## Parent Request
REQ-001 — establish and iteratively extend a persistent, interruption-safe, cross-session/
cross-account Claude Code development workflow for this repository. See `.claude/requests.md` for
the full ledger entry. Currently IN_PROGRESS as a living system (each extension is its own TASK);
no application-feature request is active.

## Session Status
Complete — TASK-007 implemented (Dashboard clickability/tooltips/chart fix + Partners required-vs-
paid contribution tracking + Dormitory clickability/tab counts), on top of TASK-001 through
TASK-006. This is the first application-feature request handled under this workflow (REQ-002).

## Active Task
None — awaiting the next request from the user, or the user's feedback from manually smoke-testing
TASK-007's changes.

## Task Status
COMPLETED (TASK-001 through TASK-007)

## Last Checkpoint
TASK-007 — see `.claude/current-task.md` and `.claude/tasks.md` for full detail.

## Completed
- **TASK-001** through **TASK-006**: workflow scaffold, task planning/decomposition, Git-optional
  operation, request ledger + session log, confirmed browser-push method, vendored skill source.
  See `.claude/tasks.md` for full per-task detail.
- **TASK-007** (REQ-002, this session): Dashboard — every KPI box now clickable (Occupancy tab was
  the gap), a shared hover-tooltip dictionary wired into the existing `kpiCard()` helper (so it
  applies app-wide, not just the dashboard), and a real chart-`resize`-listener memory-leak bug
  fixed. Partners — added a per-partner "required contribution" vs. paid/remaining, with any
  overpayment automatically shown (and totaled into the balance) as an advance/debt the dormitory
  owes back to that partner. Dormitory — hub tabs now show live numeric count badges
  (`tabsShell()` extended generically), and room tiles are now fully clickable, not just a small
  inner button.

## Currently Working On
Nothing — session complete, pending the user's manual smoke test (see "Known Issues" below) and any
follow-up feedback.

## Last Completed Step
Implemented and validated TASK-007 in a local clone at `/home/claude/repo` (cloned read-only, no
token — no push was requested this session). Updated all `.claude/*` state files. **Not committed
to Git yet** — see "Latest Git Information" below.

## Current File
N/A

## Current Position
N/A

## Remaining
Nothing queued. Possible natural follow-up (not requested, not started): extend the
required/paid/surplus contribution pattern to the Dashboard's own partner mini-cards for full
parity with the Partners page.

## Changed Files (TASK-007)
- `js/app.js` — `KPI_TOOLTIPS` dictionary, `kpiTooltip()`, tooltip-aware `kpiCard()`
- `js/dashboard.js` — Occupancy-tab KPI links, resize-listener leak fix
- `js/data.js` — `requiredContribution` field, `DataService.getContributionStatus()`
- `js/partners.js` — new contribution table, edit-required modal, surplus folded into balance
- `js/settings.js` — required-contribution input on the add-partner form
- `js/hubs.js` — `tabsShell()` count-badge support, wired for Dormitory hub tabs
- `js/dormitory.js` — room tiles fully clickable, `+ سرير` button `stopPropagation()`
- `css/style.css` — `.kpi-label-tip` tooltip affordance styling
- `.claude/requests.md`, `.claude/tasks.md`, `.claude/current-task.md`, `.claude/handoff.md` (this
  file), `.claude/session-log.md`, `.claude/project-state.md` — state updated for TASK-007/REQ-002

## Files Changed
Same as above.

## Tests / Checks
No automated test suite exists in this repo (verified, unchanged). `node --check` run on every
touched `.js` file (all passed, no syntax errors). Manual re-read of the full `git diff` per file,
specifically checking the new room-tile click-vs-"+ سرير"-button interaction for event
double-firing. **No live browser click-through was performed** — no browser/UI tool was available
in this session; this is an explicit known limitation, not silently skipped.

## Validation
See "Tests / Checks" above.

## Failures
None.

## Known Issues
- **New (this session)**: TASK-007's changes have not been manually smoke-tested in a live browser.
  Recommend the user check: Dashboard → Occupancy tab card clicks + hovering a few KPI labels;
  Partners → the new "المطلوب/المسدد/المتبقي" table + its pencil-edit button; Dormitory → a room
  tile click (should open the room modal) and its "+ سرير" button (should only add a bed, not also
  open the room modal) + the new tab count badges.
- `.claude/requests.md`'s REQ-001 entry doesn't list TASK-005/TASK-006 in its "Related Task IDs" —
  minor pre-existing staleness noted during this session's recovery, not yet fixed (cosmetic only).
- No `.gitignore` in the repo (still unaddressed — out of scope for all tasks so far).
- Stray empty `New Text Document (2).txt` in repo root — harmless, noted for possible cleanup.
- Possible leftover defensive code in `js/residents.js` (`openAddResidentModal`'s rent-autofill
  handler) — unconfirmed, unresolved, out of scope.
- `scripts/checkpoint.sh`/`.ps1` still don't themselves detect Git's absence gracefully.

## Blockers
None.

## Latest Git Information
Local clone (`/home/claude/repo`) matched `origin/main` at `4988b6c` (TASK-006) before this
session's changes. This session's TASK-007 changes are staged/present in that local clone but
**not yet committed or pushed** — no GitHub token was requested or supplied this session since no
push was asked for. If the user wants this pushed to `origin/main`, a token will need to be
supplied once for this chat session per `CLAUDE.md` → "Confirmed working method".

## Exact Next Action
1. If the user wants TASK-007 pushed to GitHub: ask for a token once (per `CLAUDE.md`), commit as
   `feat(TASK-007): dashboard clickability/tooltips/chart fix + partner contribution tracking +
   dormitory clickability/tab counts`, push, and report the actual push output.
2. Otherwise, await the user's manual smoke-test feedback or the next request.
3. For any new request: run Session Recovery, do a Project Health check, log a new `REQ-xxx`/
   `TASK-xxx` as appropriate, implement, validate, update state files, add a `SESSION-xxx` entry.

## Important Notes
- This project has no build step, no package manager, no test suite.
- GitHub push requires a token supplied by the user for that session; never persist it anywhere,
  never write it to any tracked file — see `CLAUDE.md` → "Authentication / Secrets".
- `CLAUDE.md` supports both a local Git-CLI environment and a browser-based Claude Project without
  one — always check which applies.
- If a future session finds local/remote have diverged again, fetch and inspect before pushing;
  never force-push; resolve conflicts by combining both sides' intent (see "Cross-Account
  Continuation" in `CLAUDE.md`, and SESSION-003 in `.claude/session-log.md` for a worked example).
- The workflow itself (REQ-001) is a living system — this is expected to keep being extended by
  future sessions; each extension should itself become a new `TASK-0NN` under REQ-001, or a new
  `REQ-xxx` if it's substantial enough to warrant its own request entry.

## Updated
At TASK-004 completion — see `git log` for exact commit/date.
