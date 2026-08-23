# .claude/

Persistent workflow state for this repository. See `CLAUDE.md` at the repo root for the full
rules. Read order for any new session: `CLAUDE.md` → `project-state.md` → `requests.md` →
`tasks.md` → `current-task.md` → `handoff.md` → `session-log.md` → `decisions.md` (when relevant).

| File | Purpose |
|---|---|
| `project-state.md` | Overall project status |
| `requests.md` | Request ledger (REQ-xxx) |
| `current-task.md` | Full detail on the active/last task |
| `handoff.md` | Exact continuation point for the next session |
| `tasks.md` | Full task queue (TASK-xxx / BUG-xxx) |
| `session-log.md` | One SESSION-xxx entry per session that did meaningful work |
| `decisions.md` | Architectural decisions log (no secrets) |
| `checkpoints/` | Placeholder for checkpoint artifacts |
| `sessions/` | Placeholder for per-session artifacts too large for session-log.md |

Do not store secrets in any file in this directory.
