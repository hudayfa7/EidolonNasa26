#!/bin/bash
# Setup script for the Eidolon cloud environment. Paste this into the environment's "Setup script" field at
# claude.ai/code (see CLOUD.md). It runs as root on Ubuntu 24.04 before each new session and is cached for about 7 days.
# Installs Playwright's Chromium and its system libraries, used by npm run capture, a11y and poster.
# Keep the version equal to "playwright" in web/package-lock.json; bump both together.
# Needs the environment's network access set to Full (Trusted doesn't include Playwright's download hosts).
export PLAYWRIGHT_BROWSERS_PATH=/opt/ms-playwright
npx -y playwright@1.64.1 install --with-deps chromium || true
chmod -R a+rX /opt/ms-playwright || true
