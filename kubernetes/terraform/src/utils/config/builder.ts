import { Region, Environment, Vendor } from '../common/enums';
import {
  DEFAULT_TERRAFORM_HOSTNAME,
  DEFAULT_EKS_VERSION,
  DEFAULT_EKS_CORE_ADD_ONS,
  DEFAULT_EKS_CONTROL_PLANE_LOG_TYPES,
  DEFAULT_VPC_CIDR_BLOCK,
} from '../common/constants';
import { Tags } from '../../utils/tagging/types';
import { Config, MainConfig, TerraformConfig, CloudConfig, KubernetesConfig } from './types';

export class ConfigBuilder {
  private config: Partial<MainConfig & TerraformConfig & CloudConfig & KubernetesConfig> = {};

  withEnvironment(environment: Environment): ConfigBuilder {
    this.config.environment = environment;
    return this;
  }

  withName(name: string): ConfigBuilder {
    this.config.name = name;
    return this;
  }

  withResourceType(resourceType: string): ConfigBuilder {
    this.config.resourceType = resourceType;
    return this;
  }

  withTerraformConfig(workspace: string, organisation: string, hostname?: string): ConfigBuilder {
    this.config.terraformWorkspace = workspace;
    this.config.terraformOrganisation = organisation;
    this.config.terraformHostname = hostname || DEFAULT_TERRAFORM_HOSTNAME;
    return this;
  }

  withCidrBlock(vpcCIDRBlock: string): ConfigBuilder {
    this.config.vpcCIDRBlock = vpcCIDRBlock;
    return this;
  }

  withPublicSubnetCidrBlocks(publicSubnetCIDRBlocks: string[]): ConfigBuilder {
    this.config.publicSubnetCIDRBlocks = publicSubnetCIDRBlocks;
    return this;
  }

  withPrivateSubnetCidrBlocks(privateSubnetCIDRBlocks: string[]): ConfigBuilder {
    this.config.privateSubnetCIDRBlocks = privateSubnetCIDRBlocks;
    return this;
  }

  withRegion(region: Region): ConfigBuilder {
    this.config.region = region;
    return this;
  }

  withTags(tags: Tags): ConfigBuilder {
    this.config.tags = tags;
    return this;
  }

  withVendor(vendor: Vendor): ConfigBuilder {
    this.config.vendor = vendor;
    return this;
  }

  withAWSAccountId(awsAccountId: string): ConfigBuilder {
    this.config.awsConfig = { awsAccountId };
    return this;
  }

  withEnableNatGateway(enableNatGateway: boolean): ConfigBuilder {
    this.config.enableNatGateway = enableNatGateway;
    return this;
  }

  withEksVersion(eksVersion: string): ConfigBuilder {
    this.config.eksVersion = eksVersion;
    return this;
  }

  withEksEndpointPublicAccess(eksEndpointPublicAccess: boolean): ConfigBuilder {
    this.config.eksEndpointPublicAccess = eksEndpointPublicAccess;
    return this;
  }

  withEksControlPlaneLogTypes(eksControlPlaneLogTypes: string[]): ConfigBuilder {
    this.config.eksControlPlaneLogTypes = eksControlPlaneLogTypes;
    return this;
  }

  withEksAddOns(eksAddOns: string[]): ConfigBuilder {
    this.config.eksAddOns = eksAddOns;
    return this;
  }

  build(): Config {
    if (!this.config.terraformWorkspace || !this.config.terraformOrganisation) {
      throw new Error('Terraform workspace and organisation are required');
    }

    return {
      name: this.config.name || '',
      region: this.config.region || Region.OTHERS,
      environment: this.config.environment || Environment.DEVELOPMENT,
      resourceType: this.config.resourceType || '',
      vendor: this.config.vendor || Vendor.OTHERS,
      terraformOrganisation: this.config.terraformOrganisation,
      terraformWorkspace: this.config.terraformWorkspace,
      terraformHostname: this.config.terraformHostname || DEFAULT_TERRAFORM_HOSTNAME,
      enableEncryption: true,
      enableSecretsManager: true,
      enableNatGateway: this.config.enableNatGateway ?? false,
      vpcCIDRBlock: this.config.vpcCIDRBlock || DEFAULT_VPC_CIDR_BLOCK,
      publicSubnetCIDRBlocks: this.config.publicSubnetCIDRBlocks,
      privateSubnetCIDRBlocks: this.config.privateSubnetCIDRBlocks,
      ...(this.config.tags ? { tags: this.config.tags } : {}),
      ...(this.config.awsConfig ? { awsConfig: this.config.awsConfig } : {}),
      eksVersion: this.config.eksVersion || DEFAULT_EKS_VERSION,
      eksEndpointPublicAccess: this.config.eksEndpointPublicAccess ?? false,
      eksControlPlaneLogTypes:
        this.config.eksControlPlaneLogTypes || DEFAULT_EKS_CONTROL_PLANE_LOG_TYPES,
      eksAddOns: this.config.eksAddOns || DEFAULT_EKS_CORE_ADD_ONS,
    } as Config;
  }
}
