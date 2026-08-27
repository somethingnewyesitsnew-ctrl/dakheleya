# PROJECT STATE

Project: dakheleya — نظام إدارة الشراكة والداخلية (Partnership & Student-Housing Management System)

Technology Stack:
- Static HTML/CSS/vanilla JavaScript, no build tooling
- Bootstrap 5.3.3 RTL + Bootstrap Icons (CDN)
- Chart.js 4.4.4 (CDN)
- Google Fonts: Cairo (CDN)
- No backend, no database — persistence is browser `localStorage` via `StorageService` (js/data.js)

Architecture:
- Single `index.html` shell loading scripts in sequence (data.js → app.js → feature pages → hubs.js)
- Hash-based client-side router (`js/app.js`: `ROUTES`, `router()`, `LEGACY_ALIASES`)
- Feature pages register render functions on a global `Pages` object, e.g. `Pages.residents(container)`
- `DataService` (js/data.js) is the single business-logic layer over `StorageService` (localStorage
  abstraction), covering: partners, transactions, expenses, floors/apartments/rooms/beds (dormitory
  hierarchy), residents, guests, services, vacations, transfers, assets, recurring income/expenses,
  activity log, month closings, financial calculations (profit, cash balance, simulations)
- Consolidated "hub" pages (`js/hubs.js`) group related feature pages into tabs to keep the sidebar
  to 9 top-level items (Dashboard, Partnership, Dormitory, Finance, Setup, Review, Tools, Reports, Settings)

Current Phase: Workflow finalized under REQ-001 (TASK-001–006). REQ-002/TASK-007, REQ-003/TASK-008,
REQ-004/TASK-009, REQ-005/TASK-010, and REQ-006/TASK-011 are real application-feature work done
under this system: a dormitory test-data seeder, now fully parameterized (structure, occupancy,
date-spreading) and able to populate Partnership/Setup/Treasury activity across a full simulated
month — not just the Dormitory area — with a page-wide indicator whenever demo data is active.

Overall Status: Healthy. App is functional. Workflow/feature history:
- TASK-001 (+ DECISION-002): installed the workflow scaffold, extended with task planning and a
  first cross-session/cross-account recovery procedure.
- TASK-002: removed the header notification bell/dropdown/badge and its supporting JS/CSS.
- TASK-003: made `CLAUDE.md` work correctly whether Git CLI is available or not.
- A real branch divergence between the TASK-001 extension and TASK-002/TASK-003 was reconciled via
  a merge commit (`f923a1d`).
- TASK-004: added the request ledger and session log, formalized session recovery, cross-account
  continuation, checkpoint frequency, project health checks, authentication/secrets handling.
- TASK-005: documented the confirmed browser-session GitHub push method (DECISION-004).
- TASK-006: vendored the `persistent-git-workflow` skill source into `.claude/skills/`.
- TASK-007 (REQ-002): first application-feature request — see `.claude/tasks.md` for full detail.
  Implemented and pushed to `origin/main` (`c030d90`).
- TASK-008 (REQ-003): added random dormitory test-data seeding + a scoped dormitory-only reset
  (`js/data.js`, `js/settings.js`); found and fixed a real pre-existing bug in
  `DataService.addVacation()` (bare `residentId` instead of `data.residentId`) via runtime testing.
- TASK-009 (REQ-004): improved the dormitory seeder to occupy 100% of generated beds (was ~70%) and
  generate realistic operating expenses tied to seeded revenue, so profit calculations and every
  revenue/expense-driven dashboard chart populate coherently right after seeding; dropped vacation
  seeding after runtime testing showed it silently capped occupancy below 100%; scoped
  `resetDormitoryOnly()` to remove only the seeder's own tagged expenses.
- TASK-010 (REQ-005): put the dormitory seeder fully under user control — `seedRandomDormitoryData()`
  now takes an `options` object (structure ranges, occupancy %, payment %, per-feature
  guests/services/expenses toggles, expense multiplier) instead of hardcoded values, and Settings
  now opens a form/modal (with a live occupancy slider) before running the seed, instead of a fixed
  one-click 100%-occupancy button. Committed locally; not yet pushed (no token supplied this
  session).
- TASK-011 (REQ-006): seeder gained `spreadOverDays` (dates spread across a configurable period
  instead of always "today") and `fullSystemActivity` (per-partner capital contributions, advances/
  repayments, an asset purchase, and profit distributions — populating Partnership/Setup/Treasury,
  not just Dormitory), all tagged via a new `SEEDED_DEMO_MARKER` for precise reset cleanup. Added a
  `settings.demoDataActive` flag with a page-top warning banner and a dynamic sidebar badge that
  reflect it live on every navigation. Committed locally; not yet pushed.

Active Task: None — TASK-001 through TASK-011 all COMPLETED. Awaiting the user's manual smoke-test
feedback, or the next request (see `.claude/requests.md` for REQ-006's status and `.claude/tasks.md`
for the task queue).

Environment Note: This project may be accessed either via a local Claude Code checkout with Git CLI,
or via a browser-based Claude Project connected to GitHub without a local `.git` directory.
`CLAUDE.md`'s "Browser Project / Git Availability" section governs behavior in each case.

Completed Areas (pre-existing, functional application features):
- Dashboard with 4 tabs (overview, financial, occupancy, partners) + Chart.js charts
- Partnership: partners list, capital, advances, distributions, settlements, statements
- Dormitory: hierarchical structure (floor → apartment → room → bed), residents, housing/collection,
  guests, services, vacations, transfers
- Finance: revenue, expenses, recurring income/expenses, treasury, assets
- Setup: setup budget, purchases, assets, reinvestment tracking
- Review: month close, activity log, approvals, disputes
- Tools: profit simulator, rent contract projection
- Reports: grouped report tiles across all modules with CSV export
- Settings: partners, rooms/beds config, rent/expense settings, recurring config, factory reset
- Global search across residents, floors, apartments, rooms, guests, partners, transactions, expenses
- Dashboard "يحتاج انتباهك" (attention items) box on the Overview tab (header notification bell that
  duplicated this was removed in TASK-002)
- Header date display

In Progress: None.

Pending Work: See `.claude/tasks.md` for the open task queue (currently empty beyond TASK-001–004,
all completed) and `.claude/requests.md` for REQ-001's status.

Known Issues:
- No automated tests, no linter, no type-checker exist in this repo (by design — plain static app).
- `residents.js` `openAddResidentModal`'s rent-autofill handler references
  `DataService.getRoomLocation ? DataService.getRoom(...) : null` — looks like leftover defensive
  code; not a confirmed bug, just noted for future review.
- No `.gitignore` present in the repo.
- Stray empty file `New Text Document (2).txt` in repo root — harmless, noted for possible cleanup.
- `scripts/checkpoint.sh`/`.ps1` assume Git CLI is present when invoked; correctly scoped as
  "Git-available only" per `CLAUDE.md`, but don't themselves detect Git's absence gracefully.

Blockers: None.

Last Known Good Commit: TASK-004 commit — see `git log --oneline -10` for the exact SHA.

Last Checkpoint: TASK-004 (this commit)

Validation Status: No automated validation exists for this project (no test suite/build/lint) — see
CLAUDE.md "Validation" for the manual procedure used instead. TASK-001/003/004 were documentation/
workflow-only changes, validated by manual re-read + `git diff`/`git status` inspection and (for
TASK-004) a self-applied Project Health check before starting. TASK-002 was a small UI removal,
validated manually.

Next Action: Await a real feature/bug request from the user. If substantial, open `REQ-002` in
`.claude/requests.md` and break it into tasks in `.claude/tasks.md` before implementing.

Last Updated: TASK-004 completion commit (see `git log` for exact date/SHA)
