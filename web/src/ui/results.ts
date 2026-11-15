// Search results (docs/plan.md, Must 4; engine spec §4–5) as panel templates: the capability banner, the result cards
// and one result's detail. No percentages: shape match is a word, the score a secondary number, the judge's likelihood
// a rough bar, and engine prose shows its percentages as fractions. Engine strings are escaped; its enums reach the page
// only through fixed maps (responses are typed, not checked at runtime).
import { fmtLL, fmtM, fmtSize, offsetOf, pad, pinId, type Body } from '../coords';
import type { Doubles } from '../data/client';
import { BODIES } from '../data/bodies';
import { ARID, CAVE_SOURCES, climateFit, COLD_C, ELEMENT_SOURCE, COOL_C, FETCHED, kmBetween, measuredAt, SEMI_ARID, SOURCES } from '../data/climate';
import { bestAnalogs, FACILITY_NEED, knownAnalogs, SOURCES as ANALOG_SOURCES } from '../data/analogs';
import { climateScore, facilityWeight, FACTOR_LABEL, MIN_APPLICABLE, missionFit, operationsScore, shadowWeight, SUN_HEIGHTS, terrainScore, TIER_WORD, type Factor } from '../data/mission';
import type { ShadowResult } from '../terrain/shadowfit';
import { processOf } from '../data/process';
import { establishedAt, SITES, type Site } from '../data/sites';
import type { MatchResult, SearchResponse, TargetSummary } from '../data/types.gen';
import { esc } from '../dom';
import type { Skin } from '../data/weather';

type Prop = MatchResult['properties'][number];
export const word = (m: Record<string, string>, k: unknown, none = '—') => typeof k === 'string' && Object.hasOwn(m, k) ? m[k] : none;
const ok = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x);
const num = (x: unknown, d: number) => ok(x) ? x.toFixed(d) : '—';
/** An engine list's strings (a trust boundary: anything else is dropped). */
export const strs = (xs: unknown) => Array.isArray(xs) ? xs.filter((x): x is string => typeof x === 'string') : [];
/** An engine string for the page, escaped. */
export const text = (x: unknown) => esc(String(x ?? '—'));

// Engine prose (engine.py) carries percentages: "…; landform mix at 3 km: flat 42%, shoulder 15% (target flat 25%).",
// and the capability caveat's "for 53% of targets". No percentages on the page, so each becomes the fraction it stands
// for ("flat 0.42"): the engine prints whole percents, so nothing is lost.
// Its ratios ("relief 0.9x the target") take the page's multiplication sign. Its "target" is the site on the Moon or Mars
// and its "site" the Earth cell, so the cell becomes the Earth double first ("the site is likely vegetated, so … differ
// from the target"), then the target the site; its polar note's "|lat| > 60" is said in words.
export const fractions = (s: string) => s.replace(/(\d+(?:\.\d+)?)\s?%/g, (_, n: string) => String(+(+n / 100).toFixed(4))).replace(/(\d)x\b/g, '$1×')
  .replace(/\bsite\b/g, 'Earth double').replace(/\btarget\b/g, 'site').replace(/\bTarget\b/g, 'Site').replace(/\(\|lat\| > 60\)/g, '(beyond 60° latitude)');
const prose = (x: unknown) => text(fractions(String(x ?? '—')));
// A summary's "<country> (<lat>, <lon>): " opening (after the no-match lede, if any), signed to 2 places: the card's head
// and the detail's Location show the place, its coordinates as the body's convention has them.
const unplace = (s: string) => s.replace(/(^|best available\. )[^:;]*\(-?\d+(?:\.\d+)?, -?\d+(?:\.\d+)?\): (.)/, (_, a: string, c: string) => a + c.toUpperCase());
// A card's line: the summary without what the card already shows, the place (and the "No close analog…" lede above the
// list), or what its chips carry, the landform-mix clause. The detail keeps the rest.
export function brief(x: unknown) {
  const s = fractions(unplace(String(x ?? '—').replace(/^No close analog in this region; best available\. /, ''))
    .replace(/; landform mix at [^;]*$/, '.'));
  return esc(s.charAt(0).toUpperCase() + s.slice(1));
}

/** A panel's way back (or the grid's), named for where it goes. */
export const backBtn = (label: string, to: string) => `<button class="back" data-go="${to}"><span class="chev" aria-hidden="true"></span><span>${label}</span></button>`;

/** The engine's tested accuracy line (spec §2), verbatim: under the results and in the info sheet. */
export const TESTED = 'Typically 2 of 3 searches find a good terrain analog in the first five results.';
/** Said after TESTED in a mock build (the hosted site): its results are samples, and where to get the real model. */
export const SAMPLE = ' These are sample results. <a href="https://github.com/hudayfa7/EidolonNasa26#run-it-with-the-real-model" target="_blank" rel="noopener">Run Eidolon with the real model</a> on your own computer.';

// The purposes in Eidolon's words, by the engine's keys (spec §3.2): a purpose picks the land searched, never the
// scoring, so none says it weights the match. A key not here keeps the engine's own label and description.
const PURPOSES: Record<string, [label: string, description: string]> = {
  rover_mobility: ['Rover mobility', 'Driving and navigation trials for rovers and other mobility platforms.'],
  drill_isru: ['Drilling and ISRU', 'Drilling, excavation and resource-extraction trials.'],
  eva_training: ['EVA training', 'Field training for crews in suits or suit mock-ups.'],
  habitat_ops: ['Habitat operations', 'Habitat set-up and long-duration operations.'],
  astrobiology: ['Astrobiology', 'Field science in barren, extreme environments.'],
  thermal: ['Thermal testing', 'Equipment trials; each result’s climate panel gives its mean temperature.'],
  education: ['Education and outreach', 'Look-alike landforms anywhere on land, vegetated ground included.'],
};
const own = (k: string) => Object.hasOwn(PURPOSES, k) ? PURPOSES[k] : undefined;
export const purposeLabel = (key: string, label?: string | null) => own(key)?.[0] ?? (label ?? key.replace(/_/g, ' ').replace(/^./, c => c.toUpperCase()));
export const purposeText = (key: string, description?: string | null) => own(key)?.[1] ?? (description ?? '');

const CONF = { high: 'High', medium: 'Medium', low: 'Low' };
export const conf = (c: unknown) => word(CONF, c);
const STATUS: Record<string, string> = { match: 'Match', partial: 'Partial', gap: 'Gap', not_measurable: 'Not measurable at 200 m' };
const status = (p: Prop) => typeof p.status === 'string' && Object.hasOwn(STATUS, p.status) ? p.status : 'none';
// Colour plus icon (spec §4): coral fills a match and half a partial; a gap is an empty ring, not measurable a grey dash.
const mark = (p: Prop) => `<i class="mk mk-${status(p)}" aria-hidden="true"></i>`;
const label = (p: Prop) => text(p.label ?? p.key);

// A card's chips: its two best-scored properties, then its weakest other one (a gap before a property that can't be
// measured, before a partial), so a card never shows only its good side. The detail lists all six.
const WEAK: Record<string, number> = { gap: 0, not_measurable: 1, none: 1, partial: 2, match: 3 };
export function chips(props: Prop[]): Prop[] {
  const top = props.filter(p => ok(p.score)).sort((a, b) => b.score! - a.score!).slice(0, 2), rest = props.filter(p => !top.includes(p));
  const weak = (p: Prop) => 2 * WEAK[status(p)] + (ok(p.score) ? p.score : 0);
  return rest.length ? [...top, rest.reduce((a, p) => weak(p) < weak(a) ? p : a)] : top;
}
const chip = (p: Prop) => `<span class="chip s-${status(p)}">${mark(p)}${label(p)}<span class="sr"> (${STATUS[status(p)]?.toLowerCase() ?? 'no status'})</span></span>`;

// The chips' marks, once above the cards: each chip carries its status as screen-reader text, so this is visual only.
export const legend = `<p class="marks" aria-hidden="true">${['match', 'partial', 'gap', 'not_measurable'].map(k => `<span class="s-${k}"><i class="mk mk-${k}"></i>${STATUS[k]}</span>`).join('')}</p>`;

// spec §5.2 for fair and weak landform classes, the blind tests' share given as a count of the targets tested.
export function banner(t?: TargetSummary) {
  const c = t?.capability;
  if (!c || (c.tier !== 'fair' && c.tier !== 'weak') || !ok(c.p_target_top3) || !ok(c.n_targets)) return '';
  const cls = c.landform_class ? `${text(c.landform_class)} sites` : 'sites of this kind';
  return `<p class="banner">For ${cls}, our blind tests found a good Earth analog in the top 3 for ${Math.round(c.p_target_top3 * c.n_targets)} of the ${c.n_targets} tested. These are the best available terrain matches.</p>`;
}

// The named target the search compared (spec §3.4): its IAU name when the site shows another, descriptor and size, and
// the spec's note when it is wider than the 18.8 km window. Nothing for a search by coordinates.
export function targetNote(t: TargetSummary | undefined, shown: string) {
  if (!t || typeof t.name !== 'string') return '';
  const d = t.diameter_km, km = ok(d) ? ` · ≈ ${fmtSize(d)} across` : '';
  return `<p class="fine tgt">${t.name === shown ? 'IAU feature' : `Searched as the IAU feature ${esc(t.name)}`}${t.type ? ` · ${text(t.type)}` : ''}${km}.${
    ok(d) && d > 18.8 ? ' Larger than the 18.8 km comparison window: the search matches its central part.' : ''}</p>`;
}

// The engine names no places (plan, Gaps for the merge 3): a cell shows its country and coordinates, and a tag when its
// window holds one of the established analog sites.
const tag = (k: Site) => `<span class="tag">Analog site: ${k.name}</span>`;
// A cell that is neither inside nor within 150 km of any of the 14 established analog sites Eidolon lists: a candidate for a
// site not yet characterised here. Only against those 14, so never "undiscovered": the literature may know it.
const NOVEL = 'Not near a listed analog';
export const isUnlisted = (lat: number, lon: number) => !establishedAt(lat, lon) && (nearestAnalog(lat, lon)?.km ?? Infinity) > NEAR_KM;
export const placeTag = (lat: number, lon: number) => { const k = establishedAt(lat, lon); return k ? tag(k) : isUnlisted(lat, lon) ? `<span class="tag">${NOVEL}</span>` : ''; };
/** A line above the cards: how many results are away from every listed analog site, the brief's "look beyond well-known sites". */
export function unlistedNote(results: MatchResult[]) {
  const n = results.filter(r => ok(r.location?.lat) && ok(r.location?.lon) && isUnlisted(r.location!.lat!, r.location!.lon!)).length;
  return n ? `<p class="banner">${n} of ${results.length} ${n === 1 ? 'is' : 'are'} not within ${NEAR_KM} km of the ${SITES.earth.length} established analog sites Eidolon lists: candidates for sites not yet characterised here.</p>` : '';
}
const NOTE = '<svg class="ic" viewBox="0 0 12 12" aria-hidden="true"><path d="M6 1.6 10.9 10.3H1.1Z"/><path d="M6 4.9v2.6M6 8.6v.5"/></svg>';

/** A result's hillshade tile, loaded later (ui/panel.ts thumbs, lazily); the placeholder when it has none. */
export const thumb = (r: MatchResult) => { const url = r.terrain_twins?.[0]?.earth_url;
  return `<span class="th">${typeof url === 'string' ? `<img alt="" loading="lazy" data-thumb="${esc(url)}">` : NO_SHADE}</span>`; };
/** A result's rank and notes marker, place, point, tag and shape match: a card's head, and a grid row (ui/grid.ts). */
export function cardHead(r: MatchResult) {
  const l = r.location!, n = strs(r.explanation?.caveats).length;
  return `<span class="cb"><span class="rk"><span class="sr">Rank </span>${text(pad(r.rank))}${n ? `<span class="nt">${NOTE}${n} note${n > 1 ? 's' : ''}</span>` : ''}</span>
      <span class="nm">${text(l.country ?? 'Unnamed area')}</span><span class="ll">${fmtLL(l.lat!, l.lon!, 'earth', 4)}</span>${placeTag(l.lat!, l.lon!)}
      <span class="sm">Shape match <b>${conf(r.fidelity?.confidence)}</b></span></span>`;
}
/** One result as a card (spec §4, card): `go` is its compare route. */
export function card(r: MatchResult, go: string, sel: boolean) {
  return `<li><button class="result${sel ? ' is-sel' : ''}" data-go="${go}"${sel ? ' aria-current="true"' : ''}>
    ${thumb(r)}${cardHead(r)}
    <span class="su">${brief(r.explanation?.summary)}</span>
    <span class="chips">${chips(r.properties ?? []).map(chip).join('')}</span></button></li>`;
}

/**
 * The twin hillshades (spec §4 `terrain_twins`: the most persuasive view), the target's window beside the site's, drawn
 * here from the two windows' elevation (ui/panel.ts thumbs; `shade`: the target's body|site, the site's is its Earth pin),
 * so the pair shares one lighting and stretch in every mode. The engine's own PNGs (1×, not stretched) stay on the
 * cards. `engine`: the engine's elevation, not the mock's; `real`: the mock's windows are both real elevation (terrain/dem.ts);
 * `ov`: the overlay compare, the site's window over the target's in one tile, at the overlay slider's mix (panel.css).
 */
export function twins(r: MatchResult, target: string, shade: string, engine: boolean, real = false, ov = false) {
  const l = r.location, earth = l && ok(l.lat) && ok(l.lon) ? `earth|${pinId(l.lat, l.lon)}` : '';
  // Overlaid, each figure carries its world's colour (the token named by the body in `at`): a dot by its name, as on the
  // slider, and a light tint on its hillshade (panel.css), so the ghost tells the two reliefs apart.
  const fig = (at: string, name: string) => `<figure${ov ? ` style="--c:var(--${at.split('|')[0] || 'earth'})"` : ''}>${at ? `<span class="th"><img alt="Hillshade of the ${name} window" data-shade="${esc(at)}"></span>` : NO_SHADE}<figcaption>${ov ? '<i></i>' : ''}${name}</figcaption></figure>`;
  const note = engine ? 'Hillshades of the two 18.8 km windows the search compared, drawn from the engine’s elevation, lit from the north-west, each at its own contrast.'
    : `Hillshades of the two 18.8 km windows, lit from the north-west, each at its own contrast. Drawn from ${real ? 'the elevation models the engine reads' : 'sample terrain'}.`;
  return `<h3 class="sec">Terrain twins</h3><div class="imgs twins${ov ? ' ov' : ''}">${fig(shade, esc(target))}${fig(earth, text(l?.country ?? 'Unnamed area'))}</div>
    <p class="fine">${note}${ov ? '<span class="ov"> Overlaid: the overlay slider sets how much of each shows.</span>' : ''}</p>`;
}
/** The search engine's window as a terrain block's source (ui/terrain-ui.ts). */
export const ENGINE_SRC = 'search engine’s elevation of the window it compared, 200 m samples';
/** Where the terrain shown comes from (ui/terrain-ui.ts): per block its source (a DEM's credit, ENGINE_SRC, or '' for
 *  illustrative terrain). The overlay's two blocks say whose when their sources differ, so a one-sided caveat reads against
 *  its own block: "Mars: illustrative terrain. Earth: Copernicus DEM GLO-30." */
export function terrainNote(src: string[], worlds: string[]) {
  const [a, b] = src;
  if (src.length > 1 && a !== b) return src.map((x, j) => `${worlds[j]}: ${x === ENGINE_SRC ? `the ${x}` : x || 'illustrative terrain'}.`).join(' ');
  return a === ENGINE_SRC ? `The ${a}.` : a ? `Terrain: ${a}.` : 'Illustrative terrain.';
}
/** The overlay slider's spoken value, v the Earth window's share from 0 to 100 (ui/chrome.ts). */
export const mixText = (v: number, target: string, earth: string) => v <= 0 ? `${target} only` : v >= 100 ? `${earth} only` : `${earth} over ${target}, at ${v} percent`;
/** A twin without its hillshade: no URL, or the engine's 404 no_image (spec §6: a placeholder). */
export const NO_SHADE = '<span class="ph">No hillshade for this window</span>';

export const aridity = (ai: number) => ai < .05 ? 'Hyperarid' : ai < .2 ? 'Arid' : ai < .5 ? 'Semi-arid' : ai < .65 ? 'Dry sub-humid' : 'Humid';
// The judge's probability as 0–5 segments: it is calibrated only roughly (spec §4), so it is never printed.
export const rough = (p: number) => Math.min(5, Math.max(0, Math.round(p * 5)));
export const ACCESS = { partner: 'Artemis Accords signatory', non_partner: 'Not an Accords signatory', antarctic_treaty: 'Antarctic Treaty', unknown: 'Unknown' };
export const SURFACE = { barren: 'Barren', rugged_extension: 'Rugged, likely vegetated' };
export const fact = (k: string, v: string, cls = '') => `<div${cls ? ` class="${cls}"` : ''}><dt>${k}</dt><dd>${v}</dd></div>`;
const signed = (x: number, d: number) => `${x < 0 ? '−' : ''}${Math.abs(x).toFixed(d)}`;
const raw = (rows: [string, unknown][]) => `<dl class="raw">${rows.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${text(v)}</dd></div>`).join('')}</dl>`;

export function climate(e: MatchResult['environment']) {
  if (!e) return '<p class="fine">No climate data for this Earth double.</p>';
  const t = e.t_mean_c, p = e.precip_mm, ai = e.aridity_index;
  return `<dl class="facts">${fact('Mean temperature', ok(t) ? `${signed(t, 1)} °C` : '—')}${fact('Precipitation', ok(p) ? `${Math.round(p).toLocaleString('en-GB')} mm/yr` : '—')}
    ${fact('Aridity', ok(ai) ? `${aridity(ai)} <span class="n">${ai.toFixed(2)}</span>` : '—', 'wide w')}</dl>${e.source ? `<p class="fine">${text(e.source)}</p>` : ''}`;
}

// What the match measures and what it does not, one line each (the N/A-not-zero rule of the analog-scoring report): only
// terrain form is measured, climate is a model at the Earth double's centre, the rest is not assessed. Static: no engine string.
const COVERS: [string, string, string][] = [
  ['match', 'Terrain form at 200 m', 'Measured'], ['partial', 'Climate at the Earth double’s centre', 'Modelled'],
  ['not_measurable', 'Rock type and chemistry', 'Not assessed'], ['not_measurable', 'Subsurface and caves', 'Not assessed'],
  ['not_measurable', 'Biology and habitability', 'Not assessed'],
];
const covers = `<h3 class="sec">What this match covers</h3><ul class="props">${COVERS.map(([s, k, v]) => `<li class="s-${s}"><i class="mk mk-${s}" aria-hidden="true"></i><span class="pl">${k}</span><span class="ps">${v}</span></li>`).join('')}</ul>
    <p class="fine">Matched on measured terrain form at 200 m, not on how the two places look. Rock type, caves and biology are not scored; where NASA catalogues exist, the site’s own caves and rock properties are under Measured at the site.</p>`;

// The nearest of the established analog sites (data/sites.ts: 14 of them), so a double reads as a known analog, near
// one, or away from every one Eidolon lists. Great-circle distance between the site centres.
const NEAR_KM = 150;
export function nearestAnalog(lat: number, lon: number) {
  let best: { site: Site; km: number } | undefined;
  for (const s of SITES.earth) { const km = kmBetween(lat, lon, s.lat, s.lon); if (!best || km < best.km) best = { site: s, km }; }
  return best;
}
const nearFact = (l: MatchResult['location']) => {
  if (!l || !ok(l.lat) || !ok(l.lon)) return '';
  const n = nearestAnalog(l.lat, l.lon);
  return n && n.km <= NEAR_KM ? fact('Nearest established analog', `${n.site.name}, ${n.site.place}, about ${Math.round(n.km)} km away`, 'wide w')
    : fact('Established analogs', `None within ${NEAR_KM} km of the ${SITES.earth.length} Eidolon lists`, 'wide w');
};

/**
 * The compare caption's note (ui/chrome.ts status bar): a named target's window is centred on its IAU feature
 * (data/client.ts centreOf), which can leave the site's own point outside the square. Past 10 km it says where the window
 * is and how far the site lies (merge-plan, Frontend changes: Hadley's window is on Rima Hadley, about 18 km south-west
 * of the Apollo 15 landing site). Plain text from the frontend's own sites.
 */
export function windowNote(id: Body, s: { lat: number; lon: number; iau?: string; note?: string }, c: { lat: number; lon: number }) {
  if (!s.iau) return '';
  const o = offsetOf(BODIES[id].R, s.lat, s.lon, c.lat, c.lon);
  return o.km > 10 ? `, centred on ${s.iau}, about ${Math.round(o.km)} km ${o.dir} of the ${s.note ?? 'site'}` : '';
}

// The climate fit (data/climate.ts; README, "How the climate fit works"): a coarse cold-and-dry band between an Earth result's
// climate and the target world, shown apart from the terrain match and never blended into it. Static copy and numbers only.
const FIT_WORD = { match: 'Match', partial: 'Partial', gap: 'Gap' };
export function climateFitBlock(e: MatchResult['environment'] | undefined, body: unknown) {
  const f = climateFit(e), w = body === 'moon' || body === 'mars' ? BODIES[body] : undefined;
  if (!f || !w) return '<p class="fine">No climate fit for this Earth double: its NASA POWER climatology isn’t available.</p>';
  const target = { temperature: `${w.name} surface, ${Object.fromEntries(w.stats).Temperature}`, dryness: `${w.name} has no liquid surface water` };
  return `<div class="rhead"><span class="sm">Climate fit <b>${f.verdict}</b></span></div>
    <ul class="props">${f.rows.map(r => `<li class="s-${r.status}"><i class="mk mk-${r.status}" aria-hidden="true"></i><span class="pl">${r.key === 'temperature' ? 'Temperature' : 'Dryness'}</span><span class="ps">${FIT_WORD[r.status]}</span><span class="pnote">Earth double: ${r.earth}. ${target[r.key]}.</span></li>`).join('')}</ul>
    <p class="fine">A coarse cold-and-dry band, not a measured distance, and separate from the terrain match. Temperature matches at a mean of ${COLD_C} °C or below and is partial up to ${COOL_C} °C; dryness matches below an aridity index of ${ARID} and is partial below ${SEMI_ARID}. The Earth side is mean annual air temperature (NASA POWER climatology) and aridity (Global Aridity Index v3.1) at the Earth double’s centre; ${w.name}’s temperatures are surface values, so air against surface is only a rough comparison.</p>`;
}

/**
 * The Earth site's surface temperature from NASA POWER (data/weather.ts skinAt), beside what Diviner measured on the Moon at
 * local midnight: the like-for-like of the two (surface, night-time), where the climate fit's temperature is air. Not scored.
 * `skin` is the feed's state (busy until it lands, no value when it failed); a block that redraws as it lands ([data-wx]).
 */
export function skinBlock(skin: { busy: boolean; v?: Skin } | undefined, body: unknown, lat: unknown, lon: unknown) {
  if (!skin) return '';
  const v = skin.v, c = (x: number) => `${signed(x, 1)} °C`, m = measuredAt(body, lat, lon);
  const earth = (k: 'min' | 'max', what: string) => fact(`Earth double, ${what}`, v ? `${c(v[k])} <span class="n">mean daily ${k === 'min' ? 'minimum' : 'maximum'} skin temperature</span>` : skin.busy ? 'Loading…' : 'Not available', 'wide w');
  const target = body === 'moon' && ok(m?.tbol_midnight_k) ? fact('Moon, local midnight', `${c(m.tbol_midnight_k - 273.15)} <span class="n">Diviner, at ${esc(SITES.moon.find(s => s.id === m.id)?.name ?? m.id)}</span>`, 'wide w')
    : fact(body === 'mars' ? 'Mars' : body === 'moon' ? 'Moon' : 'Site', 'No surface temperature was read for this site', 'wide w');
  return `<div data-wx><h3 class="sec">Surface temperature</h3><dl class="facts">${earth('min', 'night-time')}${earth('max', 'day-time')}${target}</dl>
    <p class="fine">Skin temperature is the surface’s own, not the air’s: NASA POWER’s climatology, 2001 to 2025. It is the like-for-like of the Moon’s midnight surface temperature. Not part of the climate fit.</p></div>`;
}

const sup = (b: string, e: string) => `${b}<sup>${e}</sup>`;
const TI = `J m${sup('', '−2')} K${sup('', '−1')} s${sup('', '−½')}`;   // thermal inertia's unit
/** What NASA's orbiters measured at the featured site nearest the target, when one is within 40 km (data/surface.gen.json). */
export function measuredBlock(t: Pick<TargetSummary, 'body' | 'lat' | 'lon'> | undefined) {
  if (t?.body !== 'moon' && t?.body !== 'mars') return '';
  const head = '<h3 class="sec">Measured at the site</h3>', m = measuredAt(t.body, t.lat, t.lon);
  if (!m) return `${head}<p class="fine">No NASA surface value was read for this site. Values exist only for featured sites, within 40 km of a site’s centre.</p>`;
  const name = SITES[m.body].find(s => s.id === m.id)?.name ?? m.id, src = SOURCES[m.body];
  const range = (r: (number | null)[] | undefined, u: string) => ok(r?.[0]) && ok(r?.[1]) ? ` <span class="n">${r[0]} to ${r[1]} ${u} in the window</span>` : '';
  const rows = m.body === 'moon'
    ? [ok(m.tbol_midnight_k) ? fact('Surface temperature at local midnight', `${m.tbol_midnight_k.toFixed(1)} K (${signed(m.tbol_midnight_k - 273.15, 1)} °C)${range(m.tbol_midnight_range_k, 'K')}`, 'wide w') : '',
      ok(m.treg_midnight_k) ? fact('Regolith temperature at local midnight', `${m.treg_midnight_k.toFixed(1)} K (${signed(m.treg_midnight_k - 273.15, 1)} °C)`, 'wide w') : '',
      ok(m.rock_abundance) ? fact('Rock abundance', `${m.rock_abundance.toFixed(3)} <span class="n">fraction of the ground covered by rocks</span>`, 'wide w') : '']
    : [ok(m.thermal_inertia) ? fact('Thermal inertia', `${m.thermal_inertia} <span class="n">${TI}</span>${range(m.thermal_inertia_range, TI)} <span class="n">lower is dust or fine sand, higher is rock</span>`, 'wide w') : ''];
  const px = m.of_px ? `${m.valid_px} of ${m.of_px} pixels were valid` : `${m.valid_px} valid pixels`, c = m.caves, cs = CAVE_SOURCES[m.body];
  // Subsurface: a catalogued entry is a candidate or a mapped pit, never a confirmed cave; none nearby is a fact about the catalogue.
  const cave = c ? fact(m.body === 'mars' ? 'Cave entrance candidates' : 'Lunar pits',
    `${c.within_100_km ? `${c.within_100_km} within 100 km; nearest ` : 'None within 100 km; nearest '}${esc(c.nearest_label)}, ${c.nearest_km.toLocaleString('en-GB')} km away <span class="n">of ${c.total.toLocaleString('en-GB')} in the catalogue</span>`, 'wide w') : '';
  // Mars rock chemistry and water: the Odyssey GRS's regional values (a 5° bin, about 300 km across at the equator), never scored.
  const el = m.elements, wt = (v: number | null | undefined, d: number) => ok(v) ? `${v.toFixed(d)} weight percent` : '—';
  const chem = el ? fact('Water in the top metre', `${wt(el.h2o_wt, 1)} <span class="n">${ok(el.h2o_sigma) ? `± ${el.h2o_sigma.toFixed(1)}, ` : ''}measured as hydrogen, read as water: ice or water bound in minerals</span>`, 'wide w')
    + fact('Iron', wt(el.fe_wt, 1), 'w') + fact('Silicon', wt(el.si_wt, 1), 'w') + fact('Potassium', wt(el.k_wt, 2), 'w') + fact('Chlorine', wt(el.cl_wt, 2), 'w')
    + fact('Thorium', ok(el.th_ppm) ? `${el.th_ppm.toFixed(1)} parts per million` : '—', 'w') : '';
  const val = rows.join('');
  return `${head}${val ? `<dl class="facts">${val}${cave}${chem}</dl>` : `<p class="fine">${m.note ?? 'No value here.'}</p>${cave || chem ? `<dl class="facts">${cave}${chem}</dl>` : ''}`}
    <p class="fine">Read at ${esc(name)}, ${Math.round(m.km)} km from this site: the median over a window of about ${m.window_km} km (${px}), ${FETCHED}. ${src.dataset}; ${src.provider}.${c ? ` Caves: ${cs.dataset}; ${cs.provider}. A candidate is not a confirmed cave.` : ''}${el ? ` Water and elements: ${ELEMENT_SOURCE.dataset}; ${ELEMENT_SOURCE.provider}. A 5° bin is about 300 km across at the equator, so these are regional.` : ''} These describe the site. Earth has no like-for-like value, so they are not part of the climate fit.</p>`;
}

// What an Earth double cannot stand for. Gravity, pressure and temperature come from data/bodies.ts, so one screen never
// shows two values for a world; radiation and signal delay are here, each with its source in the note.
const BEYOND: Record<'moon' | 'mars', { radiation: string; delay: string }> = {
  moon: { radiation: '≈ 1.4 mSv/day', delay: '1.3 s one way' }, mars: { radiation: '≈ 0.64 mSv/day', delay: '3 to 22 min one way' },
};
export function limits(body: unknown) {
  if (body !== 'moon' && body !== 'mars') return '';
  const t = Object.fromEntries(BODIES[body].stats), e = Object.fromEntries(BODIES.earth.stats), w = BODIES[body].name, b = BEYOND[body];
  const row = (k: string, tv: string, ev: string) => fact(k, `${tv} <span class="n">${w}</span> · ${ev} <span class="n">Earth</span>`, 'wide w');
  return `<details class="drawer"><summary><span class="chev" aria-hidden="true"></span>What Earth can’t reproduce</summary>
    <dl class="facts">${row('Gravity', t.Gravity, e.Gravity)}${row('Surface pressure', t['Surface pressure'], e['Surface pressure'])}${row('Temperature', t.Temperature, e.Temperature)}${row('Radiation at the surface', b.radiation, '≈ 0.007 mSv/day')}${row('One-way signal delay to Earth', b.delay, 'none')}</dl>
    <p class="fine">An Earth double matches terrain form only. Reduced gravity, near-vacuum and radiation need other facilities. Sources: NASA NSSDC fact sheets; Zhang et al. 2020, Science Advances (Moon radiation); Hassler et al. 2014, Science (Mars radiation); UNSCEAR (Earth background radiation); ESA Nebula (signal delay).</p></details>`;
}

// The analog verdict (the brief: what makes the place analogous, where the analogy breaks down, how it could help), in one
// place and only from what the detail already holds: the six properties' statuses, the climate fit, the listed analogs, and
// the factors not assessed. It scores nothing and adds no claim; the purpose says what the search was for, not how it weighted.
export function verdict(r: MatchResult, res: SearchResponse) {
  const ps = r.properties ?? [], by = (s: string) => ps.filter(p => status(p) === s).map(label).join(', ') || 'none';
  const f = climateFit(r.environment), l = r.location ?? {}, world = res.target?.body === 'moon' ? 'the Moon' : res.target?.body === 'mars' ? 'Mars' : 'the site';
  const k = ok(l.lat) && ok(l.lon) ? establishedAt(l.lat, l.lon) : undefined, n = ok(l.lat) && ok(l.lon) ? nearestAnalog(l.lat, l.lon) : undefined;
  const known = k ? `Inside ${k.name}, ${k.place}` : n && n.km <= NEAR_KM ? `${Math.round(n.km)} km from ${n.site.name}` : n ? `Not near any of the ${SITES.earth.length} listed analog sites` : '—';
  const row = (k2: string, v: string) => fact(k2, v, 'wide w');
  const m = measuredAt(res.target?.body, res.target?.lat, res.target?.lon), proc = processOf(res.target?.type);
  const read = !m ? 'Nothing for this site' : m.body === 'mars' ? 'Thermal inertia, water and elements, the nearest cave candidate' : 'Midnight surface temperature, rock abundance, the nearest pit';
  // [data-wx]: its climate fit row redraws when the site's NASA POWER climatology lands (data/climate.ts powerClimate).
  return `<div data-wx><h3 class="sec">Analog verdict</h3><dl class="facts">
    ${row('Strong on', by('match'))}${row('Partial on', by('partial'))}${row('Gaps', by('gap'))}${row('Not measurable at 200 m', by('not_measurable'))}
    ${row('Climate fit', f ? `${f.verdict} <span class="n">cold and dry, apart from the terrain match</span>` : 'No climate for this Earth double')}
    ${row('Listed analog sites', known)}
    ${proc ? row('Kind of landform searched', `${text(res.target?.type)}: ${proc} <span class="n">inferred from its IAU descriptor, not a finding about this site</span>`) : ''}
    ${row('Not assessed for the Earth double', 'Rock type and chemistry, subsurface and caves, biology and habitability')}
    ${row('Read at the site, not scored', read)}
    ${r.purpose ? row('Searched for', text(purposeLabel(String(r.purpose)))) : ''}
    ${row('How it could help', `Trials that depend on terrain form, such as driving, walking, surveying or setting up equipment on ground shaped like ${world}’s. Gravity, vacuum and radiation need other facilities.`)}</dl></div>`;
}

/** The Earth site's workable months for the mission (data/weather.ts bestMonths) and whether that feed is still loading. */
export interface Ops { months?: number[]; busy: boolean; shadow?: ShadowResult | null }
/**
 * Mission fit (data/mission.ts; README, "How the mission fit works"): the factor groups weighted for the mission the search is for,
 * each with its score, weight and evidence, and a provisional tier when enough of the weight is assessed. Apart from the terrain match:
 * it changes no score or rank of the engine's. Redraws when the weather feed lands ([data-wx]).
 */
export function missionBlock(r: MatchResult, ops?: Ops) {
  const cf = climateFit(r.environment), ts = terrainScore(r.fidelity?.score), months = ops?.months;
  const sw = shadowWeight(r.purpose), sh = ops?.shadow, fit = missionFit(r.purpose, { terrain: ts, climate: climateScore(cf?.verdict), ops: operationsScore(r.purpose, months, sh?.fit) });
  const opsMonths = months ? `${months.length} of 12 months sit under this mission’s weather limits (NASA POWER climatology). Planning limits, a judgment.` : ops?.busy ? 'Loading the Earth double’s climatology…'
    : sh ? 'The Earth double’s climatology is not available.' : 'Not assessed: the Earth double’s climatology is not available.';
  // The shadow fit counts only for the missions that move over the ground (data/mission.ts SHADOW_W): the share of each window in shadow.
  const opsShadow = sw <= 0 ? '' : sh ? ` Shadow fit ${sh.fit} of 100: how closely the two windows’ shadows match with the sun ${SUN_HEIGHTS.slice(0, -1).join('°, ')}° and ${SUN_HEIGHTS[SUN_HEIGHTS.length - 1]}° up. It carries ${Math.round(sw * 100)} of this factor’s 100 weight.`
    : ' Shadow fit not available: it needs both windows as real elevation.';
  const why: Record<Factor, string> = {
    terrain: ts === null ? 'Not assessed: the engine gave no terrain score' : `The engine’s terrain score, ${num(r.fidelity?.score, 2)}, measured at 200 m. Rock type is not in it.`,
    climate: cf ? `Climate fit ${cf.verdict.toLowerCase()}: how cold and dry the Earth double is against the site. A judgment band.` : 'Not assessed: the engine gave no climate for this Earth double',
    astro: 'Not assessed: Eidolon holds no biology or biosignature data',
    ops: `${opsMonths}${opsShadow}`,
    fidelity: 'Doesn’t apply to a field site: gravity, pressure and radiation are the same everywhere on Earth. Facilities give them: see Known analogs on the site view.',
    human: 'Doesn’t apply to a field site: crew size, duration and confinement belong to a habitat or facility. See Known analogs on the site view.',
    infra: 'Not assessed: Eidolon holds no real logistics, power or cost data',
  };
  const st = (s: number | null, na: boolean) => na || s === null ? 'not_measurable' : s >= 70 ? 'match' : s >= 40 ? 'partial' : 'gap';
  const tierless = fit.applicable < MIN_APPLICABLE ? `a field site reaches only ${fit.applicable} of this mission’s 100 weight: it needs a habitat or facility too` : 'too little of what a field site can be judged on is assessed';
  const head = fit.tier ? `<span class="tier" aria-hidden="true">${fit.tier}</span><span class="sm">Provisional tier <b>${fit.tier}</b>, ${TIER_WORD[fit.tier].toLowerCase()} <span class="n2">score ${fit.score} of 100</span></span>`
    : `<span class="tier" aria-hidden="true">–</span><span class="sm"><b>No tier</b>: ${tierless}${fit.score === null ? '' : ` <span class="n2">score ${fit.score} of 100 on what is assessed</span>`}</span>`;
  return `<div class="mfit" data-wx><h3 class="sec">Mission fit of this Earth double: ${text(purposeLabel(String(r.purpose ?? 'rover_mobility')))}</h3>
    <div class="rhead">${head}</div>
    <ul class="props">${fit.rows.map(x => `<li class="s-${st(x.score, x.na)}"><i class="mk mk-${st(x.score, x.na)}" aria-hidden="true"></i><span class="pl">${FACTOR_LABEL[x.key]}</span><span class="ps">${x.na ? 'N/A' : x.score === null ? 'Not assessed' : `${Math.round(x.score)} of 100`} · weight ${x.weight}</span><span class="pnote">${why[x.key]}</span></li>`).join('')}</ul>
    <p class="fine">A field site can be judged on ${fit.applicable} of this mission’s 100 weight, and ${fit.assessed} of it is assessed. N/A and unassessed factors drop out and never count as zero. The weights are Eidolon’s judgment; no published source gives numeric weights. Safety and permitting are not assessed, so a tier is provisional. This does not change the terrain match or the order of the results.</p></div>`;
}

export interface BookingFit { r?: Pick<MatchResult, 'fidelity' | 'environment'>; purpose: string; label: string; body: unknown; months?: number[]; busy: boolean; shadow?: ShadowResult | null }
/**
 * The mission fit as the booking flow shows it (ui/booking.ts, on the listing, the plan and the review): a compact summary for the
 * campaign's own purpose (it follows the plan's purpose select), a warning, never a block, when the fit is only marginal or worse, and
 * a note to pair a facility when the mission needs what no field site gives. An established site has no search result behind it, so its
 * terrain and climate are not assessed and it gets a tier only if enough else is. Apart from the listing's practical suitability.
 */
export function bookingFit(i: BookingFit) {
  const cf = climateFit(i.r?.environment), ts = terrainScore(i.r?.fidelity?.score), ops = operationsScore(i.purpose, i.months, i.shadow?.fit);
  const fit = missionFit(i.purpose, { terrain: ts, climate: climateScore(cf?.verdict), ops }), name = esc(i.label);
  const label = /^[A-Z]{2,}/.test(i.label) ? name : name.charAt(0).toLowerCase() + name.slice(1);   // "rover mobility", but "EVA training" keeps its capitals
  const shown = [ts !== null && `terrain ${Math.round(ts)}`, cf && `climate ${cf.verdict.toLowerCase()}`, ops !== null && `operations ${ops}${i.shadow && shadowWeight(i.purpose) > 0 ? ` (shadow fit ${i.shadow.fit})` : ''}`].filter(Boolean);
  const head = fit.tier ? `<span class="tier" aria-hidden="true">${fit.tier}</span><span class="sm">Provisional tier <b>${fit.tier}</b>, ${TIER_WORD[fit.tier].toLowerCase()} <span class="n2">score ${fit.score} of 100</span></span>`
    : `<span class="tier" aria-hidden="true">–</span><span class="sm"><b>No tier</b>: ${fit.applicable < MIN_APPLICABLE ? `a field site reaches only ${fit.applicable} of this mission’s 100 weight` : 'too little of what a field site can be judged on is assessed'}${fit.score === null ? '' : ` <span class="n2">score ${fit.score} of 100 on what is</span>`}</span>`;
  const weak = fit.tier === 'C' || fit.tier === 'D' || fit.tier === 'F';
  const warn = weak ? `<p class="banner">Rated ${TIER_WORD[fit.tier!].toLowerCase()} for ${label}: tier ${fit.tier}, score ${fit.score} of 100. You can still request this campaign; the site view’s Known analogs list closer options.</p>` : '';
  const fw = facilityWeight(i.purpose), fac = fw >= FACILITY_NEED ? bestAnalogs(i.purpose, i.body).find(x => x.a.track === 'facility')?.a : undefined;
  const pair = fac ? `<p class="banner">${name} puts ${fw} of its 100 weight on gravity, pressure, radiation and crew factors, which no field site gives. Pair this campaign with ${esc(fac.name)} (${esc(fac.place)}).</p>` : '';
  return `<div class="bfit" data-wx><h3 class="sec">Mission fit for ${label}</h3><div class="rhead">${head}</div>${warn}${pair}
    <p class="fine">${shown.length ? `Scored on ${shown.join(', ')}. ` : 'Nothing about this site is scored for this mission yet. '}${i.busy && i.months === undefined ? 'Loading the site’s climatology… ' : ''}Eidolon’s judgment, provisional; it is apart from the practical suitability below and never blocks a request.</p></div>`;
}

/**
 * The existing analogs for the search's mission on the target's world (data/analogs.ts), above the engine's Earth doubles: established
 * field sites, facilities and hybrids, best cover first, each with its source. When the mission leans on gravity, pressure, radiation or
 * crew factors, which no field site gives, it says to pair a facility with a field site.
 */
export function existingBlock(purpose: unknown, body: unknown, open = false) {
  const list = knownAnalogs(purpose, body);
  if (!list.length) return '';
  const fw = facilityWeight(purpose), link = (k: string) => `<a href="${esc(ANALOG_SOURCES[k].url)}" target="_blank" rel="noopener">${esc(ANALOG_SOURCES[k].title)}</a>`;
  const short = { field: 'Field site', facility: 'Facility', hybrid: 'Habitat on a field site' } as const;
  // One compact row each, like a result card's head: rank, name, kind and cover; the fact and its source open under it.
  const rows = list.map(({ a, cover: c }, i) => `<li><details class="ex"><summary><span class="rk">${pad(i + 1)}</span><span class="nm">${esc(a.name)}</span><span class="cv">${c}<span class="n"> of 100</span></span>
      <span class="sb">${short[a.track]} · ${esc(a.place)}</span></summary><p class="pnote">${esc(a.fact)} Source: ${a.refs.map(link).join('; ')}.</p></details></li>`).join('');
  return `<details class="drawer grp" data-keep="analogs"${open ? ' open' : ''}><summary><span class="chev" aria-hidden="true"></span>Known analogs<span class="nf">Best: ${esc(list[0].a.name)}</span></summary>
    <ol class="exl">${rows}</ol>
    <p class="fine">Established sites${fw >= FACILITY_NEED ? ', and the one facility this mission needs (it puts ' + fw + ' of its 100 weight on gravity, pressure, radiation and crew)' : ''}, ranked by how much of this mission’s weight each stands in for: Eidolon’s judgment from the cited facts. The Earth doubles above are terrain matches for this exact site.</p></details>`;
}

const group = (title: string, body: string, open = false) => `<details class="drawer grp"${open ? ' open' : ''}><summary><span class="chev" aria-hidden="true"></span>${title}</summary>${body}</details>`;

/**
 * A result's detail (spec §4, detail view): everything the engine says about it, gaps and caveats included. In order: the match's head and
 * summary, the mission fit and the analog verdict (the two answers), then one group each for the terrain comparison, the climate comparison,
 * what was measured at the target, and the Earth site's location, each named for whose values it holds.
 */
export function detail(r: MatchResult, res: SearchResponse, skin?: { busy: boolean; v?: Skin }, ops?: Ops) {
  const f = r.fidelity ?? {}, l = r.location ?? {}, ex = r.explanation ?? {}, m = res.model ?? {}, p = r.raw?.judge_p_good;
  const surf = word(SURFACE, l.surface, ''), lk = ok(p) ? rough(p) : -1, k = ok(l.lat) && ok(l.lon) ? establishedAt(l.lat, l.lon) : undefined;
  const names = (xs: unknown) => strs(xs).map(text).join(', ') || 'none';
  const world = res.target?.body === 'moon' ? 'the Moon' : res.target?.body === 'mars' ? 'Mars' : '';
  return `<section class="res" aria-label="Match detail">
    <div class="rhead"><span class="sm">Shape match <b>${conf(f.confidence)}</b></span><span class="n2">Score ${num(f.score, 2)}</span>${surf ? `<span class="badge">${surf}</span>` : ''}</div>
    ${lk < 0 ? '' : `<div class="lk"><span>Match likelihood</span><span class="seg" role="img" aria-label="Match likelihood, a rough estimate: ${lk} of 5">${'<i class="on"></i>'.repeat(lk)}${'<i></i>'.repeat(5 - lk)}</span><span>rough</span></div>`}
    <p class="su">${prose(unplace(String(ex.summary ?? '—')))}</p>
    ${l.surface === 'rugged_extension' ? '<p class="fine">Terrain form matches; the surface is likely vegetated.</p>' : ''}
    ${missionBlock(r, ops)}
    <div class="vcard">${verdict(r, res)}</div>
    ${group('Terrain: Earth double against the site', `${covers}
    <h3 class="sec">Terrain properties</h3>
    <ul class="props">${(r.properties ?? []).map(p => `<li class="s-${status(p)}">${mark(p)}<span class="pl">${label(p)}</span><span class="ps">${STATUS[status(p)] ?? '—'}</span><span class="pv">${num(p.score, 2)}</span>${p.note ? `<span class="pnote">${prose(p.note)}</span>` : ''}</li>`).join('')}</ul>
    <p class="fine">Matches: ${names(ex.strengths)} · Differs: ${names(ex.gaps)}</p>
    <h3 class="sec">Notes</h3><ul class="notes">${strs(ex.caveats).map(c => `<li>${prose(c)}</li>`).join('') || '<li>None.</li>'}</ul>`, true)}
    ${group('Climate: Earth double against the site', `<div data-wx><h3 class="sec">Earth double’s climate</h3>${climate(r.environment)}
    <h3 class="sec">Climate fit</h3>${climateFitBlock(r.environment, res.target?.body)}</div>
    ${skinBlock(skin, res.target?.body, res.target?.lat, res.target?.lon)}`)}
    ${world ? group(`Site: measured on ${world}`, measuredBlock(res.target)) : ''}
    ${group('Earth double: location and access', `<h3 class="sec">Location</h3><dl class="facts">
      ${fact('Coordinates', ok(l.lat) && ok(l.lon) ? fmtLL(l.lat, l.lon, 'earth', 4) : '—', 'wide')}${fact('Elevation', ok(l.elevation_m) ? `${fmtM(l.elevation_m)} a.s.l.` : '—')}${fact('Surface', surf || '—', 'w')}
      ${fact('Country', text(l.country), 'w')}${fact('Sovereign state', text(l.sovereign), 'w')}${fact('Access', word(ACCESS, l.access), 'wide w')}
      ${k ? fact('Established analog site', `Inside ${k.name}, ${k.place}`, 'wide w') : nearFact(l)}</dl>`)}
    ${limits(res.target?.body)}
    <details class="drawer" data-engine><summary><span class="chev" aria-hidden="true"></span>Raw engine values</summary>
      ${raw([['fidelity.score', f.score], ['fidelity.percentile_earth', f.percentile_earth], ['fidelity.matcher', f.matcher],
        // The judge's likelihood only as the rough bar above (spec §4), never as its number.
        ...Object.entries(r.raw ?? {}).filter(([key]) => key !== 'judge_p_good').map(([key, v]): [string, unknown] => [`raw.${key}`, v]),
        ['properties.*', 'percentile_earth, weight, baseline_m'],
        ...(r.properties ?? []).map((p): [string, unknown] => [`properties.${p.key}`, [p.percentile_earth, p.weight, p.baseline_m].map(v => v ?? '—').join(', ')]),
        ['site_id', r.site_id], ['purpose', r.purpose]])}
      <h4>Engine build</h4>
      ${raw([['api_version', m.api_version], ['matcher', m.matcher], ['judge', m.judge], ['engine_commit', m.engine_commit], ['source', res.source], ['timing_ms', res.timing_ms]])}
    </details>
  </section>`;
}

// The search's own states in the doubles box (spec §3.5: the loading state by source; §6: one error component keyed on
// the code), and its line in the detection frame.
export const box = (head: string, mid: string, body: string, end = '') => `<div class="state"><p class="sh">${head}</p>${mid}<p class="fine">${body}</p>${end}</div>`;
/**
 * The five cards as placeholders while a search by name runs: a filtered one takes ~0.3 s (the inline skeleton); one from
 * the cache lands in milliseconds, so `late` shows it only if that answer is slow to come (a CSS delay), not as a flash.
 */
export const skeleton = (late: boolean) => `<p class="sr">Searching Earth…</p><ul class="results skel${late ? ' late' : ''}" aria-hidden="true">${
  '<li><div class="result"><span class="th"></span><span class="cb"><i></i><i></i><i></i></span><span class="su"><i></i><i></i><i></i></span><span class="chips"><i></i><i></i><i></i></span></div></li>'.repeat(5)}</ul>`;
/** A wait with a bar that fills from `t0` (app-clock seconds) over about `s` seconds (ui/panel.ts animates it). */
const progress = (head: string, t0: number, s: number, body: string) =>
  box(head, `<span class="pbar"><i data-t0="${t0.toFixed(3)}" data-s="${s}"></i></span>`, body);
/** A search by coordinates (spec §3.5 `remote`: 5–10 s, the engine reads the target's DEM over the network). */
export const reading = (d: Doubles, body: string) => progress(`Reading ${body} terrain…`, d.t0, 10,
  'A search by coordinates takes 5 to 10 seconds while the search engine reads the elevation around this point. A new pin replaces this search.');
/** The engine warming up (spec §1 says 30–40 s; measured at the merge, 35 s warm and 56–74 s from a cold disk; `up` from
 *  its /health uptime). The bar fills over 90 s, so it doesn't sit full on a cold start. */
export const warming = (d: Doubles) => progress('Starting up…', d.up ?? d.t0, 90,
  'The search engine loads its index of Earth’s land when it starts, which takes up to about a minute and a half. The doubles follow as soon as it is ready.');
const FAILS: Record<string, [string, string]> = {
  network: ['The search engine didn’t answer', 'It may be offline or restarting.'],
  start_failed: ['The search engine failed to start', 'It needs a restart before Earth can be searched.'],
  bad_response: ['The answer couldn’t be read', 'The search engine answered in a form Eidolon doesn’t expect.'],
  invalid_request: ['The search engine refused the request', 'This is a bug on Eidolon’s side; the browser console has the details.'],
  unknown_target: ['Not a named feature', 'This feature isn’t in the search engine’s list of named features. Find it under its IAU name, or search its coordinates instead.'],
  unsupported_purpose: ['Not a purpose this search serves', 'Polar lighting geometry is a separate lighting study, not part of the terrain search. Pick another purpose above.'],
};
FAILS.unknown_purpose = FAILS.invalid_request;
const failOf = (code: string) => Object.hasOwn(FAILS, code) ? FAILS[code] : FAILS.network;
/** A failed search's heading by its error code (anything unknown reads as no answer): the grid's line on a card. */
export const failHead = (code: string) => failOf(code)[0];
/** A failed search by its error code, with `end` (its buttons) inside. */
export const failure = (code: string, end = '') => { const [h, b] = failOf(code); return box(h, '', b, end); };
/** No elevation data (no_dem: the Moon beyond 60°, plan Gaps 2): `known`, the site's curated analog sites follow;
 *  `terrain`, the name of the real elevation shown instead (terrain/dem.ts), if any. */
export const noData = (custom: boolean, known: boolean, terrain?: string) => box(`The search engine has no data for this ${custom ? 'point' : 'site'}`, '',
  `The search engine reads Moon terrain only within 59.5° of the equator, so it can’t score ${known ? 'these established analog sites' : 'Earth doubles against it'}. ${terrain ? `The terrain shown here is the ${esc(terrain)}.` : 'The terrain shown here is illustrative.'}`);
/** The engine's no-match wording (spec §5.3: show it prominently), from the first result's summary. */
export const noAnalog = (res?: SearchResponse) => String(res?.results[0]?.explanation?.summary).startsWith('No close analog');
/** The detection frame's Matching readout (ui/detection.ts) for a site's search; `remote`: searched by coordinates. */
export function matchLine(d: Doubles, body: string, remote: boolean) {
  const c = d.err?.code;
  if (c === 'no_dem') return 'No elevation data';
  if (c === 'warming_up') return 'Engine starting up';
  if (!d.res) return d.busy ? remote ? `Reading ${body} terrain` : 'Searching Earth' : 'Search failed';
  return noAnalog(d.res) ? 'No close analog' : 'Earth doubles';
}
/** The site's search for screen readers (index.html #live-s, said by ui/chrome.ts as it changes): what it's doing, what
 *  it found or why it can't. Plain text. `remote`: searched by coordinates. A warm-up's retries (`up` carried over,
 *  data/client.ts) stay one state, so it isn't said again every 3 s. */
export function searchSay(d: Doubles, body: string, remote: boolean) {
  const c = d.err?.code, rs = d.res?.results ?? [], r = rs[0];
  if (c === 'no_dem') return 'The search engine has no elevation data here: it reads Moon terrain only within 59.5° of the equator.';
  if (c === 'warming_up' || (d.busy && d.up !== undefined)) return 'The search engine is starting up. The doubles follow as soon as it is ready.';
  if (d.busy) return d.res ? 'Loading more doubles…' : remote ? `Reading ${body} terrain… A search by coordinates takes 5 to 10 seconds.` : 'Searching Earth…';
  if (c === 'aborted') return '';   // a newer pin's search replaced it
  if (c) return `${failHead(c)}.`;
  if (!r) return d.res ? 'No Earth doubles match this search.' : '';
  return `${noAnalog(d.res) ? 'No close analog in this region. ' : ''}${rs.length} Earth double${rs.length > 1 ? 's' : ''} found. The closest: ${
    r.location?.country ?? 'Unnamed area'}, shape match ${conf(r.fidelity?.confidence).toLowerCase()}.`;
}
