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

Current Phase: Active development under the task system. TASK-001, TASK-002, and TASK-003 are all
COMPLETED (see `.claude/tasks.md`). Workflow now supports both a local Git-CLI environment and a
browser-based Claude Project without one (TASK-003), plus GitHub-based task planning and
cross-session/cross-account recovery (TASK-001's DECISION-002 extension).

Overall Status: Healthy. App is functional. Recent history:
- TASK-001: installed the persistent workflow scaffold, later extended per DECISION-002 with
  task-planning/decomposition rules and a full cross-session/cross-account Project Recovery
  procedure.
- TASK-002 (separate session): removed the header notification bell/dropdown/badge and its
  supporting JS/CSS. The dashboard's own "يحتاج انتباهك" attention-items box, built on the same
  `DataService.getAttentionItems()` data, is unaffected.
- TASK-003 (separate session): made `CLAUDE.md` work correctly whether Git CLI is available (local
  Claude Code) or not (browser-based Claude Project connected via GitHub).
- A real branch divergence between the TASK-001 extension and TASK-002/TASK-003 was reconciled via
  a merge commit, combining both sides' additions in `CLAUDE.md` and the `.claude/` state files
  rather than discarding either.

Active Task: None — TASK-001, TASK-002, and TASK-003 all COMPLETED. Awaiting next task (see
`.claude/tasks.md`).

Environment Note: This project may be accessed either via a local Claude Code checkout with Git CLI,
or via a browser-based Claude Project connected to the GitHub repository without a local `.git`
directory. `CLAUDE.md`'s "Browser Project / Git Availability" section (added in TASK-003) governs
how to behave in each case — always verify which applies before assuming Git commands will work.

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
- Dashboard "يحتاج انتباهك" (attention items) box on the Overview tab, fed by
  `DataService.getAttentionItems()`. The separate header notification bell that used to read from
  the same data was removed in TASK-002 — the dashboard box itself is unaffected.
- Header date display (added prior to the task system, commit `4fcb868`).

In Progress: None.

Pending Work: See `.claude/tasks.md` for the open task queue (currently empty beyond TASK-001–003,
all completed).

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

Last Known Good Commit: Merge commit reconciling TASK-001's extension with TASK-002/TASK-003 — see
`git log --oneline -10` for the exact SHA.

Last Checkpoint: Merge reconciliation of TASK-001 (extended) + TASK-002 + TASK-003 (this commit)

Validation Status: No automated validation exists for this project (no test suite/build/lint). See
CLAUDE.md "Validation" section for the manual verification procedure used instead. TASK-001/003 were
documentation-only changes validated by manual re-read + `git diff`/`git status`. TASK-002 was a
small UI removal validated manually. The merge itself was validated by confirming no conflict
markers remained in any touched file before committing.

Next Action: Await a real feature/bug task from the user; populate TASK-004+ in `.claude/tasks.md`
when one is defined.

Last Updated: Merge reconciliation commit (see `git log` for exact date/SHA)
