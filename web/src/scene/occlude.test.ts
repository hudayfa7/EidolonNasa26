import { describe, expect, it } from 'vitest';
import { Vector3 } from 'three';
import { sunVisible } from './occlude';

const cam = new Vector3(0, 0, 10), sun = new Vector3(0, 0, -20), body = (x: number, r = 1) => ({ c: new Vector3(x, 0, 0), r });
describe('sunVisible (the lens flare\'s occlusion)', () => {
  it('a body straight in front hides the sun; one well aside leaves it whole', () => {
    expect(sunVisible(cam, sun, .2, [body(0)])).toBe(0);
    expect(sunVisible(cam, sun, .2, [body(5)])).toBe(1);
  });
  it('on the limb, about half the disc shows; it fades as the body moves across', () => {
    const lim = 1;   // the body's x at which its limb crosses the sun's direction (sin θ = x / √(x² + 100) = 1 / √(x² + 100))
    expect(sunVisible(cam, sun, .2, [body(lim)])).toBeCloseTo(.5, 1);
    const a = sunVisible(cam, sun, .2, [body(lim - .05)]), b = sunVisible(cam, sun, .2, [body(lim + .05)]);
    expect(a).toBeLessThan(.5); expect(b).toBeGreaterThan(.5);
  });
  it('ignores a body beyond the sun, one the camera is inside, and radius 0', () => {
    expect(sunVisible(cam, sun, .2, [{ c: new Vector3(0, 0, -40), r: 1 }])).toBe(1);
    expect(sunVisible(cam, sun, .2, [{ c: new Vector3(0, 0, 9.5), r: 1 }])).toBe(1);
    expect(sunVisible(cam, sun, .2, [body(0, 0)])).toBe(1);
  });
});
