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

Current Phase: Workflow bootstrap, now extended with task-planning/decomposition rules and full
cross-session/cross-account Project Recovery procedure (per DECISION-002). No feature work started
under the task system yet.

Overall Status: Healthy. App is functional; most recent change before this workflow setup was adding
a date display to the header (commit `4fcb868`, "Add current date to header").

Active Task: TASK-001 (workflow installation — see `.claude/current-task.md`)

Completed Areas (pre-existing, functional):
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
- Notification/attention bell fed by `DataService.getAttentionItems()`

In Progress: None.

Pending Work: See `.claude/tasks.md` for the open task queue (currently empty beyond TASK-001 workflow setup).

Known Issues:
- No automated tests, no linter, no type-checker exist in this repo (by design — plain static app).
- `residents.js` `openAddResidentModal`'s rent-autofill handler references
  `DataService.getRoomLocation ? DataService.getRoom(...) : null` — looks like leftover defensive code;
  not a confirmed bug, just noted for future review.
- No `.gitignore` present in the repo.

Blockers: None.

Last Known Good Commit: 4fcb868 — "Add current date to header" (last application-code commit)

Last Checkpoint: TASK-001 — workflow scaffold (commit 5e10b47) + task-planning/cross-session
recovery extension per DECISION-002 (this commit)

Validation Status: No automated validation exists for this project (no test suite/build/lint). See
CLAUDE.md "Validation" section for the manual verification procedure to use instead.

Next Action: Await a real feature/bug task from the user; populate TASK-002+ in `.claude/tasks.md`
when one is defined. No application code should be modified until a task is defined.

Last Updated: Workflow installation commit (see `git log` for exact date/SHA)
