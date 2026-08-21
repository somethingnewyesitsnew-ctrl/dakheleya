#!/usr/bin/env pwsh
# checkpoint.ps1 — create a checkpoint commit for the current task.
#
# Usage:
#   .\scripts\checkpoint.ps1 TASK-001 "short checkpoint description"
#   .\scripts\checkpoint.ps1                      # auto-detects task from .claude/current-task.md
#
# This script NEVER pushes without asking, NEVER discards changes, and NEVER force-pushes.

param(
    [string]$TaskId = "",
    [string]$Description = "checkpoint"
)

$ErrorActionPreference = "Stop"

$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $RepoRoot

Write-Host "== Current branch =="
git rev-parse --abbrev-ref HEAD

Write-Host ""
Write-Host "== Git status =="
git status --short

Write-Host ""
Write-Host "== Recent commits =="
git log --oneline -5

Write-Host ""
Write-Host "== Required state files =="
$RequiredFiles = @(
    "CLAUDE.md",
    ".claude/project-state.md",
    ".claude/current-task.md",
    ".claude/handoff.md",
    ".claude/tasks.md"
)
$missing = $false
foreach ($f in $RequiredFiles) {
    if (Test-Path $f) {
        Write-Host "  OK   $f"
    } else {
        Write-Host "  MISSING  $f"
        $missing = $true
    }
}
if ($missing) {
    Write-Host ""
    Write-Host "WARNING: one or more required state files are missing. Checkpoint will still proceed, but the workflow scaffold may be incomplete."
}

# Auto-detect task ID from .claude/current-task.md if not provided
if ([string]::IsNullOrWhiteSpace($TaskId)) {
    if (Test-Path ".claude/current-task.md") {
        $match = Select-String -Path ".claude/current-task.md" -Pattern "^(TASK-\d+|BUG-\d+)" | Select-Object -First 1
        if ($match) {
            $TaskId = $match.Matches[0].Value
        }
    }
}
if ([string]::IsNullOrWhiteSpace($TaskId)) {
    $TaskId = "checkpoint"
}

Write-Host ""
Write-Host "== Staging changes =="
git add -A
git status --short

$staged = git diff --cached --name-only
if (-not $staged) {
    Write-Host ""
    Write-Host "No staged changes to commit. Nothing to checkpoint."
    exit 0
}

$CommitMsg = "checkpoint(${TaskId}): ${Description}"
Write-Host ""
Write-Host "== Creating checkpoint commit =="
Write-Host "Message: $CommitMsg"
git commit -m "$CommitMsg"

$Sha = git rev-parse HEAD
Write-Host ""
Write-Host "Checkpoint commit created: $Sha"

Write-Host ""
Write-Host "== Checking for Git remote =="
$remoteUrl = $null
try {
    $remoteUrl = git remote get-url origin 2>$null
} catch {
    $remoteUrl = $null
}

if ($remoteUrl) {
    Write-Host "Remote 'origin' found: $remoteUrl"
    $confirm = Read-Host "Push this checkpoint to origin now? [y/N]"
    if ($confirm -match '^[Yy]$') {
        $currentBranch = git rev-parse --abbrev-ref HEAD
        git push origin $currentBranch
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Push succeeded."
        } else {
            Write-Host "Push FAILED. Do not assume the checkpoint was pushed. Resolve auth/remote issues and retry manually."
            exit 1
        }
    } else {
        Write-Host "Skipping push (not confirmed). Checkpoint remains local at $Sha."
    }
} else {
    Write-Host "No 'origin' remote configured. Skipping push."
}

Write-Host ""
Write-Host "Done."
