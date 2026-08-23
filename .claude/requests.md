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
