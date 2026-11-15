import { describe, expect, it } from 'vitest';
import { processOf } from './process';

describe('processOf', () => {
  it('a listed IAU descriptor gives its hedged line, in any case', () => {
    expect(processOf('Vallis')).toBe('a valley, commonly cut by flowing water or lava, or by faulting');
    expect(processOf('MONS')).toContain('commonly volcanic');
    expect(processOf('Dorsum')).toContain('compression');
  });
  it('every line is hedged, and none claims an origin outright', () => {
    for (const t of ['crater', 'mons', 'patera', 'tholus', 'vallis', 'dorsum', 'rima', 'cavus', 'chaos', 'mensa', 'fossa', 'catena', 'rupes']) expect(processOf(t), t).toMatch(/commonly/);
  });
  it('an unlisted type, a non-string and a prototype key give none', () => {
    for (const t of ['Planitia', '', undefined, null, 5, '__proto__', 'constructor', 'toString']) expect(processOf(t), String(t)).toBeUndefined();
  });
});
