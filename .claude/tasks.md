# TASK QUEUE

## TASK-001
Title: Install persistent, interruption-safe Claude Code workflow
Status: COMPLETED
Priority: High (infrastructure)
Description: Create CLAUDE.md, `.claude/` state files, and `scripts/checkpoint.{sh,ps1}` so any
future Claude session can resume work in this repository from repository state alone, without
relying on conversation memory. No application code modified.
Acceptance Criteria:
- CLAUDE.md exists and documents only verified project facts.
- `.claude/project-state.md`, `current-task.md`, `handoff.md`, `tasks.md`, `decisions.md`,
  `checkpoints/README.md`, `README.md` all exist.
- `scripts/checkpoint.sh` and `scripts/checkpoint.ps1` exist and are executable/functional.
- No file under `index.html`, `css/`, or `js/` was modified.
- Work committed to Git.

---

<!--
  Add new tasks below using the same format. Keep them small enough that another Claude session
  could pick one up cold and finish it using only the repository + this file + current-task.md +
  handoff.md. When unrelated work is discovered mid-task, log it here as a new PENDING task instead
  of implementing it immediately.
-->
