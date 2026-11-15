# Contracts

JSON Schemas (draft 2020-12) shared between ML, the backend (Isaam) and the front end (Hudayfa). Examples in `examples/` validate against them (`tests/test_contracts.py`). **All scores in the examples are FAKE**; coordinates are real cited points from the label set.

| Schema | What it is |
|---|---|
| `target.json` | A Moon/Mars target (preset or user-picked): coordinates, scope, which target-side data layers exist. |
| `site_listing.json` | An Earth operating area: location, known-analog flag, and the **practical** panel (access, barren fraction, footprint, protected-area flag + permit note, best months). |
| `match_result.json` | One ranked result for a (target, purpose) query: **physical fidelity** (purpose-weighted), per-property breakdown with status `match` / `partial` / `gap` / `not_measurable`, explanation (summary, strengths, gaps, caveats), optional terrain twins. |

Design rules from the research (see `docs/user_needs.md`, `docs/decisions.md`):
- Physical fidelity and practical suitability are **separate**; the UI shows both and never blends them.
- Every property has a status, so coverage gaps ("lacks ground ice") and "not measurable from global data" are explicit.
- Protected areas are **flagged with a permit note, not excluded**.
- Lighting is offered as the `polar_lighting_geometry` purpose, and the caveat that Earth's atmosphere fills shadows must be shown.
- Coordinates are planetocentric, east-positive, −180..180, and always carry a source.
