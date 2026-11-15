// Surface photographs for the site panel's surface slot and the booking listing's strip: where a lander, rover or Apollo
// crew photographed a featured site, the other US landings (`at`: where it landed, for Opportunity at Endeavour the
// crater its view looks across), and the established Earth sites with a NASA field photograph (sites.ts surfaceOf says
// why there is none elsewhere). Keyed `body-site` or `body-landing`. `npm run fetch:real -- --only=photos` writes each to
// public/photos/<key>.jpg from NASA's Image and Video Library (`id`; its page is images.nasa.gov/details/<id>), cut
// square around `crop`: centre x and y as fractions of the image, side as a fraction of its shorter edge. Credits and
// licences: docs/credits.md. Imports nothing, so the script can.
export interface Photo { id: string; what: string; by: string; alt: string; crop: [cx: number, cy: number, side: number]; at?: [lat: number, lon: number] }

export const PHOTOS: Record<string, Photo> = {
  'mars-jezero': { id: 'PIA24546', what: 'Santa Cruz hill, Perseverance Mastcam-Z, 2021', by: 'NASA/JPL-Caltech/ASU/MSSS', crop: [.45, .5, 1],
    alt: 'Santa Cruz, a low hill inside Jezero Crater, seen from Perseverance across reddish ground strewn with rocks; the crater rim is on the horizon.' },
  'mars-gale': { id: 'PIA19083', what: 'Buttes on Mount Sharp, Curiosity Mastcam, 2013', by: 'NASA/JPL-Caltech/MSSS', crop: [.72, .5, 1],
    alt: 'Layered buttes and mesas on the lower slopes of Mount Sharp, inside Gale Crater, seen by Curiosity.' },
  'mars-meridiani': { id: 'PIA05162', what: 'Eagle crater outcrop, Opportunity Pancam, 2004', by: 'NASA/JPL/Cornell', crop: [.5, .5, 1],
    alt: 'A low band of pale, flat-lying bedrock in the wall of Eagle crater, where Opportunity landed, beyond dark reddish soil.' },
  'mars-elysium': { id: 'PIA22876', what: 'InSight’s first selfie, 2018', by: 'NASA/JPL-Caltech', crop: [.5, .5, 1],
    alt: 'The InSight lander from above: its deck of instruments between two round solar panels, on flat, pebbly ground.' },
  'moon-hadley': { id: 'as15-86-11603', what: 'James Irwin and the rover, Apollo 15, 1971', by: 'NASA, photograph by David Scott', crop: [.5, .45, .8],
    alt: 'James Irwin beside the lunar rover on grey, cratered ground, with the rounded bulk of Mount Hadley behind under a black sky.' },
  'moon-taurus': { id: 'as17-140-21497', what: 'Harrison Schmitt at the split boulder, Apollo 17, 1972', by: 'NASA, photograph by Eugene Cernan', crop: [.5, .55, .85],
    alt: 'Harrison Schmitt beside a huge split boulder high on a slope, the Taurus–Littrow valley and its far massifs behind.' },
  // Landings with no featured site, at their published coordinates (Moon: LROC; Mars: planetocentric, east 0–360°).
  'moon-apollo11': { id: 'as11-40-5875', what: 'Buzz Aldrin and the flag, Apollo 11, 1969', by: 'NASA, photograph by Neil Armstrong', crop: [.5, .5, 1], at: [0.6741, 23.4730],
    alt: 'Buzz Aldrin beside the US flag on grey ground printed with bootprints, a leg of the lunar module Eagle at the left, under a black sky.' },
  'moon-apollo12': { id: 'AS12-48-7134', what: 'Pete Conrad at Surveyor 3, Apollo 12, 1969', by: 'NASA, photograph by Alan Bean', crop: [.5, .5, 1], at: [-3.0124, -23.4216],
    alt: 'Pete Conrad beside the Surveyor 3 probe, which landed in 1967, the Apollo 12 lunar module small on the crater rim behind.' },
  'moon-apollo14': { id: 'as14_66_09232', what: 'Alan Shepard and the flag, Apollo 14, 1971', by: 'NASA, photograph by Edgar Mitchell', crop: [.5, .5, 1], at: [-3.6453, -17.4714],
    alt: 'Alan Shepard beside the US flag on a grey slope; the shadows of the lunar module, its dish antenna and the photographer lie across the ground.' },
  'moon-apollo16': { id: 'as16-113-18339', what: 'John Young’s jump salute, Apollo 16, 1972', by: 'NASA, photograph by Charles Duke', crop: [.5, .5, 1], at: [-8.9730, 15.5002],
    alt: 'John Young in mid-leap, saluting the flag, the lunar module and the rover beside him and Stone Mountain behind.' },
  'mars-viking1': { id: 'PIA00563', what: 'Chryse Planitia, Viking Lander 1, 1976', by: 'NASA/JPL', crop: [.5, .5, 1], at: [22.27, 312.05],
    alt: 'Chryse Planitia from Viking Lander 1: reddish dust and scattered angular rocks out to a low horizon under a pale orange sky.' },
  'mars-viking2': { id: 'PIA00568', what: 'Utopia Planitia, Viking Lander 2, 1976', by: 'NASA/JPL', crop: [.5, .5, 1], at: [47.64, 134.29],
    alt: 'Utopia Planitia from Viking Lander 2: flat ground crowded with pitted, fist-sized rocks out to a tilted horizon under a pale sky.' },
  'mars-pathfinder': { id: 'PIA04318', what: 'Sojourner near the Rock Garden, Mars Pathfinder, 1997', by: 'NASA/JPL-Caltech', crop: [.45, .5, 1], at: [19.13, 326.78],
    alt: 'Black-and-white view of the six-wheeled Sojourner rover among angular rocks and patches of drift in Ares Vallis.' },
  'mars-phoenix': { id: 'PIA10713', what: 'Polygonal ground, Phoenix Surface Stereo Imager, 2008', by: 'NASA/JPL-Caltech/University of Arizona/Texas A&M University', crop: [.53, .32, .78], at: [68.22, 234.25],
    alt: 'A flat, pale brown plain near Mars’s north pole, cut into low polygons by ground ice, stretching to the horizon from the Phoenix lander.' },
  'mars-spirit': { id: 'PIA17760', what: 'South from Husband Hill, Spirit Pancam, 2005', by: 'NASA/JPL-Caltech/Cornell Univ.', crop: [.5, .5, 1], at: [-14.5684, 175.4726],
    alt: 'Tan, rock-strewn slopes falling south from the top of Husband Hill, in Gusev Crater, to a basin and low hills on the horizon.' },
  // shortcut: one spot per landing, so a pin on Cape York, where Opportunity stood 10 km west of this centre, gets none; add rover stops if pins there matter.
  'mars-endeavour': { id: 'PIA15684', what: 'Endeavour crater, Opportunity Pancam, 2012', by: 'NASA/JPL-Caltech/Cornell/Arizona State Univ.', crop: [.5, .55, 1], at: [-2.2836, 354.8045],
    alt: 'Opportunity’s shadow at late afternoon over the western rim of Endeavour crater, its floor stretching to the far rim, in false colour.' },
  'earth-salda': { id: 'PIA24375', what: 'Lake Salda’s eastern shore', by: 'NASA/JPL-Caltech', crop: [.55, .5, 1],
    alt: 'White carbonate sand and rock on Lake Salda’s eastern shore, turquoise water on the left and old shoreline terraces rising on the right.' },
  'earth-pilbara': { id: 'PIA23551', what: 'Stromatolite outcrop in the Pilbara, 2019', by: 'NASA/JPL-Caltech', crop: [.8, .78, .46],
    alt: 'A fossil stromatolite outcrop on a slope in the Pilbara, among the oldest on Earth: domed red rock and pale chert cracked into blocks.' },
  'earth-haughton': { id: 'ARC-2007-ACD07-0170-005', what: 'K-10 rovers at Haughton Crater, 2007', by: 'NASA, photograph by Matt Deans', crop: [.5, .5, 1],
    alt: 'Two K-10 rovers surveying the flat grey rubble of Haughton Crater, low hills behind under an overcast sky.' },
  'earth-holuhraun': { id: 'jsc2024e055198', what: 'Holuhraun lava field, 2024', by: 'NASA, photograph by Robert Markowitz', crop: [.55, .5, 1],
    alt: 'Rubbly basalt of the Holuhraun lava field, partly buried by dark wind-blown sand, stretching to a flat horizon.' },
  'earth-deathvalley': { id: 'PIA26676', what: 'Drone test over Mars Hill, 2025', by: 'NASA/JPL-Caltech', crop: [.5, .62, 1],
    alt: 'A research drone hovering over the rubbly volcanic rock of Mars Hill in Death Valley, bare mountains beyond.' },
  'earth-dryvalleys': { id: 'ARC-1996-AC94-0206', what: 'Chris McKay at a monitoring station', by: 'NASA Ames', crop: [.55, .5, .76],
    alt: 'Chris McKay in a red parka setting up a monitoring station on sandstone with microbes living inside it, between patches of snow in the Dry Valleys.' },
  'earth-atacama': { id: 'PIA16191', what: 'Dry streambed on an alluvial fan', by: 'NASA/UC Berkeley', crop: [.5, .5, 1],
    alt: 'A dry streambed of loose gravel and cobbles on an alluvial fan in the Atacama Desert, scientists surveying it below bare, dun hills.' },
  'earth-maunakea': { id: 'PIA22219', what: 'Stone stripes on Mauna Kea, 1999', by: 'Washington University in St. Louis/NASA, photograph by R. E. Arvidson', crop: [.5, .5, 1],
    alt: 'Stone stripes on a cinder cone high on Mauna Kea: lines of small rock fragments running downhill through tan regolith, boulders above.' },
};

// Beyond's cards (views/beyond.ts): a spacecraft's image of each world, which the page dithers into the footer's dots
// (ui/carousel.ts) in the world's own ink. Keyed by the card's scene. `npm run fetch:real -- --only=beyond` writes each
// to public/textures/<key>.jpg (a texture key, so it loads with the maps), 320 × 180 grey, cut 16:9 around `crop`:
// centre x and y as fractions of the image, the frame's height as a fraction of the image's (black past its edges);
// `part`, the part of the image to use first (x0, y0, x1, y1 as fractions), for a page holding two versions. Each world
// fills about .8 of the frame's height, centred.
interface Portrait { id: string; what: string; by: string; alt: string; ink: string; crop: [cx: number, cy: number, h: number]; part?: [number, number, number, number] }

export const BEYOND: Record<string, Portrait> = {
  // The 2020 reprocessing, its contrast-enhanced version (the right of the two).
  venus: { id: 'PIA23791', what: 'Mariner 10', by: 'NASA/JPL-Caltech', ink: '#EAD8B2', part: [.53, 0, 1, 1], crop: [.453, .5, 1.07],
    alt: 'Venus from Mariner 10, a gibbous disc wrapped in cloud, its bands brought out, drawn in dots.' },
  mercury: { id: 'PIA16853', what: 'MESSENGER', by: 'NASA/JHUAPL/CIW', ink: '#C9CCD2', crop: [.5, .5, 1.16],
    alt: 'Mercury from MESSENGER, a cratered disc of bright rayed craters and darker plains, drawn in dots.' },
  callisto: { id: 'PIA03456', what: 'Galileo', by: 'NASA/JPL/DLR', ink: '#CFC4B2', crop: [.498, .499, 1.06],
    alt: 'Callisto from Galileo, a dark disc scattered with bright impact craters, drawn in dots.' },
  titan: { id: 'PIA20016', what: 'Cassini', by: 'NASA/JPL/U. Arizona/U. Idaho', ink: '#E2A561', crop: [.5, .5, 1.25],
    alt: 'Titan from Cassini in infrared, which sees through its haze: dark dune fields across a brighter surface, drawn in dots.' },
};
