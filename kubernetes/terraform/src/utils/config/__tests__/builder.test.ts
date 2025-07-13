import { ConfigBuilder } from '../builder';
import { Environment, Region, Vendor } from '../../common/enums';
import { DEFAULT_TERRAFORM_HOSTNAME } from '../../common/constants';

describe('ConfigBuilder', () => {
  describe('Given basic configuration', () => {
    it('When building a minimal configuration with required terraform settings, Then it should have correct default values', () => {
      const config = new ConfigBuilder().withTerraformConfig('test-workspace', 'test-org').build();

      expect(config.name).toBe('');
      expect(config.environment).toBe(Environment.DEVELOPMENT);
      expect(config.resourceType).toBe('');
      expect(config.region).toBe(Region.OTHERS);
      expect(config.vendor).toBe(Vendor.OTHERS);
      expect(config.terraformWorkspace).toBe('test-workspace');
      expect(config.terraformOrganisation).toBe('test-org');
      expect(config.terraformHostname).toBe(DEFAULT_TERRAFORM_HOSTNAME);
      expect(config.enableEncryption).toBe(true);
      expect(config.enableSecretsManager).toBe(true);
      expect(config.tags).toBeUndefined();
    });

    it('When building a complete configuration with all settings, Then it should have all specified values', () => {
      const tags = { owner: 'team-a', project: 'infrastructure' };

      const config = new ConfigBuilder()
        .withEnvironment(Environment.PRODUCTION)
        .withName('my-infrastructure')
        .withResourceType('vpc')
        .withTerraformConfig('prod-workspace', 'my-org', 'custom.terraform.io')
        .withPublicVPC(true)
        .withRegion(Region.AUSTRALIA_EAST)
        .withTags(tags)
        .withVendor(Vendor.AWS)
        .build();

      expect(config.name).toBe('my-infrastructure');
      expect(config.environment).toBe(Environment.PRODUCTION);
      expect(config.resourceType).toBe('vpc');
      expect(config.region).toBe(Region.AUSTRALIA_EAST);
      expect(config.vendor).toBe(Vendor.AWS);
      expect(config.terraformWorkspace).toBe('prod-workspace');
      expect(config.terraformOrganisation).toBe('my-org');
      expect(config.terraformHostname).toBe('custom.terraform.io');
      expect(config.enableEncryption).toBe(true);
      expect(config.enableSecretsManager).toBe(true);
      expect(config.enablePublicVPC).toBe(true);
      expect(config.tags).toEqual(tags);
    });
  });

  describe('Given default values', () => {
    it('When not specifying optional values, Then it should US_EAST correct default values', () => {
      const config = new ConfigBuilder().withTerraformConfig('workspace', 'org').build();

      expect(config.name).toBe('');
      expect(config.environment).toBe(Environment.DEVELOPMENT);
      expect(config.resourceType).toBe('');
      expect(config.region).toBe(Region.OTHERS);
      expect(config.vendor).toBe(Vendor.OTHERS);
      expect(config.enableEncryption).toBe(true);
      expect(config.enableSecretsManager).toBe(true);
      expect(config.tags).toBeUndefined();
    });
  });

  describe('Given environment configuration', () => {
    const environments = [
      { enum: Environment.OTHERS, name: 'others' },
      { enum: Environment.DEVELOPMENT, name: 'development' },
      { enum: Environment.STAGING, name: 'staging' },
      { enum: Environment.PRODUCTION, name: 'production' },
    ];

    environments.forEach(({ enum: envEnum, name }) => {
      it(`When setting ${name} environment, Then it should be configured correctly`, () => {
        const config = new ConfigBuilder()
          .withEnvironment(envEnum)
          .withTerraformConfig(`${name}-workspace`, 'org')
          .build();

        expect(config.environment).toBe(envEnum);
      });
    });
  });

  describe('Given region configuration', () => {
    const regions = [
      { enum: Region.AUSTRALIA_EAST, name: 'Australia East' },
      { enum: Region.US_EAST, name: 'US East' },
      { enum: Region.ASIA_SOUTHEAST, name: 'Asia South East' },
      { enum: Region.EUROPE_WEST, name: 'Europe West' },
      { enum: Region.OTHERS, name: 'OTHERS' },
    ];

    regions.forEach(({ enum: regionEnum, name }) => {
      it(`When setting ${name} region, Then it should be configured correctly`, () => {
        const config = new ConfigBuilder()
          .withRegion(regionEnum)
          .withTerraformConfig('workspace', 'org')
          .build();

        expect(config.region).toBe(regionEnum);
      });
    });
  });

  describe('Given vendor configuration', () => {
    const vendors = [
      { enum: Vendor.AWS, name: 'AWS' },
      { enum: Vendor.AZURE, name: 'Azure' },
      { enum: Vendor.GCP, name: 'GCP' },
      { enum: Vendor.ON_PREMISES, name: 'on-premises' },
      { enum: Vendor.OTHERS, name: 'OTHERS' },
    ];

    vendors.forEach(({ enum: vendorEnum, name }) => {
      it(`When setting ${name} vendor, Then it should be configured correctly`, () => {
        const config = new ConfigBuilder()
          .withVendor(vendorEnum)
          .withTerraformConfig('workspace', 'org')
          .build();

        expect(config.vendor).toBe(vendorEnum);
      });
    });
  });

  describe('Given terraform configuration', () => {
    it('When setting workspace and organisation, Then they should be configured correctly', () => {
      const config = new ConfigBuilder()
        .withTerraformConfig('my-workspace', 'my-organisation')
        .build();

      expect(config.terraformWorkspace).toBe('my-workspace');
      expect(config.terraformOrganisation).toBe('my-organisation');
    });

    it('When not specifying hostname, Then it should US_EAST default hostname', () => {
      const config = new ConfigBuilder().withTerraformConfig('workspace', 'org').build();

      expect(config.terraformHostname).toBe(DEFAULT_TERRAFORM_HOSTNAME);
    });

    it('When specifying custom hostname, Then it should US_EAST the custom hostname', () => {
      const customHostname = 'my-terraform.company.com';
      const config = new ConfigBuilder()
        .withTerraformConfig('workspace', 'org', customHostname)
        .build();

      expect(config.terraformHostname).toBe(customHostname);
    });

    it('When terraform config is not set, Then it should throw error', () => {
      expect(() => new ConfigBuilder().build()).toThrow();
    });
  });

  describe('Given public VPC configuration', () => {
    it('When enabling and disabling public VPC, Then it should be configured correctly', () => {
      const enabledConfig = new ConfigBuilder()
        .withPublicVPC(true)
        .withTerraformConfig('workspace', 'org')
        .build();

      const disabledConfig = new ConfigBuilder()
        .withPublicVPC(false)
        .withTerraformConfig('workspace', 'org')
        .build();

      expect(enabledConfig.enablePublicVPC).toBe(true);
      expect(disabledConfig.enablePublicVPC).toBe(false);
    });

    it('When calling enablePublicVPC multiple times, Then the last value should take precedence', () => {
      const config = new ConfigBuilder()
        .withPublicVPC(true)
        .withPublicVPC(false)
        .withTerraformConfig('workspace', 'org')
        .build();

      expect(config.enablePublicVPC).toBe(false);
    });
  });

  describe('Given tags configuration', () => {
    it('When not specifying tags, Then it should have empty tags by default', () => {
      const config = new ConfigBuilder().withTerraformConfig('workspace', 'org').build();

      expect(config.tags).toBeUndefined();
    });

    it('When setting custom tags, Then they should be configured correctly', () => {
      const tags = {
        owner: 'team-a',
        project: 'infrastructure',
        environment: 'production',
        costCenter: 'cc-123',
      };

      const config = new ConfigBuilder()
        .withTags(tags)
        .withTerraformConfig('workspace', 'org')
        .build();

      expect(config.tags).toEqual(tags);
    });

    it('When calling withTags multiple times, Then the last tags should take precedence', () => {
      const firstTags = { owner: 'team-a' };
      const secondTags = { owner: 'team-b', project: 'infra' };

      const config = new ConfigBuilder()
        .withTags(firstTags)
        .withTags(secondTags)
        .withTerraformConfig('workspace', 'org')
        .build();

      expect(config.tags).toEqual(secondTags);
    });
  });

  describe('Given awsConfig configuration', () => {
    it('When setting awsAccountId, Then it should be configured correctly in awsConfig', () => {
      const config = new ConfigBuilder()
        .withAWSAccountId('123456789012')
        .withTerraformConfig('workspace', 'org')
        .build();
      expect(config.awsConfig).toBeDefined();
      expect(config.awsConfig?.awsAccountId).toBe('123456789012');
    });

    it('When not setting awsAccountId, Then awsConfig should be undefined', () => {
      const config = new ConfigBuilder()
        .withTerraformConfig('workspace', 'org')
        .build();
      expect(config.awsConfig).toBeUndefined();
    });

    it('When calling withAWSAccountId multiple times, Then the last value should take precedence', () => {
      const config = new ConfigBuilder()
        .withAWSAccountId('first-id')
        .withAWSAccountId('final-id')
        .withTerraformConfig('workspace', 'org')
        .build();
      expect(config.awsConfig?.awsAccountId).toBe('final-id');
    });
  });

  describe('Given builder chaining and override behavior', () => {
    it('When chaining all configuration methods, Then it should support method chaining for all options', () => {
      const config = new ConfigBuilder()
        .withEnvironment(Environment.STAGING)
        .withName('test-infra')
        .withResourceType('network')
        .withTerraformConfig('staging-workspace', 'test-org')
        .withPublicVPC(false)
        .withRegion(Region.US_EAST)
        .withTags({ owner: 'dev-team' })
        .withVendor(Vendor.AWS)
        .build();

      expect(config.environment).toBe(Environment.STAGING);
      expect(config.name).toBe('test-infra');
      expect(config.resourceType).toBe('network');
      expect(config.region).toBe(Region.US_EAST);
      expect(config.vendor).toBe(Vendor.AWS);
      expect(config.enablePublicVPC).toBe(false);
      expect(config.tags?.owner).toBe('dev-team');
    });

    it('When calling the same method multiple times, Then the last value should take precedence', () => {
      const config = new ConfigBuilder()
        .withEnvironment(Environment.DEVELOPMENT)
        .withEnvironment(Environment.STAGING)
        .withEnvironment(Environment.PRODUCTION)
        .withName('first-name')
        .withName('final-name')
        .withTerraformConfig('workspace', 'org')
        .build();

      expect(config.environment).toBe(Environment.PRODUCTION);
      expect(config.name).toBe('final-name');
    });

    it('When chaining methods, Then it should return the same builder instance', () => {
      const builder = new ConfigBuilder();
      const result1 = builder.withEnvironment(Environment.DEVELOPMENT);
      const result2 = result1.withName('test');
      const result3 = result2.withTerraformConfig('workspace', 'org');

      expect(result1).toBe(builder);
      expect(result2).toBe(builder);
      expect(result3).toBe(builder);
    });
  });

  describe('Given real-world scenarios', () => {
    it('When setting up development environment, Then it should handle development environment setup correctly', () => {
      const config = new ConfigBuilder()
        .withEnvironment(Environment.DEVELOPMENT)
        .withName('dev-infrastructure')
        .withResourceType('vpc')
        .withTerraformConfig('dev-workspace', 'my-company')
        .withPublicVPC(true)
        .withRegion(Region.AUSTRALIA_EAST)
        .withTags({
          owner: 'dev-team',
          environment: 'development',
          costCenter: 'dev-cc-001',
        })
        .withVendor(Vendor.AWS)
        .build();

      expect(config.environment).toBe(Environment.DEVELOPMENT);
      expect(config.name).toBe('dev-infrastructure');
      expect(config.resourceType).toBe('vpc');
      expect(config.region).toBe(Region.AUSTRALIA_EAST);
      expect(config.vendor).toBe(Vendor.AWS);
      expect(config.enablePublicVPC).toBe(true);
      expect(config.tags?.owner).toBe('dev-team');
      expect(config.tags?.environment).toBe('development');
      expect(config.tags?.costCenter).toBe('dev-cc-001');
    });

    it('When setting up production environment, Then it should handle production environment setup correctly', () => {
      const config = new ConfigBuilder()
        .withEnvironment(Environment.PRODUCTION)
        .withName('prod-infrastructure')
        .withResourceType('network')
        .withTerraformConfig('prod-workspace', 'my-company', 'terraform.mycompany.com')
        .withPublicVPC(false)
        .withRegion(Region.US_EAST)
        .withTags({
          owner: 'ops-team',
          environment: 'production',
          costCenter: 'prod-cc-001',
          compliance: 'sox',
        })
        .withVendor(Vendor.AWS)
        .build();

      expect(config.environment).toBe(Environment.PRODUCTION);
      expect(config.name).toBe('prod-infrastructure');
      expect(config.resourceType).toBe('network');
      expect(config.region).toBe(Region.US_EAST);
      expect(config.vendor).toBe(Vendor.AWS);
      expect(config.enablePublicVPC).toBe(false);
      expect(config.terraformHostname).toBe('terraform.mycompany.com');
      expect(config.tags?.owner).toBe('ops-team');
      expect(config.tags?.environment).toBe('production');
      expect(config.tags?.compliance).toBe('sox');
    });
  });
});
