# TASK QUEUE

## Parent Request

No substantial multi-phase feature request has been made yet. The only work performed so far is
workflow infrastructure (TASK-001) and one small standalone change made before the workflow existed
(see Git history, commit `4fcb868` "Add current date to header" — not tracked as a task ID since it
predates this system).

## Implementation Plan

N/A — no active parent request with sub-task decomposition yet. When the user gives a substantial
request, it will be broken down here into `TASK-0NN.1`, `TASK-0NN.2`, ... sub-tasks per CLAUDE.md's
"Task Decomposition" section, each with its own acceptance criteria.

## Execution Status

TASK-001 (workflow installation) is COMPLETED. No other tasks are open.

---

## Record format for future tasks/sub-tasks

Use this format for every new entry (parent tasks and dotted sub-tasks alike):

```markdown
## TASK-0NN[.M] — Title

Parent Request:
TASK-0NN (if this is a sub-task) — or "—" if this task IS the parent/top-level request

Status:
PENDING | IN_PROGRESS | COMPLETED | BLOCKED | CANCELLED

Priority:
HIGH | MEDIUM | LOW

Description:

Acceptance Criteria:
-
-

Completed:
-

Validation:

Checkpoint:

Next:
```

---

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
