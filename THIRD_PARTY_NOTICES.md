# Third-party notices

Eidolon is licensed under the MIT License (`LICENSE`). It uses the open-source software below. Licences are read
from each package's own metadata (versions as installed on 2026-11-15). Data, imagery and fonts are credited in
`web/docs/credits.md`; the fonts' SIL Open Font License texts ship beside them in `web/public/fonts/`.

## Shipped in the web app (bundled into `web/dist`)

| Package | Version | Licence | Copyright |
| --- | --- | --- | --- |
| three.js | 0.186.1 | MIT | Copyright © 2010-2026 three.js authors |
| postprocessing | 6.39.5 | Zlib | Copyright © 2015 Raoul van Rüschen |
| GSAP | 3.15.0 | GSAP Standard "no charge" License, https://gsap.com/standard-license | Copyright 2008-2026, GreenSock. All rights reserved (GreenSock is now part of Webflow) |

None of the three has dependencies of its own.

**GSAP is not OSI open source.** Its Standard License lets anyone use it free of charge, commercial use included. Webflow
keeps ownership; the licence forbids using GSAP in no-code visual animation builders that compete with Webflow's, reverse
engineering it to build a competing product, and removing its notices, and Webflow may change or end the licence. None of
these applies to Eidolon, which uses GSAP as its animation and timing library. We keep it, and state its licence here, in
the submission and in `web/docs/credits.md`.

### three.js (MIT)

```
The MIT License

Copyright © 2010-2026 three.js authors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

### postprocessing (Zlib)

```
Copyright © 2015 Raoul van Rüschen

This software is provided 'as-is', without any express or implied warranty. In
no event will the authors be held liable for any damages arising from the use of
this software.

Permission is granted to anyone to use this software for any purpose, including
commercial applications, and to alter it and redistribute it freely, subject to
the following restrictions:

1. The origin of this software must not be misrepresented; you must not claim
   that you wrote the original software. If you use this software in a product,
   an acknowledgment in the product documentation would be appreciated but is
   not required.

2. Altered source versions must be plainly marked as such, and must not be
   misrepresented as being the original software.

3. This notice may not be removed or altered from any source distribution.
```

## Used to build and test the web app (not shipped)

| Package | Version | Licence |
| --- | --- | --- |
| Vite | 8.3.4 | MIT |
| TypeScript | 7.0.2 | Apache-2.0 |
| Vitest | 5.0.5 | MIT |
| Playwright | 1.64.1 | Apache-2.0 |
| @axe-core/playwright | 4.14.0 | MPL-2.0 |
| ajv | 8.20.0 | MIT |
| json-schema-to-typescript | 16.0.0 | MIT |
| geotiff | 3.0.5 | MIT |
| sharp | 0.35.5 | Apache-2.0 |
| @types/three | 0.186.0 | MIT |

Their own dependencies are listed with their licences in `web/package-lock.json` and `web/node_modules`.

## The search engine (`engine/`, Python 3.11)

Installed by the user from conda-forge and PyPI (`engine/code/environment.yml`); none is copied into this repo.

| Package | Version | Licence |
| --- | --- | --- |
| PyTorch | 2.15.0 | BSD-3-Clause (with Apache-2.0 and BSD-2-Clause parts) |
| torchvision | 0.29.2 | BSD-3-Clause |
| NumPy | 2.4.6 | BSD-3-Clause |
| SciPy | 1.17.1 | BSD-3-Clause |
| pandas | 3.1.1 | BSD-3-Clause |
| GDAL | 3.12.3 | MIT |
| rasterio | 1.4.4 | BSD-3-Clause |
| Matplotlib | 3.11.2 | Matplotlib licence (PSF-based) |
| Pillow | 13.0.0 | MIT-CMU (HPND) |
| FastAPI | 0.163.1 | MIT |
| Uvicorn | 0.54.0 | BSD-3-Clause |
| Pydantic | 2.14.3 | MIT |
| pytest | 9.2.0 | MIT (tests only) |
| jsonschema | 4.26.0 | MIT (tests only) |

`engine/code/environment.yml` also lists packages the shipped engine code doesn't import (JupyterLab, Earth Engine,
earthaccess, scikit-learn and others): they are for the engine's research scripts, not the server.
