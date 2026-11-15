# Credits and data sources

Every asset or dataset in this repo that comes from outside the team, with its source, licence and credit line. The
real maps, elevation and crops are made by `npm run fetch:real` (`scripts/fetch-real-data.mjs`) from the sources below;
downloads are cached in `.cache/real-data/` (not in git). In the app: the info sheet's Data column and the title
footer name the sources; the site panel prints the terrain's and the images' credit lines under the orbital crops; the
terrain view's note names the elevation model; the site selector grid's foot credits the elevation models its
hillshades are drawn from; the surface photograph's credit line ("Surface: …") sits under the strip, its name linking
the photograph's page in NASA's Image and Video Library, and the info sheet's Data column lists the photographs; each
Beyond card's image has its mission (linking its library page) and credit on a line under it.

## Globes (`public/textures/`)

| Asset | Source | Licence | Credit |
| --- | --- | --- | --- |
| `mars.jpg` (4096 × 2048) | Viking MDIM 2.1 colourised global mosaic, 256 px/° (USGS Astrogeology map server COG `wms_basemaps/Mars/MDIM21_AMESColor/MDIM21_AMES_recolor_dd360_jpeg_cog.tif`, overview 5760 × 2880), https://asc-pds-services.s3.us-west-2.amazonaws.com/ , for the detail (each channel over its own ~0.5° blur), over the albedo of the MGS TES Albedo Global Mosaic, 7,410 m (USGS Astrogeology, `mosaic/Mars_MGS_TES_Albedo_mosaic_global_7410m.tif`, same host; the same ~0.5° blur, through each channel's straight-line fit to MDIM's blurred colour) within 60° of the equator, which drops Viking's frost and haze (Hellas, Elysium–Cerberus); tones matched to the prototype map's blurred percentiles within 60° (the design system's orange Mars); past 60–70° (the caps) MDIM alone, matched per channel to the prototype map's mean and spread | Public domain (NASA/USGS) | NASA/JPL Viking Orbiters, USGS Astrogeology Science Center (MDIM 2.1), colour by NASA Ames Research Center; NASA/JPL/Arizona State University, MGS Thermal Emission Spectrometer (Christensen, P.R. et al. (2001), JGR 106, 23823–23871), USGS Astrogeology (mosaic) |
| `mars_bump.jpg` (2048 × 1024) | MGS MOLA MEGDR 128/64 px/° merge (USGS map server COG `wms_basemaps/Mars/MOLA/mola128_mola64_merge_90Nto90S_SimpleC_clon0_cog.tif`), area-averaged; grey 0–255 = −8,500 to 21,500 m | Public domain (NASA) | NASA/GSFC MOLA Science Team; USGS Astrogeology |
| `moon.jpg` (4096 × 2048) | LROC WAC global morphologic mosaic v1.3, 16 px/° (PDS `LROLRC_2001/DATA/BDR/WAC_GLOBAL/WAC_GLOBAL_E000N0000_016P.IMG`), https://pds.lroc.asu.edu/ , for the detail (the mosaic over its own ~0.5° blur), times the albedo of the Clementine UVVIS 750 nm global mosaic v2 (USGS Astrogeology map server, `wms_basemaps/Moon/Clem_UVVIS_Mosaic_Global_256ppd_v02.tif.ovr`, overview 3, 16 px/°, the same ~0.5° blur), https://asc-pds-services.s3.us-west-2.amazonaws.com/ ; WAC alone past 60–70° of latitude; tones matched to the prototype map's percentiles within 60° of the equator, with its slight warm tint. The WAC mosaic's straight seams at ±90° longitude from about 60° S to the pole stay (they are in the source; the polar cap of the Rendering "Poles" row replaces that part) | Public domain (NASA PDS; USGS) | NASA/GSFC/Arizona State University (LROC WAC); NASA and the US Department of Defense (Clementine), USGS Astrogeology Science Center (mosaic) |
| `moon_cap.jpg`, `moon_cap_normal.jpg` (1024 × 1024 each; the Moon globe's south polar cap, Rendering "Poles") | South polar stereographic to 75° S (`src/coords.ts` `llToCap`), made by `npm run fetch:real -- --only=cap`: the colour from the LROC WAC south polar mosaic, 64 px/° (PDS `WAC_GLOBAL_P900S0000_064P.IMG`), its grey levels matched by percentile to `moon.jpg`'s between 75.5° and 78° S; the normal map is the slope (m/m) of LRO LOLA LDEM_75S_240M (PDS Geosciences Node, `lola_gdr/polar/float_img/ldem_75s_240m_float.img`; LDEM_16 past its 75° S edge) along the cap's two axes. The WAC mosaic's own quadrant seams show in the cap (they are in the source) | Public domain (NASA PDS) | NASA/GSFC/Arizona State University (LROC WAC); NASA/GSFC LOLA Science Team |
| `moon_bump.jpg` (2048 × 1024) | LRO LOLA LDEM_16 (PDS Geosciences Node, `lola_gdr/cylindrical/img/ldem_16.img`), https://pds-geosciences.wustl.edu/ ; grey 0–255 = −9,500 to 11,000 m | Public domain (NASA PDS) | NASA/GSFC LOLA Science Team |
| `earth_day.jpg` (4096 × 2048) | Blue Marble: Next Generation with shaded relief and bathymetry, NASA GIBS WMS layer `BlueMarble_ShadedRelief_Bathymetry` (EPSG:4326), https://gibs.earthdata.nasa.gov/ | Public domain (NASA) | NASA Earth Observatory (Reto Stöckli; relief and bathymetry from SRTM30 and GEBCO), served by NASA GIBS |
| `earth_night.jpg` (2048 × 1024) | Black Marble 2016, NASA GIBS WMS layer `VIIRS_Black_Marble`, time 2016-01-01 | Public domain (NASA) | NASA Earth Observatory / NASA GSFC, Suomi NPP VIIRS; served by NASA GIBS |
| `earth_clouds.jpg` (2048 × 1024, grey; Earth's clouds on the title only) | Blue Marble: Clouds (NASA Visible Earth image record 57747, its 2K `cloud_combined_2048.jpg`; Visible Earth's pages now redirect to NASA Earth Observatory, the file is still served), https://eoimages.gsfc.nasa.gov/images/imagerecords/57000/57747/cloud_combined_2048.jpg , one channel, made by `npm run fetch:real -- --only=clouds`; from 180° W as `earth_day.jpg` | Public domain (NASA) | NASA Goddard Space Flight Center image by Reto Stöckli (Blue Marble, 2002; clouds from MODIS, with the MODIS Atmosphere Group and Science Data Support Team); in the app, the info sheet's Data column ("Blue Marble clouds") |
| `earth_spec.jpg` (1024 × 512) | MODIS water mask (MOD44W), NASA GIBS WMS layer `MODIS_Water_Mask`; water white | Public domain (NASA) | NASA LP DAAC, MODIS; served by NASA GIBS |
| `earth_bump.jpg` (2048 × 1024) | ETOPO1 Ice Surface, NOAA NCEI map service export (`DEM_mosaics/ETOPO1_ice_surface/ImageServer`), https://gis.ngdc.noaa.gov/ ; grey 0–255 = 0 to 8,800 m, the sea at 0 | Public domain (US Government, NOAA) | Amante, C. and B.W. Eakins (2009), ETOPO1 1 Arc-Minute Global Relief Model, NOAA Technical Memorandum NESDIS NGDC-24, doi:10.7289/V5C8276M |
| `lo/mars.jpg`, `lo/moon.jpg`, `lo/earth_day.jpg` (1024 × 512 each) | The low tier the app starts on (Progressive textures): each made by `npm run fetch:real -- --only=globes` from the 4K map of the same name above, downsampled (Lanczos), nothing else changed | As the 4K map's | As the 4K map's |
| `mid/mars.jpg`, `mid/moon.jpg`, `mid/earth_day.jpg` (2048 × 1024 each) | The 2K tier phones load as their full map (Should: the lighter phone path): each made by `npm run fetch:real -- --only=globes` from the 4K map of the same name above, downsampled (Lanczos), nothing else changed | As the map's | As the map's |
| `mars_normal.jpg`, `moon_normal.jpg` (2048 × 1024), `earth_normal.jpg` (1024 × 512) | The globes' relief (Should: Planet surface): slopes east and north baked from the same DEMs as the bump maps above at full precision (MOLA, LDEM_16, ETOPO1 with the sea at 0), made by `npm run fetch:real -- --only=normals`: R and G = sign · √(\|slope\| / 0.5), B unused | As the DEM's: public domain (NASA; NOAA) | NASA/GSFC MOLA Science Team; NASA/GSFC LOLA Science Team; NOAA NCEI (Amante and Eakins 2009) |

## Site terrain and images (`public/sites/`)

`patches/` holds 16-bit elevation patches, a file each (loaded when a view first reads it), listed in `manifest.json`: each featured site on the demo path (Jezero,
Gale, Arcadia, Utopia, Meridiani, Elysium, Hadley–Apennine, Taurus–Littrow and the four south-pole regions) over its own extent and over its compare window (18.8 km, at the
IAU centre for named targets), the engine's coordinates example (a Mars pin by Gale), the 14 established Earth analog
sites (own extent and compare window), every Earth cell the mock hands out (the engine examples' 15 and the mock's
four), the engine's top five Earth cells for the demo's searches (`DEMO_CELLS` in `src/data/real-sites.ts`, read from
the live engine on 2026-11-14), and the lunar south polar cap to 80° S at 1 km (pins there; credited "resampled to 1 km"). The four south-pole
sites' own patches reach one compare window (18.8 km) past their extent at the site's spacing, so a pin near them
stays on the 240 m DEM; the other eight featured sites each have one more, over their extent plus a pin's terrain (80 km
on Mars, 60 on the Moon) at a pin's spacing, so every pin on them has real terrain. Each is resampled into the app's local azimuthal-equidistant projection, averaging several
source pixels per sample.

| Data | Source | Licence | Credit |
| --- | --- | --- | --- |
| Mars elevation | Mars MGS MOLA – MEX HRSC Blended DEM Global 200 m v2, https://asc-pds-services.s3.us-west-2.amazonaws.com/mosaic/Mars/HRSC_MOLA_Blend/Mars_HRSC_MOLA_BlendDEM_Global_200mp_v2.tif (the engine's own source) | Public domain (USGS) | NASA PDS, MOLA Science Team; ESA/DLR/FU Berlin (HRSC); USGS Astrogeology. Fergason, R.L., Hare, T.M. and Laura, J. (2018), HRSC and MOLA Blended Digital Elevation Model at 200 m v2, USGS Astrogeology Science Center |
| Moon elevation, within 60° | SLDEM2015, LOLA and SELENE Kaguya TC merge, 512 px/° (59 m), https://asc-pds-services.s3.us-west-2.amazonaws.com/mosaic/LolaKaguya_Topo/Lunar_LRO_LOLAKaguya_DEMmerge_60N60S_512ppd.tif (the engine's own source) | Public domain (NASA PDS / USGS) | NASA GSFC; JAXA SELENE Terrain Camera. Barker, M.K. et al. (2016), Icarus 273, 346–355 |
| Moon elevation, south pole | LRO LOLA LDEM_75S_240M polar stereographic (PDS Geosciences Node, `lola_gdr/polar/float_img/ldem_75s_240m_float.img`) | Public domain (NASA PDS) | NASA/GSFC LOLA Science Team |
| Earth elevation | Copernicus DEM GLO-30, 1° COG tiles, https://copernicus-dem-30m.s3.amazonaws.com/ (Registry of Open Data on AWS; the engine's own source) | Copernicus DEM licence: free use with attribution | © DLR e.V. 2010–2014 and © Airbus Defence and Space GmbH 2014–2018 provided under COPERNICUS by the European Union and ESA; all rights reserved |
| `crops/mars-*.jpg` (Jezero, Gale, Arcadia, Utopia, Meridiani, Elysium: context and regional) | Viking MDIM 2.1 colourised mosaic COG (as `mars.jpg`), at the overview nearest the crop's scale, same colour match | Public domain | NASA/JPL, USGS Astrogeology, NASA Ames |
| `crops/moon-{hadley,taurus}-*.jpg` | LROC WAC global morphologic mosaic, 64 px/° (`WAC_GLOBAL_E000N0000_064P.IMG`), same stretch as `moon.jpg` | Public domain (NASA PDS) | NASA/GSFC/Arizona State University |
| `crops/moon-{malapert,haworth,nobile,degerlache}-*.jpg` | LROC WAC south polar mosaic, 64 px/° (`WAC_GLOBAL_P900S0000_064P.IMG`); its own tone curve: black stays black, the mosaic's 99th percentile white, gamma 0.7 between | Public domain (NASA PDS) | NASA/GSFC/Arizona State University |
| `crops/earth-*.jpg` (context and regional: the 14 established Earth sites, and the mock's 19 Earth cells plus the demo's engine cells, `earth-cell-*`, at their compare window's 225.6 and 65.8 km, which the booking listing's strip shows) | Landsat WELD true-colour annual composite, 1999 (NASA GIBS WMS layer `Landsat_WELD_CorrectedReflectance_TrueColor_Global_Annual`, time 1999-12-01; 2000's has dark scene stripes over Atacama and Holuhraun), over each crop's lat/lon box at about one pixel per sample. Specks of gap (under 1 %) filled from Blue Marble Next Generation (GIBS `BlueMarble_NextGeneration`, 500 m); a crop with more gap (open sea at Atacama's and Lanzarote's, all of Svalbard's and the Dry Valleys') is Blue Marble's | Public domain (Landsat: USGS/NASA; WELD: NASA MEaSUREs, no restrictions; Blue Marble: NASA) | NASA/USGS Landsat; Web-Enabled Landsat Data (WELD), South Dakota State University (Roy, D.P. et al.); NASA Earth Observatory (Blue Marble); served by NASA GIBS |
| `crops/*-{ext}.jpg`, the drapes (26: the twelve featured sites and the 14 established Earth sites, 360 × 360 over exactly the site view's block; `npm run fetch:real -- --only=drape`) | As each body's crops above: Viking MDIM 2.1 (Mars), LROC WAC 64 px/° and its south polar mosaic (Moon), Landsat WELD 1999 with Blue Marble filling its gaps (Earth; Svalbard's, the Dry Valleys' and Lanzarote's are Blue Marble's, 500 m) | As the crops' | As the crops'; in the app, the terrain note adds "Image: <source>" while the image is draped |

Crops for every other site (pins, Earth cells past the mock's 19, the featured sites off the demo path) are still cut
in the browser from the globe's map, credited under it.

## Surface photographs (`public/photos/`)

One square crop per photo, 320 × 320 JPEG (9–32 KB each, 420 KB in all), made by `npm run fetch:real -- --only=photos`
from `src/data/photos.ts` (each photo's NASA id, crop, credit and alt text) out of NASA's Image and Video Library,
https://images.nasa.gov/details/<id> (assets from https://images-assets.nasa.gov/, the largest web size, else the
original; cached in `.cache/real-data/`). Shown lazily in the surface slot of the site panel and the booking listing; an
Earth cell inside an established site shows that site's, a pin or named target whose 18.8 km window (±9.4 km) holds a
landing's `at` that landing's, else one inside a featured site's square that site's.

Licence for all: NASA imagery is not protected by copyright in the United States (NASA Images and Media Usage
Guidelines, https://www.nasa.gov/nasa-brand-center/images-and-media/ : free to use with credit, no NASA endorsement
implied); images from JPL (`PIA…`, NASA/JPL-Caltech and partners) may be used for any purpose with credit under JPL's
image use policy, https://www.jpl.nasa.gov/jpl-image-use-policy/ .

| File | Source (NASA id) | Credit |
| --- | --- | --- |
| `mars-jezero.jpg` | PIA24546, Mastcam-Z views Santa Cruz on Mars (Perseverance, sol 68, 29 April 2021; natural colour) | NASA/JPL-Caltech/ASU/MSSS |
| `mars-gale.jpg` | PIA19083, Mount Sharp buttes and layers from near Darwin (Curiosity Mastcam, 7 September 2013) | NASA/JPL-Caltech/MSSS |
| `mars-meridiani.jpg` | PIA05162, Opportunity rocks again! (Opportunity Pancam, the Eagle crater outcrop, January 2004) | NASA/JPL/Cornell |
| `mars-elysium.jpg` | PIA22876, InSight's first selfie (Instrument Deployment Camera, sol 10, 6 December 2018) | NASA/JPL-Caltech |
| `moon-hadley.jpg` | AS15-86-11603, James Irwin at the Lunar Roving Vehicle, Mount Hadley behind (31 July 1971) | NASA; photograph by David Scott |
| `moon-taurus.jpg` | AS17-140-21497, Harrison Schmitt at the split boulder, Station 6 (13 December 1972) | NASA; photograph by Eugene Cernan |
| `moon-apollo11.jpg` | AS11-40-5875 (library id as11-40-5875), Buzz Aldrin beside the deployed flag, Tranquility Base (20 July 1969); `at` 0.6741° N, 23.4730° E (LROC) | NASA; photograph by Neil Armstrong |
| `moon-apollo12.jpg` | AS12-48-7134, Pete Conrad at Surveyor 3, the Apollo 12 lunar module behind (20 November 1969; the library's title names Bean, its caption and the frame Conrad); `at` 3.0124° S, 23.4216° W (LROC) | NASA; photograph by Alan Bean |
| `moon-apollo14.jpg` | AS14-66-9232 (library id as14_66_09232), Alan Shepard at the flag, Fra Mauro (5 February 1971); `at` 3.6453° S, 17.4714° W (LROC) | NASA; photograph by Edgar Mitchell |
| `moon-apollo16.jpg` | AS16-113-18339, John Young's jump salute at the Descartes landing site (21 April 1972; the library's date reads 1971); `at` 8.9730° S, 15.5002° E (LROC) | NASA; photograph by Charles Duke |
| `mars-viking1.jpg` | PIA00563, first colour image from Viking Lander 1 (Chryse Planitia, 21 July 1976); `at` 22.27° N, 312.05° E | NASA/JPL |
| `mars-viking2.jpg` | PIA00568, first colour image of the Viking Lander 2 site (Utopia Planitia, September 1976); `at` 47.64° N, 134.29° E (225.71° W in the old west-positive system) | NASA/JPL |
| `mars-pathfinder.jpg` | PIA04318, Sojourner sits near "Rock Garden" (Imager for Mars Pathfinder, Ares Vallis, 1997; black and white); `at` 19.13° N, 326.78° E | NASA/JPL-Caltech |
| `mars-phoenix.jpg` | PIA10713, colour view to the north-west of Phoenix (Surface Stereo Imager, sol 2, 27 May 2008; approximate colour); `at` 68.22° N, 234.25° E | NASA/JPL-Caltech/University of Arizona/Texas A&M University |
| `mars-spirit.jpg` | PIA17760, Spirit's view southward from Husband Hill (Pancam, October 2005, about 3 km from its landing); `at` the landing, 14.5684° S, 175.4726° E | NASA/JPL-Caltech/Cornell Univ. |
| `mars-endeavour.jpg` | PIA15684, late afternoon shadows at Endeavour crater (Opportunity Pancam from Greeley Haven on Cape York, sol 2,888, 9 March 2012; false colour); `at` the crater it looks across, its IAU centre 2.2836° S, 354.8045° E | NASA/JPL-Caltech/Cornell/Arizona State Univ. |
| `earth-salda.jpg` | PIA24375, Lake Salda beach (the eastern shore) | NASA/JPL-Caltech |
| `earth-pilbara.jpg` | PIA23551, researching outback stromatolites (Mars 2020 and ExoMars scientists in the Pilbara, 19 August 2019; cut to the outcrop they study) | NASA/JPL-Caltech |
| `earth-haughton.jpg` | ARC-2007-ACD07-0170-005, K-10 rovers surveying Haughton Crater (Haughton-Mars Project, July 2007) | NASA; photograph by Matt Deans |
| `earth-holuhraun.jpg` | jsc2024e055198, the Holuhraun lava field from Bárðarbunga (Artemis II crew geology training, 2024) | NASA; photograph by Robert Markowitz, NASA JSC |
| `earth-deathvalley.jpg` | PIA26676, research drone flies over Mars Hill, Death Valley National Park (September 2025) | NASA/JPL-Caltech |
| `earth-dryvalleys.jpg` | ARC-1996-AC94-0206, Chris McKay deploying an environmental monitoring station in colonised sandstone, Dry Valleys | NASA Ames Research Center |
| `earth-atacama.jpg` | PIA16191, dry streambed on alluvial fan in northern Chile (the Atacama Desert; JPL Photojournal, 27 September 2012) | NASA/UC Berkeley |
| `earth-maunakea.jpg` | PIA22219, rock stripe pattern on Hawaii's Mauna Kea (stone stripes on a cinder cone at about 4,100 m, 1999; JPL Photojournal, 15 February 2018) | Washington University in St. Louis/NASA; photograph by R. E. Arvidson |

Searched in NASA's library (images.nasa.gov, which carries JPL's Photojournal) on 2026-10-21, by each site's name and
its field projects: no ground photograph of the other featured sites (Arcadia Planitia; Utopia Planitia, where Viking 2
landed about 680 km from the site shown and Zhurong about 1,300 km; the four south-pole regions) or of six established
Earth sites (Bockfjorden, Lanzarote, Río Tinto, Hanksville, Dallol, Meteor Crater); their slot says so (an Earth site:
"No NASA field photograph of this site."). Other openly licensed photos exist for some, left out to keep one source and licence across
the set: ESA's PANGAEA photos of Lanzarote (CC BY-SA); PIA24048, a RIMFAX radar test on a Svalbard glacier (credited
FFI), shows neither Bockfjorden nor its springs. Apollo 15's crew trained at the Cinder Lake crater field (S70-53300),
not Meteor Crater.

## Beyond's spacecraft images (`public/textures/venus.jpg`, `mercury.jpg`, `callisto.jpg`, `titan.jpg`)

One image per Beyond card, 320 × 180 grey JPEG (4–9 KB each, 26 KB in all; they replace the prototype's embedded Venus
and Mercury placeholders, whose provenance was never recorded), made by `npm run fetch:real -- --only=beyond` from
`src/data/photos.ts` `BEYOND` (each image's NASA id, crop, ink, caption and alt text) out of NASA's Image and Video
Library, https://images.nasa.gov/details/<id> (the largest web size, else the original): cut 16:9 around the world,
grey, local contrast lifted (CLAHE) and the world's tones stretched. The page draws each in dots (`src/views/beyond.ts`,
the footer carousel's ordered dither) in the world's own ink. In the app: a caption line under each image, its mission
linking the library page and its credit beside it; the info sheet's Data column lists them. Licence as the surface
photographs above (NASA imagery, and JPL's image use policy for the `PIA…` images, which all four are).

| File | Source (NASA id) | Credit (shown as) |
| --- | --- | --- |
| `venus.jpg` | PIA23791, Venus from Mariner 10 (February 1974, reprocessed 2020; the contrast-enhanced version, the right of the two on the page) | NASA/JPL-Caltech |
| `mercury.jpg` | PIA16853, Colors of the Innermost Planet: View 1 (MESSENGER MDIS enhanced-colour global mosaic, released 18 February 2013) | NASA/Johns Hopkins University Applied Physics Laboratory/Carnegie Institution of Washington (NASA/JHUAPL/CIW) |
| `callisto.jpg` | PIA03456, Global Callisto in Color (Galileo, released 22 August 2001) | NASA/JPL/DLR |
| `titan.jpg` | PIA20016, Peering Through Titan Haze (Cassini VIMS near-infrared composite, T-114 flyby, 13 November 2015) | NASA/JPL/University of Arizona/University of Idaho (NASA/JPL/U. Arizona/U. Idaho) |

Chosen from NASA's library on 2026-10-21 for a whole disc that keeps its features at about 100 dots across: Mariner 10
over Galileo's 1990 violet image (PIA00072, a narrow gibbous that dithers to an oval) and Magellan's radar globe (the
surface, not the clouds the card is about); MESSENGER's colour mosaic over its plain global mosaic (PIA15160, too even
in grey); Cassini's infrared view, which sees the dunes through the haze, over its visible-light views (PIA14602, a
featureless orange ball) and its 938 nm view of the northern seas (PIA21615, the seas too small to survive the dots).
Akatsuki's Venus images are JAXA's, under its terms, not NASA's (plan): not used.

## Weather (fetched in the browser, nothing stored)

The weather window (`src/data/weather.ts`) asks both feeds from the viewer's browser for the place on screen; nothing is
downloaded into the repo or the build. In the app: "Forecast: Open-Meteo.com (CC BY 4.0)." under the days, the name
linking https://open-meteo.com/ and the licence https://creativecommons.org/licenses/by/4.0/, and the best months' line
naming NASA POWER and the NASA Langley Research Center; the info sheet's Data column lists both. NASA POWER's skin
temperature (`TS`, `TS_MIN`, `TS_MAX`, climatology 2001 to 2025) is also asked for each Earth result in the result detail's
"Surface temperature" block, from the same endpoint and under the same credit.

| Data | Source | Licence | Credit |
| --- | --- | --- | --- |
| Daily forecast, 16 days (strongest wind at 10 m, rain, high and low) | Open-Meteo Forecast API, https://api.open-meteo.com/v1/forecast (no key; `wind_speed_10m_max`, `precipitation_sum`, `temperature_2m_max`, `temperature_2m_min`, `timezone=auto`) | CC BY 4.0 (data); the free API is for non-commercial use | Weather data by Open-Meteo.com, https://open-meteo.com/ |
| Monthly climatology (mean temperature and daily range, rain, wind) | NASA POWER Climatology API, https://power.larc.nasa.gov/api/temporal/climatology/point (`T2M`, `T2M_RANGE`, `PRECTOTCORR`, `WS10M`; MERRA-2 based, the API's current 25-year period) | Public domain (NASA); acknowledgement requested | These data were obtained from the NASA Langley Research Center (LaRC) POWER Project funded through the NASA Earth Science/Applied Science Program |
| `scripts/fixtures/open-meteo-forecast.json`, `power-climatology.json` (the capture harness's recorded answers, test data only) | One response from each API above for 34.675° N, 105.075° W (the Jezero example's first Earth cell), recorded 2026-10-20; the forecast's dates moved to start on the capture day, 2026-10-04, its values unchanged | As above | As above |
| `scripts/fixtures/open-meteo-forecast-dryvalleys.json`, `power-climatology-dryvalleys.json` (test data only) | One response from each API above for 77.5° S, 162.0° E (the McMurdo Dry Valleys), recorded 2026-10-20 23:27 UTC (the forecast) and 2026-10-21 (the climatology); the forecast's dates moved to start on 2026-10-05 (the capture day's local date at UTC+13), its values unchanged | As above | As above |
| Calibration only, nothing shipped: the wind ratio and rain rule of the best months | Open-Meteo Historical Weather API (ERA5), https://archive-api.open-meteo.com/v1/archive, daily wind maximum and mean, rain, 2016–2025, at five doubles; read once on 2026-10-21 | CC BY 4.0 (Open-Meteo; ERA5 by the Copernicus Climate Change Service) | Weather data by Open-Meteo.com; contains modified Copernicus Climate Change Service information |

## Surface values read at the targets (`src/data/surface.gen.json`)

Made by `npm run fetch:surface` (`scripts/fetch-surface.mjs`, 2026-11-14). Both files are gigabytes, so each value is read
by an HTTP range request (a few KB per site) and nothing is downloaded whole or stored but the numbers: the median of the
valid pixels in a window of about 2 km at the site's centre. In the app: the result detail's "Measured at the target"
block prints the dataset and provider under the values.

| Data | Source | Licence | Credit |
| --- | --- | --- | --- |
| Moon: bolometric and regolith temperature at local midnight, rock abundance at slope-adjusted midnight (`tbol_m`, `treg_m`, `ra_sam`; 70°S–70°N, about 237 m/px) | LRO Diviner global high-resolution mosaics (GHRM), NASA PDS Geosciences Node, bundle `urn:nasa:pds:lro_diviner_derived1`, https://pds-geosciences.wustl.edu/lro/urn-nasa-pds-lro_diviner_derived1/ (`data_derived_ghrm/geotiff/dghrm_*_70s70n_tif.tif`) | NASA PDS open data: any use without permission, credit requested (https://pds-geosciences.wustl.edu/jplcopyright.html) | NASA LRO Diviner Science Team (UCLA), NASA PDS Geosciences Node |
| Mars: thermal inertia (quantitative, 32-bit, 100 m/px) | THEMIS-derived global thermal inertia mosaic, USGS Astrogeology Science Center (Astropedia) with the Arizona State University Mars Space Flight Facility, https://astrogeology.usgs.gov/search/map/mars-themis-derived-global-thermal-inertia-mosaic ; Fergason et al. 2006, JGR 111, E12004, doi:10.1029/2006JE002735 | Public domain (USGS; US Government work, 17 U.S.C. § 105) | Robin Fergason, USGS Astrogeology Science Center; NASA Mars Odyssey THEMIS |

| Mars: candidate cave entrances (about 1,060; `data/Mars_Cave_Catalog.csv` in the zip, read whole by the script, not stored) | Mars Global Cave Candidate Catalog v1, USGS Astrogeology Science Center, NASA PDS bundle `mars_mro.odyssey_multi_cavecatalog_cushing_2016`, https://astrogeology.usgs.gov/search/map/mars_global_cave_candidate_catalog_v1_cushing ; Cushing 2012, Candidate cave entrances on Mars, J. Cave and Karst Studies 74 | Public domain (USGS; US Government work, 17 U.S.C. § 105) | Glen Cushing, USGS Astrogeology Science Center |
| Moon: pits (about 280; `LUNAR_PIT_LOCATIONS.CSV`, read whole by the script, not stored) | Lunar Pit Atlas, LROC, Arizona State University, NASA PDS `LRO-L-LROC-5-RDR-V1.0`, https://data.lroc.im-ldi.com/lroc/view_rdr/SHAPEFILE_LUNAR_PIT_LOCATIONS ; Wagner and Robinson 2021, LPSC 52, abstract 2530 | NASA PDS open data: any use without permission, credit requested (https://pds-geosciences.wustl.edu/jplcopyright.html) | Robert Wagner and Mark Robinson, LROC Science Team, Arizona State University |

| Mars: water, iron, silicon, potassium, chlorine, thorium (`*_sr_5x5.tab`, six ASCII tables of about 180 KB, read whole by the script, not stored) | Odyssey GRS element concentrations, NASA PDS Geosciences Node, `ODY-M-GRS-5-ELEMENTS-V1.0`, https://pds-geosciences.wustl.edu/missions/odyssey/grs_elements.html ; Boynton et al. 2007, JGR 112, E12S99, doi:10.1029/2007JE002887 | NASA PDS open data: any use without permission, credit requested (https://pds-geosciences.wustl.edu/jplcopyright.html) | NASA 2001 Mars Odyssey GRS Science Team (W. V. Boynton, University of Arizona), NASA PDS Geosciences Node |

The climate fit (`src/data/climate.ts`) uses the engine's own climate block (WorldClim 2.1, Global Aridity Index v3.1: credited
under "Other" below) and these values only as context: they are not scored (README, "How the climate fit works").

## Fonts (`public/fonts/`)

The design system's three faces, self-hosted (Share and meta): Google Fonts' own woff2 files, as its CSS API serves them
to Chrome for `https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,300;6..72,400&family=Geist:wght@400;500;600&family=Geist+Mono:wght@400&display=swap`
(downloaded 2026-10-21 from https://fonts.gstatic.com/ : Newsreader v26, Geist v5, Geist Mono v6), the latin and
latin-ext subsets only, with Google's unicode ranges (`src/tokens.css`). Each is a variable font (Newsreader with its
optical-size axis). The licence ships beside them: `OFL-Newsreader.txt` and `OFL-Geist.txt` (Geist and Geist Mono share
one text), from https://github.com/google/fonts (`ofl/newsreader/OFL.txt`, `ofl/geist/OFL.txt`, `ofl/geistmono/OFL.txt`).

| Asset | Source | Licence | Credit |
| --- | --- | --- | --- |
| `newsreader-latin.woff2`, `newsreader-latin-ext.woff2` (132 and 87 KB) | Newsreader, Google Fonts | SIL Open Font License 1.1 | Copyright 2020 The Newsreader Project Authors (Production Type), https://github.com/productiontype/Newsreader |
| `geist-latin.woff2`, `geist-latin-ext.woff2` (29 and 17 KB) | Geist, Google Fonts | SIL Open Font License 1.1 | Copyright 2024 The Geist Project Authors (Vercel), https://github.com/vercel/geist-font |
| `geist-mono-latin.woff2`, `geist-mono-latin-ext.woff2` (10 and 7 KB) | Geist Mono, Google Fonts | SIL Open Font License 1.1 | Copyright 2024 The Geist Project Authors (Vercel), https://github.com/vercel/geist-font |

## The search engine's elevation data and models (`engine/`)

What the engine's shipped code reads (`engine/code/src/eidolon/loaders/windows.py`, `features/cell_terrain.py`,
`models/train.py`), checked 2026-11-15. Its data bundle (`engine/index`, `grid`, `weights`, `judge`, `targets`; 2.6 GB) is
on the repo's private release, not in git.

| Data | Source | Licence | Credit |
| --- | --- | --- | --- |
| Earth windows and the 500,127-site index | Copernicus DEM GLO-30 (and GLO-90 for the cell features, `cell_terrain.py`), as Site terrain above | Copernicus DEM licence: free use with attribution | As Site terrain above |
| Mars target windows | Mars MGS MOLA – MEX HRSC Blended DEM 200 m v2, as above; and the UCLA Exploration Zone CTX DEMs (~18 m), NASA PDS bundle `mars_mro_hirise_explorationzones_day_2023`, https://asc-pds-individual-investigations.s3.us-west-2.amazonaws.com/ | Public domain (USGS); NASA PDS open data: any use without permission, credit requested | Fergason et al. (2018), as above; Day, M. et al. (2023), UCLA Mars Exploration Zone CTX DEMs, NASA PDS |
| Moon target windows | SLDEM2015, as above | Public domain (NASA PDS / USGS) | Barker et al. (2016), as above |
| The 10,100 named targets | IAU Gazetteer of Planetary Nomenclature (Other, below) | Public domain | As Other, below |
| The learned models (the `e016_cnn` encoder weights, the `PAIR1` judge) | Trained by the team on elevation patches with body labels (`models/train.py`: "DEM patches X (N,P,P float32, metres) with body labels y"), from the elevation data above | The team's own | None needed |

**For the engine's owner to confirm** (the scripts that built the index and trained the models, `experiments/`, are not in
this repo): which land-cover data made the barren mask behind the index; which water mask the index's QA uses
(`engine.py`: "water > 0.15"); and whether any training run read anything beyond the elevation above.
`code/environment.yml` lists ASTER GED, EMIT, MODIS, HiRISE and Earth Engine clients, but no shipped code reads them; add
a row here for any the index or the models used.

## Other

| Asset | Source | Licence | Credit |
| --- | --- | --- | --- |
| Elevation at each Earth double's centre (the engine's `location.elevation_m`; built into its data bundle, `engine/index/site_attrs.npz`) | ETOPO 2022 15 Arc-Second Global Relief Model, sampled at 60″, NOAA NCEI, https://www.ncei.noaa.gov/products/etopo-global-relief-model | Public domain (NOAA; US Government work) | NOAA National Centers for Environmental Information (2022), ETOPO 2022 15 Arc-Second Global Relief Model, doi:10.25921/fd45-gt74 |
| Aridity at each Earth double's centre (the engine's `environment.aridity_index`; the climate fit's dryness row; `engine/index/site_attrs.npz`) | Global Aridity Index and Potential Evapotranspiration Database v3.1 (30″), figshare, https://doi.org/10.6084/m9.figshare.7504448.v7 | CC BY 4.0 (the record's licence field, read 2026-11-15; its description also says "for non-commercial use") | Zomer, R.J., Xu, J. and Trabucco, A. (2022), Version 3 of the Global Aridity Index and Potential Evapotranspiration Database, Scientific Data 9, 409, doi:10.1038/s41597-022-01493-1; dataset by Robert Zomer and Antonio Trabucco, doi:10.6084/m9.figshare.7504448.v7 |
| Country and sovereign state of each Earth double (the engine's `location.country`, `sovereign`; `engine/grid/cell_country.npz`) | Natural Earth admin-0 boundaries (`SOVEREIGNT`), https://www.naturalearthdata.com/ | Public domain | Made with Natural Earth |
| **Not used by the app:** mean temperature and precipitation in the engine's `environment` block (`engine/index/site_attrs.npz`) | WorldClim 2.1 BIO1 and BIO12 (5′), https://www.worldclim.org/data/worldclim21.html | No licence stated: "provided for use in research and related activities", © worldclim.org. Not shown to be "freely available without restriction" (Space Apps participant terms), so the app shows NASA POWER's climatology instead (`src/data/climate.ts powerClimate`). The engine's private data bundle still holds these values; it is not in this repo | Fick, S.E. and Hijmans, R.J. (2017), WorldClim 2: new 1-km spatial resolution climate surfaces for global land areas, Int. J. Climatol. 37, 4302–4315, doi:10.1002/joc.5086 |
| Mean annual air temperature and precipitation of each Earth double (the climate fit's temperature row, the result detail and the listing) | NASA POWER Climatology API (`T2M`, `PRECTOTCORR`), the same request as the best months (Weather above) | Public domain (NASA); acknowledgement requested | These data were obtained from the NASA Langley Research Center (LaRC) POWER Project funded through the NASA Earth Science/Applied Science Program |
| `src/data/targets.json` (the mock's IAU target list: names, feature types, centres, diameters) | The search engine's target store (`eidolon_search/targets/targets.json`), built from the IAU Gazetteer of Planetary Nomenclature, https://planetarynames.wr.usgs.gov ; trimmed by `scripts/trim-targets.mjs` | Public domain (USGS Astrogeology, for the IAU Working Group for Planetary System Nomenclature) | Gazetteer of Planetary Nomenclature, IAU WGPSN / USGS Astrogeology Science Center |
| `public/poster.jpg` (1920 × 1200) and `public/poster-tall.jpg` (780 × 1688): the no-WebGL page's poster | Eidolon's own title view rendered by the app (the capture harness's `title-shot` state at device scale 2, the scene alone; web-sized by `npm run poster`, `scripts/poster.mjs`): Earth drawn from the globe maps above (`earth_day.jpg`, `earth_night.jpg`, `earth_spec.jpg`, `earth_bump.jpg`, `earth_clouds.jpg`), the sun, stars and satellite the app's own | As those maps': public domain (NASA; NOAA for the relief) | In the app, under the page's site list: "The poster is Eidolon’s title view, drawn from NASA’s Blue Marble and Black Marble maps of Earth, the Blue Marble clouds, NOAA’s ETOPO1 relief and the MODIS water mask."; the maps' full credits as in Globes above |
| `public/og.jpg` (1200 × 630, 54 KB): the link preview's image (index.html `og:image`, `twitter:image`) | Eidolon's own title view rendered by the app: the capture harness's `og` state (`--viewports=og`, 1200 × 630 at device scale 2, its buttons, the blurb's first paragraph and the scroll hint hidden), downsampled by `npm run poster`; Earth drawn from the globe maps above | As those maps': public domain (NASA; NOAA for the relief) | None in the image (a link preview has no room); the maps' credits as in Globes above, and in the app's info sheet |
| `src/brand/logo.svg` (the Eidolon mark: favicon, top bar, title lockup, credits footer and its dithered art, info sheet) | Drawn in-house as a stand-in until the logo chat delivers; no third-party material | The team's own | None needed |
| `reference/eidolon.html` (the v10 prototype, the visual reference `npm run capture:ref` reads) | The prototype's own build; where its 11 embedded JPEG textures came from was never recorded | Removed from the repo on 2026-11-15 (untracked and gitignored): its textures' provenance is unknown. Keep a local copy for `capture:ref`; never commit it | None: it does not ship |

## Software

The open-source packages the app ships, builds with and the engine runs on, with their licences and copyright notices,
are in `THIRD_PARTY_NOTICES.md` at the repo root; Eidolon itself is licensed under the Apache License 2.0 (`LICENSE`). One shipped package is not OSI
open source: **GSAP** (3.15.0, the animation and timing library), under the GSAP Standard "no charge" License,
https://gsap.com/standard-license : free for anyone, commercial use included, with use restrictions that don't apply to
Eidolon (no use in no-code animation builders that compete with Webflow's). Copyright 2008-2026, GreenSock.
