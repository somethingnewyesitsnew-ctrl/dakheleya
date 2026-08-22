# sessions/

Placeholder directory for any per-session artifacts a future session chooses to persist here (e.g.
a detailed session transcript excerpt, a large diagnostic dump, or anything too long/unwieldy for
`.claude/session-log.md`'s summary entries).

The primary session record is `.claude/session-log.md` (one `SESSION-0NN` entry per session, per the
format defined there). This directory does not need to contain files for the workflow to function;
it exists so the expected structure from `CLAUDE.md` is always present.

**Never place secrets, credentials, tokens, API keys, or passwords in this directory** — same rule
as the rest of `.claude/`.
