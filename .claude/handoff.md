# HANDOFF

## Active Project
dakheleya — نظام إدارة الشراكة والداخلية (Partnership & Student-Housing Management System)

## Parent Request
REQ-001 — establish and iteratively extend a persistent, interruption-safe, cross-session/
cross-account Claude Code development workflow for this repository. See `.claude/requests.md` for
the full ledger entry. Currently IN_PROGRESS as a living system (each extension is its own TASK);
no application-feature request is active.

## Session Status
Complete — TASK-011 implemented (seeder now spreads dates across a configurable period and can
populate Partnership/Setup/Treasury via `fullSystemActivity`, plus a page-wide "demo data active"
banner/badge), on top of TASK-001 through TASK-010.

## Active Task
None — awaiting the next request from the user, or feedback from testing TASK-011.

## Task Status
COMPLETED (TASK-001 through TASK-011)

## Last Checkpoint
TASK-011 — see `.claude/current-task.md` and `.claude/tasks.md` for full detail.

## Completed
- **TASK-001** through **TASK-007**: workflow scaffold, task planning/decomposition, Git-optional
  operation, request ledger + session log, confirmed browser-push method, vendored skill source,
  dashboard/partners/dormitory UX improvements. See `.claude/tasks.md` for full per-task detail.
- **TASK-008** (REQ-003): added `DataService.seedRandomDormitoryData()` and
  `DataService.resetDormitoryOnly()`, wired to two new buttons in Settings → "الغرف والأسرة", both
  behind confirmation dialogs. Along the way, found and fixed a real pre-existing bug via runtime
  testing (not just `node --check`): `DataService.addVacation()` referenced a bare `residentId`
  instead of `data.residentId`, which would throw for *any* real user trying to add a vacation —
  fixed to `residentId: data.residentId`.
- **TASK-009** (REQ-004): `seedRandomDormitoryData()` was updated to occupy 100% of generated beds
  (was ~70%) and generate realistic operating expenses (rent, salaries, food, utilities, security,
  maintenance, purchases) as a randomized % of seeded revenue, tagged via a new
  `DataService.SEEDED_EXPENSE_MARKER` constant, so `calculateProfit()`, the dashboard's Financial
  tab, and every revenue/expense-driven chart populate coherently right after seeding.
  `resetDormitoryOnly()` extended to remove only those marker-tagged expenses, leaving real
  user-entered expenses untouched. Found via runtime testing: vacation seeding — even with
  `keepBed:true` — set bed status to `'محجوز للإجازة'`, which `occupancyStats()` correctly excludes
  from `'مشغول'`, silently capping the rate below 100%; fixed by dropping vacation seeding from the
  generator entirely rather than altering the shared occupancy definition.
- **TASK-010** (REQ-005, this session): the user asked for the random-fill/seeder to be fully under
  their own control instead of a fixed one-click 100%-occupancy action. `seedRandomDormitoryData()`
  now takes an `options` object — structure ranges (floors/apartments-per-floor/rooms-per-apartment
  min/max), `occupancyPercent` (0–100, previously always effectively 100), `paymentPercent`/
  `fullPaymentPercent`, and independent on/off toggles + percentages for guest generation, service/
  subscription generation, and operating-expense generation (plus an expense multiplier) — with
  defaults that exactly reproduce the prior hardcoded behavior for a no-args call. `js/settings.js`
  gained `openSeedOptionsModal()`, a form (including a live occupancy range slider) that must be
  submitted — and then confirmed via the existing destructive-action dialog — before the seed runs.
- **TASK-011** (REQ-006, this session): the user asked for the seeder to fill the whole system
  properly (not just Dormitory) and to spread a full month of activity across every page, plus make
  it visually clear everywhere (not only the settings screen) that current data is a demo. Added
  `spreadOverDays` (residents/payments/guests/expenses get dates randomized across the last N days)
  and `fullSystemActivity` (per-partner capital contributions, advances + optional partial
  repayments, one asset purchase, and profit distributions when distributable profit exists — all
  tagged with a new `SEEDED_DEMO_MARKER`) options on `seedRandomDormitoryData()`.
  `resetDormitoryOnly()` extended to remove `SEEDED_DEMO_MARKER`-tagged records too, and both
  seeding and reset now toggle `settings.demoDataActive`. `js/app.js` gained a page-top warning
  banner (`demoDataBannerHTML()`) and a dynamic sidebar badge (`updateDevBadge()`), both wired into
  `router()` so they reflect `demoDataActive` on every navigation.

## Currently Working On
Nothing — session complete, pending user feedback.

## Last Completed Step
Implemented and validated TASK-011 in the fresh clone at `/home/claude/repo` (same session, after
TASK-010 was already pushed to `origin/main`). Ran Node `vm` runtime smoke tests (not committed —
scratch files `/tmp/smoketest/harness2.js`, plus re-running `harness.js`/`harness_default.js` from
TASK-010 as a regression check) that actually execute `seedRandomDormitoryData({ spreadOverDays,
fullSystemActivity })`, asserting date-spreading, per-partner capital/advance/repayment/distribution
transaction generation, and `resetDormitoryOnly()`'s scoping (removes only `SEEDED_DEMO_MARKER`/
`SEEDED_EXPENSE_MARKER`-tagged records, preserves real manual ones) — all passed. Committed locally
(**not pushed** — no GitHub token was supplied for this part of the session, and no push was
requested yet).

## Current File
N/A

## Current Position
N/A

## Remaining
Nothing queued. Item #9 from the review that produced REQ-004 (a Partnership/Finance equivalent of
the Dormitory seeder) is now effectively superseded by TASK-011's `fullSystemActivity` option.

## Changed Files (TASK-011)
- `js/data.js` — `SEEDED_DEMO_MARKER` constant added; `seedRandomDormitoryData()` gained
  `spreadOverDays` and `fullSystemActivity` options (plus `randomPastDate()`/`randomDateAfter()`
  helpers); sets `settings.demoDataActive`; `resetDormitoryOnly()` extended to remove
  `SEEDED_DEMO_MARKER`-tagged transactions/assets and reset the flag
- `js/settings.js` — seed options modal gained the "نشاط شهر كامل" toggle + spread-days input;
  panel/confirm/toast copy rewritten for whole-system scope; both seed and reset handlers now call
  `updateDevBadge()`
- `js/app.js` — new `demoDataBannerHTML()` (page-top warning banner) and `updateDevBadge()`
  (dynamic sidebar badge), both called from `router()` on every navigation
- `.claude/requests.md`, `.claude/tasks.md`, `.claude/current-task.md`, `.claude/handoff.md` (this
  file), `.claude/session-log.md`, `.claude/project-state.md` — state updated for TASK-011/REQ-006

## Files Changed
Same as above (TASK-011). TASK-010's files were changed and pushed earlier in this same session —
see `git log`.

## Tests / Checks
No automated test suite exists in this repo (verified, unchanged). For TASK-011: `node --check` on
all three touched `.js` files, plus an actual **runtime** smoke test — a Node `vm`-based harness
that shims `localStorage`/`document`/`window`, loads `js/data.js` for real, and calls
`seedRandomDormitoryData({ spreadOverDays: 30, fullSystemActivity: true, ... })` using the app's own
auto-seeded default partners, asserting: exactly one capital-contribution transaction per partner;
resident check-in dates and expense dates span multiple distinct days; `settings.demoDataActive`
becomes `true`; then, after adding one real manual transaction and one real manual asset, running
`resetDormitoryOnly()` and asserting every seeded (`SEEDED_DEMO_MARKER`/`SEEDED_EXPENSE_MARKER`)
record is gone, both real records survive, occupancy clears, and `demoDataActive` becomes `false`.
Also re-ran a no-args call (dates all "today", `fullSystemActivity` defaults `false` — unchanged
TASK-010 behavior) and re-ran TASK-010's four-option-combination + 5×no-args harnesses as a
regression check. All passed.

## Validation
See "Tests / Checks" above.

## Failures
None outstanding for TASK-011. One test-harness mistake (not a product bug) was found and fixed
during validation: the harness initially added two *new* partners named `أيمن`/`الفاضل` on top of
the two the app's own `seedDemoData()` already creates at load, producing 4 same-named partners and
inflated transaction counts in an assertion; fixed by reusing the auto-seeded partners instead of
adding duplicates.

## Known Issues
- Still no live-browser click-through in any session so far (no browser/UI tool available) — the
  user should do a manual smoke test per `.claude/current-task.md`'s "Known Limitation" section:
  confirm the new "نشاط شهر كامل" checkbox and spread-days input work, that the resulting seed
  actually shows dated activity in Partnership/Setup/Treasury (not just Dormitory), and that the
  page-top banner + sidebar badge genuinely appear on every page while demo data is active and
  disappear after "إعادة تهيئة الداخلية".
- `.claude/requests.md`'s REQ-001 entry still doesn't list TASK-005/TASK-006 (pre-existing,
  cosmetic, unaddressed across multiple sessions now — should probably just be fixed next time
  REQ-001's ledger entry is touched).
- No `.gitignore` in the repo (still unaddressed — out of scope for all tasks so far).
- Stray empty `New Text Document (2).txt` in repo root — harmless, noted for possible cleanup.
- `scripts/checkpoint.sh`/`.ps1` still don't themselves detect Git's absence gracefully.

## Blockers
None.

## Latest Git Information
TASK-010 was pushed earlier in this same chat session, confirmed via the actual push output line
`505097d..8771ae0 main -> main`, using a token the user supplied in-chat (a first token attempt
failed with a 403 permission error and was superseded by a working second token; both attempts are
recorded in this session's conversation, and the local remote URL was stripped of the token
immediately after use in both cases). TASK-011's work is **committed locally** on top of `8771ae0`
in this session's clone but **not yet pushed** — no token has been supplied for this part of the
session yet. The next step (or a future session) should ask for a token once before pushing, per
`CLAUDE.md` → "Confirmed working method".

## Exact Next Action
1. If a push is wanted: ask the user for a GitHub token (once for this chat session — reuse the one
   already supplied earlier in this session if it's still fresh; note the first token this session
   supplied failed with a 403, so a *working* token may need to be confirmed again), push the local
   TASK-011 commit(s) to `origin/main`, mask the token in shown output, and remind the user to
   revoke/rotate it afterward.
2. Await the user's manual smoke-test feedback on TASK-011 (and any still-pending feedback on
   earlier tasks).
3. For any new request: run Session Recovery, do a Project Health check, log a new `REQ-xxx`/
   `TASK-xxx` as appropriate, implement, validate with an actual runtime check (not just
   `node --check`) when the change involves non-trivial logic, update state files, add a
   `SESSION-xxx` entry, commit and push once a token is available.

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
