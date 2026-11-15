// Named-feature search on the Mars and Moon body views (spec §3.3, §7 flow 1): the engine's IAU targets as you type,
// through the data seam, debounced 150 ms on the app clock (so ?capture seeks drive it). An ARIA 1.2 combobox with a
// listbox and automatic selection: the first match is active when results land, arrows move it, Enter opens it,
// Escape closes the list, then clears the field; it closes when the focus leaves the field. A featured site opens as
// itself, any other feature as a named target. Featured sites the engine's list can't open (no IAU name: the Moon's
// south-pole regions, beyond its 60°) are matched by name here.
import gsap from 'gsap';
import { fmtLL, fmtSize, type Body } from '../coords';
import { BODIES } from '../data/bodies';
import { data } from '../data/client';
import { EngineError } from '../data/api';
import { featuredByName, SITES, targetSiteId } from '../data/sites';
import type { TargetSummary } from '../data/types.gen';
import { $, esc } from '../dom';
import { go, state } from '../router';

const pin = $('#pin'), LIMIT = 8;
const HELP = 'IAU names, as the search engine knows them: Rima Hadley, not Hadley Rille.';
// opts: the routes of the options shown for the field's current text (empty while a new text is being searched, so
// arrows and Enter wait for its answer); active: the one aria-activedescendant names.
let pending: gsap.core.Tween | null = null, seq = 0, opts: string[] = [], active = -1;

// A fresh field: whatever the last one had (options, a pending or late answer) is dropped.
export function targetSearchHTML(id: Body) {
  pending?.kill(); pending = null; opts = []; active = -1; seq++;
  return `<div class="cform"><label for="tq">Find a named feature</label>
    <div class="cfield"><input id="tq" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="tq-list" aria-describedby="tq-msg"
      placeholder="${id === 'mars' ? 'Jezero, Gale, Olympus Mons' : 'Rima Hadley, Tycho, Mare Imbrium'}" spellcheck="false" autocomplete="off"></div>
    <ul class="rows opts" id="tq-list" role="listbox" aria-label="Named features" hidden></ul>
    <p class="cmsg" id="tq-msg" aria-live="polite">${HELP}</p></div>`;
}

const parts = () => ({ input: pin.querySelector<HTMLInputElement>('#tq'), list: pin.querySelector<HTMLElement>('#tq-list'), msg: pin.querySelector<HTMLElement>('#tq-msg') });
const say = (s: string) => { const { msg } = parts(); if (msg) msg.textContent = s; };
const km = (d: unknown) => typeof d === 'number' && Number.isFinite(d) ? `≈ ${fmtSize(d)}` : '';
function show(ts: TargetSummary[], total: number, q: string) {
  const { input, list } = parts(); if (!input || !list) return;
  const b = state.body!, fs = featuredByName(b, q);
  const rows = [...fs.map(s => ({ to: `${b}/${s.id}`, name: s.name, mt: '', sb: `Featured site · ${fmtLL(s.lat, s.lon, b, 4)}` })),
    ...ts.map(t => { const f = SITES[b].find(s => s.iau === t.name);
      return { to: `${b}/${targetSiteId(b, t.name!, t.lat, t.lon)}`, name: t.name!, mt: km(t.diameter_km), sb: `${t.type ? `${t.type} · ` : ''}${fmtLL(t.lat, t.lon, b, 4)}${f ? ` · Featured: ${f.name}` : ''}` }; })];
  opts = rows.map(r => r.to); active = opts.length ? 0 : -1;
  list.innerHTML = rows.map((r, i) => `<li class="row" role="option" id="tq-o${i}" data-to="${esc(r.to)}" aria-selected="false"><span class="dot" style="--c:${BODIES[b].color}"></span><span class="nm">${esc(r.name)}</span><span class="mt">${r.mt}</span>
      <span class="sb">${esc(r.sb)}</span></li>`).join('');
  list.hidden = !opts.length; input.setAttribute('aria-expanded', String(!!opts.length)); mark();
  const n = opts.length, all = total + fs.length;
  say(!n ? `No named feature on ${BODIES[b].name} matches “${q}”.${b === 'moon' ? ' The search engine lists Moon features only within 60° of the equator; the south-pole sites are under Featured sites.' : ''}`
    : `${all > n ? `${n} of ${all.toLocaleString('en-GB')}` : n} named feature${all === 1 ? '' : 's'}. Arrow keys choose, Enter opens.`);
}
function mark(scroll = false) {
  const { input, list } = parts(); if (!input || !list) return;
  list.querySelectorAll('[role="option"]').forEach((o, i) => o.setAttribute('aria-selected', String(i === active)));
  if (active < 0) input.removeAttribute('aria-activedescendant');
  else { input.setAttribute('aria-activedescendant', `tq-o${active}`); if (scroll) list.children[active]?.scrollIntoView({ block: 'nearest' }); }
}
function close() {
  const { input, list } = parts(); pending?.kill(); pending = null; opts = []; active = -1; seq++;
  if (list) { list.hidden = true; list.innerHTML = ''; }
  input?.setAttribute('aria-expanded', 'false'); input?.removeAttribute('aria-activedescendant');
}
// The engine's answer (a trust boundary): only targets on this body with a name and a position are listed.
function ask(q: string) {
  const n = ++seq, body = state.body as TargetSummary['body'];
  if (parts().list?.hidden) say('Searching named features…');   // the first search also loads the mock's target list
  data.targets({ body, q, limit: LIMIT }).then(r => {
    if (n !== seq || state.body !== body) return;
    const ts = (Array.isArray(r?.targets) ? r.targets : []).filter(t => t?.body === body && typeof t.name === 'string' && Number.isFinite(t.lat) && Number.isFinite(t.lon));
    show(ts, Number.isFinite(r?.total) ? Math.max(r.total, ts.length) : ts.length, q);
  }, (e: unknown) => {
    if (n !== seq) return;
    close();
    say(e instanceof EngineError && e.code === 'warming_up' ? 'The search engine is starting up. Try again in a moment.' : 'Named features couldn’t be loaded: the search engine could not be reached.');
  });
}

pin.addEventListener('input', e => {
  const t = e.target as HTMLInputElement; if (t.id !== 'tq') return;
  pending?.kill(); pending = null;
  // The options shown are for the old text: arrows and Enter wait for the new answer (a press on one still opens it).
  opts = []; active = -1; seq++; mark();
  const q = t.value.trim();
  if (!q) { close(); say(HELP); return; }
  pending = gsap.delayedCall(.15, () => { pending = null; if (parts().input === t) ask(q); });
});
pin.addEventListener('keydown', e => {
  const t = e.target as HTMLInputElement; if (t.id !== 'tq') return;
  const shown = parts().list?.hidden === false, n = shown ? opts.length : 0;
  if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && n) { e.preventDefault(); active = (active + (e.key === 'ArrowDown' ? 1 : n - 1)) % n; mark(true); }
  else if (e.key === 'ArrowDown' && !shown && !pending && t.value.trim()) { e.preventDefault(); ask(t.value.trim()); }   // reopens a list closed by a blur
  else if (e.key === 'Enter' && n && active >= 0) { e.preventDefault(); go(opts[active]); }
  else if (e.key === 'Escape') {
    e.stopPropagation();   // Escape here closes the list, then clears the field; it doesn't leave the view
    if (shown || pending) close(); else if (t.value) { t.value = ''; say(HELP); } else t.blur();
  }
});
// The list belongs to the field: it closes when the focus leaves (a press on an option keeps the focus, below).
pin.addEventListener('focusout', e => { if ((e.target as Element).id === 'tq') close(); });
// A press on an option keeps the focus in the field; the click opens it.
pin.addEventListener('mousedown', e => { if ((e.target as Element).closest('#tq-list')) e.preventDefault(); });
pin.addEventListener('click', e => { const o = (e.target as Element).closest<HTMLElement>('#tq-list [data-to]'); if (o) go(o.dataset.to!); });
