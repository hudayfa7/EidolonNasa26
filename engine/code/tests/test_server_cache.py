"""E1: a failed remote elevation read (None) is not cached; a good one is."""
import importlib


def test_cache_found_skips_none_and_keeps_hits():
    server = importlib.import_module("eidolon.server")
    calls = []
    results = iter([None, "z", "z2"])

    @server._cache_found(2)
    def read(k):
        calls.append(k)
        return next(results)

    assert read(1) is None          # a blip
    assert read(1) == "z"           # asked again, not stuck on None
    assert read(1) == "z"           # now cached
    assert calls == [1, 1]


def test_cache_found_evicts_oldest():
    server = importlib.import_module("eidolon.server")
    n = []

    @server._cache_found(2)
    def read(k):
        n.append(k)
        return k

    read(1); read(2); read(3); read(1)
    assert n == [1, 2, 3, 1]


def test_target_window_memoised_and_misses_not_kept(monkeypatch):
    import numpy as np
    from eidolon.search import api
    api._WINDOWS.clear()
    calls = []
    answers = iter([None, np.ones((4, 4)), np.zeros((4, 4))])

    def fake(body, lat, lon, tries, wait_s, px):
        calls.append((body, lat, lon))
        return next(answers)

    monkeypatch.setattr(api, "_target_window", fake)
    assert api.target_window("mars", 18.38, 77.58) is None              # a miss is not kept
    a = api.target_window("mars", 18.38001, 77.58)                      # same pin to 4 places: asked again, now found
    assert a.sum() == 16
    a[:] = 5                                                            # a caller's edit must not reach the cache
    assert api.target_window("mars", 18.38, 77.58).sum() == 16          # served from the cache
    assert len(calls) == 2
    api._WINDOWS.clear()


def test_png_stretch_uses_full_range():
    import io
    import numpy as np
    from PIL import Image
    from eidolon import server
    yy, xx = np.mgrid[0:94, 0:94]
    z = 3.0 * np.sin(xx / 9.0) * 0.2 + 0.1 * yy                         # gentle terrain
    im = np.asarray(Image.open(io.BytesIO(server._png(z))))
    assert im.max() - im.min() > 150
