#!/usr/bin/env python3
"""
scaffold.py — install or update the persistent-git-workflow scaffold in a project.

Usage:
    python scaffold.py --project-root /path/to/repo --config config.json
    python scaffold.py --project-root /path/to/repo --name "My App" --type "..." --stack "..." \
        --entry-point "..." --persistence "..." --file-layout "..." --commands "..."

Behavior:
    - Idempotent-safe: if CLAUDE.md / .claude already exist, does NOT silently overwrite them.
      Use --force to overwrite, or --update to bump only the version marker.
    - Never touches application code — only writes CLAUDE.md and .claude/*.
    - Writes a version marker (.claude/.workflow-version) so future installs can detect drift.
"""
import argparse
import json
import shutil
from pathlib import Path

SKILL_DIR = Path(__file__).resolve().parent.parent
TEMPLATE = SKILL_DIR / "references" / "CLAUDE.md.template"
CLAUDE_DIR_TEMPLATES = SKILL_DIR / "references" / "claude-dir-templates"
WORKFLOW_VERSION = "1.1"

REQUIRED_PLACEHOLDERS = [
    "PROJECT_NAME", "PROJECT_TYPE", "ENTRY_POINT", "STACK",
    "PERSISTENCE", "FILE_LAYOUT", "COMMANDS",
]


def fill(text: str, values: dict) -> str:
    for key, val in values.items():
        text = text.replace("{{" + key + "}}", val)
    return text


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--project-root", required=True)
    p.add_argument("--config", help="JSON file with the placeholder values")
    p.add_argument("--name")
    p.add_argument("--type", dest="ptype")
    p.add_argument("--entry-point")
    p.add_argument("--stack")
    p.add_argument("--persistence")
    p.add_argument("--file-layout")
    p.add_argument("--commands")
    p.add_argument("--force", action="store_true", help="Overwrite existing CLAUDE.md/.claude")
    p.add_argument("--update", action="store_true",
                    help="Only bump the version marker, don't touch existing content")
    args = p.parse_args()

    root = Path(args.project_root).resolve()
    root.mkdir(parents=True, exist_ok=True)
    claude_md = root / "CLAUDE.md"
    claude_dir = root / ".claude"

    if args.update:
        version_file = claude_dir / ".workflow-version"
        old = version_file.read_text().strip() if version_file.exists() else "unknown"
        version_file.parent.mkdir(parents=True, exist_ok=True)
        version_file.write_text(WORKFLOW_VERSION + "\n")
        print(f"Updated workflow version marker: {old} -> {WORKFLOW_VERSION}")
        print("Note: --update does not rewrite CLAUDE.md/.claude content. Re-run with --force "
              "if you also want the template text refreshed (this will NOT touch project-state.md, "
              "tasks.md, current-task.md, handoff.md, session-log.md, decisions.md, requests.md — "
              "those are live project data, not template boilerplate).")
        return

    if (claude_md.exists() or claude_dir.exists()) and not args.force:
        print("CLAUDE.md and/or .claude/ already exist in this project.")
        print("This looks like an existing scaffold, not a fresh install.")
        print("Read the existing files first (this is real project history) rather than "
              "overwriting them. Re-run with --force only if you're deliberately replacing them, "
              "and only after confirming with the user.")
        return

    if args.config:
        values = json.loads(Path(args.config).read_text())
    else:
        values = {
            "PROJECT_NAME": args.name or "UNSET — fill in",
            "PROJECT_TYPE": args.ptype or "UNSET — fill in",
            "ENTRY_POINT": args.entry_point or "UNSET — fill in",
            "STACK": args.stack or "UNSET — fill in",
            "PERSISTENCE": args.persistence or "UNSET — fill in",
            "FILE_LAYOUT": args.file_layout or "UNSET — fill in",
            "COMMANDS": args.commands or "none exist in this repo",
        }

    missing = [k for k in REQUIRED_PLACEHOLDERS if not values.get(k) or values[k].startswith("UNSET")]
    if missing:
        print(f"WARNING: these fields were not supplied and are left as placeholders: {missing}")
        print("Go back and fill them with VERIFIED project facts before treating this as done — "
              "never invent stack/commands that aren't real.")

    # CLAUDE.md
    text = fill(TEMPLATE.read_text(), values)
    claude_md.write_text(text)
    print(f"Wrote {claude_md}")

    # .claude/*
    claude_dir.mkdir(exist_ok=True)
    for src in CLAUDE_DIR_TEMPLATES.rglob("*"):
        if src.is_dir():
            continue
        rel = src.relative_to(CLAUDE_DIR_TEMPLATES)
        dst = claude_dir / rel
        dst.parent.mkdir(parents=True, exist_ok=True)
        dst.write_text(fill(src.read_text(), values))
        print(f"Wrote {dst}")

    (claude_dir / ".workflow-version").write_text(WORKFLOW_VERSION + "\n")
    print(f"Wrote {claude_dir / '.workflow-version'} ({WORKFLOW_VERSION})")

    print("\nScaffold installed. Application code was not touched.")
    print("Next: fill any remaining UNSET placeholders with verified facts, then commit as the "
          "first checkpoint (TASK-001) if Git is available.")


if __name__ == "__main__":
    main()
