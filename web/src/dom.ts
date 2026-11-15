// DOM helpers. Per-frame writers go through setStyle/setAttr, which skip values that haven't changed; use them only on
// elements GSAP doesn't also animate (their cache would go stale).
export const $ = <T extends Element = HTMLElement>(s: string, e: ParentNode = document) => e.querySelector<T>(s)!;
export const $$ = <T extends Element = HTMLElement>(s: string, e: ParentNode = document) => [...e.querySelectorAll<T>(s)];

const last = new WeakMap<Element, Record<string, string>>();
const changed = (el: Element, k: string, v: string) => {
  let c = last.get(el); if (!c) last.set(el, c = {});
  if (c[k] === v) return false;
  c[k] = v; return true;
};
export const setStyle = (el: HTMLElement | SVGElement, prop: string, v: string) => { if (changed(el, prop, v)) el.style.setProperty(prop, v); };
export const setAttr = (el: Element, name: string, v: string | number) => { const s = String(v); if (changed(el, '@' + name, s)) el.setAttribute(name, s); };
export const setText = (el: Element, s: string) => { const c = changed(el, '#text', s); if (c) el.textContent = s; return c; };
export const setHTML = (el: Element, s: string) => { if (changed(el, '#html', s)) el.innerHTML = s; };
export const setClass = (el: Element, cls: string, on: boolean) => { if (changed(el, '.' + cls, on ? '1' : '')) el.classList.toggle(cls, on); };
// Text from the engine (country names, summaries) on its way into a template's innerHTML or a double-quoted attribute.
export const esc = (s: string) => s.replace(/[&<>"]/g, c => `&#${c.charCodeAt(0)};`);
// Text onto the clipboard: the Clipboard API, else the old copy command (a page over plain http has no
// navigator.clipboard; a frame can be refused it). Whether it took.
export async function copyText(text: string) {
  try { await navigator.clipboard.writeText(text); return true; } catch { /* the fallback below */ }
  const ta = document.createElement('textarea'), was = document.activeElement as HTMLElement | null;
  ta.value = text; ta.readOnly = true; ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none';
  document.body.append(ta); ta.select();
  let ok = false; try { ok = document.execCommand('copy'); } catch { /* not supported */ }
  ta.remove(); was?.focus({ preventScroll: true }); return ok;
}
