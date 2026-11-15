// setReading: the telemetry flash. A reading that changes after holding flashes; drift and reduced motion don't.
import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => {
  const g = globalThis as Record<string, unknown>;
  const rm: { set?: (on: boolean) => void } = {};
  g.location = { search: '', hash: '' };
  g.matchMedia = () => ({ matches: false, addEventListener: (_: string, f: (e: { matches: boolean }) => void) => { rm.set ??= on => f({ matches: on }); } });
  return { rm, fromTo: vi.fn() };
});
vi.mock('gsap', () => ({ default: { fromTo: h.fromTo } }));
import { setReading } from './motion';

let now = 0;
vi.spyOn(performance, 'now').mockImplementation(() => now * 1000);
const el = () => ({ textContent: '-' }) as Element;
const at = (t: number, e: Element, s: string, news?: boolean) => { now = t; setReading(e, s, news); };

describe('setReading', () => {
  beforeEach(() => { h.fromTo.mockClear(); h.rm.set!(false); });

  it('flashes a reading that changes after holding, coral (--fl 1) easing back', () => {
    const e = el();
    at(10, e, 'LIVE');
    expect(e.textContent).toBe('LIVE');
    expect(h.fromTo).toHaveBeenCalledOnce();
    expect(h.fromTo.mock.calls[0].slice(0, 2)).toEqual([e, { '--fl': 1 }]);
    at(12, e, '×600');
    expect(h.fromTo).toHaveBeenCalledTimes(2);
  });

  it('writes but does not flash drift, nor an unchanged value', () => {
    const e = el();
    at(20, e, '18.0N');                                   // first reading: flashes
    for (let i = 1; i <= 30; i++) at(20 + i / 60, e, `18.${i}N`);   // every frame for half a second
    at(20.8, e, '18.30N');                                // unchanged
    at(20.9, e, '18.31N');                                // .4 s after the last change: still drift
    expect(e.textContent).toBe('18.31N');
    expect(h.fromTo).toHaveBeenCalledOnce();
    at(21.45, e, '19.0N');                                // held .55 s: news again
    expect(h.fromTo).toHaveBeenCalledTimes(2);
  });

  it('writes a change its caller calls drift (news false) without flashing, and still counts it as a change', () => {
    const e = el();
    at(40, e, '05:10');                                   // flashes
    at(43, e, '05:11', false);                            // held 3 s, but a steady tick (the Moon's local time at ×600)
    expect(e.textContent).toBe('05:11');
    expect(h.fromTo).toHaveBeenCalledOnce();
    at(43.2, e, '-');                                     // news .2 s after that tick: still drift
    expect(h.fromTo).toHaveBeenCalledOnce();
    at(44, e, '05:12');                                   // news after holding .8 s
    expect(h.fromTo).toHaveBeenCalledTimes(2);
  });

  it('is off under reduced motion, read live', () => {
    const e = el();
    h.rm.set!(true);
    at(30, e, 'YES');
    expect(e.textContent).toBe('YES');
    expect(h.fromTo).not.toHaveBeenCalled();
    h.rm.set!(false);
    at(31, e, 'NO');
    expect(h.fromTo).toHaveBeenCalledOnce();
  });
});
