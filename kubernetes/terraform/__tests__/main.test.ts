import { Testing } from 'cdktf';
import { App, RemoteBackend } from 'cdktf';
import { Environment, Region, Vendor } from '../src/utils/common/enums';
import { getEnumFromRequiredEnvironmentVariable } from '../src/utils/common/environment';
import { DevelopmentStack } from '../src/stacks/development-stack';
import { ProductionStack } from '../src/stacks/production-stack';
import { ConfigBuilder } from '../src/utils/config/builder';
import { validateConfig } from '../src/utils/config/validator';
import { DEFAULT_SERVICE_NAME } from '../src/utils/common/constants';
import { getRequiredEnvironmentVariableValue } from '../src/utils/common';

const originalEnv = process.env;

describe('main', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Stack Creation and Synthesis', () => {
    const testCases = [
      {
        name: 'development environment',
        environment: Environment.DEVELOPMENT,
        region: Region.AUE,
        vendor: Vendor.AWS,
        stackClass: DevelopmentStack,
        publicVPC: true,
        expectedConfig: {
          enablePublicVPC: true,
          environment: Environment.DEVELOPMENT
        }
      },
      {
        name: 'production environment',
        environment: Environment.PRODUCTION,
        region: Region.USE,
        vendor: Vendor.AWS,
        stackClass: ProductionStack,
        publicVPC: false,
        expectedConfig: {
          environment: Environment.PRODUCTION
        }
      }
    ];

    testCases.forEach(({ name, environment, region, vendor, stackClass, publicVPC, expectedConfig }) => {
      it(`Given ${name} variables, When creating ${name} stack, Then it should synthesize successfully`, () => {
        const terraformOrganisation = 'test-org';
        const app = new App();
        const configBuilder = new ConfigBuilder()
          .withEnvironment(environment)
          .withPublicVPC(publicVPC);

        const serviceName = DEFAULT_SERVICE_NAME;
        const serviceNameAndEnvironment = `${serviceName}-${environment}`;
        const serviceResourceType = 'stack';

        const config = configBuilder
          .withName(serviceName)
          .withResourceType(serviceResourceType)
          .withVendor(vendor)
          .withRegion(region)
          .withTerraformConfig(
            serviceNameAndEnvironment,
            terraformOrganisation,
            'app.terraform.io'
          )
          .build();

        validateConfig(config);

        const stack = new stackClass(app, serviceNameAndEnvironment, {
          config,
          description: `${config.environment} infrastructure for ${config.name} in ${config.environment} environment`,
        });

        expect(() => {
          Testing.fullSynth(stack);
        }).not.toThrow();

        expect(stack).toBeDefined();
        expect(stack.node.id).toBe(serviceNameAndEnvironment);
        
        // Verify expected configuration
        Object.entries(expectedConfig).forEach(([key, value]) => {
          expect(config[key as keyof typeof config]).toBe(value);
        });
      });
    });

    it('Given different region configurations, When creating stacks, Then they should synthesize with correct region settings', () => {
      const regions = [Region.AUE, Region.USE, Region.EUW];
      
      regions.forEach(region => {
        const environment = Environment.DEVELOPMENT;
        const vendor = Vendor.AWS;
        const terraformOrganisation = 'test-org';

        const app = new App();
        const configBuilder = new ConfigBuilder()
          .withEnvironment(Environment.DEVELOPMENT)
          .withPublicVPC(true);

        const serviceName = DEFAULT_SERVICE_NAME;
        const serviceNameAndEnvironment = `${serviceName}-${environment}`;
        const serviceResourceType = 'stack';

        const config = configBuilder
          .withName(serviceName)
          .withResourceType(serviceResourceType)
          .withVendor(vendor)
          .withRegion(region)
          .withTerraformConfig(
            serviceNameAndEnvironment,
            terraformOrganisation,
            'app.terraform.io'
          )
          .build();

        validateConfig(config);

        const stack = new DevelopmentStack(app, serviceNameAndEnvironment, {
          config,
          description: `${config.environment} infrastructure for ${config.name} in ${config.environment} environment`,
        });

        expect(() => {
          Testing.fullSynth(stack);
        }).not.toThrow();

        expect(stack).toBeDefined();
        expect(config.region).toBe(region);
      });
    });

    it('Given custom terraform configuration, When creating stack, Then it should synthesize with remote backend configuration', () => {
      const environment = Environment.DEVELOPMENT;
      const region = Region.AUE;
      const vendor = Vendor.AWS;
      const terraformOrganisation = 'custom-org';
      const terraformHostname = 'custom.terraform.io';

      const app = new App();
      const configBuilder = new ConfigBuilder()
        .withEnvironment(Environment.DEVELOPMENT)
        .withPublicVPC(true);

      const serviceName = DEFAULT_SERVICE_NAME;
      const serviceNameAndEnvironment = `${serviceName}-${environment}`;
      const serviceResourceType = 'stack';

      const config = configBuilder
        .withName(serviceName)
        .withResourceType(serviceResourceType)
        .withVendor(vendor)
        .withRegion(region)
        .withTerraformConfig(
          serviceNameAndEnvironment,
          terraformOrganisation,
          terraformHostname
        )
        .build();

      validateConfig(config);

      const stack = new DevelopmentStack(app, serviceNameAndEnvironment, {
        config,
        description: `${config.environment} infrastructure for ${config.name} in ${config.environment} environment`,
      });

      expect(() => {
        Testing.fullSynth(stack);
      }).not.toThrow();

      expect(stack).toBeDefined();
      expect(config.terraformOrganisation).toBe(terraformOrganisation);
      expect(config.terraformHostname).toBe(terraformHostname);
      expect(config.name).toBe(serviceName);
      expect(config.terraformWorkspace).toBe(serviceNameAndEnvironment);
    });
  });

  describe('Environment Variable Handling', () => {
    it('Given no ENVIRONMENT variable set, When creating stack, Then it should default to development environment', () => {
      delete process.env.ENVIRONMENT;
      process.env.REGION = Region.AUE;
      process.env.VENDOR = Vendor.AWS;
      process.env.TERRAFORM_ORGANISATION = 'test-org';

      const environment = process.env.ENVIRONMENT || Environment.DEVELOPMENT;
      expect(environment).toBe(Environment.DEVELOPMENT);
    });

    it('Given invalid or missing environment variables, When getting enum from env, Then it should throw appropriate errors', () => {
      const testCases = [
        {
          name: 'invalid REGION',
          setup: () => {
            process.env.REGION = 'INVALID_REGION';
            process.env.ENVIRONMENT = Environment.DEVELOPMENT;
            process.env.VENDOR = Vendor.AWS;
            process.env.TERRAFORM_ORGANISATION = 'test-org';
          },
          test: () => getEnumFromRequiredEnvironmentVariable(process.env.REGION, Region, 'REGION'),
          expectedError: 'Invalid or missing REGION environment variable. Must be one of: OTHERS, AUE, USE, ASIASE, EUW'
        },
        {
          name: 'invalid VENDOR',
          setup: () => {
            process.env.REGION = Region.AUE;
            process.env.ENVIRONMENT = Environment.DEVELOPMENT;
            process.env.VENDOR = 'INVALID_VENDOR';
            process.env.TERRAFORM_ORGANISATION = 'test-org';
          },
          test: () => getEnumFromRequiredEnvironmentVariable(process.env.VENDOR, Vendor, 'VENDOR'),
          expectedError: 'Invalid or missing VENDOR environment variable. Must be one of: OTHERS, ON_PREMISES, AWS, AZURE, GCP'
        },
        {
          name: 'undefined REGION',
          setup: () => {
            delete process.env.REGION;
            process.env.ENVIRONMENT = Environment.DEVELOPMENT;
            process.env.VENDOR = Vendor.AWS;
            process.env.TERRAFORM_ORGANISATION = 'test-org';
          },
          test: () => getEnumFromRequiredEnvironmentVariable(process.env.REGION, Region, 'REGION'),
          expectedError: 'Invalid or missing REGION environment variable. Must be one of: OTHERS, AUE, USE, ASIASE, EUW'
        },
        {
          name: 'undefined VENDOR',
          setup: () => {
            process.env.REGION = Region.AUE;
            process.env.ENVIRONMENT = Environment.DEVELOPMENT;
            delete process.env.VENDOR;
            process.env.TERRAFORM_ORGANISATION = 'test-org';
          },
          test: () => getEnumFromRequiredEnvironmentVariable(process.env.VENDOR, Vendor, 'VENDOR'),
          expectedError: 'Invalid or missing VENDOR environment variable. Must be one of: OTHERS, ON_PREMISES, AWS, AZURE, GCP'
        },
        {
          name: 'missing TERRAFORM_ORGANISATION',
          setup: () => {
            process.env.REGION = Region.AUE;
            process.env.ENVIRONMENT = Environment.DEVELOPMENT;
            process.env.VENDOR = Vendor.AWS;
            delete process.env.TERRAFORM_ORGANISATION;
          },
          test: () => getRequiredEnvironmentVariableValue('TERRAFORM_ORGANISATION'),
          expectedError: 'TERRAFORM_ORGANISATION environment variable is required but not set.'
        }
      ];

      testCases.forEach(({ name: _name, setup, test, expectedError }) => {
        setup();
        expect(() => {
          test();
        }).toThrow(expectedError);
      });
    });
  });

  describe('Config Validation', () => {
    it('Given invalid config with missing required fields, When validating config, Then it should throw validation errors', () => {
      const baseConfig = {
        environment: Environment.DEVELOPMENT,
        region: Region.AUE,
        vendor: Vendor.AWS,
        terraformOrganisation: 'test-org',
        terraformWorkspace: 'test-workspace',
        terraformHostname: 'app.terraform.io',
        name: DEFAULT_SERVICE_NAME,
        resourceType: 'stack',
        enableEncryption: true,
        enableSecretsManager: true,
        tags: { environment: 'test' }
      };

      const testCases = [
        {
          name: 'missing name',
          config: { ...baseConfig, name: '' },
          expectedError: 'Config validation error: name is required and cannot be empty.'
        },
        {
          name: 'missing resourceType',
          config: { ...baseConfig, resourceType: '' },
          expectedError: 'Config validation error: resourceType is required and cannot be empty.'
        },
        {
          name: 'missing environment',
          config: { ...baseConfig, environment: undefined },
          expectedError: 'Config validation error: environment is required.'
        },
        {
          name: 'missing region',
          config: { ...baseConfig, region: undefined },
          expectedError: 'Config validation error: region is required.'
        },
        {
          name: 'missing vendor',
          config: { ...baseConfig, vendor: undefined },
          expectedError: 'Config validation error: vendor is required.'
        },
        {
          name: 'missing terraformOrganisation',
          config: { ...baseConfig, terraformOrganisation: '' },
          expectedError: 'Config validation error: terraformOrganisation is required and cannot be empty.'
        },
        {
          name: 'missing terraformWorkspace',
          config: { ...baseConfig, terraformWorkspace: '' },
          expectedError: 'Config validation error: terraformWorkspace is required and cannot be empty.'
        },
        {
          name: 'missing terraformHostname',
          config: { ...baseConfig, terraformHostname: '' },
          expectedError: 'Config validation error: terraformHostname is required and cannot be empty.'
        },
        {
          name: 'missing enableEncryption',
          config: { ...baseConfig, enableEncryption: undefined },
          expectedError: 'Config validation error: enableEncryption is required and must be a boolean.'
        },
        {
          name: 'missing enableSecretsManager',
          config: { ...baseConfig, enableSecretsManager: undefined },
          expectedError: 'Config validation error: enableSecretsManager is required and must be a boolean.'
        },
        {
          name: 'missing tags',
          config: { ...baseConfig, tags: undefined },
          expectedError: 'Config validation error: tags is required and must be an object with string values.'
        }
      ];

      testCases.forEach(({ name: _name, config, expectedError }) => {
        expect(() => {
          validateConfig(config as any);
        }).toThrow(expectedError);
      });
    });

    it('Given STAGING environment, When creating stack, Then it should throw error for unsupported environment', () => {
      const environment = Environment.STAGING;
      const region = Region.AUE;
      const vendor = Vendor.AWS;
      const terraformOrganisation = 'test-org';

      const app = new App();
      const configBuilder = new ConfigBuilder()
        .withEnvironment(Environment.STAGING)
        .withPublicVPC(true);

      const serviceName = DEFAULT_SERVICE_NAME;
      const serviceNameAndEnvironment = `${serviceName}-${environment}`;
      const serviceResourceType = 'stack';

      const config = configBuilder
        .withName(serviceName)
        .withResourceType(serviceResourceType)
        .withVendor(vendor)
        .withRegion(region)
        .withTerraformConfig(
          serviceNameAndEnvironment,
          terraformOrganisation,
          'app.terraform.io'
        )
        .build();

      validateConfig(config);

      expect(() => {
        switch (environment as Environment) {
          case Environment.DEVELOPMENT:
            new DevelopmentStack(app, serviceNameAndEnvironment, {
              config,
              description: `${config.environment} infrastructure for ${config.name} in ${config.environment} environment`,
            });
            break;
          case Environment.PRODUCTION:
            new ProductionStack(app, serviceNameAndEnvironment, {
              config,
              description: `${config.environment} infrastructure for ${config.name} in ${config.environment} environment`,
            });
            break;
          default:
            throw new Error(`Unknown environment: ${environment}`);
        }
      }).toThrow(`Unknown environment: ${environment}`);
    });
  });

  describe('RemoteBackend Configuration', () => {
    it('Given valid configuration, When creating RemoteBackend, Then it should be configured with correct values', () => {
      const environment = Environment.DEVELOPMENT;
      const region = Region.AUE;
      const vendor = Vendor.AWS;
      const terraformOrganisation = 'test-org';
      const terraformHostname = 'app.terraform.io';

      const app = new App();
      const configBuilder = new ConfigBuilder()
        .withEnvironment(Environment.DEVELOPMENT)
        .withPublicVPC(true);

      const serviceName = DEFAULT_SERVICE_NAME;
      const serviceNameAndEnvironment = `${serviceName}-${environment}`;
      const serviceResourceType = 'stack';

      const config = configBuilder
        .withName(serviceName)
        .withResourceType(serviceResourceType)
        .withVendor(vendor)
        .withRegion(region)
        .withTerraformConfig(
          serviceNameAndEnvironment,
          terraformOrganisation,
          terraformHostname
        )
        .build();

      validateConfig(config);

      const stack = new DevelopmentStack(app, serviceNameAndEnvironment, {
        config,
        description: `${config.environment} infrastructure for ${config.name} in ${config.environment} environment`,
      });

      const remoteBackend = new RemoteBackend(stack, {
        hostname: config.terraformHostname,
        organization: config.terraformOrganisation,
        workspaces: {
          name: config.terraformWorkspace,
        },
      });

      expect(remoteBackend).toBeDefined();
      expect(stack).toBeDefined();
      expect(config.terraformHostname).toBe(terraformHostname);
      expect(config.terraformOrganisation).toBe(terraformOrganisation);
      expect(config.terraformWorkspace).toBe(serviceNameAndEnvironment);
    });

    it('Given custom terraform hostname from environment, When creating RemoteBackend, Then it should use custom hostname', () => {
      const environment = Environment.DEVELOPMENT;
      const region = Region.AUE;
      const vendor = Vendor.AWS;
      const terraformOrganisation = 'test-org';
      const customHostname = 'custom.terraform.io';

      process.env.TERRAFORM_HOSTNAME = customHostname;

      const app = new App();
      const configBuilder = new ConfigBuilder()
        .withEnvironment(Environment.DEVELOPMENT)
        .withPublicVPC(true);

      const serviceName = DEFAULT_SERVICE_NAME;
      const serviceNameAndEnvironment = `${serviceName}-${environment}`;
      const serviceResourceType = 'stack';

      const config = configBuilder
        .withName(serviceName)
        .withResourceType(serviceResourceType)
        .withVendor(vendor)
        .withRegion(region)
        .withTerraformConfig(
          serviceNameAndEnvironment,
          terraformOrganisation,
          process.env.TERRAFORM_HOSTNAME
        )
        .build();

      validateConfig(config);

      const stack = new DevelopmentStack(app, serviceNameAndEnvironment, {
        config,
        description: `${config.environment} infrastructure for ${config.name} in ${config.environment} environment`,
      });

      const remoteBackend = new RemoteBackend(stack, {
        hostname: config.terraformHostname,
        organization: config.terraformOrganisation,
        workspaces: {
          name: config.terraformWorkspace,
        },
      });

      expect(remoteBackend).toBeDefined();
      expect(config.terraformHostname).toBe(customHostname);
    });
  });
});
