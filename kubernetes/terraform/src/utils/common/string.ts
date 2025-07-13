import { Environment, Region } from './enums';

export function cleanString(name?: string): string {
  return (name ?? '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase()
    .trim();
}

let _env: string;
export function cleanEnvironment(inputEnv: Environment): string {
  switch (inputEnv) {
    case Environment.PRODUCTION:
      _env = 'prod';
      break;
    case Environment.STAGING:
      _env = 'stg';
      break;
    case Environment.OTHERS:
      _env = 'o';
      break;
    case Environment.DEVELOPMENT:
    default:
      _env = 'dev';
      break;
  }
  return _env.trim();
}

let region: string;
export function cleanRegion(inputRegion: Region): string {
  switch (inputRegion) {
    case Region.AUSTRALIA_EAST:
      region = 'aue';
      break;
    case Region.US_EAST:
      region = 'use';
      break;
    case Region.ASIA_SOUTHEAST:
      region = 'ase';
      break;
    case Region.EUROPE_WEST:
      region = 'euw';
      break;
    case Region.OTHERS:
    default:
      region = 'o';
      break;
  }
  return region.trim();
}
