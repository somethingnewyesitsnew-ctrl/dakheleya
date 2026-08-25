# CURRENT TASK

## Task ID
None active — TASK-001 through TASK-010 are all COMPLETED. Awaiting the next request from the user.

## Most Recently Completed Task
TASK-010 — Put the dormitory random-fill (seeder) fully under user control via an options modal.
Parent Request: REQ-005. `seedRandomDormitoryData()` now takes an `options` object (structure
ranges, occupancy %, payment %, per-feature toggles for guests/services/expenses, expense
multiplier) instead of hardcoded ~100%-occupancy values, and Settings now opens a form/modal before
running the seed instead of a fixed one-click action (see `.claude/tasks.md` for full detail).

## Status
COMPLETED (all of TASK-001 through TASK-010)

## Summary of TASK-010 (see `.claude/tasks.md` for full acceptance criteria / validation detail)
- `js/data.js`: `seedRandomDormitoryData(options = {})` — every previously-hardcoded value is now
  an option with a default matching the old behavior: `floorsMin/Max`, `aptsPerFloorMin/Max`,
  `roomsPerAptMin/Max`, `occupancyPercent` (0–100, was always effectively 100), `paymentPercent`,
  `fullPaymentPercent`, `generateGuests` + `guestsMin/Max`, `generateServices` +
  `serviceSubscribePercent`, `generateExpenses` + `expensePercentMultiplier`. Occupied-bed count is
  now `Math.round(totalBeds * occupancyPercent/100)` instead of always all beds. Summary object
  gained `occupiedBeds`, `occupancyPercent`, `servicesAssigned`.
- `js/settings.js`: new `openSeedOptionsModal(container)` — a form with all of the above (occupancy
  as a live-updating range slider), only running the seed (behind the existing `confirmAction()`
  dialog) after the user submits it. Replaced the old always-100% button/copy.

## Summary of TASK-009 (see `.claude/tasks.md` for full acceptance criteria / validation detail)
- `js/data.js`: `seedRandomDormitoryData()` now occupies 100% of generated beds (was ~70%); no
  longer seeds vacations (a real behavioral interaction found via runtime testing: even
  `keepBed:true` vacations set bed status to `'محجوز للإجازة'`, which `occupancyStats()` correctly
  excludes from `'مشغول'`/occupied — so vacations were silently capping the rate below 100% despite
  zero `'متاح'` beds); now generates realistic operating expenses (rent, salaries, food, utilities,
  security, maintenance, purchases) as a randomized % of seeded revenue, tagged via a new
  `DataService.SEEDED_EXPENSE_MARKER` constant.
- `js/data.js`: `resetDormitoryOnly()` extended to also remove only `SEEDED_EXPENSE_MARKER`-tagged
  expenses, leaving real user-entered expenses untouched (verified via runtime test).
- `js/settings.js`: seed-panel description/confirm/toast copy updated to match (100% occupancy,
  expense generation, vacations no longer mentioned).

## Summary of TASK-008 (see `.claude/tasks.md` for full acceptance criteria / validation detail)
- `js/data.js`: `seedRandomDormitoryData()` (random floors/apartments/rooms/beds + residents with
  payments/services/guests/vacations) and `resetDormitoryOnly()` (clears only dormitory-derived
  data, leaves partners/financial settings intact — narrower than the existing `factoryReset()`).
- `js/settings.js`: two new buttons in "الغرف والأسرة" wired to these, both behind confirmation
  dialogs.
- Bug fix: `DataService.addVacation()` was building its record with a bare `residentId` instead of
  `data.residentId`, which crashed for any real vacation-add attempt, not just the new seeder —
  found via a Node runtime smoke test (not just `node --check`), fixed to `data.residentId`.

## Summary of TASK-007 (prior task — see `.claude/tasks.md` for full detail)
- `js/app.js`: added a shared `KPI_TOOLTIPS` dictionary + `kpiTooltip()` lookup consumed by
  `kpiCard()`, so every page using that helper gets hover tooltips automatically.
- `js/dashboard.js`: Occupancy-tab KPI cards now all link to `#/dormitory`; fixed a real bug where
  every dashboard visit added a new, never-removed `window` `resize` listener that called
  `.resize()` on destroyed Chart.js instances.
- `js/data.js`: added `requiredContribution` per partner + `DataService.getContributionStatus()`.
- `js/partners.js`: new "المطلوب / المسدد / المتبقي" table; amounts paid beyond the required
  contribution now show as an automatic "سلفة/دين على الداخلية" and are folded into the partner's
  overall "الرصيد المستحق".
- `js/settings.js`: required-contribution input added to the add-partner form.
- `js/hubs.js` + `js/dormitory.js`: Dormitory hub tabs now show live count badges; room tiles are
  now fully clickable (not just a small inner button).
- `css/style.css`: tooltip affordance styling.

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
None — TASK-010 completed in the same session it was requested.

## Remaining Work
None queued. Item #9 from an earlier review (a Partnership/Finance equivalent of the Dormitory
seeder) was explicitly deferred by the user and remains out of scope. Also still not started:
extend the required/paid/surplus contribution pattern to the Dashboard's own partner mini-cards
(currently only the Partners page shows it in full) — unrelated pre-existing follow-up.

## Known Limitation From This Session
No browser/UI tool was available in this session to click through the app live. Validation for
TASK-010 was `node --check` plus a Node `vm`-based runtime harness exercising
`seedRandomDormitoryData(options)` across four option combinations and 5 no-args backward-
compatibility runs (see `.claude/tasks.md` TASK-010 for exact assertions). The user should do a
quick manual smoke test: Settings → "الغرف والأسرة" → "تحكم وتعبئة عشوائية للتجربة" → confirm the
form opens, the occupancy slider updates its live label, submitting it shows the confirmation
dialog, and the resulting seed matches the chosen occupancy/structure/toggles (e.g. try 50%
occupancy with services/guests/expenses all unchecked and confirm none of those get created).

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
