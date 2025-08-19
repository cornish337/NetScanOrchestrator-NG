#!/usr/bin/env python3
"""Ensure documentation updated when backend/frontend changes occur.

This script checks the previous commit for changes under ``backend/`` or
``frontend/``. If such changes exist, at least one file in ``docs/`` or the
root ``README.md`` must be modified in the same commit.

The script is intended for CI usage and relies on ``git diff --name-only HEAD^``.
"""

from __future__ import annotations

import subprocess
import sys


def get_changed_files() -> list[str]:
    """Return list of files changed in the last commit.

    Falls back to an empty list if the diff cannot be produced (e.g., initial
    commit).
    """

    try:
        result = subprocess.run(
            ["git", "diff", "--name-only", "HEAD^"],
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
        )
    except subprocess.CalledProcessError as exc:  # pragma: no cover - defensive
        print("Warning: unable to determine diff:", exc, file=sys.stderr)
        return []

    return [line.strip() for line in result.stdout.splitlines() if line.strip()]


def main() -> int:
    changed = get_changed_files()

    backend = [f for f in changed if f.startswith("backend/")]
    frontend = [f for f in changed if f.startswith("frontend/")]
    docs = [f for f in changed if f.startswith("docs/") or f == "README.md"]

    if (backend or frontend) and not docs:
        print("Documentation must be updated when backend or frontend files change.")
        print("Changed backend/frontend files:")
        for f in backend + frontend:
            print(f" - {f}")
        return 1

    print("Documentation sync check passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
