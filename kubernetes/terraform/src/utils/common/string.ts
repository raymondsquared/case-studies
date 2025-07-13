import { Environment } from './enums';

export function cleanString(name?: string): string {
  return (name ?? '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase()
    .trim();
}

export function cleanEnvironment(inputEnv: Environment): string {
  let _env;
  switch (inputEnv) {
    case Environment.PRODUCTION:
      _env = 'prod';
      break;
    case Environment.STAGING:
      _env = 'stg';
      break;
    case Environment.DEVELOPMENT:
    default:
      _env = 'dev';
      break;
  }
  return _env.trim();
}
