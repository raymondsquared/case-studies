import { Environment, Vendor, Region } from '../common/enums';
import { Tags } from '../../utils/tagging/types';

export interface MainConfig {
  name: string;
  environment: Environment;
  resourceType: string;
  region: Region;
  vendor: Vendor;
  layer?: string;
}

export interface TerraformConfig {
  terraformOrganisation: string;
  terraformWorkspace: string;
  terraformHostname: string;
}

export interface CloudConfig {
  enableEncryption: boolean;
  enableSecretsManager: boolean;
  enablePublicVPC?: boolean;
  tags: Tags;
}

export interface Config extends MainConfig, TerraformConfig, CloudConfig {} 
