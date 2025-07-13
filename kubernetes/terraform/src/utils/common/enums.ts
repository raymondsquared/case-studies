export enum Confidentiality {
  PUBLIC = 0,
  INTERNAL = 1,
  CONFIDENTIAL = 2,
  RESTRICTED = 3,
  HIGHLY_RESTRICTED = 4,
  TOP_SECRET = 5,
}

export enum Criticality {
  NONE = 0,
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
  CRITICAL = 4,
  MISSION_CRITICAL = 5,
}

export enum Vendor {
  OTHERS = 'OTHERS',
  ON_PREMISES = 'ON_PREMISES',
  AWS = 'AWS',
  AZURE = 'AZURE',
  GCP = 'GCP',
}

export enum Region {
  OTHERS = 'OTHERS',
  // Australia - East
  AUE = 'AUE',
  // US - East
  USE = 'USE',
  // Asia - South East
  ASIASE = 'ASIASE',
  // Europe - West
  EUW = 'EUW',
}

export enum Environment {
  DEVELOPMENT = 'development',
  STAGING = 'staging',
  PRODUCTION = 'production',
}
