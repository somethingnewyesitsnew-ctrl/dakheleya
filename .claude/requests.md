# REQUEST LEDGER

Every substantial user request gets a unique `REQ-xxx` ID here, preserving the chain:

```text
USER REQUEST → TASKS → CHECKPOINTS → FINAL RESULT
```

When a new large request arrives:
1. Create a REQ ID.
2. Record it below using the format under "Record format".
3. Break it into tasks in `.claude/tasks.md`, each linked back to this REQ ID.
4. Persist the plan (this file + `tasks.md` + `current-task.md` + `handoff.md`) **before**
   implementation starts.

Small, single-step requests (a one-line fix, a small isolated UI change) do not require a REQ entry —
log them directly as a task in `.claude/tasks.md`. Use judgment per `CLAUDE.md` → "User Request →
Task Plan".

---

## Record format

```markdown
## REQ-0NN

Date:
Original Request Summary:
Objective:
Status: PENDING | IN_PROGRESS | COMPLETED | BLOCKED | CANCELLED
Related Task IDs:
Completed Tasks:
Current Task:
Remaining Tasks:
Final Outcome:
```

---

## REQ-001

Date: See `git log` for the commit dates of TASK-001 through TASK-004 (this ledger was introduced
retroactively in TASK-004; TASK-001–003 predate REQ tracking and are recorded here for continuity).

Original Request Summary: Establish a persistent, interruption-safe Claude Code development workflow
for this repository (CLAUDE.md + `.claude/` state files + checkpoint scripts), so any Claude session
— including a different Claude account — can resume work from repository state alone. Later extended
across several follow-up requests: GitHub-based task planning and cross-session/cross-account
recovery (DECISION-002); removal of the header notification bell (a small, separate UI request, not
part of this REQ's original scope but performed by another session in the same timeframe); making
the workflow function without a local Git CLI for browser-based Claude Projects (TASK-003); and now
this ledger + session log + per-session recovery/health-check system (TASK-004).

Objective: Make the project continuously recoverable by any Claude session, at any time, using only
the repository — never conversation memory.

Status: IN_PROGRESS (the workflow itself is a living system; TASK-004 is the latest increment)

Related Task IDs: TASK-001, TASK-002, TASK-003, TASK-004

Completed Tasks:
- TASK-001 — Install persistent Claude Code workflow (+ DECISION-002 extension: task planning,
  decomposition, cross-session/cross-account recovery)
- TASK-002 — Remove header notification bell/dropdown (UI-only; adjacent work by another session,
  linked here for the record since it shares the same timeframe and was reconciled via merge)
- TASK-003 — Make CLAUDE.md work without a local Git CLI (browser-based Claude Project support)
- TASK-004 — Add request ledger, session log, and per-session recovery/health-check procedures

Current Task: TASK-004 (see `.claude/current-task.md` for live status)

Remaining Tasks: None currently queued beyond TASK-004. Future substantial requests will receive
their own `REQ-0NN` entry.

Final Outcome: (updated as TASK-004 completes — see `.claude/current-task.md` and `.claude/handoff.md`)

---

## REQ-002

Date: See `git log` for the commit date of TASK-007.

Original Request Summary: First real application-feature request under this workflow (Arabic,
paraphrased): make every KPI box on the Dashboard clickable — including the Occupancy tab, which
was missing links; make sure all dashboard charts render reliably; add hover tooltips explaining
each KPI/metric by name; on the Partners page, track a "required contribution" per partner against
what they've actually paid, show the remaining amount, and treat any amount paid *beyond* the
required contribution as an automatic advance/debt owed by the dormitory back to that partner (or
potentially another person); and in the Dormitory hub, make all the boxes/tiles clickable and show
numeric counts on the hub's tabs.

Objective: Improve dashboard/dormitory/partners UX (navigability, chart reliability, in-context
help) and add a real missing accounting concept (required vs. paid capital contribution, with
overpayment automatically tracked as a debt owed to the partner).

Status: COMPLETED

Related Task IDs: TASK-007 (single task, five acceptance-criteria groups — scoped small enough not
to need dotted sub-task IDs, per CLAUDE.md's "match the ceremony to the size of the task" guidance)

Completed Tasks:
- TASK-007 — see `.claude/tasks.md` for full detail.

Current Task: None — TASK-007 completed in the same session it was requested.

Remaining Tasks: None queued for this REQ. Possible natural follow-ups (not requested, not started):
extending the "required contribution → paid → remaining/surplus" pattern to the Dashboard's own
partner mini-cards for full parity with the Partners page, and to a non-partner "other person"
creditor concept if the user later asks for money owed to someone outside the registered partner
list.

Final Outcome: Implemented directly in `js/app.js` (KPI tooltip dictionary + tooltip-aware
`kpiCard()`), `js/dashboard.js` (Occupancy-tab KPI links + a chart `resize` listener leak fix),
`js/data.js` (`requiredContribution` field on partners + `getContributionStatus()`), `js/partners.js`
(new "المطلوب/المسدد/المتبقي" table + surplus-as-debt display, folded into the existing balance
figure), `js/settings.js` (required-contribution input on the add-partner form), `js/hubs.js`
(tab count badges, wired for the Dormitory hub), `js/dormitory.js` (room tiles now fully clickable),
and `css/style.css` (tooltip affordance styling). No test suite exists; validated via `node --check`
on every touched JS file and manual re-read of each diff — see `.claude/current-task.md`.

---

## REQ-003

Date: See `git log` for the commit date of TASK-008.

Original Request Summary: (Arabic, paraphrased) Add the ability to randomly fill the dormitory with
test data, and the ability to reset the dormitory back to a clean slate — a testing/demo workflow
distinct from the existing full "تصفير النظام" (factory reset), which already wipes everything
including partners and financial settings.

Objective: Give the user a fast way to populate a realistic-looking dormitory (floors → apartments
→ rooms → beds → residents, with payments, services, guests, and vacations) for UI testing/demos,
and a scoped reset that clears only that dormitory data (not partners or general financial
settings) so the cycle can be repeated.

Status: COMPLETED

Related Task IDs: TASK-008

Completed Tasks:
- TASK-008 — see `.claude/tasks.md` for full detail, including a real pre-existing bug found and
  fixed along the way (`DataService.addVacation()` referenced a bare `residentId` instead of
  `data.residentId`, which would have thrown for any real user trying to add a vacation, not just
  this new seeder).

Current Task: None — TASK-008 completed in the same session it was requested.

Remaining Tasks: None queued for this REQ.

Final Outcome: Added `DataService.seedRandomDormitoryData()` and `DataService.resetDormitoryOnly()`
in `js/data.js`, wired to two new buttons in Settings → "الغرف والأسرة" (`js/settings.js`). Fixed
`DataService.addVacation()`'s `residentId` reference bug in the process (discovered via a Node-based
runtime smoke test, not just `node --check` syntax validation — see TASK-008 for the harness used).

---

## REQ-004

Date: See `git log` for the commit date of TASK-009.

Original Request Summary: (Arabic, paraphrased) After reviewing a list of known/unfinished items
across the project, the user asked to act on most of them but explicitly deferred item #9 (a
"random fill" for Partnership/Finance analogous to the Dormitory one — intentionally left
unimplemented). For the Dormitory seeder specifically (TASK-008's `seedRandomDormitoryData()`), the
user asked that the system "interact with the dormitory fill logically — profit, expenses, and
charts and everything should work" and that occupancy be increased to 100%.

Objective: Make `seedRandomDormitoryData()` occupy every generated bed (100%, not ~70%) and
generate realistic operating expenses tied to the seeded revenue, so that profit calculations, the
dashboard's financial/occupancy tabs, and every chart that reads from `DataService` (revenue/expense
trend, expense-by-category, cash composition, setup-progress) reflect a coherent, non-zero financial
picture immediately after seeding — while keeping `resetDormitoryOnly()` scoped correctly so it only
removes the seeder's own generated expenses, never a real user-entered one.

Status: COMPLETED

Related Task IDs: TASK-009

Completed Tasks:
- TASK-009 — see `.claude/tasks.md` for full detail, including a real behavioral interaction found
  via runtime testing: seeding vacations (even with `keepBed:true`) set bed status to
  `'محجوز للإجازة'`, which the app's own `occupancyStats()` correctly excludes from `'occupied'` —
  silently preventing a true 100% rate despite zero beds being `'متاح'`. Fixed by dropping vacation
  seeding from the generator entirely (vacations remain fully available to add manually per-resident
  after seeding) rather than altering the shared `occupancyStats()` definition used across the whole
  app.

Current Task: None — TASK-009 completed in the same session it was requested.

Remaining Tasks: None queued for this REQ. Item #9 from the original review (a Partnership/Finance
equivalent of the seeder) was explicitly deferred by the user and remains out of scope.

Final Outcome: `js/data.js` — `seedRandomDormitoryData()` now occupies 100% of generated beds, no
longer seeds vacations, and generates 8–10 categories of realistic operating expenses (rent,
salaries, food, utilities, security, maintenance, purchases...) as a randomized percentage of
collected/expected revenue, each tagged via a new `DataService.SEEDED_EXPENSE_MARKER` sentinel.
`resetDormitoryOnly()` now also removes only expenses carrying that marker. `js/settings.js` — seed
panel description/confirm/toast copy updated to match (100% occupancy, expense generation,
vacations no longer mentioned). Validated via `node --check` plus a runtime Node `vm`-based smoke
test (not just syntax-check) run 8+ times with fresh random data each run.

---

## REQ-005

Date: See `git log` for the commit date of TASK-010.

Original Request Summary: (Arabic, paraphrased) "التعبئة العشوائية عاوزها تكون تحت تحكمي" — the
user wants the dormitory random-fill/seeder to be fully under their control instead of a one-click
action with hardcoded values (fixed ~100% occupancy, fixed structure ranges, fixed feature set).

Objective: Turn `DataService.seedRandomDormitoryData()` into a parameterized generator (structure
ranges, occupancy percent, payment percentages, and independent on/off toggles for
guests/services/expenses, with an expense multiplier), and give the user an actual UI (a form/modal
in Settings) to set those parameters before each run, instead of only a fixed-behavior button.

Status: COMPLETED

Related Task IDs: TASK-010

Completed Tasks:
- TASK-010 — see `.claude/tasks.md` for full detail.

Current Task: None — TASK-010 completed in the same session it was requested.

Remaining Tasks: None queued for this REQ.

Final Outcome: `js/data.js` — `seedRandomDormitoryData(options)` now takes a full options object
(floors/apartments/rooms min-max ranges, occupancy %, payment %, full-payment %, per-feature
guests/services/expenses toggles + their own percentages, expense multiplier) with defaults
matching the prior hardcoded behavior for backward compatibility. `js/settings.js` — new
`openSeedOptionsModal()` presents all of these as a form (including a live occupancy slider) before
running the seed, replacing the previous one-click fixed-100% button. Validated via `node --check`
plus a runtime Node `vm`-based smoke test across four distinct option combinations (including 0%
and 100% occupancy, all-extras-off, and a 2x expense multiplier) plus 5 no-args runs confirming
backward compatibility.
