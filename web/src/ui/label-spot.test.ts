// A globe marker's label: right of it, else the first side inside the viewport and clear of the other visible markers.
import { describe, expect, it } from 'vitest';
import { labelSpot, type Pt } from './label-spot';

const vp = { x: 0, y: 0, w: 400, h: 400 }, at = (x: number, y: number, on = true): Pt => ({ x, y, on });

describe('labelSpot', () => {
  it('right of the marker when that side is clear and inside', () => {
    const m = at(100, 200);
    expect(labelSpot(m, 120, 24, vp, [m, at(100, 260)])).toEqual([8, -12]);
  });
  it('left when a marker sits on the right, or the right edge is near', () => {
    const m = at(200, 200);
    expect(labelSpot(m, 120, 24, vp, [m, at(240, 205)])).toEqual([-128, -12]);
    expect(labelSpot(at(330, 200), 120, 24, vp, [])).toEqual([-128, -12]);
  });
  it('under, then above, shifted inside the viewport and off the markers; hidden markers are no obstacle', () => {
    const m = at(97, 234), box = { x: 0, y: 0, w: 195, h: 400 };   // the phone's half-width globe
    expect(labelSpot(m, 100, 24, box, [m, at(57, 215), at(50, 260), at(52, 271)])).toEqual([-13, 11]);   // centred covers (50, 260): runs right instead
    expect(labelSpot(m, 100, 24, box, [m, at(80, 250), at(150, 250)])).toEqual([-50, -35]);   // under is crowded: above
    expect(labelSpot(m, 100, 24, box, [m, at(80, 250, false)])).toEqual([-50, 11]);
  });
  it('the spot that covers fewest markers when none is clear (the first of equals), else under it', () => {
    const m = at(200, 200), crowd = [m, at(240, 200), at(160, 200), at(200, 230), at(200, 170), at(150, 225), at(250, 225), at(150, 175), at(250, 175)];
    expect(labelSpot(m, 120, 24, vp, crowd)).toEqual([8, -12]);
    expect(labelSpot(m, 120, 24, vp, [m, at(240, 200), at(300, 205), at(160, 200), at(200, 230), at(200, 170)])).toEqual([-128, -12]);
    expect(labelSpot(at(50, 50), 300, 24, { x: 0, y: 0, w: 100, h: 400 }, [])).toEqual([-150, 11]);
  });
});
