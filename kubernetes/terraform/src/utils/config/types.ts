import { Tags } from '../../utils/tagging/types';
import { Environment, Vendor, Region } from '../common/enums';

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

export interface AwsConfig {
  awsAccountId: string;
}

export interface CloudConfig {
  enableEncryption: boolean;
  enableSecretsManager: boolean;
  enableNatGateway?: boolean;
  vpcCIDRBlock?: string;
  publicSubnetCIDRBlocks?: string[];
  privateSubnetCIDRBlocks?: string[];
  tags?: Tags;
  awsConfig?: AwsConfig;
}

export interface KubernetesConfig {
  eksVersion?: string;
  eksEndpointPublicAccess?: boolean;
  eksControlPlaneLogTypes?: string[];
  eksAddOns?: string[];
}

export interface Config extends MainConfig, TerraformConfig, CloudConfig, KubernetesConfig {}
