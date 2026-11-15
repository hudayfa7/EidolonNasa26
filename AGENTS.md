# Eidolon: agent guide

Eidolon is our NASA Space Apps Challenge 2026 entry for *Identify Earth locations that analog the permanent Moon base
locations and Mars*. Pick a site on the Moon or Mars and Eidolon ranks the places on Earth whose terrain form comes
closest at 200 m, shows them side by side in 3D, and helps plan a test campaign at one. A search engine (Python,
FastAPI) does the ranking; the frontend in `web/` shows it.

## Layout

| Path | What |
| --- | --- |
| `web/` | The frontend (Vite, TypeScript, three.js). It has its own `web/AGENTS.md`: read it before you touch `web/` |
| `engine/` | The engine's code, copied in unmodified and **not connected**: nothing calls it, and its 2.6 GB of data isn't in git (`engine/README.md`). Connecting it: `MERGE.md` |
| `.claude/launch.json` | Claude desktop preview: `eidolon-dev` (:5173) and `eidolon-preview` (:4173), both `npm --prefix web …` |
| `README.md` | A short pointer to both halves |

Until the engine is imported, the frontend runs on mock data that replays the engine's own example responses.

## Quickstart

```sh
cd web
npm ci                 # not npm install: it keeps package-lock.json from churning
npm run dev            # http://localhost:5173/ on mock data, no engine needed
```

Node 26 (step 1 used v26.8.2). Every npm command runs from `web/`. Running against the engine comes with the engine
import.

## Docs

| Doc | What it holds |
| --- | --- |
| `web/docs/plan.md` | Step 1: the design system, the copy rules, the verification table and the budgets |
| `web/docs/merge-plan.md` | Step 2: the engine merge, the team decisions (D1–D11) and the phases |
| `web/docs/progress.md` | The running log, 0.9 MB. Never read it whole. Read "Final state" and "Merge notes"; for anything else, `grep -n '^## \|^### ' web/docs/progress.md` and read only that range |
| `web/docs/engine/frontend_spec.md` | The engine's API spec (a copy). On data the spec wins; on visuals `plan.md` wins |
| `web/contracts/` | The engine's JSON Schemas and example responses (a copy; base commit in `ENGINE_COMMIT`) |
| `web/docs/credits.md` | Every outside asset and dataset, with its licence and credit line |
| `web/README.md` | Scripts, env vars, routes and project structure |

A few Merge notes in `progress.md` are known stale (`web/docs/merge-plan.md`, Frontend changes, the row "Fix stale
notes in progress.md"): **Data seam, engine mode** and **Performance budget** still say to set `VITE_DATA=engine` in
`.env`. Where a note and an AGENTS.md disagree, the AGENTS.md wins.

## Team workflow

- Work on a branch and open a PR into `main`. Never push to `main` directly, and never force-push it. The repo can't
  enforce this (merge-plan D8 recommends it; the team has not recorded the decision yet). No CI runs yet, so the
  checks in `web/AGENTS.md` are the gate: run them before you ask for review.
- Never rewrite history: `progress.md` cites commit SHAs.
- Never commit: `web/node_modules`, `web/dist`, `web/captures/`, `web/.cache/`, any `.env*.local`,
  `.claude/settings.local.json`, or credentials (`~/.netrc`, a Kaggle token, API keys). `web/.env` is tracked and holds
  no secrets; secrets go in `web/.env.local`, which is ignored. After the engine import, also never commit the data
  dirs `engine/index`, `engine/grid`, `engine/weights`, `engine/judge` and `engine/targets` (2.6 GB).
- File size: GitHub warns over 50 MB and rejects over 100 MB. Keep every file well under 50 MB; the largest today is
  4.7 MB. No Git LFS. Check before you push: `git ls-files -z | xargs -0 du -k | sort -n | tail -3`.
- Commit only when your change passes the checks in `web/AGENTS.md`.

## The engine is not connected yet

`engine/` holds the engine's code, copied unmodified from its bundle (base `ec4e20b`). The frontend doesn't call it, and
it can't run until its five data dirs (2.6 GB, gitignored) are placed in `engine/`. `web/contracts/` and
`web/docs/engine/` are still the frontend's copies of `engine/code/contracts/` and `engine/code/docs/` (`web/AGENTS.md`,
The seam rule, says how to refresh them). Connecting the two follows `MERGE.md`. Engine changes go in their own
commits, and the engine's owner reviews them.

## Product name and copy

- The product is **Eidolon**. The engine's spec and docstrings say MoonBnb; that name never appears in user-facing text.
- Every user-facing claim follows the copy rules in `web/docs/plan.md` (Must: copy pass, and Design system: Rules).
  `web/AGENTS.md` lists them, and `npm run build` fails on some of them.

## Commits

Follow `git log`:

- Subject: `<item or area>: <what changed, in plain words>`. Add the plan item in brackets when there is one, for
  example `Landing ellipse: a mission's ellipse at its true size on the site's block and map (Stretch 4)`. Use
  `Review fixes: <item>` for fixes after a review. Sentence case, no `feat:`-style prefix, no full stop at the end.
- Body: what changed and why, wrapped at about 72 columns. Bullets are fine.
- AI agents end the message with their `Co-Authored-By:` trailer.
