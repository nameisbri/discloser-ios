/**
 * @deprecated Use labDatabase.ts instead. This file is a backward-compatibility shim.
 */
export {
  type Region as CanadianProvince,
  type RecognizedLab as CanadianLab,
  LAB_DATABASE as CANADIAN_LAB_DATABASE,
  getLabsByRegion as getLabsByProvince,
  getLabById,
  findLabByName,
  getHealthCardType,
} from './labDatabase';
