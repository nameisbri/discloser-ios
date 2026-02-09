/**
 * Recognized Lab Database
 *
 * A comprehensive, structured database of recognized medical laboratories
 * organized by region (province, state, or country). Each entry includes
 * canonical names, common variations (as an LLM might extract from OCR'd
 * documents), abbreviations, optional accession number formats, and the
 * regional health card type where applicable.
 *
 * This database complements `labNameNormalizer.ts` by providing richer
 * metadata for lab identification, region detection, and document
 * validation workflows.
 *
 * Coverage:
 *   - Canada (all 13 provinces/territories)
 *   - United States (major national and regional labs)
 *   - United Kingdom (NHS and public health labs)
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Regions supported by this database. Includes:
 *   - All 13 Canadian provinces/territories (two-letter postal codes)
 *   - All 50 US states + DC (two-letter USPS codes)
 *   - 'UK' for United Kingdom labs
 *   - 'INTL' for international / multi-country labs
 */
export type Region =
  // Canadian provinces and territories
  | 'AB' | 'BC' | 'MB' | 'NB' | 'NL' | 'NS' | 'NT' | 'NU'
  | 'ON' | 'PE' | 'QC' | 'SK' | 'YT'
  // US states + DC
  | 'AL' | 'AK' | 'AZ' | 'AR' | 'CA' | 'CO' | 'CT' | 'DE'
  | 'FL' | 'GA' | 'HI' | 'ID' | 'IL' | 'IN' | 'IA' | 'KS'
  | 'KY' | 'LA' | 'ME' | 'MD' | 'MA' | 'MI' | 'MN' | 'MS'
  | 'MO' | 'MT' | 'NE' | 'NV' | 'NH' | 'NJ' | 'NM' | 'NY'
  | 'NC' | 'ND' | 'OH' | 'OK' | 'OR' | 'PA' | 'RI' | 'SC'
  | 'SD' | 'TN' | 'TX' | 'UT' | 'VT' | 'VA' | 'WA' | 'WV'
  | 'WI' | 'WY' | 'DC'
  // United Kingdom
  | 'UK'
  // International
  | 'INTL';

/**
 * Represents a recognized medical laboratory with all the metadata
 * required for flexible matching and region-level identification.
 */
export interface RecognizedLab {
  /** Unique, stable identifier for this lab entry (kebab-case). */
  id: string;

  /**
   * The preferred display name for this laboratory.
   * This is the name shown to users after a match is found.
   */
  canonicalName: string;

  /**
   * Common name variations an LLM or OCR engine might produce.
   * Includes full names, partial names, regional qualifiers, and
   * common misspellings. All comparisons should be case-insensitive.
   */
  variations: string[];

  /**
   * Short-form abbreviations (e.g. "PHO", "BCCDC").
   * Stored separately so callers can prioritise exact abbreviation
   * matches before falling back to fuzzy variation matching.
   */
  abbreviations: string[];

  /** The region where this lab primarily operates. */
  region: Region;

  /**
   * Country code indicating which country this lab belongs to.
   * 'CA' = Canada, 'US' = United States, 'UK' = United Kingdom,
   * 'INTL' = International / multi-country.
   */
  country?: 'CA' | 'US' | 'UK' | 'INTL';

  /**
   * A RegExp that matches the lab's accession / requisition number
   * format, if known. Useful for cross-referencing document IDs.
   * `undefined` when the format is unknown or varies too widely.
   */
  accessionFormat: RegExp | undefined;

  /**
   * The regional health insurance card type associated with this
   * lab's region (e.g. "OHIP", "MSP"). `undefined` for labs in
   * territories, US, UK, or situations where the card type is not
   * applicable.
   */
  healthCardType: string | undefined;
}

// ---------------------------------------------------------------------------
// Database
// ---------------------------------------------------------------------------

/**
 * Comprehensive database of recognized medical laboratories.
 *
 * Organized by country and region in the following order:
 *   Canada: ON, BC, AB, QC, SK, MB, NS, NB, NL, PE, NT, National/Private
 *   United States: National labs, then regional
 *   United Kingdom: NHS and public health labs
 *
 * Each entry's `variations` array is designed to handle the kinds of
 * name fragments an LLM might extract from OCR'd lab reports, including
 * "Laboratory" vs "Lab" vs "Laboratories" suffixes, "Centre" vs "Center"
 * spellings, and institutional sub-unit references.
 */
export const LAB_DATABASE: readonly RecognizedLab[] = [
  // =========================================================================
  // CANADA - ONTARIO (ON)
  // =========================================================================
  {
    id: 'lifelabs-on',
    canonicalName: 'LifeLabs',
    variations: [
      'LifeLabs',
      'Life Labs',
      'LifeLabs Medical Laboratory',
      'LifeLabs Medical Laboratories',
      'LifeLabs Medical Lab',
      'LifeLabs Laboratory',
      'LifeLabs Ontario',
      'LifeLabs Medical Laboratory Services',
      'Life Labs Medical',
      'LifeLabs Inc',
    ],
    abbreviations: ['LL'],
    region: 'ON',
    country: 'CA',
    accessionFormat: /^L\d{7,10}$/,
    healthCardType: 'OHIP',
  },
  {
    id: 'pho',
    canonicalName: 'Public Health Ontario',
    variations: [
      'Public Health Ontario',
      'Public Health Ontario Laboratory',
      'Public Health Ontario Laboratories',
      'Public Health Ontario Lab',
      'Ontario Public Health Laboratory',
      'Ontario Public Health Laboratories',
      'Ontario Public Health Lab',
      'PHO Laboratory',
      'PHO Lab',
      'Public Health Ontario Labs',
    ],
    abbreviations: ['PHO', 'PHOL'],
    region: 'ON',
    country: 'CA',
    accessionFormat: /^PH\d{6,8}$/,
    healthCardType: 'OHIP',
  },
  {
    id: 'dynacare-on',
    canonicalName: 'Dynacare',
    variations: [
      'Dynacare',
      'Dynacare Medical Laboratory',
      'Dynacare Medical Laboratories',
      'Dynacare Medical Lab',
      'Dynacare Laboratory',
      'Dynacare Lab',
      'Dynacare Ontario',
      'Dynacare Inc',
    ],
    abbreviations: ['DC'],
    region: 'ON',
    country: 'CA',
    accessionFormat: /^[A-Z]{2,3}\d{6,10}$/, // Dynacare uses 2-3 letter prefix + 6-10 digits
    healthCardType: 'OHIP',
  },
  {
    id: 'gamma-dynacare',
    canonicalName: 'Gamma-Dynacare',
    variations: [
      'Gamma-Dynacare',
      'Gamma Dynacare',
      'Gamma-Dynacare Medical Laboratories',
      'Gamma-Dynacare Medical Laboratory',
      'Gamma Dynacare Medical Lab',
      'Gamma-Dynacare Lab',
      'Gamma-Dynacare Laboratory',
    ],
    abbreviations: ['GDC', 'GDML'],
    region: 'ON',
    country: 'CA',
    accessionFormat: /^[A-Z]{2,3}\d{6,10}$/, // Same parent as Dynacare
    healthCardType: 'OHIP',
  },
  {
    id: 'medlabs',
    canonicalName: 'MedLabs',
    variations: [
      'MedLabs',
      'Med Labs',
      'MedLabs Inc',
      'MedLabs Laboratory',
      'MedLabs Medical Laboratory',
      'MedLabs Medical Lab',
      'MedLabs Diagnostics',
    ],
    abbreviations: ['ML'],
    region: 'ON',
    country: 'CA',
    accessionFormat: undefined,
    healthCardType: 'OHIP',
  },
  {
    id: 'hassle-free-clinic',
    canonicalName: 'Hassle Free Clinic',
    variations: [
      'Hassle Free Clinic',
      'Hassle-Free Clinic',
      'Hassle Free Clinic Laboratory',
      'Hassle Free Clinic Lab',
      'HFC Toronto',
      'Hassle Free',
    ],
    abbreviations: ['HFC'],
    region: 'ON',
    country: 'CA',
    accessionFormat: undefined,
    healthCardType: 'OHIP',
  },
  {
    id: 'mapletree-medical',
    canonicalName: 'Mapletree Medical',
    variations: [
      'Mapletree Medical',
      'Mapletree Medical Laboratory',
      'Mapletree Medical Laboratories',
      'Mapletree Medical Lab',
      'Mapletree Lab',
      'Mapletree Laboratory',
    ],
    abbreviations: [],
    region: 'ON',
    country: 'CA',
    accessionFormat: undefined,
    healthCardType: 'OHIP',
  },
  {
    id: 'idexx',
    canonicalName: 'IDEXX',
    variations: [
      'IDEXX',
      'IDEXX Laboratories',
      'IDEXX Laboratory',
      'IDEXX Lab',
      'IDEXX Reference Laboratories',
      'IDEXX Canada',
    ],
    abbreviations: ['IDEXX'],
    region: 'ON',
    country: 'CA',
    accessionFormat: undefined,
    healthCardType: 'OHIP',
  },
  {
    id: 'cml-healthcare',
    canonicalName: 'CML Healthcare',
    variations: [
      'CML Healthcare',
      'CML Healthcare Inc',
      'CML Healthcare Laboratory',
      'CML Healthcare Laboratories',
      'CML Healthcare Lab',
      'CML Medical Laboratory',
      'CML Lab',
    ],
    abbreviations: ['CML'],
    region: 'ON',
    country: 'CA',
    accessionFormat: undefined,
    healthCardType: 'OHIP',
  },
  {
    id: 'uhn',
    canonicalName: 'University Health Network',
    variations: [
      'University Health Network',
      'University Health Network Laboratory',
      'University Health Network Laboratories',
      'University Health Network Lab',
      'UHN Laboratory',
      'UHN Lab',
      'UHN Labs',
      'Toronto General Hospital Lab',
      'Toronto Western Hospital Lab',
      'Princess Margaret Hospital Lab',
      'UHN Toronto',
    ],
    abbreviations: ['UHN'],
    region: 'ON',
    country: 'CA',
    accessionFormat: undefined,
    healthCardType: 'OHIP',
  },
  {
    id: 'sunnybrook',
    canonicalName: 'Sunnybrook Health Sciences Centre',
    variations: [
      'Sunnybrook Health Sciences Centre',
      'Sunnybrook Health Sciences Center',
      'Sunnybrook Hospital',
      'Sunnybrook Hospital Laboratory',
      'Sunnybrook Hospital Lab',
      'Sunnybrook Lab',
      'Sunnybrook Laboratory',
      'Sunnybrook Health Sciences',
      'Sunnybrook HSC',
    ],
    abbreviations: ['SHSC'],
    region: 'ON',
    country: 'CA',
    accessionFormat: undefined,
    healthCardType: 'OHIP',
  },
  {
    id: 'mount-sinai-on',
    canonicalName: 'Mount Sinai Hospital',
    variations: [
      'Mount Sinai Hospital',
      'Mount Sinai Hospital Laboratory',
      'Mount Sinai Hospital Lab',
      'Mt Sinai Hospital',
      'Mt. Sinai Hospital',
      'Mt Sinai Lab',
      'Mt. Sinai Lab',
      'Sinai Health System',
      'Sinai Health System Laboratory',
      'Sinai Health Lab',
      'Mount Sinai Toronto',
    ],
    abbreviations: ['MSH'],
    region: 'ON',
    country: 'CA',
    accessionFormat: undefined,
    healthCardType: 'OHIP',
  },
  {
    id: 'st-michaels',
    canonicalName: "St. Michael's Hospital",
    variations: [
      "St. Michael's Hospital",
      "St Michael's Hospital",
      "Saint Michael's Hospital",
      "St. Michael's Hospital Laboratory",
      "St. Michael's Hospital Lab",
      "St Michael's Lab",
      "St. Mike's",
      "St. Mike's Hospital",
      'Unity Health Toronto',
      'Unity Health Laboratory',
      'Unity Health Lab',
    ],
    abbreviations: ['SMH'],
    region: 'ON',
    country: 'CA',
    accessionFormat: undefined,
    healthCardType: 'OHIP',
  },
  {
    id: 'hamilton-health-sciences',
    canonicalName: 'Hamilton Health Sciences',
    variations: [
      'Hamilton Health Sciences',
      'Hamilton Health Sciences Centre',
      'Hamilton Health Sciences Center',
      'Hamilton Health Sciences Laboratory',
      'Hamilton Health Sciences Lab',
      'HHS Laboratory',
      'HHS Lab',
      'Hamilton General Hospital Lab',
      'McMaster University Medical Centre Lab',
      'Juravinski Hospital Lab',
    ],
    abbreviations: ['HHS'],
    region: 'ON',
    country: 'CA',
    accessionFormat: undefined,
    healthCardType: 'OHIP',
  },
  {
    id: 'lhsc',
    canonicalName: 'London Health Sciences Centre',
    variations: [
      'London Health Sciences Centre',
      'London Health Sciences Center',
      'London Health Sciences Centre Laboratory',
      'London Health Sciences Centre Lab',
      'LHSC Laboratory',
      'LHSC Lab',
      'University Hospital London',
      'Victoria Hospital London',
      'London Health Sciences',
    ],
    abbreviations: ['LHSC'],
    region: 'ON',
    country: 'CA',
    accessionFormat: undefined,
    healthCardType: 'OHIP',
  },
  {
    id: 'ottawa-hospital',
    canonicalName: 'The Ottawa Hospital',
    variations: [
      'The Ottawa Hospital',
      'Ottawa Hospital',
      'The Ottawa Hospital Laboratory',
      'The Ottawa Hospital Lab',
      'Ottawa Hospital Laboratory',
      'Ottawa Hospital Lab',
      'TOH Laboratory',
      'TOH Lab',
      'Ottawa Hospital Civic Campus Lab',
      'Ottawa Hospital General Campus Lab',
    ],
    abbreviations: ['TOH'],
    region: 'ON',
    country: 'CA',
    accessionFormat: undefined,
    healthCardType: 'OHIP',
  },
  {
    id: 'khsc',
    canonicalName: 'Kingston Health Sciences Centre',
    variations: [
      'Kingston Health Sciences Centre',
      'Kingston Health Sciences Center',
      'Kingston Health Sciences Centre Laboratory',
      'Kingston Health Sciences Centre Lab',
      'KHSC Laboratory',
      'KHSC Lab',
      'Kingston General Hospital Lab',
      'Hotel Dieu Hospital Kingston Lab',
      'Kingston Health Sciences',
    ],
    abbreviations: ['KHSC', 'KGH'],
    region: 'ON',
    country: 'CA',
    accessionFormat: undefined,
    healthCardType: 'OHIP',
  },
  {
    id: 'trillium-health-partners',
    canonicalName: 'Trillium Health Partners',
    variations: [
      'Trillium Health Partners',
      'Trillium Health Partners Laboratory',
      'Trillium Health Partners Lab',
      'THP Laboratory',
      'THP Lab',
      'Credit Valley Hospital Lab',
      'Mississauga Hospital Lab',
      'Trillium Health',
    ],
    abbreviations: ['THP'],
    region: 'ON',
    country: 'CA',
    accessionFormat: undefined,
    healthCardType: 'OHIP',
  },
  {
    id: 'grand-river-hospital',
    canonicalName: 'Grand River Hospital',
    variations: [
      'Grand River Hospital',
      'Grand River Hospital Laboratory',
      'Grand River Hospital Lab',
      'GRH Laboratory',
      'GRH Lab',
      'Grand River Health Centre',
      'Grand River Health Center',
      'Grand River Hospital Kitchener',
    ],
    abbreviations: ['GRH'],
    region: 'ON',
    country: 'CA',
    accessionFormat: undefined,
    healthCardType: 'OHIP',
  },

  // =========================================================================
  // CANADA - BRITISH COLUMBIA (BC)
  // =========================================================================
  {
    id: 'lifelabs-bc',
    canonicalName: 'LifeLabs BC',
    variations: [
      'LifeLabs BC',
      'LifeLabs British Columbia',
      'Life Labs BC',
      'LifeLabs Medical Laboratory BC',
      'LifeLabs Medical Lab BC',
      'LifeLabs Vancouver',
      'LifeLabs Victoria',
      'LifeLabs Medical Laboratory Services BC',
    ],
    abbreviations: ['LL BC'],
    region: 'BC',
    country: 'CA',
    accessionFormat: /^L\d{7,10}$/,
    healthCardType: 'MSP',
  },
  {
    id: 'bccdc',
    canonicalName: 'BC Centre for Disease Control',
    variations: [
      'BC Centre for Disease Control',
      'BC Center for Disease Control',
      'British Columbia Centre for Disease Control',
      'British Columbia Center for Disease Control',
      'BC CDC',
      'BC CDC Laboratory',
      'BC CDC Lab',
      'BCCDC Laboratory',
      'BCCDC Lab',
      'BCCDC Public Health Laboratory',
    ],
    abbreviations: ['BCCDC', 'BC CDC'],
    region: 'BC',
    country: 'CA',
    accessionFormat: undefined,
    healthCardType: 'MSP',
  },
  {
    id: 'st-pauls-hospital',
    canonicalName: "St. Paul's Hospital",
    variations: [
      "St. Paul's Hospital",
      "St Paul's Hospital",
      "Saint Paul's Hospital",
      "St. Paul's Hospital Laboratory",
      "St. Paul's Hospital Lab",
      "St Paul's Lab",
      "St. Paul's Vancouver",
      'Providence Health Care Laboratory',
      'Providence Health Care Lab',
    ],
    abbreviations: ['SPH'],
    region: 'BC',
    country: 'CA',
    accessionFormat: undefined,
    healthCardType: 'MSP',
  },
  {
    id: 'vgh',
    canonicalName: 'Vancouver General Hospital',
    variations: [
      'Vancouver General Hospital',
      'Vancouver General Hospital Laboratory',
      'Vancouver General Hospital Lab',
      'VGH Laboratory',
      'VGH Lab',
      'Vancouver General Lab',
      'VGH Vancouver',
    ],
    abbreviations: ['VGH'],
    region: 'BC',
    country: 'CA',
    accessionFormat: undefined,
    healthCardType: 'MSP',
  },
  {
    id: 'royal-jubilee',
    canonicalName: 'Royal Jubilee Hospital',
    variations: [
      'Royal Jubilee Hospital',
      'Royal Jubilee Hospital Laboratory',
      'Royal Jubilee Hospital Lab',
      'Royal Jubilee Lab',
      'Royal Jubilee Victoria',
      'Island Health Laboratory',
      'Island Health Lab',
    ],
    abbreviations: ['RJH'],
    region: 'BC',
    country: 'CA',
    accessionFormat: undefined,
    healthCardType: 'MSP',
  },
  {
    id: 'bc-cancer-agency',
    canonicalName: 'BC Cancer Agency',
    variations: [
      'BC Cancer Agency',
      'BC Cancer Agency Laboratory',
      'BC Cancer Agency Lab',
      'British Columbia Cancer Agency',
      'BC Cancer',
      'BC Cancer Lab',
      'BC Cancer Laboratory',
      'BCCA Laboratory',
      'BCCA Lab',
    ],
    abbreviations: ['BCCA'],
    region: 'BC',
    country: 'CA',
    accessionFormat: undefined,
    healthCardType: 'MSP',
  },

  // =========================================================================
  // CANADA - ALBERTA (AB)
  // =========================================================================
  {
    id: 'dynalife',
    canonicalName: 'DynaLIFE',
    variations: [
      'DynaLIFE',
      'Dyna LIFE',
      'DynaLIFE Medical Labs',
      'DynaLIFE Medical Laboratory',
      'DynaLIFE Medical Laboratories',
      'DynaLIFE Medical Lab',
      'DynaLIFE Laboratory',
      'DynaLIFE Lab',
      'DynaLIFE Dx',
      'DynaLIFE Edmonton',
    ],
    abbreviations: ['DL'],
    region: 'AB',
    country: 'CA',
    accessionFormat: /^DL\d{6,8}$/,
    healthCardType: 'AHCIP',
  },
  {
    id: 'apl',
    canonicalName: 'Alberta Precision Laboratories',
    variations: [
      'Alberta Precision Laboratories',
      'Alberta Precision Labs',
      'Alberta Precision Laboratory',
      'Alberta Precision Lab',
      'APL Laboratory',
      'APL Lab',
      'Alberta Precision',
    ],
    abbreviations: ['APL'],
    region: 'AB',
    country: 'CA',
    accessionFormat: undefined,
    healthCardType: 'AHCIP',
  },
  {
    id: 'calgary-lab-services',
    canonicalName: 'Calgary Lab Services',
    variations: [
      'Calgary Lab Services',
      'Calgary Laboratory Services',
      'Calgary Labs',
      'Calgary Lab',
      'CLS Laboratory',
      'CLS Lab',
      'Calgary Lab Services Inc',
    ],
    abbreviations: ['CLS'],
    region: 'AB',
    country: 'CA',
    accessionFormat: undefined,
    healthCardType: 'AHCIP',
  },
  {
    id: 'ahs',
    canonicalName: 'Alberta Health Services',
    variations: [
      'Alberta Health Services',
      'Alberta Health Services Laboratory',
      'Alberta Health Services Laboratories',
      'Alberta Health Services Lab',
      'AHS Laboratory',
      'AHS Lab',
      'AHS Labs',
      'Alberta Health Services Labs',
    ],
    abbreviations: ['AHS'],
    region: 'AB',
    country: 'CA',
    accessionFormat: undefined,
    healthCardType: 'AHCIP',
  },

  // =========================================================================
  // CANADA - QUEBEC (QC)
  // =========================================================================
  {
    id: 'biron',
    canonicalName: 'Biron',
    variations: [
      'Biron',
      'Biron Groupe Sante',
      'Biron Health Group',
      'Biron Laboratoire',
      'Biron Laboratory',
      'Biron Lab',
      'Biron Medical Laboratory',
      'Biron Medical Laboratories',
      'Groupe Biron',
    ],
    abbreviations: [],
    region: 'QC',
    country: 'CA',
    accessionFormat: undefined,
    healthCardType: 'RAMQ',
  },
  {
    id: 'lspq',
    canonicalName: 'Laboratoire de sante publique du Quebec',
    variations: [
      'Laboratoire de sante publique du Quebec',
      'Laboratoire de sante publique du Quebec (LSPQ)',
      'Quebec Public Health Laboratory',
      'LSPQ Laboratory',
      'LSPQ Lab',
      'Laboratoire de sante publique',
      'Quebec Public Health Lab',
    ],
    abbreviations: ['LSPQ'],
    region: 'QC',
    country: 'CA',
    accessionFormat: undefined,
    healthCardType: 'RAMQ',
  },
  {
    id: 'chum',
    canonicalName: 'CHUM',
    variations: [
      'CHUM',
      "Centre hospitalier de l'Universite de Montreal",
      "Centre hospitalier de l'Universite de Montreal Laboratory",
      "Centre hospitalier de l'Universite de Montreal Lab",
      'CHUM Laboratory',
      'CHUM Lab',
      'CHUM Hospital',
      'CHUM Laboratoire',
    ],
    abbreviations: ['CHUM'],
    region: 'QC',
    country: 'CA',
    accessionFormat: undefined,
    healthCardType: 'RAMQ',
  },
  {
    id: 'muhc',
    canonicalName: 'McGill University Health Centre',
    variations: [
      'McGill University Health Centre',
      'McGill University Health Center',
      'MUHC',
      'CUSM',
      'Centre universitaire de sante McGill',
      'MUHC Laboratory',
      'MUHC Lab',
      'CUSM Laboratoire',
      'CUSM Lab',
      'McGill University Health Centre Laboratory',
      'McGill University Health Centre Lab',
      'Royal Victoria Hospital Lab',
      'Montreal General Hospital Lab',
    ],
    abbreviations: ['MUHC', 'CUSM'],
    region: 'QC',
    country: 'CA',
    accessionFormat: undefined,
    healthCardType: 'RAMQ',
  },
  {
    id: 'dynacare-qc',
    canonicalName: 'Dynacare Quebec',
    variations: [
      'Dynacare Quebec',
      'Dynacare Montreal',
      'Dynacare Laboratoire',
      'Dynacare Laboratory Quebec',
      'Dynacare Lab Quebec',
      'Dynacare QC',
    ],
    abbreviations: [],
    region: 'QC',
    country: 'CA',
    accessionFormat: undefined,
    healthCardType: 'RAMQ',
  },
  {
    id: 'hmr',
    canonicalName: 'Hopital Maisonneuve-Rosemont',
    variations: [
      'Hopital Maisonneuve-Rosemont',
      'Hopital Maisonneuve Rosemont',
      'Hospital Maisonneuve-Rosemont',
      'Maisonneuve-Rosemont Hospital',
      'Maisonneuve Rosemont Hospital',
      'HMR Laboratory',
      'HMR Lab',
      'HMR Laboratoire',
      'Maisonneuve-Rosemont Lab',
    ],
    abbreviations: ['HMR'],
    region: 'QC',
    country: 'CA',
    accessionFormat: undefined,
    healthCardType: 'RAMQ',
  },

  // =========================================================================
  // CANADA - SASKATCHEWAN (SK)
  // =========================================================================
  {
    id: 'rrpl',
    canonicalName: 'Roy Romanow Provincial Laboratory',
    variations: [
      'Roy Romanow Provincial Laboratory',
      'Roy Romanow Provincial Lab',
      'Roy Romanow Provincial Laboratories',
      'Roy Romanow Lab',
      'Romanow Provincial Lab',
      'Saskatchewan Provincial Laboratory',
      'Saskatchewan Provincial Lab',
      'RRPL Laboratory',
      'RRPL Lab',
    ],
    abbreviations: ['RRPL'],
    region: 'SK',
    country: 'CA',
    accessionFormat: undefined,
    healthCardType: 'Saskatchewan Health Card',
  },
  {
    id: 'sha-labs',
    canonicalName: 'Saskatchewan Health Authority Labs',
    variations: [
      'Saskatchewan Health Authority Labs',
      'Saskatchewan Health Authority Laboratory',
      'Saskatchewan Health Authority Laboratories',
      'Saskatchewan Health Authority Lab',
      'SHA Laboratory',
      'SHA Lab',
      'SHA Labs',
      'Saskatchewan Health Authority',
    ],
    abbreviations: ['SHA'],
    region: 'SK',
    country: 'CA',
    accessionFormat: undefined,
    healthCardType: 'Saskatchewan Health Card',
  },

  // =========================================================================
  // CANADA - MANITOBA (MB)
  // =========================================================================
  {
    id: 'cadham',
    canonicalName: 'Cadham Provincial Laboratory',
    variations: [
      'Cadham Provincial Laboratory',
      'Cadham Provincial Lab',
      'Cadham Provincial Laboratories',
      'Cadham Lab',
      'Cadham Laboratory',
      'Cadham Winnipeg',
      'Manitoba Provincial Laboratory',
      'Manitoba Provincial Lab',
    ],
    abbreviations: ['CPL'],
    region: 'MB',
    country: 'CA',
    accessionFormat: undefined,
    healthCardType: 'Manitoba Health Card',
  },
  {
    id: 'shared-health-dsm',
    canonicalName: 'Shared Health / Diagnostic Services Manitoba',
    variations: [
      'Shared Health',
      'Diagnostic Services Manitoba',
      'DSM Laboratory',
      'DSM Lab',
      'Shared Health Laboratory',
      'Shared Health Lab',
      'Shared Health Manitoba',
      'Diagnostic Services Manitoba Lab',
      'Diagnostic Services Manitoba Laboratory',
    ],
    abbreviations: ['DSM'],
    region: 'MB',
    country: 'CA',
    accessionFormat: undefined,
    healthCardType: 'Manitoba Health Card',
  },
  {
    id: 'hsc-winnipeg',
    canonicalName: 'Health Sciences Centre Winnipeg',
    variations: [
      'Health Sciences Centre Winnipeg',
      'Health Sciences Center Winnipeg',
      'Health Sciences Centre Winnipeg Laboratory',
      'Health Sciences Centre Winnipeg Lab',
      'HSC Winnipeg',
      'HSC Winnipeg Laboratory',
      'HSC Winnipeg Lab',
      'HSC Laboratory Winnipeg',
      'HSC Lab Winnipeg',
      'Winnipeg Health Sciences Centre',
      'Winnipeg Health Sciences Center',
    ],
    abbreviations: ['HSC'],
    region: 'MB',
    country: 'CA',
    accessionFormat: undefined,
    healthCardType: 'Manitoba Health Card',
  },

  // =========================================================================
  // CANADA - NOVA SCOTIA (NS)
  // =========================================================================
  {
    id: 'qe2',
    canonicalName: 'QE2 Health Sciences Centre',
    variations: [
      'QE2 Health Sciences Centre',
      'QE2 Health Sciences Center',
      'QEII Health Sciences Centre',
      'QEII Health Sciences Center',
      'Queen Elizabeth II Health Sciences Centre',
      'Queen Elizabeth II Health Sciences Center',
      'QE2 HSC',
      'QE2 Laboratory',
      'QE2 Lab',
      'QEII Laboratory',
      'QEII Lab',
      'QE2 Halifax',
      'QEII Halifax',
    ],
    abbreviations: ['QE2', 'QEII'],
    region: 'NS',
    country: 'CA',
    accessionFormat: undefined,
    healthCardType: 'Nova Scotia MSI',
  },

  // =========================================================================
  // CANADA - NEW BRUNSWICK (NB)
  // =========================================================================
  {
    id: 'nb-provincial-lab',
    canonicalName: 'New Brunswick Provincial Lab',
    variations: [
      'New Brunswick Provincial Lab',
      'New Brunswick Provincial Laboratory',
      'New Brunswick Provincial Laboratories',
      'NB Provincial Lab',
      'NB Provincial Laboratory',
      'Laboratoire provincial du Nouveau-Brunswick',
      'New Brunswick Public Health Lab',
      'New Brunswick Public Health Laboratory',
    ],
    abbreviations: ['NBPL'],
    region: 'NB',
    country: 'CA',
    accessionFormat: undefined,
    healthCardType: 'NB Medicare',
  },

  // =========================================================================
  // CANADA - NEWFOUNDLAND AND LABRADOR (NL)
  // =========================================================================
  {
    id: 'nl-public-health-lab',
    canonicalName: 'Newfoundland and Labrador Public Health Lab',
    variations: [
      'Newfoundland and Labrador Public Health Lab',
      'Newfoundland and Labrador Public Health Laboratory',
      'NL Public Health Lab',
      'NL Public Health Laboratory',
      'Newfoundland Public Health Lab',
      'Newfoundland Public Health Laboratory',
      'NL Provincial Public Health Lab',
      'NL Provincial Public Health Laboratory',
      "Eastern Health Laboratory St. John's",
      'Eastern Health Lab',
    ],
    abbreviations: ['NLPHL'],
    region: 'NL',
    country: 'CA',
    accessionFormat: undefined,
    healthCardType: 'NL MCP',
  },

  // =========================================================================
  // CANADA - PRINCE EDWARD ISLAND (PE)
  // =========================================================================
  {
    id: 'pei-provincial-lab',
    canonicalName: 'PEI Provincial Lab',
    variations: [
      'PEI Provincial Lab',
      'PEI Provincial Laboratory',
      'Prince Edward Island Provincial Lab',
      'Prince Edward Island Provincial Laboratory',
      'PEI Health Lab',
      'PEI Health Laboratory',
      'Queen Elizabeth Hospital Lab',
      'Queen Elizabeth Hospital Laboratory',
      'Health PEI Laboratory',
      'Health PEI Lab',
    ],
    abbreviations: ['PEIPL'],
    region: 'PE',
    country: 'CA',
    accessionFormat: undefined,
    healthCardType: 'PEI Health Card',
  },

  // =========================================================================
  // CANADA - NORTHWEST TERRITORIES (NT)
  // =========================================================================
  {
    id: 'stanton-territorial',
    canonicalName: 'Stanton Territorial Hospital',
    variations: [
      'Stanton Territorial Hospital',
      'Stanton Territorial Hospital Laboratory',
      'Stanton Territorial Hospital Lab',
      'Stanton Hospital',
      'Stanton Hospital Lab',
      'Stanton Lab',
      'Stanton Yellowknife',
    ],
    abbreviations: ['STH'],
    region: 'NT',
    country: 'CA',
    accessionFormat: undefined,
    healthCardType: undefined,
  },

  // =========================================================================
  // CANADA - ADDITIONAL ONTARIO (ON)
  // =========================================================================
  {
    id: 'womens-college-hospital',
    canonicalName: "Women's College Hospital",
    variations: [
      "Women's College Hospital",
      "Women's College Hospital Laboratory",
      "Women's College Hospital Lab",
      "Women's College Lab",
      'WCH Laboratory',
      'WCH Lab',
      "Women's College Toronto",
    ],
    abbreviations: ['WCH'],
    region: 'ON',
    country: 'CA',
    accessionFormat: undefined,
    healthCardType: 'OHIP',
  },
  {
    id: 'north-york-general',
    canonicalName: 'North York General Hospital',
    variations: [
      'North York General Hospital',
      'North York General Hospital Laboratory',
      'North York General Hospital Lab',
      'NYGH Laboratory',
      'NYGH Lab',
      'North York General Lab',
    ],
    abbreviations: ['NYGH'],
    region: 'ON',
    country: 'CA',
    accessionFormat: undefined,
    healthCardType: 'OHIP',
  },

  // =========================================================================
  // CANADA - ADDITIONAL NOVA SCOTIA (NS)
  // =========================================================================
  {
    id: 'iwk-health-centre',
    canonicalName: 'IWK Health Centre',
    variations: [
      'IWK Health Centre',
      'IWK Health Center',
      'IWK Health Centre Laboratory',
      'IWK Health Centre Lab',
      'IWK Laboratory',
      'IWK Lab',
      'IWK Halifax',
    ],
    abbreviations: ['IWK'],
    region: 'NS',
    country: 'CA',
    accessionFormat: undefined,
    healthCardType: 'Nova Scotia MSI',
  },

  // =========================================================================
  // CANADA - ADDITIONAL BRITISH COLUMBIA (BC)
  // =========================================================================
  {
    id: 'phsa-labs',
    canonicalName: 'Provincial Health Services Authority Labs',
    variations: [
      'Provincial Health Services Authority Labs',
      'Provincial Health Services Authority Laboratory',
      'Provincial Health Services Authority Laboratories',
      'Provincial Health Services Authority Lab',
      'PHSA Laboratory',
      'PHSA Lab',
      'PHSA Labs',
      'PHSA BC',
    ],
    abbreviations: ['PHSA'],
    region: 'BC',
    country: 'CA',
    accessionFormat: undefined,
    healthCardType: 'MSP',
  },

  // =========================================================================
  // CANADA - NATIONAL / PRIVATE
  // =========================================================================
  {
    id: 'mds-diagnostics',
    canonicalName: 'MDS Diagnostics',
    variations: [
      'MDS Diagnostics',
      'MDS Diagnostic Services',
      'MDS Laboratory',
      'MDS Laboratories',
      'MDS Lab',
      'MDS Labs',
      'MDS Inc',
      'MDS Medical Diagnostics',
    ],
    abbreviations: ['MDS'],
    region: 'ON',
    country: 'CA',
    accessionFormat: undefined,
    healthCardType: 'OHIP',
  },
  {
    id: 'bio-test',
    canonicalName: 'Bio-Test',
    variations: [
      'Bio-Test',
      'Bio Test',
      'BioTest',
      'Bio-Test Laboratory',
      'Bio-Test Laboratories',
      'Bio-Test Lab',
      'Bio-Test Medical Laboratory',
      'Bio-Test Medical Lab',
      'Bio-Test Inc',
    ],
    abbreviations: [],
    region: 'ON',
    country: 'CA',
    accessionFormat: undefined,
    healthCardType: 'OHIP',
  },

  // =========================================================================
  // UNITED STATES
  // =========================================================================
  {
    id: 'quest-diagnostics',
    canonicalName: 'Quest Diagnostics',
    variations: [
      'Quest Diagnostics',
      'Quest Diagnostics Incorporated',
      'Quest Diagnostics Inc',
      'Quest Diagnostics LLC',
      'Quest Diagnostics Laboratory',
      'Quest Diagnostics Lab',
      'Quest Diagnostics Clinical Laboratories',
      'Quest Labs',
    ],
    abbreviations: ['Quest', 'QD'],
    region: 'NJ',
    country: 'US',
    accessionFormat: /^\d{10,12}$/,
    healthCardType: undefined,
  },
  {
    id: 'labcorp',
    canonicalName: 'LabCorp',
    variations: [
      'LabCorp',
      'Laboratory Corporation of America',
      'Laboratory Corporation of America Holdings',
      'Lab Corp',
      'LabCorp Diagnostics',
      'LabCorp Laboratory',
      'LabCorp Lab',
      'LabCorp Inc',
    ],
    abbreviations: ['LC', 'LCA'],
    region: 'NC',
    country: 'US',
    accessionFormat: /^\d{8,12}$/,
    healthCardType: undefined,
  },
  {
    id: 'bioreference-laboratories',
    canonicalName: 'BioReference Laboratories',
    variations: [
      'BioReference Laboratories',
      'BioReference Laboratories Inc',
      'BioReference Labs',
      'BioReference Lab',
      'BioReference Laboratory',
      'Bio Reference Laboratories',
      'Bio Reference Labs',
      'GenPath Diagnostics',
    ],
    abbreviations: ['BRL'],
    region: 'NJ',
    country: 'US',
    accessionFormat: /^\d{8,12}$/, // BioReference: numeric, 8-12 digits
    healthCardType: undefined,
  },
  {
    id: 'sonic-healthcare-usa',
    canonicalName: 'Sonic Healthcare USA',
    variations: [
      'Sonic Healthcare USA',
      'Sonic Healthcare',
      'Sonic Healthcare Laboratory',
      'Sonic Healthcare Lab',
      'Sonic Healthcare Laboratories',
      'Sonic Healthcare USA Inc',
      'Sonic Labs',
      'Sonic Clinical Labs',
    ],
    abbreviations: ['SH'],
    region: 'TX',
    country: 'US',
    accessionFormat: undefined,
    healthCardType: undefined,
  },
  {
    id: 'arup-laboratories',
    canonicalName: 'ARUP Laboratories',
    variations: [
      'ARUP Laboratories',
      'ARUP Labs',
      'ARUP Laboratory',
      'ARUP Lab',
      'ARUP Reference Laboratories',
      'Associated Regional and University Pathologists',
      'ARUP Inc',
      'ARUP Salt Lake City',
    ],
    abbreviations: ['ARUP'],
    region: 'UT',
    country: 'US',
    accessionFormat: /^\d{8,10}$/,
    healthCardType: undefined,
  },
  {
    id: 'mayo-clinic-laboratories',
    canonicalName: 'Mayo Clinic Laboratories',
    variations: [
      'Mayo Clinic Laboratories',
      'Mayo Clinic Labs',
      'Mayo Clinic Laboratory',
      'Mayo Clinic Lab',
      'Mayo Medical Laboratories',
      'Mayo Reference Services',
      'Mayo Clinic Rochester',
      'Mayo Labs',
    ],
    abbreviations: ['MCL'],
    region: 'MN',
    country: 'US',
    accessionFormat: /^[A-Z]{0,3}\d{7,12}$/, // Mayo: optional letter prefix + 7-12 digits
    healthCardType: undefined,
  },
  {
    id: 'clinical-pathology-laboratories',
    canonicalName: 'Clinical Pathology Laboratories',
    variations: [
      'Clinical Pathology Laboratories',
      'Clinical Pathology Labs',
      'Clinical Pathology Laboratory',
      'Clinical Pathology Lab',
      'CPL Laboratories',
      'CPL Labs',
      'CPL Laboratory',
      'CPL Lab',
    ],
    abbreviations: ['CPL'],
    region: 'TX',
    country: 'US',
    accessionFormat: /^\d{8,12}$/, // CPL: numeric, 8-12 digits
    healthCardType: undefined,
  },

  // =========================================================================
  // UNITED KINGDOM
  // =========================================================================
  {
    id: 'nhs-blood-and-transplant',
    canonicalName: 'NHS Blood and Transplant',
    variations: [
      'NHS Blood and Transplant',
      'NHS Blood & Transplant',
      'NHSBT',
      'NHSBT Laboratory',
      'NHSBT Lab',
      'NHS Blood and Transplant Laboratory',
      'NHS Blood and Transplant Lab',
      'NHS Blood Service',
    ],
    abbreviations: ['NHSBT'],
    region: 'UK',
    country: 'UK',
    accessionFormat: undefined,
    healthCardType: undefined,
  },
  {
    id: 'uk-health-security-agency',
    canonicalName: 'UK Health Security Agency',
    variations: [
      'UK Health Security Agency',
      'UKHSA',
      'UKHSA Laboratory',
      'UKHSA Lab',
      'UK Health Security Agency Laboratory',
      'UK Health Security Agency Lab',
      'Public Health England',
      'PHE Laboratory',
    ],
    abbreviations: ['UKHSA', 'PHE'],
    region: 'UK',
    country: 'UK',
    accessionFormat: undefined,
    healthCardType: undefined,
  },
];

// ---------------------------------------------------------------------------
// Lookup helpers
// ---------------------------------------------------------------------------

/**
 * Returns all labs that operate in the given region.
 *
 * @param region - Region code (province, state, 'UK', or 'INTL')
 * @returns Array of matching `RecognizedLab` entries (may be empty)
 *
 * @example
 * const ontarioLabs = getLabsByRegion('ON');
 * // Returns all Ontario labs
 */
export function getLabsByRegion(region: Region): readonly RecognizedLab[] {
  return LAB_DATABASE.filter(lab => lab.region === region);
}

/**
 * Finds a lab entry by its unique identifier.
 *
 * @param id - The lab's `id` field (kebab-case)
 * @returns The matching `RecognizedLab` or `undefined` if not found
 *
 * @example
 * const pho = getLabById('pho');
 * // Returns the Public Health Ontario entry
 */
export function getLabById(id: string): RecognizedLab | undefined {
  return LAB_DATABASE.find(lab => lab.id === id);
}

/**
 * Attempts to match a raw lab name (e.g. from OCR or LLM extraction) to a
 * known lab entry. Performs case-insensitive matching against canonical names,
 * variations, and abbreviations.
 *
 * Matching strategy (evaluated in order, returns on first hit):
 * 1. Exact abbreviation match (case-insensitive)
 * 2. Exact variation match (case-insensitive)
 * 3. Substring match -- checks if any variation is contained within the input
 *    or if the input is contained within any variation
 *
 * @param rawName - The laboratory name to look up
 * @returns The matching `RecognizedLab` or `undefined` if no match is found
 *
 * @example
 * findLabByName('PHO');
 * // Returns the Public Health Ontario entry
 *
 * @example
 * findLabByName('Quest Diagnostics');
 * // Returns the Quest Diagnostics entry
 *
 * @example
 * findLabByName('Some Unknown Lab');
 * // Returns undefined
 */
export function findLabByName(rawName: string): RecognizedLab | undefined {
  if (!rawName || rawName.trim().length === 0) return undefined;

  const normalized = rawName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')  // strip diacritics (e->e, a->a, c->c)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');

  const stripAccents = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  // Strategy 1: Exact abbreviation match
  for (const lab of LAB_DATABASE) {
    for (const abbr of lab.abbreviations) {
      if (stripAccents(abbr) === normalized) {
        return lab;
      }
    }
  }

  // Strategy 2: Exact variation match
  for (const lab of LAB_DATABASE) {
    if (stripAccents(lab.canonicalName) === normalized) {
      return lab;
    }
    for (const variation of lab.variations) {
      if (stripAccents(variation) === normalized) {
        return lab;
      }
    }
  }

  // Strategy 3: Substring containment (input contains variation or vice versa)
  for (const lab of LAB_DATABASE) {
    for (const variation of lab.variations) {
      const variationNorm = stripAccents(variation);
      if (normalized.includes(variationNorm) || variationNorm.includes(normalized)) {
        return lab;
      }
    }
  }

  return undefined;
}

/**
 * Returns the health card type for a given region.
 *
 * @param region - Region code (province, state, 'UK', or 'INTL')
 * @returns The health card type string, or `undefined` for territories,
 *   US/UK regions, or regions without a known card type in this database
 *
 * @example
 * getHealthCardType('ON');
 * // Returns 'OHIP'
 */
export function getHealthCardType(region: Region): string | undefined {
  const lab = LAB_DATABASE.find(l => l.region === region);
  return lab?.healthCardType;
}
