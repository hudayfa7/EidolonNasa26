// Existing analogs: the established field sites, facilities and hybrids a mission can use beside the engine's terrain matches
// (docs/analog-weights.md, "Existing analogs": every fact's source, every strength's reasoning). Pure: no DOM.
//
// `serves` is how fully an analog reproduces each factor group, 0 to 1, our judgment from the cited facts (docs/analog-weights.md
// gives the reason for each). An analog's cover for a mission is the sum of the mission's weights times those strengths, over the factors
// its track is judged on: how much of the mission's 100 weight it can stand in for. It ranks existing analogs; it is not the mission fit.
import { APPLIES, facilityWeight, profileOf, type Factor, type Track } from './mission';

export interface Source { title: string; url: string }
/** Every source behind a fact here, by key (docs/analog-weights.md lists them with what each supports). */
export const SOURCES: Record<string, Source> = {
  hera: { title: 'NASA, Human Exploration Research Analog (HERA)', url: 'https://www.nasa.gov/analogs/hera' },
  chapea: { title: 'NASA, Voyagers of Mars: the first CHAPEA crew’s yearlong journey', url: 'https://www.nasa.gov/missions/voyagers-of-mars-the-first-chapea-crews-yearlong-journey' },
  nbl: { title: 'NASA Johnson, Neutral Buoyancy Laboratory', url: 'https://www.nasa.gov/johnson/neutral-buoyancy-laboratory/' },
  argos: { title: 'NASA Technical Reports Server 20220009230 (ARGOS, reduced-gravity offload)', url: 'https://ntrs.nasa.gov/citations/20220009230' },
  nsrl: { title: 'Brookhaven National Laboratory, NASA Space Radiation Laboratory (archived)', url: 'https://webarchive.library.unt.edu/web/20130213222723/http://www.bnl.gov/medical/NASA/NSRL_description.asp' },
  neemo: { title: 'NASA, NEEMO studies', url: 'https://www.nasa.gov/missions/analog-field-testing/neemo/nasa-extreme-environment-mission-operations-neemo-studies' },
  aquarius: { title: 'Canadian Space Agency, Aquarius Underwater Laboratory', url: 'https://www.asc-csa.gc.ca/eng/missions/neemo/aquarius.asp' },
  envihab: { title: 'Frontiers in Physiology, conference abstract (2018) on NASA, ESA and DLR analog campaigns', url: 'https://www.frontiersin.org/10.3389%2Fconf.fphys.2018.26.00044/event_abstract' },
  hiseas: { title: 'HI-SEAS, About (archived)', url: 'https://web.archive.org/web/20260514053129/https://www.hi-seas.org/about-hi-seas' },
  mdrs: { title: 'National Geographic, Exploring Mars in Utah (MDRS)', url: 'https://www.nationalgeographic.com/science/article/exploring-mars-utah-mock-mission-simulation-space-science' },
  concordia: { title: 'ESA, Spaceship Concordia', url: 'https://www.esa.int/Science_Exploration/Human_and_Robotic_Exploration/Concordia/Spaceship_Concordia' },
  hmp: { title: 'Mars Institute, Haughton-Mars Project', url: 'https://www.marsinstitute.no/hmp' },
  arads: { title: 'NASA Astrobiology, NASA tests life detection drill in the Atacama Desert', url: 'https://astrobiology.nasa.gov/news/nasa-tests-life-detection-drill-in-the-atacama-desert/' },
  iceland: { title: 'NASA Science, Artemis II crew uses Iceland terrain for lunar training', url: 'https://science.nasa.gov/missions/artemis/nasas-artemis-ii-crew-uses-iceland-terrain-for-lunar-training/' },
  pisces: { title: 'NASA Technical Reports Server 20140008708 (ISRU analog tests on Mauna Kea)', url: 'https://ntrs.nasa.gov/citations/20140008708' },
};

export interface Analog { id: string; name: string; track: Track; place: string; bodies: ('moon' | 'mars')[]; fact: string; serves: Partial<Record<Factor, number>>; refs: string[] }
export const ANALOGS: Analog[] = [
  // Facilities: judged on target fidelity, human factors and infrastructure.
  { id: 'hera', name: 'HERA', track: 'facility', place: 'NASA Johnson Space Center, Houston', bodies: ['moon', 'mars'], refs: ['hera'],
    fact: 'A 650 square foot habitat for isolation and confinement studies; crews of four for 45 days.', serves: { human: .75, infra: 1 } },
  { id: 'chapea', name: 'CHAPEA', track: 'facility', place: 'NASA Johnson Space Center, Houston', bodies: ['mars'], refs: ['chapea'],
    fact: 'Mars Dune Alpha, a 1,700 square foot 3D-printed habitat; the first crew of four stayed 378 days with a communication delay of up to 22 minutes.', serves: { human: 1, infra: 1 } },
  { id: 'nbl', name: 'Neutral Buoyancy Laboratory', track: 'facility', place: 'NASA Johnson Space Center, Houston', bodies: ['moon', 'mars'], refs: ['nbl'],
    fact: 'A pool 202 by 102 by 40 feet holding 6.2 million gallons, used for spacewalk training.', serves: { fidelity: .5, infra: 1 } },
  { id: 'argos', name: 'ARGOS', track: 'facility', place: 'NASA Johnson Space Center, Houston', bodies: ['moon', 'mars'], refs: ['argos'],
    fact: 'An active gravity offload system that simulates reduced gravity, lunar and Martian included.', serves: { fidelity: .5, infra: 1 } },
  { id: 'nsrl', name: 'NASA Space Radiation Laboratory', track: 'facility', place: 'Brookhaven National Laboratory, New York', bodies: ['moon', 'mars'], refs: ['nsrl'],
    fact: 'Heavy-ion beams that mimic the cosmic rays of space, for radiation-risk studies.', serves: { fidelity: .5, infra: 1 } },
  { id: 'neemo', name: 'NEEMO (Aquarius)', track: 'facility', place: 'Off Key Largo, Florida, about 19 m down', bodies: ['moon', 'mars'], refs: ['neemo', 'aquarius'],
    fact: 'An undersea habitat; missions of 7 to 14 days, with weights and tethers to simulate tasks at different gravity levels.', serves: { fidelity: .25, human: .5, infra: .5 } },
  { id: 'envihab', name: ':envihab', track: 'facility', place: 'DLR, Cologne', bodies: ['moon', 'mars'], refs: ['envihab'],
    fact: 'DLR’s facility for bed-rest studies, used with NASA and ESA (a 60-day artificial-gravity bed-rest campaign was planned there).', serves: { fidelity: .25, human: .5, infra: .5 } },
  // Hybrids: a habitat on a field site, judged on both sets.
  { id: 'hiseas', name: 'HI-SEAS', track: 'hybrid', place: 'Mauna Loa, Hawaiʻi, about 8,200 ft', bodies: ['moon', 'mars'], refs: ['hiseas'],
    fact: 'A habitat on an isolated Mars- and Moon-like volcanic site; missions have run from four months to a year.', serves: { terrain: .5, climate: .25, ops: .5, human: 1, infra: .5 } },
  { id: 'mdrs', name: 'Mars Desert Research Station', track: 'hybrid', place: 'Near Hanksville, Utah', bodies: ['mars'], refs: ['mdrs'],
    fact: 'The Mars Society’s station in the Utah desert; crews typically stay about two weeks.', serves: { terrain: .75, climate: .5, ops: .5, human: .5, infra: .25 } },
  { id: 'concordia', name: 'Concordia', track: 'hybrid', place: 'Dome C, Antarctica, 3,200 m', bodies: ['moon', 'mars'], refs: ['concordia'],
    fact: 'Nothing can reach the station in winter; ESA sponsors a doctor each year to study how the crew adapts.', serves: { climate: 1, ops: 1, human: 1, infra: .5 } },
  // Field sites: judged on geology, climate, astrobiology, operations and logistics.
  { id: 'hmp', name: 'Haughton-Mars Project', track: 'field', place: 'Devon Island, Nunavut, Canada', bodies: ['moon', 'mars'], refs: ['hmp'],
    fact: 'Field research at Haughton, a 20 km impact crater in polar desert, led from NASA Ames.', serves: { terrain: 1, climate: .75, ops: .75, infra: .5 } },
  { id: 'atacama', name: 'Atacama (ARADS)', track: 'field', place: 'Hyperarid core, Atacama Desert, Chile', bodies: ['mars'], refs: ['arads'],
    fact: 'NASA Ames’s ARADS tested a rover, a drill and life-detection instruments here for a future search for life on Mars.', serves: { terrain: .75, climate: 1, astro: 1, ops: .5, infra: .5 } },
  { id: 'iceland', name: 'Iceland', track: 'field', place: 'Iceland', bodies: ['moon', 'mars'], refs: ['iceland'],
    fact: 'Apollo crews trained in geology here, and so did the Artemis II crew.', serves: { terrain: 1, climate: .5, ops: .5, infra: .5 } },
  { id: 'pisces', name: 'Mauna Kea (PISCES)', track: 'field', place: 'Mauna Kea, Hawaiʻi', bodies: ['moon'], refs: ['pisces'],
    fact: 'ISRU field tests in 2010 and 2012, coordinated by NORCAT with the Canadian Space Agency, DLR and NASA through PISCES, on fine volcanic tephra.', serves: { terrain: 1, climate: .25, ops: .75, infra: 1 } },
];

/** How much of a mission's 100 weight an existing analog stands in for, 0–100 (rounded). */
export function cover(a: Analog, purpose: unknown) {
  const P = profileOf(purpose);
  return Math.round(APPLIES[a.track].reduce((n, k) => n + P[k] * (a.serves[k] ?? 0), 0));
}
/** A mission needs a facility beside its field sites when it puts at least this much of its 100 weight on fidelity and crew factors. */
export const FACILITY_NEED = 25;
/**
 * The existing analogs to show for a mission on a world: field sites and hybrids, plus the single best facility only when the mission needs
 * one (facilityWeight ≥ FACILITY_NEED), all ranked together by cover; the first `n`.
 */
export function knownAnalogs(purpose: unknown, body: unknown, n = 3) {
  const all = bestAnalogs(purpose, body), need = facilityWeight(purpose) >= FACILITY_NEED;
  const fac = need ? all.find(x => x.a.track === 'facility') : undefined;
  return all.filter(x => x.a.track !== 'facility' || x === fac).slice(0, n);
}
/** The existing analogs for a mission on a world, best cover first (ties by name). */
export const bestAnalogs = (purpose: unknown, body: unknown) => ANALOGS.filter(a => (a.bodies as unknown[]).includes(body))
  .map(a => ({ a, cover: cover(a, purpose) })).sort((x, y) => y.cover - x.cover || x.a.name.localeCompare(y.a.name));
