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
  AUSTRALIA_EAST = 'AUSTRALIA_EAST',
  US_EAST = 'US_EAST',
  ASIA_SOUTHEAST = 'ASIA_SOUTHEAST',
  EUROPE_WEST = 'EUROPE_WEST',
}

export enum Environment {
  OTHERS = 'others',
  DEVELOPMENT = 'development',
  STAGING = 'staging',
  PRODUCTION = 'production',
}
