import { Environment, Confidentiality, Criticality, Vendor, Region } from '../common/enums';

export interface BaseTags {
  name: string;
  environment: Environment;
  version: string;
  layer: string;
  vendor: Vendor;
  region: Region;
  confidentiality: Confidentiality;
  criticality: Criticality;
  owner: string;
  project: string;
  costCenter: string;

  compliance?: string;
  customer?: string;
  runningSchedule?: string;
  backupSchedule?: string;
}

export type Tags = { [key: string]: string };
