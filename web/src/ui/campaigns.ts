// My campaigns (docs/plan.md, Stretch; Decisions 191): the test campaigns requested in this browser (data/booking.ts
// keeps them), soonest first, in a dialog opened from the top bar or a booking confirmation ([data-camps]). Each opens
// its confirmation (…/book/done), which shows the request as it was made.
import { fmtLL } from '../coords';
import { BODIES } from '../data/bodies';
import { days, lasting } from '../data/booking';
import { $, esc } from '../dom';
import { state } from '../router';
import { routeOf } from '../routes';
import { plural, span } from './booking';
import { count, listed } from './chrome';
import { ic } from './icons';
import { box, text } from './results';

const dlg = $<HTMLDialogElement>('#camps'), body = $('.pin', dlg), btn = $('#camps-btn');
btn.insertAdjacentHTML('afterbegin', ic('booked'));   // shown below 1,100 px, where the words go (top.css)

addEventListener('storage', count);   // another tab's request

// Names and ids come from site storage: escaped, as the engine's text is. Points to 4 places, as a result card's: a
// double that is an Earth cell is named by its country alone. A pin target by its point too (its crumbs round it to 2).
function campsHTML() {
  const cs = listed(), on = state.view === 'compare' ? `${state.body}/${state.site}|${state.dbl}` : '', b = state.body === 'moon' ? 'moon' : 'mars';
  const row = (c: typeof cs[number]) => { const p = c.plan, sel = c.key === on, target = c.site.startsWith('@') ? `Pin ${fmtLL(c.t.lat, c.t.lon, c.body, 4)}` : c.target;
    return `<li><button class="row${sel ? ' is-sel' : ''}" data-go="${esc(routeOf({ body: c.body, site: c.site, dbl: c.dbl, book: 'done' }))}"${sel ? ' aria-current="true"' : ''}>
      <span class="dot" style="--c:${BODIES.earth.color}"></span><span class="nm">${text(c.name)}</span><span class="sb ll">${fmtLL(c.d.lat, c.d.lon, 'earth', 4)}</span>
      <span class="sb">${span(p)} · ${plural(days(p), 'day', 'days')}</span>
      <span class="sb">For ${esc(target)}, ${BODIES[c.body].name} · ${plural(+p.team, 'person', 'people')}</span><span class="sb n">${esc(c.ref)}</span></button></li>`; };
  return `<div class="phead"><button class="back" data-shut><span class="chev" aria-hidden="true"></span><span>Close</span></button></div>
    <h2 class="title" id="camps-h" tabindex="-1">My campaigns</h2>
    ${cs.length ? `<p class="lede">The test campaigns you requested, soonest first. Each opens its confirmation.</p><ul class="rows">${cs.map(row).join('')}</ul>`
      : box('No campaigns requested yet', '', 'Compare a site on the Moon or Mars with one of its Earth doubles, plan a test campaign there and request it: it is listed here.',
        `<div class="actions"><button class="btn primary" data-go="${b}/sites">Featured sites on ${BODIES[b].name}</button></div>`)}
    <p class="fine">${lasting ? 'Kept in this browser only.' : 'This browser blocks storage, so they last until the page is closed.'} A mock-up: nothing was sent and no one was contacted.</p>`;
}
// Under its button, its right edge on the button's, inside the 12 px gutters (a phone's sheet ignores it: responsive.css).
function place() {
  const r = btn.getBoundingClientRect().right;
  dlg.style.setProperty('--r', `${Math.max(12, Math.min(innerWidth - r, innerWidth - dlg.offsetWidth - 12))}px`);
}
addEventListener('resize', () => { if (dlg.open) place(); });
document.addEventListener('click', e => {
  if (!(e.target as Element).closest('[data-camps]')) return;
  body.innerHTML = campsHTML(); count(); dlg.showModal(); place(); dlg.scrollTop = 0;
  $('#camps-h', dlg).focus();   // as a panel opens on its heading; closing gives the focus back to the opener
});
// Close, a campaign or the featured sites (the router then opens it), or the backdrop: a click on the dialog's own box,
// outside its content.
dlg.addEventListener('click', e => { const t = e.target as Element; if (t === dlg || t.closest('[data-shut], [data-go]')) dlg.close(); });
addEventListener('hashchange', () => dlg.close());   // the browser's back or forward under it
