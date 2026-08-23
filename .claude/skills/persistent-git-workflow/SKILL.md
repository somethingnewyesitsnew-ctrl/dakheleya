---
name: persistent-git-workflow
description: Use this skill whenever the user starts a new coding project and wants Claude to remember progress across sessions/chats, or whenever the user asks Claude to commit/push/save changes to GitHub from a Claude.ai browser chat. Also trigger when the user says things like "set up the workflow", "make this project persistent", "install the workflow skill", "continue the project", or asks how to get Claude to commit to git without re-explaining everything each time. Covers both (a) bootstrapping a CLAUDE.md + .claude/ state-file scaffold in any repo so a new chat/session can recover full context, and (b) the confirmed procedure for cloning/committing/pushing to GitHub from inside a Claude.ai sandboxed chat session using a user-supplied token.
---

# Persistent Git Workflow

Two things bundled together, because they're meant to be used as a pair:

1. **Project continuity scaffold** — a `CLAUDE.md` + `.claude/` state-file system so any future
   Claude session (or account) can resume a project from repo state alone, without conversation
   memory.
2. **Browser-session GitHub push method** — the confirmed way to actually commit/push from a
   Claude.ai browser chat sandbox, asking the user for a token once per chat.

Use part 1 when starting/onboarding a project. Use part 2 whenever a push is actually needed
(which may be the very next thing after part 1, or much later in an existing project).

---

## Part 1 — Bootstrap the continuity scaffold on a new/existing project

Trigger: user says "set up the workflow here", "install this skill on this project", starts a new
repo and wants Claude to track progress — **or** you notice a `CLAUDE.md` already present in an
uploaded/synced repo that matches this pattern (see "Auto-resume" below).

### Auto-resume on an already-scaffolded project

Before installing anything, check whether `CLAUDE.md` and `.claude/` already exist in the project
(they may have been synced in via GitHub, uploaded, or installed in an earlier session). If so:
**don't reinstall — resume.** Read them in the order `CLAUDE.md` says (project-state → requests →
tasks → current-task → handoff → session-log → decisions) and report a `PROJECT RECOVERY` block
per that file's own instructions, same as if the user had explicitly said "continue." Only fall
through to a fresh install if no scaffold exists yet.

### Fresh install

1. Inspect the actual project first — stack, file layout, existing tooling (tests? build? linter?
   package manager?), and any existing conventions/docs already in the repo. Do not invent facts;
   only document what you verify. If the repo already has real content and structure (not a blank
   folder), **adapt the scaffold to what's already there** rather than imposing a foreign layout —
   e.g. don't invent a task-ID convention if the repo already tracks issues in GitHub Issues; note
   that and integrate with it instead of duplicating it.
2. Run the bundled script to generate the files deterministically instead of retyping them by hand:
   ```bash
   python scripts/scaffold.py --project-root /path/to/repo \
     --name "..." --type "..." --entry-point "..." --stack "..." \
     --persistence "..." --file-layout "..." --commands "..."
   ```
   Or pass `--config path/to/values.json` with the same fields as keys. The script:
   - refuses to overwrite an existing `CLAUDE.md`/`.claude/` (use `--force` only after confirming
     with the user that a deliberate replacement is wanted)
   - warns about any field left unfilled rather than silently shipping a placeholder
   - writes `.claude/.workflow-version` so future sessions can detect if the template has moved on
   - never touches application code
3. After the script runs, open `CLAUDE.md` and fill in any field it flagged as unresolved with
   real, verified facts — don't leave `UNSET` in a file you're about to commit.
4. If Git is available (see Part 2), commit this scaffold as the first checkpoint
   (`docs(TASK-001): install persistent Claude Code workflow scaffold`). If not, tell the user
   plainly that no commit occurred and the files exist only locally/in-session until pushed.
5. From this point on, follow the full procedure in `CLAUDE.md` for all further work in this
   project (task IDs, checkpoints, session recovery, etc.).

### Match the ceremony to the size of the task — don't over-apply this

This scaffold's task/request/checkpoint system is for **substantial, multi-session work**. Don't
force it onto everything:

- **Trivial/one-off** (a quick script, a single obvious bug fix, something finishable in one
  reply): just do it. Optionally add one line to `tasks.md` for the record, skip the full
  `TASK-xxx` ceremony, skip creating a `REQ-xxx`, skip a formal checkpoint report.
- **Substantial** (spans multiple sessions, has real sub-phases, or the user explicitly wants it
  tracked): use the full system — `REQ-xxx` → dotted `TASK-xxx.N` sub-tasks with acceptance
  criteria → checkpoint after each.
- When unsure, ask yourself: "would losing this mid-way through actually be costly to recover
  from?" If yes, track it properly. If it's a 5-minute fix, tracking it formally just adds noise.

### Core rules this scaffold establishes (summary — see the template for full text)

- Every meaningful unit of work gets a `TASK-0NN` (or `BUG-0NN`) ID, logged in `.claude/tasks.md`.
- Substantial multi-phase requests get a `REQ-0NN` entry in `.claude/requests.md` *before*
  implementation starts, broken into dotted sub-tasks (`TASK-0NN.1`, `TASK-0NN.2`, ...) each with
  explicit acceptance criteria.
- Checkpoint after every meaningful milestone (not just at the end of a whole request): update
  `current-task.md`, `project-state.md`, `handoff.md`, `tasks.md`, and commit if Git is available.
- At the start of any new session (or when the user says "continue"), read, in order: `CLAUDE.md`
  → `project-state.md` → `requests.md` → `tasks.md` → `current-task.md` → `handoff.md` →
  `session-log.md` → `decisions.md` (when relevant) — then report using the `PROJECT RECOVERY`
  format from the template, before asking the user anything.
- If state files contradict each other: **stop**, name the contradiction, resolve using the most
  recently verified evidence (Git history when available), then report the resolution.
- Never fabricate Git status, a commit SHA, or a "pushed successfully" claim that didn't actually
  happen — always verify against the actual command output.
- Never write secrets/tokens into any tracked file.

---

## Part 2 — Committing/pushing to GitHub from a Claude.ai browser chat

Trigger: the user asks Claude to commit, push, or "save this to GitHub" while working in a
Claude.ai chat (not Claude Code).

**First, check whether this is even possible in the current environment**: this only works if the
chat has the code-execution/bash sandbox enabled (i.e. Claude has a working shell). If there's no
bash/code-execution tool available, this method cannot run — tell the user plainly and suggest
Claude Code instead, or offer to hand them finished diffs to paste into GitHub's web editor
themselves.

If the sandbox is available:

1. **Verify the environment once per chat**, don't assume:
   ```bash
   which git && git --version
   curl -sI https://api.github.com --max-time 5 | head -3
   ```
   A `403` from that curl is fine and expected (it just means no auth yet) — it confirms the
   network path is open.

2. **Ask the user for a GitHub token — once per chat session, right when the push is first
   needed** (not preemptively, not more than once per chat). Recommend: a fine-grained Personal
   Access Token at `github.com/settings/tokens?type=beta`, scoped to only the target repo,
   `Contents: Read & Write`, short expiry.

3. **Clone using the token**, into a scratch directory (e.g. `/home/claude/repo`):
   ```bash
   export GH_TOKEN="<token>"
   git clone "https://${GH_TOKEN}@github.com/<owner>/<repo>.git" repo
   ```

4. Do the actual task's work inside that clone.

5. Commit with a descriptive, task-linked message (`feat(TASK-xxx): ...`,
   `checkpoint(TASK-xxx): ...`, `fix(BUG-xxx): ...` — see Part 1's task ID system).

6. Push, **masking the token in whatever output gets shown back to the user**:
   ```bash
   git push origin <branch> 2>&1 | sed "s/${GH_TOKEN}/***TOKEN***/g"
   ```
   Only report success if the push output actually shows the `<old-sha>..<new-sha> branch -> branch`
   confirmation line — never claim it succeeded otherwise.

7. **Reuse the same token for the rest of that chat session** — don't re-ask on every commit. Do
   ask again in a brand-new chat, since the token only lives in that session's ephemeral sandbox.

8. Once done with pushing for that session, strip the token back out of the local remote so it
   doesn't linger in any file the user might later view:
   ```bash
   unset GH_TOKEN
   git remote set-url origin "https://github.com/<owner>/<repo>.git"
   ```

9. **Tell the user, once, that the token they pasted is now in the chat transcript and should be
   treated as no longer secret** — recommend they revoke/rotate it once the session's work is
   done. Don't repeat this warning every single message, just once per session near the end (or
   right after they first paste it).

### Edge cases

- **Working across multiple repos in one chat**: a token is scoped to whichever repo(s) the user
  granted access to when creating it. If you need to push to a *different* repo than the one the
  token already covers, ask for a token again (or ask the user to confirm the existing one also
  covers the new repo) — don't assume one token silently covers every repo.
- **Push rejected as unauthorized / token expired mid-session**: don't retry silently or guess.
  Tell the user plainly what happened and ask for a fresh token — this can happen with short-lived
  fine-grained tokens on a long session.
- **`git push` rejected because the remote has moved on** (someone else pushed, or a previous
  session did): `git fetch`, then `git log HEAD..origin/<branch>` to see what's new. Understand
  what changed before merging. Prefer `git merge` over rebase unless the user asks for a clean
  linear history. Resolve conflicts by combining both sides' intent, not by picking one blindly.
  Never `git push --force` unless the user explicitly asks for it and understands what it does.
- **User pastes a token unprompted, before you've asked**: still follow the same procedure (mask
  it in output, use it for the session, remind them to rotate it) — don't ask them to re-paste it
  just because you didn't ask first.

### What NOT to do

- Don't tell the user this is impossible without checking first — verify `git`/network access
  before assuming the sandbox lacks them.
- Don't ask for a fresh token on every single commit within one chat — that's needless friction;
  the exposure already happened at the first paste.
- Don't write the token into any file that gets committed, into `.claude/*`, or into `CLAUDE.md`.
- Don't claim a push succeeded without seeing the actual confirming output line.
- Don't force-push. Don't discard another session's work if a `git fetch` shows the remote has
  diverged — merge/rebase carefully instead (see `references/CLAUDE.md.template` → "Cross-Account
  Continuation" for the full procedure).

---

## Versioning

`scripts/scaffold.py` writes `.claude/.workflow-version` on every fresh install (currently `1.1`).
If you're resuming a project and its version marker is older than this skill's current version,
mention it to the user once ("this project's workflow scaffold is on an older version of this
skill — want me to note what's changed, or leave it as-is?") rather than silently rewriting their
live project-state/tasks/handoff files, which are real data, not template boilerplate. Only
`CLAUDE.md`'s rules text itself is safe to refresh with `--force`; never touch the content of
`project-state.md`, `tasks.md`, `current-task.md`, `handoff.md`, `session-log.md`, `decisions.md`,
or `requests.md` without the user's confirmation, since those carry actual project history.

## Reference files

- `scripts/scaffold.py` — deterministic installer. `--project-root`, plus either individual
  `--name/--type/--entry-point/--stack/--persistence/--file-layout/--commands` flags or
  `--config values.json`. Refuses to overwrite an existing scaffold unless `--force`. Use this
  instead of hand-typing the templates.
- `references/CLAUDE.md.template` — full text used to generate a project's `CLAUDE.md`. Contains
  the complete workflow rules (task lifecycle, checkpoints, session recovery format, cross-account
  continuation, project health checks, the full Part 2 procedure written out formally, etc.) Read
  this directly if you need the full rules rather than the summary above.
- `references/claude-dir-templates/` — starter content for each `.claude/*` file, used by the
  script. Read directly only if you're building the scaffold by hand instead of via the script.
