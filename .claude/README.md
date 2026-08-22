# .claude/

Persistent workflow state for this repository. See `CLAUDE.md` at the repository root for the full
rules. Read order for any new session: `CLAUDE.md` → `project-state.md` → `requests.md` →
`tasks.md` → `current-task.md` → `handoff.md` → `session-log.md` → `decisions.md` (when relevant).

| File | Purpose |
|---|---|
| `project-state.md` | Overall project status: stack, architecture, completed/pending work, known issues |
| `requests.md` | Request ledger: one `REQ-xxx` entry per substantial user request, linked to its tasks |
| `current-task.md` | Full detail on the currently active task (or last completed one) |
| `handoff.md` | Exact continuation point for the next session |
| `tasks.md` | Full task queue (TASK-xxx / BUG-xxx), ordered by priority, linked back to `REQ-xxx` |
| `session-log.md` | One `SESSION-xxx` entry per Claude session that did meaningful work here |
| `decisions.md` | Architectural decisions log (no secrets) |
| `checkpoints/` | Placeholder directory for checkpoint-related artifacts |
| `sessions/` | Placeholder directory for per-session artifacts too large for `session-log.md` |

Do not store secrets (tokens, passwords, API keys) in any file in this directory.
