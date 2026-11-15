// The site selector grid's templates (views/grid.ts shows them): a target world's featured sites as cards, each with
// its 18.8 km window's hillshade and the head of the site's own search (data/client.ts), the one the site view shows.
// Hillshades load later through ui/panel.ts thumbs, as the result cards' do.
import { latStr, lonStr, type Body } from '../coords';
import { BODIES, PICKABLE } from '../data/bodies';
import { AS_ENGINE, cellsOf, knownOf, MOCK, query, targetImage, type Doubles } from '../data/client';
import { EARTH_BY, SITES, type Site } from '../data/sites';
import { esc } from '../dom';
import { routeOf } from '../routes';
import { credit } from '../terrain/dem';
import { backBtn, banner, cardHead, failHead, failure, noAnalog, purposeLabel, targetNote, TESTED, thumb } from './results';

const TOP = 3;   // doubles per card: the head of the site's five
// An established analog site as a row: its hillshade from Eidolon's own elevation, its name and place.
const known = (go: string, d: string) =>
  `<li><button data-go="${go}"><span class="th"><img alt="" loading="lazy" data-own="earth|${d}"></span><span class="nm">${EARTH_BY[d].name}</span><span class="sb">${esc(EARTH_BY[d].place!)}</span></button></li>`;
const SKEL = `<ul class="gd skel" aria-hidden="true">${'<li><div><span class="th"></span><i></i><i></i></div></li>'.repeat(TOP)}</ul>`;

/**
 * A card's doubles, from its site's search for the current query (`e`; undefined while a search by coordinates waits its
 * turn): the IAU feature searched and the capability banner (spec §3.4, §5.2), then the three closest, each as a result
 * card's head (rank, notes, place, point, shape match) to its comparison; where the engine has no elevation (no_dem), the
 * site's established analog sites, unscored; else the search's state.
 */
export function gridDoubles(id: Body, s: Site, e?: Doubles) {
  const to = (dbl: string) => routeOf({ body: id, site: s.id, dbl }), kn = e ? knownOf(s, e) : [];
  if (kn.length) return `<p class="sec">Established analog sites</p><ul class="gd">${kn.slice(0, TOP).map(d => known(to(d), d)).join('')}</ul>
    <p class="fine">No elevation data here for the search, so these known analogs are unscored.</p>`;
  const res = e?.res, head = `${res ? targetNote(res.target, s.name) : ''}<p class="sec">Closest Earth doubles</p>${res ? banner(res.target) : ''}`;
  const list = res ? cellsOf(res).slice(0, TOP) : [];
  if (list.length) return `${head}${noAnalog(res) ? '<p class="lede">No close analog in this region. These are the closest available.</p>' : ''}<ul class="gd">${
    list.map(({ r, id: did }) => `<li><button data-go="${to(did)}">${thumb(r)}${cardHead(r)}</button></li>`).join('')}</ul>`;
  const nf = Object.keys(query.filters).length;
  const line = !e ? 'Waiting its turn: searches by coordinates run one at a time.'
    : res ? `No Earth doubles match ${nf ? 'these filters' : 'this search'}.`
    : e.busy ? s.iau ? 'Searching Earth…' : `Reading ${BODIES[id].name} terrain…<span class="pbar"><i data-t0="${e.t0.toFixed(3)}" data-s="10"></i></span>`
    : e.err?.code === 'warming_up' ? 'Search engine starting up…' : `${failHead(e.err?.code ?? '')}. Open the site to try again.`;
  return `${head}<p class="fine">${line}</p>${!e || e.busy || e.err?.code === 'warming_up' ? SKEL : ''}`;   // rows to come, not after a failure
}

/** Above the cards when every search of the world failed (none warming up, none answered; no_dem is an answer): the
 *  error keyed on the code (spec §6) with Try again (views/grid.ts). */
export function gridFail(es: (Doubles | undefined)[]) {
  const c = es.find(e => e?.err && e.err.code !== 'no_dem')?.err?.code;
  return c && es.every(e => e && !e.busy && !e.res && e.err && e.err.code !== 'warming_up')
    ? failure(c, '<div class="actions"><button class="btn" data-gretry>Try again</button></div>') : '';
}

/** A featured site's card: its window's hillshade, name, kind and point (a click opens the site), then the box its
 *  doubles fill (views/grid.ts, gridDoubles). */
export function gridCard(id: Body, s: Site) {
  // A named target's image from the engine; one by coordinates has none: its window drawn from its elevation, or where
  // the engine has none (no_dem), from Eidolon's own.
  const img = s.iau ? `data-thumb="${esc(targetImage(id, s.iau))}"` : `data-shade="${id}|${s.id}" data-own="${id}|${s.id}"`;
  return `<article class="gc" aria-labelledby="gn-${s.id}"><button class="gt" data-go="${id}/${s.id}"><span class="th"><img alt="" loading="lazy" ${img}></span>
      <span class="nm" id="gn-${s.id}">${s.name}</span><span class="kd">${s.kind}. ${s.note}.</span><span class="ll"><span>${latStr(s.lat, 4)},</span> <span>${lonStr(s.lon, 4, id)}</span></span></button>
    <div data-gd="${s.id}" aria-busy="true"${s.iau ? '' : ' aria-live="polite"'}></div></article>`;   // by name: all at once, unannounced
}

/** A target world's grid: its heading and world switch, a card per featured site, the notes. */
export function gridHTML(id: Body) {
  const b = BODIES[id], nf = Object.keys(query.filters).length;
  const src = [...id === 'mars' ? ['blend'] : ['sldem', 'lolaPole'], 'glo30'].map(credit).filter(Boolean);
  const shade = AS_ENGINE ? `the search engine’s elevation${id === 'moon' ? ' and, where it has none, Eidolon’s own' : ''}`
    : 'the elevation models the search engine reads where Eidolon has them; elsewhere illustrative';
  return `<div class="gh"><div>${backBtn(b.name, id)}<h2 class="title" tabindex="-1">Featured sites</h2></div>
      <div class="tabs" role="group" aria-label="World">${PICKABLE.map(w => `<button data-go="${w}/sites" aria-pressed="${w === id}"><i style="--c:${BODIES[w].color}"></i>${BODIES[w].name}</button>`).join('')}</div></div>
    <p class="lede">Each site’s 18.8&nbsp;km window beside its closest doubles on Earth. Open a site, or compare it with a double.${id === 'moon' ? ' Matching reaches 59.5° from the equator, so the south-pole regions list their established analog sites, unscored.' : ''}</p>
    <p class="fine">Test purpose: ${esc(purposeLabel(query.purpose))}${nf ? `, with ${nf} filter${nf > 1 ? 's' : ''} on` : ''}. Change it on any site.</p>
    <div data-gfail tabindex="-1" aria-live="polite"></div><div class="gcards">${SITES[id].map(s => gridCard(id, s)).join('')}</div>
    <p class="fine">${TESTED}${MOCK ? ' These are sample results.' : ''} Hillshades of each 18.8&nbsp;km window, lit from the north-west, each at its own contrast, drawn from ${shade}.</p>
    ${src.length ? `<p class="fine credit">Elevation: ${src.map(esc).join('. ')}.</p>` : ''}`;
}
