# Checkpoints

This directory is a placeholder for any checkpoint-related artifacts that scripts/checkpoint.sh or
scripts/checkpoint.ps1 choose to write locally (e.g. a log of checkpoint commits).

The primary checkpoint mechanism is a **Git commit** (see CLAUDE.md → "Checkpoint System") combined
with the state files `.claude/project-state.md`, `.claude/current-task.md`, and `.claude/handoff.md`.
This folder does not need to contain files for the workflow to function; it exists so the expected
directory structure is always present.
