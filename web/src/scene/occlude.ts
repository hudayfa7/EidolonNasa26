// How much of a sun disc of radius sunR at `sun` a camera at `cam` sees past the spheres in front of it: 1 clear, 0
// hidden, soft over the disc's own angular radius. Dims the title sun's lens flare (scene/post.ts); a sphere of radius 0
// is ignored.
import { Vector3 } from 'three';
import { smooth } from '../coords';

const _s = new Vector3(), _c = new Vector3();
export function sunVisible(cam: Vector3, sun: Vector3, sunR: number, spheres: { c: Vector3; r: number }[]) {
  const ls = _s.subVectors(sun, cam).length(), as = Math.asin(Math.min(1, sunR / ls));
  let v = 1;
  for (const { c, r } of spheres) {
    const lc = _c.subVectors(c, cam).length();
    if (!r || lc <= r || lc - r > ls) continue;   // none, the camera inside it, or wholly beyond the sun
    const ab = Math.asin(r / lc);
    v *= smooth(ab - as, ab + as, _s.angleTo(_c));
  }
  return v;
}
