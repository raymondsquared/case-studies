import { ConfigBuilder } from '../builder';
import { Environment, Region, Vendor } from '../../common/enums';
import { DEFAULT_TERRAFORM_HOSTNAME } from '../../common/constants';

const testWorkspace = 'test-workspace';
const testOrg = 'test-org';
const testHostname = 'my-terraform.company.com';

describe('ConfigBuilder', () => {
  describe('Given minimal configuration with required terraform settings', () => {
    describe('When building the configuration', () => {
      it('Then it should have correct default values', () => {
        const config = new ConfigBuilder().withTerraformConfig(testWorkspace, testOrg).build();

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
    });

    describe('When optional values are not specified', () => {
      it('Then it should use correct default values', () => {
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

    describe('When terraform config is not set', () => {
      it('Then it should throw error', () => {
        expect(() => new ConfigBuilder().build()).toThrow();
      });
    });
  });

  describe('Given complete configuration with all settings', () => {
    describe('When building the configuration', () => {
      it('Then it should have all specified values', () => {
        const tags = { owner: 'team-a', project: 'infrastructure' };

        const config = new ConfigBuilder()
          .withEnvironment(Environment.PRODUCTION)
          .withName('my-infrastructure')
          .withResourceType('vpc')
          .withTerraformConfig('prod-workspace', 'my-org', 'custom.terraform.io')
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
        expect(config.tags).toEqual(tags);
      });
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
      describe(`When setting ${name} environment`, () => {
        it('Then it should be configured correctly', () => {
          const config = new ConfigBuilder()
            .withEnvironment(envEnum)
            .withTerraformConfig(`${name}-workspace`, 'org')
            .build();

          expect(config.environment).toBe(envEnum);
        });
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
      describe(`When setting ${name} region`, () => {
        it('Then it should be configured correctly', () => {
          const config = new ConfigBuilder()
            .withRegion(regionEnum)
            .withTerraformConfig('workspace', 'org')
            .build();

          expect(config.region).toBe(regionEnum);
        });
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
      describe(`When setting ${name} vendor`, () => {
        it('Then it should be configured correctly', () => {
          const config = new ConfigBuilder()
            .withVendor(vendorEnum)
            .withTerraformConfig('workspace', 'org')
            .build();

          expect(config.vendor).toBe(vendorEnum);
        });
      });
    });
  });

  describe('Given terraform configuration', () => {
    describe('When setting workspace and organisation', () => {
      it('Then they should be configured correctly', () => {
        const config = new ConfigBuilder()
          .withTerraformConfig('my-workspace', 'my-organisation')
          .build();

        expect(config.terraformWorkspace).toBe('my-workspace');
        expect(config.terraformOrganisation).toBe('my-organisation');
      });
    });

    describe('When not specifying hostname', () => {
      it('Then it should use default hostname', () => {
        const config = new ConfigBuilder().withTerraformConfig('workspace', 'org').build();

        expect(config.terraformHostname).toBe(DEFAULT_TERRAFORM_HOSTNAME);
      });
    });

    describe('When specifying custom hostname', () => {
      it('Then it should use the custom hostname', () => {
        const config = new ConfigBuilder()
          .withTerraformConfig('workspace', 'org', testHostname)
          .build();

        expect(config.terraformHostname).toBe(testHostname);
      });
    });
  });

  describe('Given tags configuration', () => {
    describe('When not specifying tags', () => {
      it('Then it should have empty tags by default', () => {
        const config = new ConfigBuilder().withTerraformConfig('workspace', 'org').build();

        expect(config.tags).toBeUndefined();
      });
    });

    describe('When setting custom tags', () => {
      it('Then they should be configured correctly', () => {
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
    });

    describe('When calling withTags multiple times', () => {
      it('Then the last tags should take precedence', () => {
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
  });

  describe('Given AWS configuration', () => {
    describe('When setting awsAccountId', () => {
      it('Then it should be configured correctly in awsConfig', () => {
        const config = new ConfigBuilder()
          .withAWSAccountId('123456789012')
          .withTerraformConfig('workspace', 'org')
          .build();
        expect(config.awsConfig).toBeDefined();
        expect(config.awsConfig?.awsAccountId).toBe('123456789012');
      });
    });

    describe('When not setting awsAccountId', () => {
      it('Then awsConfig should be undefined', () => {
        const config = new ConfigBuilder()
          .withTerraformConfig('workspace', 'org')
          .build();
        expect(config.awsConfig).toBeUndefined();
      });
    });

    describe('When calling withAWSAccountId multiple times', () => {
      it('Then the last value should take precedence', () => {
        const config = new ConfigBuilder()
          .withAWSAccountId('first-id')
          .withAWSAccountId('final-id')
          .withTerraformConfig('workspace', 'org')
          .build();
        expect(config.awsConfig?.awsAccountId).toBe('final-id');
      });
    });
  });

  describe('Given CIDR block configuration', () => {
    describe('When setting vpcCIDRBlock', () => {
      it('Then it should be configured correctly', () => {
        const config = new ConfigBuilder()
          .withCidrBlock('192.168.0.0/16')
          .withTerraformConfig('workspace', 'org')
          .build();
        expect(config.vpcCIDRBlock).toBe('192.168.0.0/16');
      });
    });

    describe('When not setting vpcCIDRBlock', () => {
      it('Then it should be undefined', () => {
        const config = new ConfigBuilder()
          .withTerraformConfig('workspace', 'org')
          .build();
        expect(config.vpcCIDRBlock).toBeUndefined();
      });
    });

    describe('When setting publicSubnetCIDRBlocks', () => {
      it('Then it should be configured correctly', () => {
        const publicSubnets = ['192.168.1.0/24', '192.168.2.0/24'];
        const config = new ConfigBuilder()
          .withPublicSubnetCidrBlocks(publicSubnets)
          .withTerraformConfig('workspace', 'org')
          .build();
        expect(config.publicSubnetCIDRBlocks).toEqual(publicSubnets);
      });
    });

    describe('When not setting publicSubnetCIDRBlocks', () => {
      it('Then it should be undefined', () => {
        const config = new ConfigBuilder()
          .withTerraformConfig('workspace', 'org')
          .build();
        expect(config.publicSubnetCIDRBlocks).toBeUndefined();
      });
    });

    describe('When setting privateSubnetCIDRBlocks', () => {
      it('Then it should be configured correctly', () => {
        const privateSubnets = ['192.168.10.0/24', '192.168.11.0/24'];
        const config = new ConfigBuilder()
          .withPrivateSubnetCidrBlocks(privateSubnets)
          .withTerraformConfig('workspace', 'org')
          .build();
        expect(config.privateSubnetCIDRBlocks).toEqual(privateSubnets);
      });
    });

    describe('When not setting privateSubnetCIDRBlocks', () => {
      it('Then it should be undefined', () => {
        const config = new ConfigBuilder()
          .withTerraformConfig('workspace', 'org')
          .build();
        expect(config.privateSubnetCIDRBlocks).toBeUndefined();
      });
    });

    describe('When calling CIDR block methods multiple times', () => {
      it('Then the last value should take precedence', () => {
        const config = new ConfigBuilder()
          .withCidrBlock('10.0.0.0/16')
          .withCidrBlock('172.16.0.0/16')
          .withPublicSubnetCidrBlocks(['10.0.1.0/24'])
          .withPublicSubnetCidrBlocks(['172.16.1.0/24', '172.16.2.0/24'])
          .withPrivateSubnetCidrBlocks(['10.0.10.0/24'])
          .withPrivateSubnetCidrBlocks(['172.16.10.0/24', '172.16.11.0/24'])
          .withTerraformConfig('workspace', 'org')
          .build();
        expect(config.vpcCIDRBlock).toBe('172.16.0.0/16');
        expect(config.publicSubnetCIDRBlocks).toEqual(['172.16.1.0/24', '172.16.2.0/24']);
        expect(config.privateSubnetCIDRBlocks).toEqual(['172.16.10.0/24', '172.16.11.0/24']);
      });
    });
  });

  describe('Given builder chaining and override behavior', () => {
    describe('When chaining all configuration methods', () => {
      it('Then it should support method chaining for all options', () => {
        const config = new ConfigBuilder()
          .withEnvironment(Environment.STAGING)
          .withName('test-infra')
          .withResourceType('network')
          .withTerraformConfig('staging-workspace', 'test-org')
          .withCidrBlock('192.168.0.0/16')
          .withPublicSubnetCidrBlocks(['192.168.1.0/24', '192.168.2.0/24'])
          .withPrivateSubnetCidrBlocks(['192.168.10.0/24', '192.168.11.0/24'])
          .withRegion(Region.US_EAST)
          .withTags({ owner: 'dev-team' })
          .withVendor(Vendor.AWS)
          .build();

        expect(config.environment).toBe(Environment.STAGING);
        expect(config.name).toBe('test-infra');
        expect(config.resourceType).toBe('network');
        expect(config.region).toBe(Region.US_EAST);
        expect(config.vendor).toBe(Vendor.AWS);
        expect(config.vpcCIDRBlock).toBe('192.168.0.0/16');
        expect(config.publicSubnetCIDRBlocks).toEqual(['192.168.1.0/24', '192.168.2.0/24']);
        expect(config.privateSubnetCIDRBlocks).toEqual(['192.168.10.0/24', '192.168.11.0/24']);
        expect(config.tags?.owner).toBe('dev-team');
      });
    });

    describe('When calling the same method multiple times', () => {
      it('Then the last value should take precedence', () => {
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
    });

    describe('When chaining methods', () => {
      it('Then it should return the same builder instance', () => {
        const builder = new ConfigBuilder();
        const result1 = builder.withEnvironment(Environment.DEVELOPMENT);
        const result2 = result1.withName('test');
        const result3 = result2.withTerraformConfig('workspace', 'org');

        expect(result1).toBe(builder);
        expect(result2).toBe(builder);
        expect(result3).toBe(builder);
      });
    });
  });

  describe('Given real-world scenarios', () => {
    describe('When setting up development environment', () => {
      it('Then it should handle development environment setup correctly', () => {
        const config = new ConfigBuilder()
          .withEnvironment(Environment.DEVELOPMENT)
          .withName('dev-infrastructure')
          .withResourceType('vpc')
          .withTerraformConfig('dev-workspace', 'my-company')
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
        expect(config.tags?.owner).toBe('dev-team');
        expect(config.tags?.environment).toBe('development');
        expect(config.tags?.costCenter).toBe('dev-cc-001');
      });
    });

    describe('When setting up production environment', () => {
      it('Then it should handle production environment setup correctly', () => {
        const config = new ConfigBuilder()
          .withEnvironment(Environment.PRODUCTION)
          .withName('prod-infrastructure')
          .withResourceType('network')
          .withTerraformConfig('prod-workspace', 'my-company', 'terraform.mycompany.com')
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
        expect(config.terraformHostname).toBe('terraform.mycompany.com');
        expect(config.tags?.owner).toBe('ops-team');
        expect(config.tags?.environment).toBe('production');
        expect(config.tags?.compliance).toBe('sox');
      });
    });
  });
});
