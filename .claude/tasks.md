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

## TASK-002
Title: Remove the notification system and icon from the header
Status: COMPLETED
Priority: Normal (UI change)
Description: Remove the bell icon, its badge, and its dropdown from the top header
(`renderShell()` in `js/app.js`), along with the `updateNotifications()` function that populated
it and its call site in `router()`. Remove the now-unused `.notif-badge` CSS rule.
Acceptance Criteria:
- No bell icon/dropdown/badge remains in the header markup.
- `updateNotifications()` function and its call in `router()` are removed.
- `.notif-badge` CSS rule removed from `css/style.css`.
- Dashboard's separate "يحتاج انتباهك" (attention items) section on the Overview tab is
  untouched — it's a different feature built on the same `DataService.getAttentionItems()` data,
  not part of the header, and was out of scope for this task.
- `bi-bell` icon used elsewhere (vacation alerts card in `js/vacations.js`) is untouched — unrelated
  icon usage, not part of the header notification system.
- No other application files modified.
- Work committed to Git.

---

## TASK-003
Title: Make the workflow (CLAUDE.md) work correctly in a browser-based Claude Project without a local Git CLI
Status: COMPLETED
Priority: High (infrastructure / workflow)
Description: Update `CLAUDE.md` so the workflow no longer assumes a local `.git` directory or Git
CLI is always available. Added a new "Browser Project / Git Availability" section and made every
Git-dependent step elsewhere in the document (startup procedure, task completion criteria,
checkpoint system, interruption safety, new session protocol, Git workflow, session limit protocol)
explicitly conditional: use Git normally when available, and when unavailable, work from the
`.claude/` state files instead without ever fabricating Git status, commit SHAs, branches, or push
results. Also added an explicit `.claude/handoff.md` field format and a "Final Task Checkpoint
Report" format for reporting back to the user at the end of a task.
Acceptance Criteria:
- All pre-existing project-specific instructions in `CLAUDE.md` preserved (nothing removed).
- No application/business code (`index.html`, `css/`, `js/`) modified.
- No existing file deleted.
- No Git commit/SHA/branch/push information fabricated anywhere in the updated file.
- `.claude/` state files remain the primary persistent handoff mechanism regardless of Git
  availability.
- CLAUDE.md now documents: Git-available vs Git-unavailable behavior; mandatory persistent state
  read order; checkpoint behavior in both cases; task completion rules in both cases; interruption
  safety in both cases; a handoff.md field format; and a "Final Task Checkpoint" report format.
- Work committed to Git (this session had a working Git CLI against the cloned repository).

---

<!--
  Add new tasks below using the same format. Keep them small enough that another Claude session
  could pick one up cold and finish it using only the repository + this file + current-task.md +
  handoff.md. When unrelated work is discovered mid-task, log it here as a new PENDING task instead
  of implementing it immediately.
-->
