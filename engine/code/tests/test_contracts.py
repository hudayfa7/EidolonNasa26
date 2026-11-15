"""Contract examples must stay valid against the schemas the front end / backend build against."""
import json
from pathlib import Path

import jsonschema
import pytest

C = Path(__file__).resolve().parents[1] / "contracts"
PAIRS = [("target.json", "target_jezero.json"), ("site_listing.json", "site_green_river.json"),
         ("match_result.json", "match_jezero_green_river.json")]


@pytest.mark.parametrize("schema,example", PAIRS)
def test_example_validates(schema, example):
    s = json.loads((C / schema).read_text(encoding="utf-8"))
    jsonschema.Draft202012Validator.check_schema(s)
    jsonschema.validate(json.loads((C / "examples" / example).read_text(encoding="utf-8")), s)


def test_physical_and_practical_scores_are_separate():
    m = json.loads((C / "match_result.json").read_text(encoding="utf-8"))
    s = json.loads((C / "site_listing.json").read_text(encoding="utf-8"))
    assert "practical" not in m["properties"] and "fidelity" not in s["properties"]


def test_real_index_example_validates():
    """Real output of scripts/search_analogs.py over the global index (a list of match_result objects)."""
    s = json.loads((C / "match_result.json").read_text(encoding="utf-8"))
    rows = json.loads((C / "examples" / "match_nirgal_index_REAL.json").read_text(encoding="utf-8"))
    assert rows and [r["rank"] for r in rows] == list(range(1, len(rows) + 1))
    for r in rows:
        jsonschema.validate(r, s)


def _api_registry():
    from referencing import Registry, Resource
    reg = Registry()
    for p in list((C / "api").glob("*.json")) + [C / "match_result.json"]:
        s = json.loads(p.read_text(encoding="utf-8"))
        reg = reg.with_resource(s["$id"], Resource.from_contents(s))
    return reg


@pytest.mark.parametrize("schema,example", [("search_request.json", f"{n}.request.json") for n in
                                            ("search_named_cached", "search_named_filtered", "search_coordinates")]
                         + [("search_response.json", f"{n}.response.json") for n in
                            ("search_named_cached", "search_named_filtered", "search_coordinates")]
                         + [("targets_list.json", "targets_jez.json"), ("target_summary.json", "target_jezero.json")])
def test_api_examples_validate(schema, example):
    """REAL responses from the reference server (scripts/make_api_examples.py) match the API contract."""
    s = json.loads((C / "api" / schema).read_text(encoding="utf-8"))
    jsonschema.Draft202012Validator.check_schema(s)
    v = jsonschema.Draft202012Validator(s, registry=_api_registry())
    v.validate(json.loads((C / "examples" / "api" / example).read_text(encoding="utf-8")))
