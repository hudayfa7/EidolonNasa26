# Analog weights: design choices and sources

How Eidolon weighs an analog for a mission, why each weight is what it is, and where every fact comes from. Code:
`src/data/mission.ts` (tracks, profiles, mission fit), `src/data/analogs.ts` (existing analogs, sources), `src/ui/results.ts`
(`missionBlock`, `existingBlock`).

**Read this first.** No published source gives numeric weights for analog factors. The numbers below are the team's judgment. What the
sources support is *which* factors matter for *which* mission, and which analogs NASA and its partners use for what. Every weight is
explained against those sources, and every number is labelled as judgment in the app.

## Principle

An analog is judged against the use it is for, not as a whole: a site or facility is a good analog for some properties and a poor one for
others (Foucher et al. 2021, "functional analogues" [F1]). So the weights change with the mission, and a factor that does not apply to a
kind of analog is left out rather than scored zero.

## Tracks

| Track | Judged on | Examples |
| --- | --- | --- |
| Field site | Terrain form, climate, astrobiology, operations, infrastructure | The engine's Earth doubles; Haughton, the Atacama, Iceland, Mauna Kea |
| Facility | Gravity, pressure and radiation; crew; infrastructure | HERA, CHAPEA, the Neutral Buoyancy Laboratory, ARGOS, NSRL |
| Hybrid | Both sets | HI-SEAS, MDRS, Concordia |

Why gravity, pressure and radiation are not scored for field sites: all three are the same at every site on Earth's surface, so
they cannot rank one field site against another. They still carry weight in a mission's profile, because some missions need them, and only
facilities give them (reduced gravity: NBL [S3], ARGOS [S4]; space radiation: NSRL [S5]). When a mission puts much of its weight there, the
app says to pair a facility with a field site. NASA's Human Research Program uses analogs for four of the five spaceflight stressors it
names, radiation, altered gravity, and isolation and confinement among them [S8].

## Mission profiles (each row sums to 100)

| Mission | Terrain form | Climate | Astrobiology | Operations | Gravity, pressure and radiation | Crew | Infrastructure |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Rover mobility | 45 | 10 | 0 | 20 | 10 | 0 | 15 |
| Drilling and ISRU | 30 | 20 | 0 | 15 | 10 | 0 | 25 |
| EVA training | 25 | 10 | 0 | 15 | 25 | 10 | 15 |
| Habitat operations | 5 | 5 | 0 | 15 | 15 | 45 | 15 |
| Astrobiology | 15 | 25 | 35 | 10 | 0 | 0 | 15 |
| Thermal testing | 10 | 45 | 0 | 15 | 15 | 0 | 15 |
| Education and outreach | 40 | 0 | 0 | 30 | 0 | 0 | 30 |

Why each mission is weighted as it is:

- **Rover mobility.** Driving trials exercise the ground first: terrain leads. NASA's rover analog work happens at field sites, e.g. ARADS
  drove a rover and drill in the Atacama [S13]. Reduced gravity changes how wheels load the ground and no field site gives it, so gravity,
  pressure and radiation have a small weight (judgment; gravity-offload facilities exist but are indoor [S4]). Operations covers the
  weather window for field days.
- **Drilling and ISRU.** Regolith and terrain matter, and so do field logistics and a test site's instruments: the 2010 and 2012 ISRU tests
  ran on Mauna Kea's fine volcanic tephra through PISCES, a dedicated test site [S15]. Climate matters for drills and volatiles (temperature,
  moisture).
- **EVA training.** Two halves, both sourced: geology field training on Moon-like ground (Apollo and the Artemis II crew in Iceland [S14]), and
  reduced-gravity work in facilities (spacewalk training in the NBL [S3]; lunar and Martian gravity in ARGOS [S4]). So terrain and gravity,
  pressure and radiation carry equal weight; crew a little.
- **Habitat operations.** Long-duration living is a behavioural health question first. NASA studies it in isolated, confined and controlled
  habitats (HERA [S1], CHAPEA [S2]) and in isolated, confined and extreme places such as Antarctic stations; a 2025 NASA-authored review weighs
  both kinds [S16]. Crew leads; terrain and climate barely matter inside a habitat.
- **Astrobiology.** The search for life is the mission, so the biology baseline leads, then the environment that preserves or limits it
  (hyperaridity in the Atacama, where ARADS tested life detection [S13]). Gravity, pressure and radiation, and crew, carry nothing.
- **Thermal testing.** Climate leads. Gravity, pressure and radiation have some weight because vacuum and radiation change how heat
  moves, and only chambers give them (judgment; we have no source for a figure).
- **Education and outreach.** Look-alike terrain, easy access and cost.

## Scoring the engine's Earth doubles (field sites)

Only three factors have data today. Each is a 0 to 100 score:

| Factor | Score | Kind |
| --- | --- | --- |
| Terrain form | The engine's terrain score × 100 | Measured at 200 m; rock type is not in it |
| Climate | The climate fit: Match 100, Partial 50, Gap 0 (README, "How the climate fit works") | A judgment band |
| Operations | Share of the year's months under the mission's weather limits (NASA POWER climatology); for rover mobility, EVA training and drilling, mixed with the shadow fit below | Planning limits and a shadow comparison, both judgment |

**Shadow fit (inside Operations).** The site view's sun control draws shadows with a ray march over the elevation grid (`sunlit` in
`src/terrain/mesh.ts`). The same march, run on the target's 94 × 94 window at 200 m and on the Earth double's, gives each window's shadowed
share at sun heights of 1°, 2° and 4°, each averaged over eight compass directions (`src/terrain/shadowfit.ts`). The fit is 100 less the mean
difference between the two sets of shares, scaled so a difference of 0.25 scores 0. Low suns, because at 200 m spacing ordinary slopes block
only a grazing sun: at 10° both windows read 0.00 and the fit would always be 100 (we measured this on Jezero against a search-result cell:
0.30, 0.09, 0.01 against 0.22, 0.04, 0.00, a fit of 83). It counts for 40 of Operations for rover mobility and EVA training and 30 for drilling,
and nothing for the other missions (shadows hide hazards from a rover's cameras and a crew's eyes and decide solar power; judgment, no source
gives the share). It overlaps relief and slope, which the terrain match already has; it is scored only where both windows are real elevation;
and the Moon's south pole, where illumination matters most, has no elevation here. No published method was used: this is our own judgment.

Astrobiology and infrastructure are "not assessed". Gravity, pressure and radiation, and crew, are N/A for a field site. Neither counts
as zero: the score is the weighted mean over what is scored. A tier (A 70+, B 55+, C 40+, D 25+, F below) is given only when a field site
can be judged on at least 50 of the mission's 100 weight and half of that is assessed. Safety and permitting, a pass/fail gate in a full
method, are not assessed, so every tier is provisional.

## Existing analogs

The app lists the three existing analogs that stand in for the most of a mission's weight, under the engine's Earth doubles. An analog's
cover = the sum, over the factors its track is judged on, of the mission's weight times how fully the analog reproduces that factor (0 to 1).
Those strengths are our judgment from the facts below.

| Analog | Track | World | Fact (source) | Strengths (judgment) |
| --- | --- | --- | --- | --- |
| HERA | Facility | Moon, Mars | 650 sq ft habitat at NASA Johnson for isolation and confinement; crews of four, 45 days [S1] | crew 0.75 (45 days), infrastructure 1 |
| CHAPEA | Facility | Mars | Mars Dune Alpha, 1,700 sq ft, 3D-printed; first crew of four stayed 378 days, June 2023 to July 2024, with a communication delay of up to 22 min [S2] | crew 1 (a year), infrastructure 1 |
| Neutral Buoyancy Laboratory | Facility | Moon, Mars | 202 × 102 × 40 ft, 6.2 million gallons; spacewalk training [S3] | gravity, pressure and radiation 0.5 (gravity only), infrastructure 1 |
| ARGOS | Facility | Moon, Mars | Active gravity offload; reduced gravity from Earth's to microgravity, lunar and Martian included [S4] | gravity, pressure and radiation 0.5 (gravity only), infrastructure 1 |
| NSRL | Facility | Moon, Mars | Heavy-ion beams that mimic cosmic rays, at Brookhaven [S5] | gravity, pressure and radiation 0.5 (radiation only), infrastructure 1 |
| NEEMO (Aquarius) | Facility | Moon, Mars | Undersea habitat about 19 m down, 5.6 km off Key Largo; missions of 7 to 14 days; weights and tethers simulate gravity levels [S6][S7] | gravity, pressure and radiation 0.25, crew 0.5, infrastructure 0.5 |
| :envihab | Facility | Moon, Mars | DLR bed-rest facility; a 60-day artificial-gravity bed-rest campaign with NASA and ESA was planned there [S8] | gravity, pressure and radiation 0.25, crew 0.5, infrastructure 0.5 |
| HI-SEAS | Hybrid | Moon, Mars | Habitat at about 8,200 ft on Mauna Loa on a Mars- and Moon-like site; missions of four months to a year [S9] | terrain 0.5, climate 0.25, operations 0.5, crew 1, infrastructure 0.5 |
| MDRS | Hybrid | Mars | The Mars Society's station near Hanksville, Utah; crews typically two weeks [S10] | terrain 0.75, climate 0.5, operations 0.5, crew 0.5, infrastructure 0.25 |
| Concordia | Hybrid | Moon, Mars | Dome C, 3,200 m; unreachable in winter; ESA sponsors a doctor each year to study crew adaptation [S11] | climate 1, operations 1, crew 1, infrastructure 0.5 |
| Haughton-Mars Project | Field | Moon, Mars | Haughton, a 20 km impact crater in polar desert on Devon Island; led from NASA Ames [S12] | terrain 1, climate 0.75, operations 0.75, infrastructure 0.5 |
| Atacama (ARADS) | Field | Mars | NASA Ames's ARADS tested a rover, a drill and life detection in the hyperarid core [S13] | terrain 0.75, climate 1, astrobiology 1, operations 0.5, infrastructure 0.5 |
| Iceland | Field | Moon, Mars | Apollo geology training; the Artemis II crew trained there [S14] | terrain 1, climate 0.5, operations 0.5, infrastructure 0.5 |
| Mauna Kea (PISCES) | Field | Moon | 2010 and 2012 ISRU tests, coordinated by NORCAT with CSA, DLR and NASA through PISCES, on fine volcanic tephra [S15] | terrain 1, climate 0.25, operations 0.75, infrastructure 1 |

Checks in `src/data/mission.test.ts`: the best existing analog is the Atacama for astrobiology on Mars, Concordia for habitation, PISCES
for ISRU on the Moon and Haughton for rover mobility on Mars.

### Left out, or to check

- **Not in the app, no source found yet:** parabolic flight, altitude chambers, Kraken, MMEA (the HERA-to-CHAPEA mission), and the VaPER
  bed-rest result. They are in the team's notes; add each with a source before it goes in.
- **Discrepancies between sources:** Haughton's age is given as about 23 million years by the Mars Institute but about 39 million by other
  sources, so the app gives no age. NEEMO's distance off Key Largo is 5.4 miles in the team's notes but 5.6 km (about 3.5 miles) in the
  CSA's page, so the app gives the CSA's figure. HI-SEAS's elevation is about 8,200 ft on its own site and 8,000 ft on a NASA page.
  Aquarius is now run by Florida International University (from 2013 or 2014, sources differ), not stated in the app.
- **McMurdo Dry Valleys** stays among Eidolon's 14 established sites but is not in this catalogue: its use for NASA life-detection tests was
  not confirmed in our search.

## Sources

- [F1] Foucher, F. et al. (2021). Definition and use of functional analogues in planetary exploration. *Planetary and Space Science*.
  https://kar.kent.ac.uk/109579/
- [S1] NASA, Human Exploration Research Analog (HERA). https://www.nasa.gov/analogs/hera
- [S2] NASA, Voyagers of Mars: the first CHAPEA crew's yearlong journey. https://www.nasa.gov/missions/voyagers-of-mars-the-first-chapea-crews-yearlong-journey
- [S3] NASA Johnson, Neutral Buoyancy Laboratory. https://www.nasa.gov/johnson/neutral-buoyancy-laboratory/ (fact sheet:
  https://www.nasa.gov/centers/johnson/pdf/736186main_FS-2013-NBL_WEB.pdf)
- [S4] NASA Technical Reports Server 20220009230 (ARGOS). https://ntrs.nasa.gov/citations/20220009230
- [S5] Brookhaven National Laboratory, NASA Space Radiation Laboratory (archived).
  https://webarchive.library.unt.edu/web/20130213222723/http://www.bnl.gov/medical/NASA/NSRL_description.asp
- [S6] NASA, NEEMO studies. https://www.nasa.gov/missions/analog-field-testing/neemo/nasa-extreme-environment-mission-operations-neemo-studies
- [S7] Canadian Space Agency, Aquarius Underwater Laboratory. https://www.asc-csa.gc.ca/eng/missions/neemo/aquarius.asp
- [S8] Frontiers in Physiology, conference abstract (2018), NASA, ESA and DLR analog campaigns.
  https://www.frontiersin.org/10.3389%2Fconf.fphys.2018.26.00044/event_abstract
- [S9] HI-SEAS, About. https://www.hi-seas.org/about-hi-seas
- [S10] National Geographic, Exploring Mars in Utah. https://www.nationalgeographic.com/science/article/exploring-mars-utah-mock-mission-simulation-space-science
- [S11] ESA, Spaceship Concordia. https://www.esa.int/Science_Exploration/Human_and_Robotic_Exploration/Concordia/Spaceship_Concordia
- [S12] Mars Institute, Haughton-Mars Project. https://www.marsinstitute.no/hmp
- [S13] NASA Astrobiology, NASA tests life detection drill in the Atacama Desert. https://astrobiology.nasa.gov/news/nasa-tests-life-detection-drill-in-the-atacama-desert/
- [S14] NASA Science, Artemis II crew uses Iceland terrain for lunar training. https://science.nasa.gov/missions/artemis/nasas-artemis-ii-crew-uses-iceland-terrain-for-lunar-training/
- [S15] NASA Technical Reports Server 20140008708 (ISRU analog tests on Mauna Kea). https://ntrs.nasa.gov/citations/20140008708
- [S16] Rahill, Mulavara, Gore and Whitmire (2025). Increasing fidelity in lunar and martian analogs for behavioral health and
  performance research. *Frontiers in Space Technologies*. https://www.frontiersin.org/journals/space-technologies/articles/10.3389/frspt.2025.1505823/full
