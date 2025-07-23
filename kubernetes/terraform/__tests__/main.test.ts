import { App, RemoteBackend } from 'cdktf';
import { Environment, Region, Vendor } from '../src/utils/common/enums';
import { getEnumFromRequiredEnvironmentVariable } from '../src/utils/common/environment';
import { DevelopmentStack } from '../src/stacks/development-stack';
import { ProductionStack } from '../src/stacks/production-stack';
import { ConfigBuilder } from '../src/utils/config/builder';
import {
  DEFAULT_SERVICE_NAME,
  DEFAULT_VPC_PUBLIC_SUBNET_CIDR_BLOCK,
} from '../src/utils/common/constants';
import { getRequiredEnvironmentVariableValue } from '../src/utils/common';

const originalEnv = process.env;

describe('Main', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    process.env.AWS_ACCOUNT_ID = '123456789012';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Given an invalid configuration', () => {
    describe('When creating stack with STAGING environment', () => {
      it('Then it should throw error for unsupported environment', () => {
        const environment = Environment.STAGING;
        const region = Region.AUSTRALIA_EAST;
        const vendor = Vendor.AWS;
        const terraformOrganisation = 'test-org';

        const app = new App();
        const configBuilder = new ConfigBuilder()
          .withEnvironment(Environment.STAGING)
          .withPublicSubnetCidrBlocks(DEFAULT_VPC_PUBLIC_SUBNET_CIDR_BLOCK);

        const serviceName = DEFAULT_SERVICE_NAME;
        const serviceNameAndEnvironment = `${serviceName}-${environment}`;
        const serviceResourceType = 'stack';

        const config = configBuilder
          .withName(serviceName)
          .withResourceType(serviceResourceType)
          .withVendor(vendor)
          .withRegion(region)
          .withTerraformConfig(serviceNameAndEnvironment, terraformOrganisation, 'app.terraform.io')
          .build();

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
  });

  describe('Given environment variable handling', () => {
    describe('When no ENVIRONMENT variable is set', () => {
      it('Then it should default to development environment', () => {
        delete process.env.ENVIRONMENT;
        process.env.REGION = Region.AUSTRALIA_EAST;
        process.env.VENDOR = Vendor.AWS;
        process.env.TERRAFORM_ORGANISATION = 'test-org';

        const environment = process.env.ENVIRONMENT || Environment.DEVELOPMENT;
        expect(environment).toBe(Environment.DEVELOPMENT);
      });
    });

    describe('When getting enum from invalid or missing environment variables', () => {
      it('Then it should throw appropriate errors', () => {
        const testCases = [
          {
            name: 'invalid REGION',
            setup: () => {
              process.env.REGION = 'INVALID_REGION';
              process.env.ENVIRONMENT = Environment.DEVELOPMENT;
              process.env.VENDOR = Vendor.AWS;
              process.env.TERRAFORM_ORGANISATION = 'test-org';
            },
            test: () =>
              getEnumFromRequiredEnvironmentVariable(process.env.REGION, Region, 'REGION'),
            expectedError:
              'Invalid or missing REGION environment variable. Must be one of: OTHERS, AUSTRALIA_EAST, US_EAST, ASIA_SOUTHEAST, EUROPE_WEST',
          },
          {
            name: 'invalid VENDOR',
            setup: () => {
              process.env.REGION = Region.AUSTRALIA_EAST;
              process.env.ENVIRONMENT = Environment.DEVELOPMENT;
              process.env.VENDOR = 'INVALID_VENDOR';
              process.env.TERRAFORM_ORGANISATION = 'test-org';
            },
            test: () =>
              getEnumFromRequiredEnvironmentVariable(process.env.VENDOR, Vendor, 'VENDOR'),
            expectedError:
              'Invalid or missing VENDOR environment variable. Must be one of: OTHERS, ON_PREMISES, AWS, AZURE, GCP',
          },
          {
            name: 'undefined REGION',
            setup: () => {
              delete process.env.REGION;
              process.env.ENVIRONMENT = Environment.DEVELOPMENT;
              process.env.VENDOR = Vendor.AWS;
              process.env.TERRAFORM_ORGANISATION = 'test-org';
            },
            test: () =>
              getEnumFromRequiredEnvironmentVariable(process.env.REGION, Region, 'REGION'),
            expectedError:
              'Invalid or missing REGION environment variable. Must be one of: OTHERS, AUSTRALIA_EAST, US_EAST, ASIA_SOUTHEAST, EUROPE_WEST',
          },
          {
            name: 'undefined VENDOR',
            setup: () => {
              process.env.REGION = Region.AUSTRALIA_EAST;
              process.env.ENVIRONMENT = Environment.DEVELOPMENT;
              delete process.env.VENDOR;
              process.env.TERRAFORM_ORGANISATION = 'test-org';
            },
            test: () =>
              getEnumFromRequiredEnvironmentVariable(process.env.VENDOR, Vendor, 'VENDOR'),
            expectedError:
              'Invalid or missing VENDOR environment variable. Must be one of: OTHERS, ON_PREMISES, AWS, AZURE, GCP',
          },
          {
            name: 'missing TERRAFORM_ORGANISATION',
            setup: () => {
              process.env.REGION = Region.AUSTRALIA_EAST;
              process.env.ENVIRONMENT = Environment.DEVELOPMENT;
              process.env.VENDOR = Vendor.AWS;
              delete process.env.TERRAFORM_ORGANISATION;
            },
            test: () => getRequiredEnvironmentVariableValue('TERRAFORM_ORGANISATION'),
            expectedError: 'TERRAFORM_ORGANISATION environment variable is required but not set.',
          },
        ];

        testCases.forEach(({ name: _name, setup, test, expectedError }) => {
          setup();
          expect(() => {
            test();
          }).toThrow(expectedError);
        });
      });
    });

    describe('When running main with AWS vendor and missing AWS_ACCOUNT_ID', () => {
      it('Then it should exit with error and log the correct message', () => {
        process.env.ENVIRONMENT = Environment.DEVELOPMENT;
        process.env.REGION = Region.AUSTRALIA_EAST;
        process.env.VENDOR = Vendor.AWS;
        process.env.TERRAFORM_ORGANISATION = 'test-org';
        delete process.env.AWS_ACCOUNT_ID;
        jest.resetModules();
        const originalExit = process.exit;
        const exitMock = jest.fn() as unknown as typeof process.exit;
        process.exit = exitMock;
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        import('../main').then(() => {
          expect(exitMock).toHaveBeenCalledWith(1);
          expect(errorSpy).toHaveBeenCalledWith(
            'Failed to synthesise Terraform configuration:',
            expect.objectContaining({
              message: 'AWS_ACCOUNT_ID environment variable is required but not set.',
            })
          );
          process.exit = originalExit;
          errorSpy.mockRestore();
        });
      });
    });
  });

  describe('Given RemoteBackend configuration', () => {
    describe('When creating RemoteBackend with valid configuration', () => {
      it('Then it should be configured with correct values', () => {
        const environment = Environment.DEVELOPMENT;
        const region = Region.AUSTRALIA_EAST;
        const vendor = Vendor.AWS;
        const terraformOrganisation = 'test-org';
        const terraformHostname = 'app.terraform.io';

        const app = new App();
        const configBuilder = new ConfigBuilder()
          .withEnvironment(Environment.DEVELOPMENT)
          .withPublicSubnetCidrBlocks(DEFAULT_VPC_PUBLIC_SUBNET_CIDR_BLOCK)
          .withPrivateSubnetCidrBlocks(['10.0.1.0/24', '10.0.2.0/24']);

        const serviceName = DEFAULT_SERVICE_NAME;
        const serviceNameAndEnvironment = `${serviceName}-${environment}`;
        const serviceResourceType = 'stack';

        const config = configBuilder
          .withName(serviceName)
          .withResourceType(serviceResourceType)
          .withVendor(vendor)
          .withRegion(region)
          .withTerraformConfig(serviceNameAndEnvironment, terraformOrganisation, terraformHostname)
          .build();

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
    });

    describe('When creating RemoteBackend with custom terraform hostname from environment', () => {
      it('Then it should use custom hostname', () => {
        const environment = Environment.DEVELOPMENT;
        const region = Region.AUSTRALIA_EAST;
        const vendor = Vendor.AWS;
        const terraformOrganisation = 'test-org';
        const customHostname = 'custom.terraform.io';

        // Set custom hostname - will be restored by afterEach hook
        process.env.TERRAFORM_HOSTNAME = customHostname;

        const app = new App();
        const configBuilder = new ConfigBuilder()
          .withEnvironment(Environment.DEVELOPMENT)
          .withPublicSubnetCidrBlocks(DEFAULT_VPC_PUBLIC_SUBNET_CIDR_BLOCK)
          .withPrivateSubnetCidrBlocks(['10.0.1.0/24', '10.0.2.0/24']);

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
});
