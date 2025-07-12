export interface EnvironmentConfig {
  environment: string;
  region: string;
  project: string;
  owner: string;
  costCenter: string;
  terraformOrganization: string;
  terraformWorkspace: string;
  terraformHostname: string;
  enableMonitoring: boolean;
  enableEncryption: boolean;
  enableLogging: boolean;
  enableVpc: boolean;
  enableSecretsManager: boolean;
  tags: Record<string, string>;
}

export class EnvironmentConfigBuilder {
  private config: Partial<EnvironmentConfig> = {};

  withEnvironment(environment: string): EnvironmentConfigBuilder {
    this.config.environment = environment;
    return this;
  }

  withRegion(region: string): EnvironmentConfigBuilder {
    this.config.region = region;
    return this;
  }

  withProject(project: string): EnvironmentConfigBuilder {
    this.config.project = project;
    return this;
  }

  withOwner(owner: string): EnvironmentConfigBuilder {
    this.config.owner = owner;
    return this;
  }

  withCostCenter(costCenter: string): EnvironmentConfigBuilder {
    this.config.costCenter = costCenter;
    return this;
  }

  withTerraformConfig(organization: string, workspace: string, hostname?: string): EnvironmentConfigBuilder {
    this.config.terraformOrganization = organization;
    this.config.terraformWorkspace = workspace;
    this.config.terraformHostname = hostname || 'app.terraform.io';
    return this;
  }

  withMonitoring(enabled: boolean): EnvironmentConfigBuilder {
    this.config.enableMonitoring = enabled;
    return this;
  }

  withEncryption(enabled: boolean): EnvironmentConfigBuilder {
    this.config.enableEncryption = enabled;
    return this;
  }

  withLogging(enabled: boolean): EnvironmentConfigBuilder {
    this.config.enableLogging = enabled;
    return this;
  }

  withVpc(enabled: boolean): EnvironmentConfigBuilder {
    this.config.enableVpc = enabled;
    return this;
  }

  withSecretsManager(enabled: boolean): EnvironmentConfigBuilder {
    this.config.enableSecretsManager = enabled;
    return this;
  }

  withTags(tags: Record<string, string>): EnvironmentConfigBuilder {
    this.config.tags = tags;
    return this;
  }

  build(): EnvironmentConfig {
    if (!this.config.environment) {
      throw new Error('Environment is required');
    }
    if (!this.config.region) {
      throw new Error('Region is required');
    }
    if (!this.config.project) {
      throw new Error('Project is required');
    }
    if (!this.config.owner) {
      throw new Error('Owner is required');
    }
    if (!this.config.costCenter) {
      throw new Error('Cost center is required');
    }
    if (!this.config.terraformOrganization) {
      throw new Error('Terraform organization is required');
    }
    if (!this.config.terraformWorkspace) {
      throw new Error('Terraform workspace is required');
    }

    const defaultTags = {
      Environment: this.config.environment!,
      Project: this.config.project!,
      Owner: this.config.owner!,
      CostCenter: this.config.costCenter!,
      ManagedBy: 'terraform',
      CreatedAt: new Date().toISOString(),
    };

    return {
      environment: this.config.environment!,
      region: this.config.region!,
      project: this.config.project!,
      owner: this.config.owner!,
      costCenter: this.config.costCenter!,
      terraformOrganization: this.config.terraformOrganization!,
      terraformWorkspace: this.config.terraformWorkspace!,
      terraformHostname: this.config.terraformHostname!,
      enableMonitoring: this.config.enableMonitoring ?? true,
      enableEncryption: this.config.enableEncryption ?? true,
      enableLogging: this.config.enableLogging ?? true,
      enableVpc: this.config.enableVpc ?? true,
      enableSecretsManager: this.config.enableSecretsManager ?? true,
      tags: { ...defaultTags, ...this.config.tags },
    };
  }
}

export function getEnvironmentConfig(): EnvironmentConfig {
  const environment = process.env.ENVIRONMENT || 'development';
  
  switch (environment) {
    case 'development':
      return new EnvironmentConfigBuilder()
        .withEnvironment('development')
        .withRegion('ap-southeast-2')
        .withProject('case-studies')
        .withOwner('raymond.boles')
        .withCostCenter('engineering')
        .withTerraformConfig(
          process.env.TERRAFORM_ORGANISATION || 'pawlution',
          process.env.TERRAFORM_WORKSPACE || 'case-studies-kubernetes-development',
          process.env.TERRAFORM_HOSTNAME
        )
        .withMonitoring(true)
        .withEncryption(true)
        .withLogging(true)
        .withVpc(true)
        .withSecretsManager(true)
        .withTags({
          Purpose: 'development',
          DataClassification: 'internal',
          Environment: 'development',
          Compliance: 'basic',
        })
        .build();

    case 'staging':
      return new EnvironmentConfigBuilder()
        .withEnvironment('staging')
        .withRegion('ap-southeast-2')
        .withProject('case-studies')
        .withOwner('raymond.boles')
        .withCostCenter('engineering')
        .withTerraformConfig(
          process.env.TERRAFORM_ORGANISATION || 'pawlution',
          process.env.TERRAFORM_WORKSPACE || 'case-studies-kubernetes-staging',
          process.env.TERRAFORM_HOSTNAME
        )
        .withMonitoring(true)
        .withEncryption(true)
        .withLogging(true)
        .withVpc(true)
        .withSecretsManager(true)
        .withTags({
          Purpose: 'staging',
          DataClassification: 'internal',
          Environment: 'staging',
          Compliance: 'basic',
        })
        .build();

    case 'production':
      return new EnvironmentConfigBuilder()
        .withEnvironment('production')
        .withRegion('ap-southeast-2')
        .withProject('case-studies')
        .withOwner('raymond.boles')
        .withCostCenter('engineering')
        .withTerraformConfig(
          process.env.TERRAFORM_ORGANISATION || 'pawlution',
          process.env.TERRAFORM_WORKSPACE || 'case-studies-kubernetes-production',
          process.env.TERRAFORM_HOSTNAME
        )
        .withMonitoring(true)
        .withEncryption(true)
        .withLogging(true)
        .withVpc(true)
        .withSecretsManager(true)
        .withTags({
          Purpose: 'production',
          DataClassification: 'confidential',
          Environment: 'production',
          Compliance: 'soc2',
        })
        .build();

    default:
      throw new Error(`Unknown environment: ${environment}`);
  }
} 