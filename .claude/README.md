# .claude/

Persistent workflow state for this repository. See `CLAUDE.md` at the repository root for the full
rules. Read order for any new session: `CLAUDE.md` → `project-state.md` → `current-task.md` →
`handoff.md` → `tasks.md` → `decisions.md` (when relevant).

| File | Purpose |
|---|---|
| `project-state.md` | Overall project status: stack, architecture, completed/pending work, known issues |
| `current-task.md` | Full detail on the currently active task (or last completed one) |
| `handoff.md` | Exact continuation point for the next session |
| `tasks.md` | Full task queue (TASK-xxx / BUG-xxx), ordered by priority |
| `decisions.md` | Architectural decisions log (no secrets) |
| `checkpoints/` | Placeholder directory for checkpoint-related artifacts |

Do not store secrets (tokens, passwords, API keys) in any file in this directory.
