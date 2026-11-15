#!/bin/bash
# Claude Code cloud sessions only: install web/ dependencies when they are missing or package-lock.json changed.
# Does nothing locally.
[ "$CLAUDE_CODE_REMOTE" = "true" ] || exit 0
cd "$CLAUDE_PROJECT_DIR/web" || exit 0
h=$(sha256sum package-lock.json | cut -d' ' -f1)
[ "$(cat node_modules/.lock-sha 2>/dev/null)" = "$h" ] && exit 0
if npm ci --no-audit --no-fund >/tmp/eidolon-npm-ci.log 2>&1; then
  echo "$h" > node_modules/.lock-sha
  echo "web/: dependencies installed (npm ci)."
else
  echo "web/: npm ci failed; see /tmp/eidolon-npm-ci.log."
fi
exit 0
