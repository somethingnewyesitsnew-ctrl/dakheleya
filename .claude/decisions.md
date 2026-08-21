# ARCHITECTURAL DECISIONS

Do not store secrets in this file.

---

## DECISION-001 — Adopt persistent Claude Code workflow scaffold without altering existing architecture

Date: See commit history (workflow installation commit)

Status: Accepted

### Decision
Install the CLAUDE.md + `.claude/` + `scripts/` workflow scaffold as pure additive documentation and
tooling. Do not introduce a build system, package manager, framework, or test runner as part of this
change, even though their absence limits automated validation.

### Why
The existing project is a working static HTML/CSS/vanilla-JS app with no build tooling. The task was
to add an interruption-safe workflow, not to re-architect the app. Introducing tooling not requested
by the user would violate the "do not modify application code / do not upgrade dependencies during
setup" rule in the workflow instructions themselves.

### Alternatives Considered
- Adding a lightweight test runner (e.g. plain Node scripts) to give "Validation" more teeth.
  Rejected for this task: out of scope, and no task required it.
- Adding a `.gitignore`. Rejected for this task: not required by the workflow instructions and not
  requested; noted as a known gap in `project-state.md` instead of silently fixed.

### Consequences
- Validation for all future tasks in this repo will remain manual (documented explicitly in
  CLAUDE.md) unless a future task explicitly adds tooling — which should itself be logged here as a
  new decision before implementation.
