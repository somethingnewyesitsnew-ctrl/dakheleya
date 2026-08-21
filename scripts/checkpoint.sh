#!/usr/bin/env bash
# checkpoint.sh — create a checkpoint commit for the current task.
#
# Usage:
#   ./scripts/checkpoint.sh TASK-001 "short checkpoint description"
#   ./scripts/checkpoint.sh                      # auto-detects task from .claude/current-task.md
#
# This script NEVER pushes without asking, NEVER discards changes, and NEVER force-pushes.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

TASK_ID="${1:-}"
DESCRIPTION="${2:-checkpoint}"

echo "== Current branch =="
git rev-parse --abbrev-ref HEAD

echo
echo "== Git status =="
git status --short

echo
echo "== Recent commits =="
git log --oneline -5 || true

echo
echo "== Required state files =="
REQUIRED_FILES=(
  "CLAUDE.md"
  ".claude/project-state.md"
  ".claude/current-task.md"
  ".claude/handoff.md"
  ".claude/tasks.md"
)
missing=0
for f in "${REQUIRED_FILES[@]}"; do
  if [ -f "$f" ]; then
    echo "  OK   $f"
  else
    echo "  MISSING  $f"
    missing=1
  fi
done
if [ "$missing" -eq 1 ]; then
  echo
  echo "WARNING: one or more required state files are missing. Checkpoint will still proceed," \
       "but the workflow scaffold may be incomplete."
fi

# Auto-detect task ID from .claude/current-task.md if not provided
if [ -z "$TASK_ID" ]; then
  if [ -f ".claude/current-task.md" ]; then
    DETECTED="$(grep -m1 -E '^TASK-[0-9]+|^BUG-[0-9]+' .claude/current-task.md || true)"
    if [ -n "$DETECTED" ]; then
      TASK_ID="$DETECTED"
    fi
  fi
fi
if [ -z "$TASK_ID" ]; then
  TASK_ID="checkpoint"
fi

echo
echo "== Staging changes =="
git add -A
git status --short

if git diff --cached --quiet; then
  echo
  echo "No staged changes to commit. Nothing to checkpoint."
  exit 0
fi

COMMIT_MSG="checkpoint(${TASK_ID}): ${DESCRIPTION}"
echo
echo "== Creating checkpoint commit =="
echo "Message: $COMMIT_MSG"
git commit -m "$COMMIT_MSG"

SHA="$(git rev-parse HEAD)"
echo
echo "Checkpoint commit created: $SHA"

echo
echo "== Checking for Git remote =="
if git remote get-url origin >/dev/null 2>&1; then
  REMOTE_URL="$(git remote get-url origin)"
  echo "Remote 'origin' found: $REMOTE_URL"
  read -r -p "Push this checkpoint to origin now? [y/N] " CONFIRM
  if [[ "$CONFIRM" =~ ^[Yy]$ ]]; then
    CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
    if git push origin "$CURRENT_BRANCH"; then
      echo "Push succeeded."
    else
      echo "Push FAILED. Do not assume the checkpoint was pushed. Resolve auth/remote issues and retry manually."
      exit 1
    fi
  else
    echo "Skipping push (not confirmed). Checkpoint remains local at $SHA."
  fi
else
  echo "No 'origin' remote configured. Skipping push."
fi

echo
echo "Done."
