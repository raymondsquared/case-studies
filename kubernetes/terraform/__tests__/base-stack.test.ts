import { Testing } from 'cdktf';
import { App } from 'cdktf';
import { BaseStack, BaseStackArgs } from '../src/stacks/base-stack';
import { Environment, Region, Vendor, NodeCapacityType } from '../src/utils/common/enums';
import { Config } from '../src/utils/config';
import { SecretArgs } from '../src/constructs/aws/security/secrets-manager';
import { ScalingArgs } from '../src/utils/eks/types';
import {
  DEFAULT_VPC_PRIVATE_SUBNET_CIDR_BLOCK,
  DEFAULT_VPC_PUBLIC_SUBNET_CIDR_BLOCK,
  getResourceFromStack,
} from '../src/utils/common';

class TestBaseStack extends BaseStack {
  constructor(scope: App, id: string, data: BaseStackArgs) {
    super(scope, id, data);
  }

  protected getSecretsArgs(): SecretArgs[] {
    if (!this.config.hasSecretsManager) {
      return [];
    }

    return [
      {
        name: 'test-secret-1',
        description: 'Test secret for base stack testing',
        secretString: JSON.stringify({
          testKey: 'testValue',
        }),
      },
      {
        name: 'test-secret-2',
        description: 'Another test secret for base stack testing',
        secretString: JSON.stringify({
          anotherKey: 'anotherValue',
        }),
      },
    ];
  }

  public testCreateNodeGroup(
    config: Config,
    args: {
      instanceTypes?: string[];
      capacityType?: NodeCapacityType;
      scalingArgs?: ScalingArgs;
      subnetIds?: string[];
      tags?: Record<string, string>;
      labels?: { [key: string]: string };
      taints?: Array<{ key: string; value: string; effect: string }>;
    } = {}
  ) {
    return this.createNodeGroup(config, args);
  }
}

const testConfig: Config = {
  name: 'test-base-stack',
  resourceType: 'stack',
  vendor: Vendor.AWS,
  environment: Environment.DEVELOPMENT,
  region: Region.AUSTRALIA_EAST,
  terraformOrganisation: 'test-org',
  terraformWorkspace: 'test-workspace',
  terraformHostname: 'app.terraform.io',
  hasEncryption: true,
  hasSecretsManager: true,
  hasNatGateway: true,
  publicSubnetCIDRBlocks: DEFAULT_VPC_PUBLIC_SUBNET_CIDR_BLOCK,
  privateSubnetCIDRBlocks: DEFAULT_VPC_PRIVATE_SUBNET_CIDR_BLOCK,
  tags: {
    purpose: 'testing',
  },
};

describe('BaseStack', () => {
  let config: Config;

  beforeEach(() => {
    config = { ...testConfig };
  });

  describe('Given a valid configuration', () => {
    describe('When creating the stack', () => {
      it('Then it should initialise with all required resources', () => {
        const app = new App();
        const stack = new TestBaseStack(app, 'test-base-stack', {
          config,
        });

        expect(() => {
          Testing.fullSynth(stack);
        }).not.toThrow();

        expect(stack).toBeDefined();
        expect(stack.node.id).toBe('test-base-stack');
        expect(stack.vpc).toBeDefined();
        expect(stack.kms).toBeDefined();
        expect(stack.secretsManager).toBeDefined();
        expect(stack.controlPlaneIamRole).toBeDefined();
        expect(stack.nodeGroupIamRole).toBeDefined();
        expect(stack.eks).toBeDefined();
        expect(stack.eksNodeGroups).toBeDefined();
        expect(Array.isArray(stack.eksNodeGroups)).toBe(true);
      });

      it('Then it should create networking resources with correct configuration', () => {
        const app = new App();
        const stack = new TestBaseStack(app, 'test-base-stack', {
          config,
        });

        expect(() => {
          Testing.fullSynth(stack);
        }).not.toThrow();

        expect(stack.vpc).toBeDefined();
        expect(stack.vpc.vpc).toBeDefined();
        expect(stack.vpc.privateSubnets).toBeDefined();
        expect(stack.vpc.privateSubnets.length).toBeGreaterThan(0);
        expect(stack.vpc.publicSubnets).toBeDefined();
        expect(stack.vpc.publicSubnets.length).toBeGreaterThan(0);
        expect(stack.vpc.securityGroups).toBeDefined();
        expect(stack.vpc.securityGroups.length).toBeGreaterThan(0);
      });

      it('Then it should create security resources with encryption enabled', () => {
        const app = new App();
        const stack = new TestBaseStack(app, 'test-base-stack', {
          config,
        });

        expect(() => {
          Testing.fullSynth(stack);
        }).not.toThrow();

        expect(stack.kms).toBeDefined();
        expect(stack.kms.id).toBeDefined();
        expect(stack.kms.arn).toBeDefined();
        expect(stack.secretsManager).toBeDefined();
        expect(stack.secretsManager.count).toBe(2);
        expect(stack.secretsManager.names).toHaveLength(2);
      });

      it('Then it should create IAM roles with correct policies', () => {
        const app = new App();
        const stack = new TestBaseStack(app, 'test-base-stack', {
          config,
        });

        expect(() => {
          Testing.fullSynth(stack);
        }).not.toThrow();

        expect(stack.controlPlaneIamRole).toBeDefined();
        expect(stack.controlPlaneIamRole.arn).toBeDefined();
        expect(stack.controlPlaneIamRole.name).toBeDefined();

        expect(stack.nodeGroupIamRole).toBeDefined();
        expect(stack.nodeGroupIamRole.arn).toBeDefined();
        expect(stack.nodeGroupIamRole.name).toBeDefined();
      });

      it('Then it should synthesize stack with security group successfully', () => {
        const app = new App();
        const stack = new TestBaseStack(app, 'test-base-stack-security', {
          config,
        });

        expect(() => {
          Testing.fullSynth(stack);
        }).not.toThrow();

        expect(stack.vpc).toBeDefined();
        expect(stack.vpc.vpc).toBeDefined();
        expect(stack.eksSecurityGroup).toBeDefined();
        expect(stack.controlPlaneIamRole).toBeDefined();
        expect(stack.nodeGroupIamRole).toBeDefined();
        expect(stack.eks).toBeDefined();

        const securityGroup = getResourceFromStack(stack, 'aws_security_group');
        // expect(securityGroup.name).toContain('test-base-stack');
        // expect(securityGroup.name).toContain(config.environment);
        // expect(securityGroup.name).toContain('eks-sg');
        expect(securityGroup.vpc_id).toBeDefined();
      });

      it('Then it should create EKS cluster with security group and node groups', () => {
        const app = new App();
        const stack = new TestBaseStack(app, 'test-base-stack', {
          config,
        });

        expect(() => {
          Testing.fullSynth(stack);
        }).not.toThrow();

        expect(stack.eksSecurityGroup).toBeDefined();
        expect(stack.eksSecurityGroup.name).toBeDefined();
        expect(stack.eksSecurityGroup.description).toBeDefined();
        expect(stack.eksSecurityGroup.vpcId).toBeDefined();
        expect(stack.eksSecurityGroup.id).toBeDefined();

        // const securityGroup = getResourceFromStack(stack, 'aws_security_group');
        // expect(securityGroup.description).toBe('Security group for EKS cluster');

        expect(stack.eks).toBeDefined();
        expect(stack.eks.name).toBeDefined();
        expect(stack.eks.arn).toBeDefined();
        expect(stack.eks.endpoint).toBeDefined();
        expect(stack.eksNodeGroups.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Given different environment arguments', () => {
    describe('When creating stacks for different environments', () => {
      it.each([
        [Environment.DEVELOPMENT, 'dev'],
        [Environment.PRODUCTION, 'prod'],
      ])('Then it should create stack successfully for environment %s', (env: Environment) => {
        const configWithEnvironment = {
          ...config,
          environment: env,
        };

        const app = new App();
        const stack = new TestBaseStack(app, `test-base-stack-${env}`, {
          config: configWithEnvironment,
        });

        expect(() => {
          Testing.fullSynth(stack);
        }).not.toThrow();

        expect(stack).toBeDefined();
        expect(stack.vpc).toBeDefined();
        expect(stack.eks).toBeDefined();
      });
    });

    describe('When creating stacks with different project names', () => {
      it('Then it should create stack successfully with custom project name', () => {
        const configWithCustomName = {
          ...config,
          name: 'custom-project',
        };

        const app = new App();
        const stack = new TestBaseStack(app, 'test-base-stack-custom', {
          config: configWithCustomName,
        });

        expect(() => {
          Testing.fullSynth(stack);
        }).not.toThrow();

        expect(stack).toBeDefined();
        expect(stack.node.id).toBe('test-base-stack-custom');
        expect(stack.vpc).toBeDefined();
        expect(stack.eks).toBeDefined();
      });
    });

    describe('When creating stacks for AWS vendor', () => {
      it('Then it should handle AWS vendor configuration', () => {
        const configWithVendor = {
          ...config,
          vendor: Vendor.AWS,
        };

        const app = new App();
        const stack = new TestBaseStack(app, 'test-base-stack-aws', {
          config: configWithVendor,
        });

        expect(() => {
          Testing.fullSynth(stack);
        }).not.toThrow();

        expect(stack).toBeDefined();
        expect(stack.vpc).toBeDefined();
        expect(stack.eks).toBeDefined();
      });

      it('Then it should throw error for non-AWS vendors', () => {
        const nonAwsVendors = [Vendor.AZURE, Vendor.GCP, Vendor.ON_PREMISES, Vendor.OTHERS];

        nonAwsVendors.forEach(vendor => {
          const configWithVendor = {
            ...config,
            vendor,
          };

          const app = new App();

          expect(() => {
            new TestBaseStack(app, `test-base-stack-${vendor}`, {
              config: configWithVendor,
            });
          }).toThrow(`Unsupported vendor: ${vendor}. Only AWS is supported.`);
        });
      });
    });
  });

  describe('Given an invalid configuration', () => {
    describe('When creating base stack with missing required fields', () => {
      it.each([
        ['name', 'name is required and cannot be empty.'],
        ['resourceType', 'resourceType is required and cannot be empty.'],
        ['terraformOrganisation', 'terraformOrganisation is required and cannot be empty.'],
        ['terraformWorkspace', 'terraformWorkspace is required and cannot be empty.'],
        ['terraformHostname', 'terraformHostname is required and cannot be empty.'],
      ])('Then it should throw error for missing %s', (field: string, expectedError: string) => {
        const invalidConfig = {
          ...config,
          [field]: '',
        };

        const app = new App();

        expect(() => {
          new TestBaseStack(app, 'test-stack', {
            config: invalidConfig,
          });
        }).toThrow(`Config validation error: ${expectedError}`);
      });
    });
  });
});
