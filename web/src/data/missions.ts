// The landing ellipse's mission presets (ellipse.ts, ui/ellipse.ts): each one's published ellipse, full long × short
// axes in km (equal for a circle), and the source line the panel shows (a number and its unit held together). Sources
// in full: docs/progress.md, "Landing ellipse (Stretch 4)". A body offers its own; Earth, where analogs are tested, all.
// `landed`: where a mission came down (inside its own ellipse) when that is one of our sites (`site`): the ellipse is
// drawn on the site's centre with only NASA's size, so the panel says there where it really landed (ellipse.ts landedOf).
export interface Mission {
  id: string; name: string; body: 'mars' | 'moon'; a: number; b: number; src: string;
  landed?: { site: string; name: string; lat: number; lon: number };
}

export const MISSIONS: Mission[] = [
  { id: 'perseverance', name: 'Perseverance', body: 'mars', a: 7.7, b: 6.6, src: 'The size of Perseverance’s ellipse (NASA/JPL, 2021)',
    landed: { site: 'jezero', name: 'Octavia E. Butler Landing', lat: 18.4446, lon: 77.4509 } },
  { id: 'curiosity', name: 'Curiosity', body: 'mars', a: 20, b: 7, src: 'The size of Curiosity’s ellipse as narrowed in June 2012 (NASA/JPL)',
    landed: { site: 'gale', name: 'Bradbury Landing', lat: -4.5895, lon: 137.4417 } },
  { id: 'artemis', name: 'Artemis HLS', body: 'moon', a: .2, b: .2, src: 'Artemis’s crewed lander must touch down within 100\u00a0m of its target (NASA, lunar navigation architecture, 2024)' },
  { id: 'apollo11', name: 'Apollo 11', body: 'moon', a: 18.5, b: 4.8, src: 'Apollo 11’s ellipse at Tranquility Base, 18.5\u00a0km east–west by 4.8\u00a0km north–south (1969)' },
];
