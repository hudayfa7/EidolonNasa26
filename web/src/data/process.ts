// What kind of process commonly sits behind a landform of each IAU descriptor type (the brief: "think about processes as well as
// places"). The IAU's descriptors name a landform's form, not its origin, so each line is hedged ("commonly") and shown as inferred from the
// descriptor: a pointer for where to look, never a finding about the site. The keys are the engine's `target.type` (spec §3: Crater, Vallis,
// Dorsum, …), compared in lower case.
const PROCESS: Record<string, string> = {
  crater: 'a bowl, commonly formed by impact; some are volcanic calderas',
  mons: 'a mountain, commonly volcanic; some are uplifted by faulting or impact',
  patera: 'an irregular crater, commonly a volcanic caldera',
  tholus: 'a small hill, commonly a volcanic dome or cone',
  vallis: 'a valley, commonly cut by flowing water or lava, or by faulting',
  dorsum: 'a ridge, commonly from compression of the crust or a lava flow',
  rima: 'a narrow channel, commonly a lava channel or a fault trough',
  cavus: 'irregular hollows, commonly from collapse or the loss of ice',
  chaos: 'broken terrain, commonly from collapse as ground ice or water is lost',
  mensa: 'a flat-topped mesa, commonly left by erosion',
  fossa: 'a long trough, commonly from faulting',
  catena: 'a chain of pits or craters, commonly impact or collapse',
  rupes: 'a scarp, commonly from faulting',
  promontorium: 'a headland of high ground at the edge of a plain',
};
/** The process line for an IAU descriptor type, or undefined for one not listed (or not a string). Never a prototype key. */
export const processOf = (type: unknown) => typeof type === 'string' && Object.hasOwn(PROCESS, type.toLowerCase()) ? PROCESS[type.toLowerCase()] : undefined;
