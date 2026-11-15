# Working in Claude Code on the web (cloud)

How to work on this repo in Claude Code cloud sessions (claude.ai/code, or Cloud in the Claude desktop app) instead of
on a laptop. Each session runs in a fresh Ubuntu 24.04 VM (about 4 vCPU, 16 GB RAM, 30 GB disk) with Node 22, Python,
git and `gh` preinstalled. Node 22 runs everything in `web/`: typecheck, all tests and the build pass on it.

## One-time setup

1. **Give Claude access to the repo.** Install the Claude GitHub App on `hudayfa7/nasahackathon2026`:
   https://github.com/apps/claude (or, from a terminal signed in with `gh`, run `/web-setup` in Claude Code).
2. **Create the environment** at claude.ai/code: open the environment selector under the message box, then
   New environment:
   - **Name:** `eidolon`.
   - **Network access:** Full. Trusted covers npm and GitHub but not Playwright's browser download or the NASA and
     USGS hosts that `npm run fetch:real` reads.
   - **Environment variables:** `PLAYWRIGHT_BROWSERS_PATH=/opt/ms-playwright`
   - **Setup script:** paste the contents of [`.claude/cloud-setup.sh`](.claude/cloud-setup.sh). It installs
     Playwright's Chromium for screenshots and is cached between sessions.
3. **Start a session:** pick the `eidolon` environment and this repo, then give it a task. In the desktop app, choose
   Cloud instead of Local, then the environment and the repo.

Nothing else is needed: the repo's `.claude/settings.json` runs `.claude/hooks/cloud-session-start.sh` when a cloud
session starts, which runs `npm ci` in `web/` (skipped when `package-lock.json` hasn't changed). Locally the hook does
nothing.

## What works there

| Task | In the cloud |
| --- | --- |
| `npm run typecheck`, `npm test`, `npm run build` | Yes |
| `npm run capture`, `a11y`, `poster` | Yes, with the setup script. Claude reads the screenshots in `web/captures/` to check visuals |
| Seeing the site yourself | No browser preview from a cloud VM. Pull the branch and run `npm run dev` locally, or move the session to your machine (`claude --teleport`) |
| `npm run perf` | No: it needs a real GPU and stops on the VM's software renderer |
| The engine | Possible: 16 GB RAM is enough. Run `sh engine/fetch_data.sh` (2.84 GB, re-downloaded in each new VM), then `MERGE.md` step 2 |

## Git in a cloud session

- Git and `gh` go through GitHub's proxy, already signed in. Don't add a GitHub token to the environment: everyone who
  uses the environment can read its variables.
- The proxy doesn't stop pushes to `main`. Work on a branch and open a PR.
- GraphQL is blocked, so `gh pr create` fails. Open the PR from the session's PR button, or with
  `gh api repos/hudayfa7/nasahackathon2026/pulls -f title=... -f head=<branch> -f base=main -f body=...`.
- The VM pauses when idle and a reopened session may get a fresh one: anything not pushed can be lost. Push often.
