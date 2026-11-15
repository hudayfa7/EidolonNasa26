// Every outside source the data scripts read (scripts/fetch-real-data.mjs, scripts/fetch-surface.mjs): who provides it,
// where it is read from, its licence and how to cite it. The scripts write these into the files they make (provenance),
// and scripts/check-credits.mjs fails the build when a URL in either script has no entry here, or an entry has no
// licence or no row in docs/credits.md (`anchor`: text in that row) whose licence is stated.
//
// Licences, as checked on 2026-11-15 (the Space Apps participant terms: a non-NASA source must be freely and publicly
// available without restriction, or OSI open source; NASA's and partner space agencies' data are NASA resources):
// - NASA, USGS and NOAA data are US Government works: public domain in the US (17 U.S.C. § 105).
// - NASA PDS archives: "may be used by any person for any purpose without prior permission", with a credit line and
//   no implied endorsement (https://pds-geosciences.wustl.edu/jplcopyright.html).
// - NASA imagery: not protected by copyright in the US (NASA Images and Media Usage Guidelines).
// - Copernicus DEM: free use with attribution (Copernicus DEM licence; ESA, a Space Apps partner agency).

const PD_NASA = 'Public domain (NASA; US Government work)';
const PD_USGS = 'Public domain (USGS; US Government work)';
const PDS = 'NASA PDS open data: any use without permission, credit requested';

/** @type {Record<string, { name: string, provider: string, url: string | string[], licence: string, citation: string, anchor: string }>} */
export const SOURCES = {
  mdim: { name: 'Viking MDIM 2.1 colourised global mosaic', provider: 'USGS Astrogeology Science Center; NASA Ames', url: 'https://asc-pds-services.s3.us-west-2.amazonaws.com/wms_basemaps/Mars/MDIM21_AMESColor/',
    licence: PD_USGS, citation: 'NASA/JPL Viking Orbiters; USGS Astrogeology Science Center (MDIM 2.1); colour by NASA Ames Research Center', anchor: 'Viking MDIM 2.1 colourised global mosaic' },
  tes: { name: 'MGS TES Albedo Global Mosaic, 7,410 m', provider: 'NASA/JPL/Arizona State University; USGS Astrogeology', url: 'https://asc-pds-services.s3.us-west-2.amazonaws.com/mosaic/Mars_MGS_TES_Albedo_mosaic_global_7410m.tif',
    licence: PD_USGS, citation: 'Christensen, P.R. et al. (2001), Mars Global Surveyor Thermal Emission Spectrometer experiment, JGR 106, 23823–23871', anchor: 'Viking MDIM 2.1 colourised global mosaic' },
  mola: { name: 'MGS MOLA MEGDR 128/64 px/° merge', provider: 'NASA/GSFC MOLA Science Team; USGS Astrogeology', url: 'https://asc-pds-services.s3.us-west-2.amazonaws.com/wms_basemaps/Mars/MOLA/',
    licence: PD_NASA, citation: 'Smith, D.E. et al. (2001), Mars Orbiter Laser Altimeter, JGR 106, 23689–23722', anchor: 'MGS MOLA MEGDR' },
  blend: { name: 'Mars MGS MOLA – MEX HRSC Blended DEM Global 200 m v2', provider: 'USGS Astrogeology Science Center (NASA PDS, MOLA; ESA/DLR/FU Berlin, HRSC)', url: 'https://asc-pds-services.s3.us-west-2.amazonaws.com/mosaic/Mars/HRSC_MOLA_Blend/',
    licence: PD_USGS, citation: 'Fergason, R.L., Hare, T.M. and Laura, J. (2018), HRSC and MOLA Blended Digital Elevation Model at 200 m v2, USGS Astrogeology Science Center', anchor: 'Mars MGS MOLA – MEX HRSC Blended DEM' },
  sldem: { name: 'SLDEM2015, LOLA and SELENE Kaguya TC merge', provider: 'NASA GSFC; JAXA (SELENE); USGS Astrogeology mirror', url: 'https://asc-pds-services.s3.us-west-2.amazonaws.com/mosaic/LolaKaguya_Topo/',
    licence: PD_NASA, citation: 'Barker, M.K. et al. (2016), A new lunar digital elevation model from the Lunar Orbiter Laser Altimeter and SELENE Terrain Camera, Icarus 273, 346–355, doi:10.1016/j.icarus.2015.07.039', anchor: 'SLDEM2015' },
  clem: { name: 'Clementine UVVIS 750 nm global mosaic v2', provider: 'NASA and the US Department of Defense; USGS Astrogeology', url: 'https://asc-pds-services.s3.us-west-2.amazonaws.com/wms_basemaps/Moon/Clem_UVVIS_Mosaic_Global_256ppd_v02.tif.ovr',
    licence: PD_USGS, citation: 'NASA and the US Department of Defense (Clementine); USGS Astrogeology Science Center (mosaic)', anchor: 'LROC WAC global morphologic mosaic v1.3' },
  wac: { name: 'LROC WAC global and south polar morphologic mosaics', provider: 'NASA/GSFC/Arizona State University (NASA PDS)', url: 'https://pds.lroc.asu.edu/data/LRO-L-LROC-5-RDR-V1.0/LROLRC_2001/DATA/BDR/WAC_GLOBAL/',
    licence: PDS, citation: 'Robinson, M.S. et al. (2010), Lunar Reconnaissance Orbiter Camera (LROC) instrument overview, Space Sci. Rev. 150, 81–124; NASA PDS', anchor: 'LROC WAC global morphologic mosaic v1.3' },
  lola: { name: 'LRO LOLA LDEM_16 and LDEM_75S_240M', provider: 'NASA/GSFC LOLA Science Team (NASA PDS Geosciences Node)', url: 'https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/',
    licence: PDS, citation: 'Smith, D.E. et al. (2010), The Lunar Orbiter Laser Altimeter investigation on the Lunar Reconnaissance Orbiter mission, Space Sci. Rev. 150, 209–241; NASA PDS', anchor: 'LRO LOLA LDEM_16' },
  glo30: { name: 'Copernicus DEM GLO-30', provider: 'ESA and the European Union (Copernicus); DLR, Airbus; AWS Registry of Open Data', url: 'https://copernicus-dem-30m.s3.amazonaws.com/',
    licence: 'Copernicus DEM licence: free use with attribution', citation: '© DLR e.V. 2010–2014 and © Airbus Defence and Space GmbH 2014–2018 provided under COPERNICUS by the European Union and ESA; all rights reserved', anchor: 'Copernicus DEM GLO-30, 1° COG tiles' },
  clouds: { name: 'Blue Marble: Clouds', provider: 'NASA Goddard Space Flight Center (Visible Earth)', url: 'https://eoimages.gsfc.nasa.gov/images/imagerecords/57000/57747/',
    licence: PD_NASA, citation: 'NASA Goddard Space Flight Center image by Reto Stöckli (Blue Marble, 2002); clouds from MODIS', anchor: 'Blue Marble: Clouds' },
  etopo1: { name: 'ETOPO1 Ice Surface', provider: 'NOAA National Centers for Environmental Information', url: 'https://gis.ngdc.noaa.gov/arcgis/rest/services/DEM_mosaics/ETOPO1_ice_surface/',
    licence: 'Public domain (NOAA; US Government work)', citation: 'Amante, C. and B.W. Eakins (2009), ETOPO1 1 Arc-Minute Global Relief Model, NOAA Technical Memorandum NESDIS NGDC-24, doi:10.7289/V5C8276M', anchor: 'ETOPO1 Ice Surface' },
  gibs: { name: 'NASA GIBS WMS: Blue Marble (shaded relief, Next Generation), Black Marble 2016, MODIS water mask, Landsat WELD 1999', provider: 'NASA Global Imagery Browse Services (NASA Earth Observatory, NASA LP DAAC, USGS/NASA Landsat, South Dakota State University WELD)', url: 'https://gibs.earthdata.nasa.gov/wms/',
    licence: 'Public domain (NASA; USGS/NASA Landsat; WELD, NASA MEaSUREs, no restrictions)', citation: 'NASA Earth Observatory (Blue Marble, Reto Stöckli; Black Marble); NASA LP DAAC (MODIS MOD44W); NASA/USGS Landsat and Roy, D.P. et al., Web-Enabled Landsat Data (WELD); served by NASA GIBS', anchor: 'Blue Marble: Next Generation with shaded relief and bathymetry' },
  nasaImages: { name: 'NASA Image and Video Library (surface photographs, Beyond images)', provider: 'NASA', url: 'https://images-assets.nasa.gov/',
    licence: 'NASA imagery: not protected by copyright in the US (NASA Images and Media Usage Guidelines); JPL PIA images: any purpose with credit (JPL image use policy)', citation: 'Each image\'s own credit line (docs/credits.md, Surface photographs and Beyond)', anchor: 'Licence for all: NASA imagery' },
  diviner: { name: 'LRO Diviner global high-resolution mosaics', provider: 'NASA LRO Diviner Science Team (UCLA); NASA PDS Geosciences Node', url: 'https://pds-geosciences.wustl.edu/lro/urn-nasa-pds-lro_diviner_derived1/',
    licence: PDS, citation: 'Williams, J.-P. et al. (2017), The global surface temperatures of the Moon as measured by the Diviner Lunar Radiometer Experiment, Icarus 283, 300–325; NASA PDS', anchor: 'LRO Diviner global high-resolution mosaics' },
  themis: { name: 'THEMIS-derived global thermal inertia mosaic (quantitative, 100 m)', provider: 'USGS Astrogeology Science Center; ASU Mars Space Flight Facility', url: ['https://asc-astropedia.s3.us-west-2.amazonaws.com/Mars/Odyssey/THEMIS-Global-Thermal-Inertia-Mosaic/', 'https://astrogeology.usgs.gov/search/map/mars-themis-derived-global-thermal-inertia-mosaic'],
    licence: PD_USGS, citation: 'Fergason, R.L., Christensen, P.R. and Kieffer, H.H. (2006), JGR 111, E12004, doi:10.1029/2006JE002735', anchor: 'THEMIS-derived global thermal inertia mosaic' },
  caves: { name: 'Mars Global Cave Candidate Catalog v1', provider: 'USGS Astrogeology Science Center (NASA PDS)', url: ['https://astrogeology.usgs.gov/ckan/dataset/', 'https://astrogeology.usgs.gov/search/map/mars_global_cave_candidate_catalog_v1_cushing'],
    licence: PD_USGS, citation: 'Cushing, G.E. (2012), Candidate cave entrances on Mars, J. Cave and Karst Studies 74, 33–47, doi:10.4311/2010PA0161', anchor: 'Mars Global Cave Candidate Catalog v1' },
  pits: { name: 'Lunar Pit Atlas (LUNAR_PIT_LOCATIONS)', provider: 'LROC Science Team, Arizona State University (NASA PDS)', url: ['https://pds.lroc.im-ldi.com/data/LRO-L-LROC-5-RDR-V1.0/', 'https://data.lroc.im-ldi.com/lroc/view_rdr/'],
    licence: PDS, citation: 'Wagner, R.V. and Robinson, M.S. (2021), LPSC 52, abstract 2530; NASA PDS', anchor: 'Lunar Pit Atlas' },
  grs: { name: 'Mars Odyssey GRS element concentrations', provider: 'NASA 2001 Mars Odyssey GRS Science Team (University of Arizona); NASA PDS Geosciences Node', url: ['https://pds-geosciences.wustl.edu/ody/ody-m-grs-5-elements-v1/', 'https://pds-geosciences.wustl.edu/missions/odyssey/grs_elements.html'],
    licence: PDS, citation: 'Boynton, W.V. et al. (2007), Concentration of H, Si, Cl, K, Fe, and Th in the low- and mid-latitude regions of Mars, JGR 112, E12S99, doi:10.1029/2007JE002887', anchor: 'Odyssey GRS element concentrations' },
};

/** The entry whose URL a source URL starts with, if any. */
export const sourceFor = url => Object.entries(SOURCES).find(([, s]) => [s.url].flat().some(u => url.startsWith(u)))?.[0];

/** The provenance block a script writes into its output: each source it read, with its URL, licence and citation, and
 *  the date of the run. */
export const provenance = (keys, fetched = new Date().toISOString().slice(0, 10)) =>
  ({ fetched, sources: Object.fromEntries(keys.map(k => [k, { name: SOURCES[k].name, provider: SOURCES[k].provider, url: SOURCES[k].url, licence: SOURCES[k].licence, citation: SOURCES[k].citation }])) });
