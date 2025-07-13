import { Region, Environment, Vendor } from '../common/enums';
import { DEFAULT_TERRAFORM_HOSTNAME } from '../common/constants';
import { Tags } from '../../utils/tagging/types';
import { Config, MainConfig, TerraformConfig, CloudConfig } from './types';

export class ConfigBuilder {
  private config: Partial<MainConfig & TerraformConfig & CloudConfig> = {};

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

  withPublicVPC(enabled: boolean): ConfigBuilder {
    this.config.enablePublicVPC = enabled;
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
      ...(this.config.enablePublicVPC !== undefined
        ? { enablePublicVPC: this.config.enablePublicVPC }
        : {}),
      tags: { ...this.config.tags },
    } as Config;
  }
}
