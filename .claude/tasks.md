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

## TASK-006
Parent Request: REQ-001
Title: Vendor the persistent-git-workflow skill source into the repo
Status: COMPLETED
Priority: Medium
Description: Store the source of the `persistent-git-workflow` Claude skill (built this session,
generalizing this repo's own CLAUDE.md/.claude workflow + the confirmed browser-session git push
method into a reusable, installable skill) inside this repo at
`.claude/skills/persistent-git-workflow/`, so it's versioned in Git history rather than existing
only as a downloaded `.skill` file outside the repo. Includes `SKILL.md`,
`references/CLAUDE.md.template`, `references/claude-dir-templates/*`, and `scripts/scaffold.py`
(tested this session: fresh install + overwrite-safety guard both verified working before this
task, and a template bug — placeholder values gluing to their inline example hints — was found and
fixed as part of that testing).
Acceptance Criteria:
- `.claude/skills/persistent-git-workflow/` exists in the repo with the full skill source.
- No application code touched.
- Work committed and pushed to `origin/main`, verified via push output.
Completed:
- Copied the built-and-tested skill source into `.claude/skills/persistent-git-workflow/`.
- This task entry added.
Validation:
- Skill was already tested earlier this session (fresh install + re-run-refuses-overwrite, both
  verified via actual script output) before this task copied it into the repo.
Checkpoint: TASK-006 (this entry)
Next: Await the next user request.

---

## TASK-007
Parent Request: REQ-002
Title: Dashboard clickability/tooltips/chart-reliability + Partners required-vs-paid contribution
tracking + Dormitory clickability/tab counts
Status: COMPLETED
Priority: Normal (UI/UX + one new accounting concept)
Description: Five related changes requested together in Arabic:
1. Make every Dashboard KPI box clickable, including the Occupancy tab's cards (previously the only
   tab missing `link` on its `kpiCard()` calls).
2. Make sure all dashboard charts render reliably — found and fixed a real bug: every call to
   `Pages.dashboard` added a new `window` `resize` listener without ever removing the previous one,
   so navigating to the dashboard repeatedly accumulated listeners that called `.resize()` on
   already-destroyed Chart.js instances. Fixed by tracking a single named handler and removing it
   before adding a new one, plus wrapping the resize call in try/catch as defense in depth.
3. Add hover tooltips explaining each KPI by name. Implemented as a shared `KPI_TOOLTIPS` dictionary
   in `js/app.js` keyed by label text (plus a small prefix-matcher for dynamic labels like
   `نصيب ${partnerName}`), consumed automatically by the existing `kpiCard()` helper — so every page
   that already uses `kpiCard()` picked up tooltips for free, not just the dashboard.
4. Partners page: added a `requiredContribution` field per partner (editable from the add-partner
   form in Settings, and per-partner from a new pencil-edit button on the Partners page). Added a
   new "المطلوب / المسدد / المتبقي" table showing required vs. actually-paid capital, and — per the
   request — any amount paid *beyond* the required contribution is now automatically treated as an
   advance/debt the dormitory owes back to that partner, folded into the existing "الرصيد المستحق"
   balance figure (which previously only reflected formal `سلفة شريك` transactions).
5. Dormitory hub: added optional numeric count badges to `tabsShell()` (reusable by any hub page),
   wired with real counts for all six Dormitory tabs; made room tiles inside the apartment-detail
   modal fully clickable (previously only a small "عرض" button inside the tile was clickable).
Acceptance Criteria:
- Every Occupancy-tab KPI card on the Dashboard has a working link (verified: all now link to
  `#/dormitory`).
- The `resize` listener leak is fixed — confirmed only one handler is ever registered by re-reading
  the diff (previous handler removed before a new one is added).
- Hovering a KPI card's label shows a native tooltip with a plain-language explanation, for every
  label present in `KPI_TOOLTIPS` (covers all dashboard/partners/dormitory/finance/reports KPI
  labels found via `grep`), without needing to touch every individual call site.
- Partners page shows required/paid/remaining per partner, with an "عدّل" action to set the required
  amount; paying more than required shows a distinct "سلفة/دين على الداخلية" badge with the exact
  surplus amount, and that surplus is included in the partner's overall "الرصيد المستحق".
- Dormitory hub tab buttons show a live count badge; room tiles anywhere they render are clickable
  without double-firing the "+ سرير" action (verified via explicit `stopPropagation()`).
- No application file broken: `node --check` passes on every touched `.js` file.
- No pre-existing feature removed or behavior changed outside what was requested.
Completed:
- `js/app.js`: `KPI_TOOLTIPS` dictionary + `kpiTooltip()` lookup + `kpiCard()` now tooltip-aware.
- `js/dashboard.js`: Occupancy-tab `kpiCard()` calls given `link:'#/dormitory'`; resize-listener
  leak fixed via a tracked `dashboardResizeHandler`.
- `js/data.js`: `requiredContribution` on `addPartner`/`updatePartner`; new
  `DataService.getContributionStatus(partner)` helper (`required`/`paid`/`remaining`/`surplus`/`complete`).
- `js/partners.js`: new contribution table + edit-required modal; existing partner table/mini-cards'
  "الرصيد المستحق" now includes contribution surplus, not just formal advances.
- `js/settings.js`: required-contribution input added to the add-partner form.
- `js/hubs.js`: `tabsShell()` accepts an optional `count` per tab; `Pages.dormitory` now computes and
  passes real counts for all six tabs.
- `js/dormitory.js`: `roomCardHTML()` tile is now the clickable element (`room-card-open-btn` moved
  from a small inner button to the whole tile); `+ سرير` button given `stopPropagation()` so it no
  longer also triggers the tile's own open-room click.
- `css/style.css`: `.kpi-label-tip` styling (dotted underline + help cursor) for the new tooltip
  affordance.
Validation:
- `node --check` run on every touched `.js` file (`app.js`, `dashboard.js`, `partners.js`,
  `hubs.js`, `dormitory.js`, `data.js`, `settings.js`) — all passed with no syntax errors.
- Manual re-read of the full `git diff` for every file to confirm no unrelated behavior was
  changed and the new event-listener wiring doesn't double-fire (specifically the room-tile /
  "+ سرير" button interaction).
- No automated test suite exists in this repo (unchanged fact) — no further automated validation
  was possible; a live-browser click-through was not performed in this session (no browser tool
  available), so the user should do a quick manual smoke test of: Dashboard → Occupancy tab card
  clicks, hovering a few KPI labels, Partners → the new contribution table and its edit button, and
  Dormitory → a room tile click plus the tab count badges.
Checkpoint: TASK-007 (this entry)
Next: Await user feedback from manual testing; a natural follow-up (not requested, not started)
would be extending the required/paid/surplus pattern to the Dashboard's own partner mini-cards.

---

## TASK-008
Parent Request: REQ-003
Title: Random dormitory test-data seeding + scoped dormitory-only reset
Status: COMPLETED
Priority: Normal (testing/demo tooling)
Description: Added two new `DataService` methods and wired them into Settings → "الغرف والأسرة":
1. `seedRandomDormitoryData()` — generates 2–3 random floors, 2–3 apartments per floor (globally
   unique numbers, e.g. "101", "102", "201"...), a bathroom per apartment, 3–5 rooms per apartment
   with a random type/price (beds auto-created via the existing `addRoom()`), then occupies ~70% of
   the resulting beds with randomly-generated residents (random Arabic names, phone numbers,
   universities, home regions, parent info), gives ~60% of those residents a partial-or-full random
   rent payment, marks some of the remaining beds as صيانة/محجوز for visual variety, seeds a small
   services catalog (إنترنت/طعام/مكتبة) with random subscriptions, and adds a couple of random
   guests and up to two vacations. Returns a summary object; logs one activity-log entry.
2. `resetDormitoryOnly()` — clears floors/apartments/bathrooms/rooms/beds/residents/guests/
   services/residentServices/vacations/transfers, plus any transactions whose type is `'إيراد'` and
   whose category is one of the dormitory-derived revenue categories (housing, food/internet/
   library/transport service income, guest hosting) — but leaves partners, capital/advance
   transactions, expenses, assets, and general settings untouched. This is intentionally narrower
   than the existing `factoryReset()` in the Settings "تصفير النظام" danger tab, which wipes
   everything including partners.
Both actions are gated behind `confirmAction()` and show a result toast; the settings page
re-renders afterward so the "طوابق/غرف/أسرة" counters update immediately.
Acceptance Criteria:
- A "تعبئة عشوائية للتجربة" button in Settings → "الغرف والأسرة" populates a non-trivial random
  dormitory structure + residents + guests + services + vacations in one click, without touching
  `js/data.js`'s partners/settings storage keys.
- A "إعادة تهيئة الداخلية من الصفر" button clears all of the above back to empty, confirmed via a
  destructive-action confirmation dialog, while partners and financial settings remain intact.
- Both actions are runtime-tested, not just syntax-checked (`node --check` alone would not have
  caught the bug found below).
- No pre-existing behavior changed outside what was needed for these two new features, except the
  bug fix below (which was necessary — the seeder calls `addVacation()`, which crashed).
Completed:
- `js/data.js`: added `seedRandomDormitoryData()` and `resetDormitoryOnly()`.
- `js/settings.js`: added a "بيانات تجريبية للداخلية" panel with both buttons, wired to
  `confirmAction()` + `showToast()` + a re-render of the settings page.
- **Bug fix (found via runtime testing, not present in the original request)**: `DataService.
  addVacation()` built its returned record with a bare `residentId` identifier instead of
  `data.residentId` — a real pre-existing bug that would throw `ReferenceError: residentId is not
  defined` for *any* user trying to add a vacation from `js/residents.js`'s "تسجيل إجازة" flow, not
  just this session's new seeder. Fixed to `residentId: data.residentId`.
Validation:
- `node --check` on `js/data.js` and `js/settings.js` — both passed.
- **Runtime smoke test** (not just syntax-check): wrote a small Node harness
  (`/tmp/test_seed.js`, not committed to the repo — scratch-only) that shims `localStorage`/
  `document`/`window`, loads `js/data.js` for real, and calls `seedRandomDormitoryData()` followed
  by `resetDormitoryOnly()`, asserting via console output that: a non-zero, sane number of floors/
  apartments/rooms/beds/residents/guests/services/vacations/transactions were created; partners and
  `bedPrice` settings were untouched; and after reset every dormitory collection is back to zero
  while partners/settings remain. This is what caught the `addVacation()` bug — `node --check` alone
  would have missed it since it's a valid-syntax runtime `ReferenceError`. Re-ran the harness 5 more
  times after the fix (random data means different counts each run) with no further exceptions.
Checkpoint: TASK-008 (this entry)
Next: Await user feedback. Not requested/not started: no equivalent "random fill" exists for the
Partnership or Finance domains — only Dormitory, per what was explicitly asked.

---

## TASK-009
Parent Request: REQ-004
Title: Guarantee 100% occupancy + realistic operating expenses in the dormitory seeder
Status: COMPLETED
Priority: Normal (testing/demo tooling improvement)
Description: Following a review of outstanding/unfinished items, the user asked to act on most of
them but explicitly asked to leave item #9 (a Partnership/Finance equivalent of the Dormitory
"random fill") out of scope. For the Dormitory seeder itself (`DataService.seedRandomDormitoryData()`
from TASK-008), the user asked that: (a) the system "interact with the dormitory fill logically —
profit, expenses, and charts and everything should work", and (b) occupancy be raised to 100%.
Implemented:
1. `seedRandomDormitoryData()` now occupies every single generated bed (100%, previously ~70%).
2. Vacation seeding was removed from the generator entirely. Runtime testing showed that even a
   `keepBed:true` seeded vacation sets the bed's status to `'محجوز للإجازة'`, not `'مشغول'` — and
   `DataService.occupancyStats()` (used by the dashboard, occupancy tab, and reports) only counts
   `'مشغول'` beds as occupied, so `occ.rate` stayed below 100% even with zero `'متاح'` beds. Rather
   than changing that shared, app-wide occupancy definition just to accommodate the seeder, vacation
   seeding was dropped — vacations remain fully available to add manually per-resident afterward.
3. `seedRandomDormitoryData()` now also generates realistic operating expenses (rent, salaries,
   food, electricity, water, internet, cleaning, security, maintenance, purchases) as a randomized
   percentage of the seeded/collected revenue via `addExpense()`, so `calculateProfit()`, the
   dashboard's Financial tab (revenue/expense trend chart, expense-by-category chart, cash
   composition chart), and Reports all show a coherent non-zero financial picture immediately after
   seeding instead of revenue with no matching expenses.
4. Each generated expense is tagged via a new `DataService.SEEDED_EXPENSE_MARKER` constant in its
   `createdBy` field.
5. `resetDormitoryOnly()` now also removes only expenses carrying `SEEDED_EXPENSE_MARKER`, leaving
   any real user-entered expense (manual, or from a real recurring-expense template) untouched.
6. `js/settings.js` — updated the seed-data panel's description text, confirm-dialog text, and
   success-toast text to reflect 100% occupancy and the new expense generation; removed the
   now-inaccurate mention of seeded vacations.
Acceptance Criteria:
- After clicking "تعبئة عشوائية للتجربة", every generated bed is occupied: `occ.available === 0`
  and `occ.rate === 100` for that run, verified across multiple random runs (not just once).
- The same run also produces a non-zero `getOperatingExpensesForMonth()` for the current month, and
  `calculateProfit()` returns a non-degenerate (non-zero, non-`NaN`) net profit and distributable
  figure, so dashboard KPIs and charts that depend on these are populated rather than empty.
- `getMonthlyFinancials()`, `getCashBalance()`, and `getReinvestmentSummary()` — the methods backing
  the dashboard's trend chart, cash-composition chart, and setup-progress — all execute without
  throwing against freshly seeded data.
- `resetDormitoryOnly()` removes 100% of the seeder's own generated expenses and none of a real
  user-entered expense, verified by interleaving a manual `addExpense()` call with a seed+reset
  cycle.
- `node --check` passes on both touched files.
- No pre-existing behavior changed outside of `seedRandomDormitoryData()` and `resetDormitoryOnly()`
  in `js/data.js` and the seed-panel copy in `js/settings.js`.
Completed:
- `js/data.js`: `seedRandomDormitoryData()` rewritten for 100% occupancy + realistic expense
  generation; `SEEDED_EXPENSE_MARKER` constant added; `resetDormitoryOnly()` extended to remove
  seeded expenses by that marker.
- `js/settings.js`: seed panel copy updated (description, confirm dialog, success toast).
Validation:
- `node --check` on both touched files — passed.
- **Runtime smoke test** (Node `vm`-based harness shimming `localStorage`/`document`/`window`,
  loading `js/data.js` for real): ran `seedRandomDormitoryData()` then asserted `beds.length ===
  activeResidents.length`, `occ.available === 0`, `occ.rate === 100`, non-zero
  `getOperatingExpensesForMonth()`, and that `getMonthlyFinancials()`/`getCashBalance()`/
  `getReinvestmentSummary()` all execute cleanly; then ran `resetDormitoryOnly()` and asserted every
  dormitory collection returns to zero and zero `SEEDED_EXPENSE_MARKER` expenses remain; then
  interleaved a real `addExpense()` call with another seed+reset cycle and asserted that real
  expense survives. Re-ran the full harness 8+ times (random data differs each run) with all
  assertions passing every time — this is what caught the vacation/occupancy interaction, which
  `node --check` alone could not have caught since it's correct-syntax, incorrect-runtime-behavior.
Checkpoint: TASK-009 (this entry)
Next: Await user feedback. Item #9 (Partnership/Finance random-fill parity) remains explicitly out
of scope per this request.

---

## TASK-010
Parent Request: REQ-005
Title: Put the dormitory random-fill (seeder) fully under user control via an options modal
Status: COMPLETED
Priority: Normal (testing/demo tooling improvement)
Description: The user said the random seeder (`DataService.seedRandomDormitoryData()` from
TASK-008/TASK-009) needed to be "under my control" instead of hardcoded ~100%-occupancy, fixed
structure ranges. Reworked the method to accept an `options` object (with sane defaults matching
the previous hardcoded behavior, so a no-args call is unchanged) covering: floors/apartments-per-
floor/rooms-per-apartment min/max ranges, occupancy percent (0–100, previously always 100),
percent of residents who pay something and percent of those who pay in full, and independent
on/off toggles + percentages for guest generation, service/subscription generation, and operating
expense generation (with an expense-percentage multiplier). Added `openSeedOptionsModal()` in
`js/settings.js`, replacing the old one-click "تعبئة عشوائية للتجربة (إشغال 100%)" button with a
"تحكم وتعبئة عشوائية للتجربة" button that opens a form (structure ranges, an occupancy slider,
payment percentages, three feature checkboxes, service-subscribe %, expense multiplier) and only
runs the seeder — behind the existing destructive-action confirmation dialog — after the user
submits that form.
Acceptance Criteria:
- `seedRandomDormitoryData(options)` respects every option: occupancy percent no longer always
  fills 100% of generated beds; structure ranges (floors/apartments/rooms) are configurable;
  guests/services/expenses can each be independently disabled; payment/service-subscribe
  percentages and the expense multiplier are configurable.
- Calling `seedRandomDormitoryData()` with no arguments still reproduces the prior fixed behavior
  (100% occupancy, same structure ranges) — verified so existing callers/tests aren't broken.
- The Settings → "الغرف والأسرة" seeding button now opens a form first; the seed only runs after
  the user submits it and confirms the destructive-action dialog.
- `resetDormitoryOnly()`'s existing scoping (removes only `SEEDED_EXPENSE_MARKER`-tagged expenses
  and dormitory-derived collections, never a real user-entered expense) still holds regardless of
  which options were used to seed.
- `node --check` passes on both touched files.
- No pre-existing behavior outside `seedRandomDormitoryData()` and the seed-panel UI in
  `js/settings.js` was changed.
Completed:
- `js/data.js`: `seedRandomDormitoryData()` rewritten to take an `options` object with defaults
  matching the old hardcoded values; occupancy is now `Math.round(totalBeds * occupancyPercent/100)`
  instead of always all beds; guests/services/expenses generation each gated behind a boolean
  option; payment and service-subscribe rates now use the configurable percentages instead of fixed
  0.75/0.7/0.35 constants; expense amounts scaled by a configurable multiplier. Summary object
  extended with `occupiedBeds`, `occupancyPercent`, `servicesAssigned`.
- `js/settings.js`: added `openSeedOptionsModal()` — a form covering all of the above, including an
  occupancy `<input type="range">` with a live percentage label — wired so the seed only executes
  after form submission + the existing `confirmAction()` dialog; updated the panel description text
  and button label to reflect that the seed is now configurable rather than fixed at 100%.
Validation:
- `node --check` on both touched files — passed.
- Runtime smoke test (Node `vm`-based harness, same pattern as TASK-008/TASK-009, loading
  `js/data.js` for real): ran `seedRandomDormitoryData(options)` across four distinct option sets
  (100% occupancy/all extras on; 40% occupancy/all extras off; 0% occupancy/large structure/2x
  expense multiplier; 100% occupancy/100% payment/0x expense multiplier), asserting each time that
  occupied-bed count matches the requested percentage exactly, resident count matches occupied
  beds, disabled features produce zero output for that feature, chart-facing methods
  (`calculateProfit`, `getMonthlyFinancials`, `getCashBalance`, `getReinvestmentSummary`) execute
  without throwing, `resetDormitoryOnly()` removes only seeded expenses and preserves a real manual
  expense, and post-reset occupancy returns to zero beds — all checks passed on all four runs.
  Additionally ran `seedRandomDormitoryData()` with **no** arguments 5 times to confirm the
  backward-compatible default still reproduces the old 100%-occupancy behavior every time.
Checkpoint: TASK-010 (this entry)
Next: Await user feedback from manually opening the new options modal in-browser (no browser/UI
tool was available in this session — see Known Limitation in `.claude/current-task.md`).

---

## TASK-011
Parent Request: REQ-006
Title: Full-system demo activity — spread dates across a month + populate every module, not just the
dormitory area; make demo-data status visible on every page
Status: COMPLETED
Priority: Normal (testing/demo tooling improvement)
Description: The user said (Arabic, paraphrased): "the seeding should fill the system properly, and
should tell me clearly this is a trial/demo version — not just in the seeding area — do a full
month's worth of activity across every page of the system." Extended `seedRandomDormitoryData()`
(TASK-010's parameterized seeder) with two more options:
1. `spreadOverDays` (default 0, backward-compatible): when > 0, resident check-in dates, resident
   payment dates, guest stays, and operating-expense dates are each randomized within the last N
   days instead of always being "today" — so charts and reports show a genuine month of activity
   instead of a single-day snapshot.
2. `fullSystemActivity` (default false, backward-compatible): when true, also generates — spread
   across the same period — per-partner capital contribution transactions (toward
   `requiredContribution` when set), a partner advance with a 50% chance of a partial repayment, one
   asset purchase, and a profit distribution for the current month if `calculateProfit()` shows
   distributable profit — so the Partnership, Setup/تجهيز, and Treasury pages (not just Dormitory)
   show real seeded activity too. All of these are tagged with a new `SEEDED_DEMO_MARKER` constant
   (separate from TASK-009's `SEEDED_EXPENSE_MARKER`, which stays scoped to expenses only) so
   `resetDormitoryOnly()` can remove exactly these — and nothing a real user entered — precisely.
Also added a persistent, page-wide "demo data active" indicator: `settings.demoDataActive` is set
`true` whenever a seed runs and `false` on reset, and two UI surfaces read it live: (a) the sidebar
"نسخة تجريبية" badge (both desktop and mobile) switches to an explicit warning-colored message when
active, via a new `updateDevBadge()` called from `router()` on every navigation; (b) every page now
shows a dismissable-looking (but always-current) warning banner at the top of its content
(`demoDataBannerHTML()`, inserted at the top of `#main-content` on every `router()` call) stating
plainly that the currently-displayed data is demo/generated, not real — this is new: previously the
only "this is a trial version" notice was the static top-of-page dev-strip, which doesn't reflect
whether *current data* is real or seeded.
Acceptance Criteria:
- `seedRandomDormitoryData({ spreadOverDays: N })` produces resident check-in dates, payment dates,
  guest check-ins, and expense dates spread across the last N days rather than all being today,
  verified by checking the number of distinct dates produced is >1 for a non-trivial resident count.
- `seedRandomDormitoryData({ fullSystemActivity: true })` creates exactly one capital-contribution
  transaction per partner, zero-or-more advances/repayments, at least a chance of one asset
  purchase, and a distribution transaction per partner when distributable profit > 0 — all tagged
  `createdBy: DataService.SEEDED_DEMO_MARKER`.
- Calling `seedRandomDormitoryData()` with no arguments, or with only TASK-010's existing options,
  still reproduces the exact prior behavior (`spreadOverDays` and `fullSystemActivity` both default
  to values that skip this new behavior entirely) — verified.
- `resetDormitoryOnly()` removes every `SEEDED_DEMO_MARKER`-tagged transaction and asset, in
  addition to its existing `SEEDED_EXPENSE_MARKER`-tagged expenses and dormitory-derived revenue
  categories, while preserving a real manually-entered transaction/asset with the same type —
  verified via an interleaved seed+manual-entry+reset cycle.
- `settings.demoDataActive` is `true` after any successful seed and `false` after
  `resetDormitoryOnly()`.
- The Settings → "الغرف والأسرة" options modal exposes both new options (a "نشاط شهر كامل" checkbox
  defaulting to checked, and a spread-days number input defaulting to 30), and the panel's
  description/confirm/toast copy reflects the new scope (whole system, not just dormitory).
- Every page shows a warning banner at the top of its content while `demoDataActive` is true, and
  the sidebar badge (desktop + mobile) reflects the same state; both disappear/revert immediately
  after `resetDormitoryOnly()` runs (verified the state-reading logic; live-browser confirmation is
  the one thing this session's tooling can't do — see Known Limitation).
- `node --check` passes on all three touched files (`js/data.js`, `js/settings.js`, `js/app.js`).
Completed:
- `js/data.js`: added `SEEDED_DEMO_MARKER` constant; `seedRandomDormitoryData()` extended with
  `spreadOverDays` and `fullSystemActivity` options (plus `randomPastDate()`/`randomDateAfter()`
  helpers), producing dated residents/payments/guests/expenses and, when `fullSystemActivity` is on,
  partner capital contributions, advances/repayments, an asset purchase, and profit distributions,
  all tagged for precise cleanup; sets `settings.demoDataActive = true` on completion. Summary object
  extended with `spreadOverDays`, `fullSystemActivity`, `capitalContributed`, `advancesCreated`,
  `repaymentsCreated`, `assetsCreated`, `distributionsCreated`, `distributionsTotal`.
  `resetDormitoryOnly()` extended to also strip `SEEDED_DEMO_MARKER`-tagged transactions and assets,
  and sets `settings.demoDataActive = false`.
- `js/settings.js`: seed options modal gained a "نشاط شهر كامل عبر كل صفحات النظام" section (toggle
  + spread-days input); panel description, reset-confirmation text, and success toast rewritten to
  describe whole-system scope instead of dormitory-only; both the seed button and the reset button
  now call `updateDevBadge()` after completing.
- `js/app.js`: new `demoDataBannerHTML()` (reads `settings.demoDataActive`) inserted at the top of
  `#main-content` on every `router()` call; new `updateDevBadge()` swaps the sidebar `.dev-badge`
  text/icon based on the same flag, called from `router()` so it updates on every navigation without
  needing a full page reload.
Validation:
- `node --check` on all three touched files — passed.
- Runtime smoke test (Node `vm`-based harness, same pattern as prior tasks): seeded with
  `spreadOverDays: 30, fullSystemActivity: true` using the app's own auto-seeded default partners
  (`أيمن`/`الفاضل`, each `requiredContribution` set to 3,000,000) and asserted: exactly one capital
  contribution transaction per partner; resident check-in dates span 22 distinct days out of 33
  residents; expense dates span 8 distinct days; `settings.demoDataActive` becomes `true`; then added
  one real manual transaction and one real manual asset, ran `resetDormitoryOnly()`, and asserted
  every `SEEDED_DEMO_MARKER`/`SEEDED_EXPENSE_MARKER`-tagged record was removed while both real
  records survived, occupancy returned to zero, and `demoDataActive` became `false`. Also re-ran a
  no-args call (confirming all dates are still "today" and `fullSystemActivity` defaults to `false`,
  matching the exact prior TASK-010 behavior) and a `fullSystemActivity: true` call with
  `spreadOverDays` omitted (confirming it doesn't throw and chart-facing methods
  (`calculateProfit`/`getMonthlyFinancials`/`getCashBalance`/`getReinvestmentSummary`) still execute
  cleanly against the richer dataset). One test-harness mistake was caught and fixed along the way:
  the harness initially added two *new* partners named `أيمن`/`الفاضل` on top of the two the app's
  own `seedDemoData()` already creates at load, producing 4 same-named partners and inflated
  transaction counts — not a product bug, fixed by reusing the auto-seeded partners instead.
Checkpoint: TASK-011 (this entry)
Next: Await the user's manual smoke-test feedback — specifically confirming the new banner/badge
actually render correctly in a live browser (this session had no browser/UI tool available).

---

<!--
  Add new tasks below using the same format. Keep them small enough that another Claude session
  could pick one up cold and finish it using only the repository + this file + current-task.md +
  handoff.md. When unrelated work is discovered mid-task, log it here as a new PENDING task instead
  of implementing it immediately. If the task belongs to a tracked user request, link it via
  "Parent Request: REQ-0NN" and make sure that REQ's entry in requests.md lists this task ID too.
-->
