// The booking flow's line icons (plan, Rendering and shaders: Icons), drawn as the panel's other icons are (.ic: a
// 12 px grid, 1.1 px strokes in the text's colour, no fill): before its section heads and form labels, never alone, so
// hidden from screen readers.
const P = {
  dates: '<rect x="1.5" y="2.5" width="9" height="8" rx="1"/><path d="M1.5 5h9M4 1.2v2.4M8 1.2v2.4"/>',
  booked: '<rect x="1.5" y="2.5" width="9" height="8" rx="1"/><path d="M1.5 5h9M4 1.2v2.4M8 1.2v2.4M4.2 7.7l1.3 1.2 2.3-2.5"/>',   // My campaigns: dates requested
  team: '<circle cx="4.3" cy="4" r="1.8"/><path d="M1.2 10.4c.3-2 1.5-3.1 3.1-3.1s2.8 1.1 3.1 3.1"/><circle cx="8.7" cy="4.4" r="1.4"/><path d="M8.6 7.3c1.2 0 2 .9 2.3 2.6"/>',
  equipment: '<rect x="1.3" y="4" width="9.4" height="6.2" rx="1"/><path d="M4.2 4V2.6h3.6V4M1.3 6.9h9.4M6 6.1v1.6"/>',
  permits: '<path d="M3 1.3h4.2l2 2v7.4H3Z"/><path d="M7.2 1.3v2h2M4.6 7l1.1 1.1 2-2.2"/>',
  access: '<path d="M3.2 10.7 4.9 1.3M8.8 10.7 7.1 1.3M6 2.3v1.3M6 5.2v1.4M6 8.2v1.6"/>',
  purpose: '<circle cx="6" cy="6" r="4.4"/><circle cx="6" cy="6" r="1.5"/><path d="M6 .6v1.6M6 9.8v1.6M.6 6h1.6M9.8 6h1.6"/>',
  notes: '<path d="M2 2.8h8M2 5.6h8M2 8.4h4.6"/>',
  cost: '<circle cx="6" cy="6" r="4.6"/><path d="M7.4 4.4c-.3-.6-.9-.9-1.5-.9-.9 0-1.5.5-1.5 1.2 0 1.6 3.1.8 3.1 2.5 0 .7-.7 1.3-1.6 1.3-.7 0-1.3-.4-1.6-1M6 2.5v1M6 8.5v1"/>',
  season: '<circle cx="6" cy="6" r="2.2"/><path d="M6 .9v1.3M6 9.8v1.3M.9 6h1.3M9.8 6h1.3M2.4 2.4l.9.9M8.7 8.7l.9.9M2.4 9.6l.9-.9M8.7 3.3l.9-.9"/>',
  surface: '<path d="M.9 10.2 4.4 4.3l2 3.2 1.3-1.9 3.4 4.6Z"/><circle cx="9" cy="2.6" r="1"/>',
  practical: '<path d="M1.6 8.8a4.4 4.4 0 1 1 8.8 0"/><path d="M6 8.4l2.2-2.8M1.6 8.8h8.8"/>',
  site: '<path d="M6 10.9S9.6 7.4 9.6 4.7a3.6 3.6 0 0 0-7.2 0C2.4 7.4 6 10.9 6 10.9Z"/><circle cx="6" cy="4.7" r="1.3"/>',
};
type Icon = keyof typeof P;
export const ic = (k: Icon) => `<svg class="ic" viewBox="0 0 12 12" aria-hidden="true">${P[k]}</svg>`;
