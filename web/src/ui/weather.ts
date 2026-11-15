// The weather window's words (data/weather.ts), shared by the Earth site view (ui/panel.ts) and the booking plan
// (ui/booking.ts): a day for screen readers, a purpose's limits, where the days come from. Pure, tested.
import { fmtDay } from '../data/booking';
import { limitsOf, type Day, type Src } from '../data/weather';

// To one decimal, trimmed, so a value just under a whole-number limit doesn't read as on it ('10.7', not '11').
const deg = (x: number) => `${x < 0 ? '−' : ''}${+Math.abs(x).toFixed(1)}`;
/** A purpose's name inside a sentence: 'rover mobility', 'EVA training'. */
export const lc = (s: string) => /^[A-Z]{2}/.test(s) ? s : s.charAt(0).toLowerCase() + s.slice(1);
/** A purpose's limits as a phrase (HTML): 'wind under 11 m/s, rain up to 2 mm, −20 to 40 °C'. */
export const limitsText = (purpose: string) => { const L = limitsOf(purpose); return `wind under ${L.wind}&nbsp;m/s, rain up to ${L.rain}&nbsp;mm, ${deg(L.lo)} to ${deg(L.hi)}&nbsp;°C`; };
/** A bar's height (0–1) for the day's strongest wind; none without one. */
export const barH = (d: Day) => Number.isFinite(d.wind) ? Math.min(1, d.wind / 18).toFixed(2) : '0';
/** Whether a day shows as a go (blue): under every limit, once its weather is known. */
export const isGo = (over: string[], src: Src) => src !== 'loading' && !over.length;
const known = (d: Day) => [d.wind, d.rain, d.hi, d.lo].every(Number.isFinite);
/** A day's marks as classes: ' go' (blue), and ' dot' where its rain or temperature goes over a limit, which the bar
 *  (the wind) can't show: on a touch screen there is no tooltip to say why a short bar is grey. */
export const marks = (d: Day, over: string[], src: Src) =>
  `${isGo(over, src) ? ' go' : ''}${src !== 'loading' && known(d) && over.some(k => k !== 'wind') ? ' dot' : ''}`;
const and = (xs: string[]) => xs.length > 1 ? `${xs.slice(0, -1).join(', ')} and ${xs.at(-1)}` : xs[0];
/** A day for screen readers: its weather, then which of the purpose's limits it goes over (`over`, data/weather.ts). */
export function dayText(d: Day, over: string[], src: Src) {
  if (src === 'loading') return `${fmtDay(d.iso)}: forecast loading`;
  if (!known(d)) return `${fmtDay(d.iso)}: no forecast for this day`;
  return `${fmtDay(d.iso)}: wind ${deg(d.wind)} m/s, rain ${deg(d.rain)} mm, ${deg(d.lo)} to ${deg(d.hi)} °C; ${over.length ? `over the ${and(over)} limit${over.length > 1 ? 's' : ''}` : 'under the limits'}`;
}
const link = (href: string, s: string) => `<a href="${href}" target="_blank" rel="noopener">${s}</a>`;
/** Where the days come from, as a sentence (HTML: Open-Meteo's credit links the source and the licence, as CC BY asks). */
export const srcText = (src: Src) => src === 'loading' ? 'Loading the forecast…'
  : src === 'forecast' ? `Forecast: ${link('https://open-meteo.com/', 'Open-Meteo.com')} (${link('https://creativecommons.org/licenses/by/4.0/', 'CC BY 4.0')}).`
  : 'Sample weather: the forecast couldn’t be loaded.';
/** Where the best months come from, as a sentence (`purpose` as in a sentence). */
export const monthsSrc = (purpose: string) => `The months whose typical day sits under the limits for ${purpose}, estimated from NASA POWER’s monthly climatology (NASA Langley Research Center).`;
/** The off-season caveat when no month is good for the purpose (`purpose` as in a sentence). */
export const noMonths = (purpose: string) => `No month’s typical day sits under the limits for ${purpose}.`;
