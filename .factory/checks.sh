#!/usr/bin/env bash
# Deterministic gate checks executed from origin/<base> inside a job worktree.
set -euo pipefail

echo "=== Factory Gate: $(pwd) ($(git rev-parse --short HEAD 2>/dev/null || echo 'no-git')) ==="

ran_any=0

# 1. Python (pytest + py_compile + ruff)
has_python_tests=0
if compgen -G "test_*.py" >/dev/null || compgen -G "*_test.py" >/dev/null; then
  has_python_tests=1
elif [[ -d "tests" ]] && [[ -n "$(find tests -not -path '*/node_modules/*' -not -path '*/.venv/*' -not -path '*/venv/*' -not -path '*/.worktrees/*' \( -name 'test_*.py' -o -name '*_test.py' \) -print -quit)" ]]; then
  has_python_tests=1
fi
if [[ -f "pyproject.toml" || -f "pytest.ini" || "$has_python_tests" -eq 1 ]]; then
  ran_any=1
  HERMES_VENV_PY="${HERMES_VENV_PY:-/Users/tanner/.hermes/hermes-agent/venv/bin/python}"
  if [[ -x ".venv/bin/python" ]] && .venv/bin/python -m pytest --version >/dev/null 2>&1; then
    PY=".venv/bin/python"
  elif command -v python3 >/dev/null 2>&1 && python3 -m pytest --version >/dev/null 2>&1; then
    PY="python3"
  elif [[ -x "$HERMES_VENV_PY" ]] && "$HERMES_VENV_PY" -m pytest --version >/dev/null 2>&1; then
    PY="$HERMES_VENV_PY"
  elif [[ -x ".venv/bin/python" ]]; then
    PY=".venv/bin/python"
  else
    PY="python3"
  fi
  if [[ "$has_python_tests" -eq 1 ]]; then
    "$PY" -m pytest -q
  fi
  if command -v ruff >/dev/null 2>&1; then
    ruff check .
  fi
fi

# 2. Node / TypeScript / Next.js
if [[ -f "package.json" ]]; then
  ran_any=1
  if [[ -x "/opt/homebrew/bin/node" ]]; then
    export PATH="/opt/homebrew/bin:$PATH"
  fi
  node_major="$(node -p 'process.versions.node.split(".")[0]')"
  if [[ "$node_major" -ge 25 && "${NODE_OPTIONS:-}" != *"--no-experimental-webstorage"* ]]; then
    export NODE_OPTIONS="${NODE_OPTIONS:+$NODE_OPTIONS }--no-experimental-webstorage"
  fi
  PKG_MGR="npm"
  if [[ -f "bun.lock" || -f "bun.lockb" ]] && command -v bun >/dev/null 2>&1; then
    PKG_MGR="bun"
  elif [[ -f "pnpm-lock.yaml" ]] && command -v pnpm >/dev/null 2>&1; then
    PKG_MGR="pnpm"
  fi
  node -e '
    const fs = require("fs");
    const s = JSON.parse(fs.readFileSync("package.json", "utf8")).scripts || {};
    for (const k of ["typecheck", "lint"]) {
      if (s[k]) console.log(k);
    }
    if (s.test) console.log("test");
    else if (s["test:unit"]) console.log("test:unit");
    if (s.build && (fs.existsSync(".env.local") || fs.existsSync(".env"))) console.log("build");
  ' | while IFS= read -r script_name; do
    echo "--- Running $PKG_MGR run $script_name ---"
    "$PKG_MGR" run "$script_name"
  done
fi

# 3. Shell syntax check on touched or repo scripts
while IFS= read -r -d '' sh_file; do
  ran_any=1
  bash -n "$sh_file"
done < <(find . -maxdepth 3 -name "*.sh" -not -path "./.git/*" -not -path "./node_modules/*" -not -path "./.worktrees/*" -not -path "./.venv/*" -not -path "./venv/*" -print0)

if [[ "$ran_any" -eq 0 ]]; then
  echo "No automated test/lint runner detected; running git diff sanity check."
  if git rev-parse --git-dir >/dev/null 2>&1; then
    git diff --check
  fi
fi

echo "GATE CHECKS COMPLETED SUCCESSFULLY"
