import { Testing } from 'cdktf';
import { App } from 'cdktf';
import { DevelopmentStack } from '../src/stacks/development-stack';
import { Environment, Region, Vendor } from '../src/utils/common/enums';
import { Config } from '../src/utils/config';
import {
  DEFAULT_VPC_PRIVATE_SUBNET_CIDR_BLOCK,
  DEFAULT_VPC_PUBLIC_SUBNET_CIDR_BLOCK,
} from '../src/utils/common';

const testConfig: Config = {
  name: 'test-development',
  resourceType: 'stack',
  vendor: Vendor.AWS,
  environment: Environment.DEVELOPMENT,
  region: Region.AUSTRALIA_EAST,
  terraformOrganisation: 'test-org',
  terraformWorkspace: 'test-workspace',
  terraformHostname: 'app.terraform.io',
  enableEncryption: true,
  enableSecretsManager: true,
  enableNatGateway: true,
  publicSubnetCIDRBlocks: DEFAULT_VPC_PUBLIC_SUBNET_CIDR_BLOCK,
  privateSubnetCIDRBlocks: DEFAULT_VPC_PRIVATE_SUBNET_CIDR_BLOCK,
  tags: {
    purpose: 'testing',
  },
};

describe('DevelopmentStack', () => {
  let config: Config;

  beforeEach(() => {
    config = { ...testConfig };
  });

  describe('Given a development stack configuration', () => {
    describe('When creating the stack', () => {
      it('Then it should initialise with development environment and all required resources', () => {
        const app = new App();
        const stack = new DevelopmentStack(app, 'test-dev-stack', {
          config,
        });

        expect(() => {
          Testing.fullSynth(stack);
        }).not.toThrow();

        expect(stack).toBeDefined();
        expect(stack.node.id).toBe('test-dev-stack');
        expect(stack.vpc).toBeDefined();
        expect(stack.secretsManager).toBeDefined();
        expect(stack.kms).toBeDefined();
      });

      it('Then it should use default development description and create development-specific secret configuration', () => {
        const app = new App();
        const stack = new DevelopmentStack(app, 'test-dev-stack', {
          config,
        });

        expect(() => {
          Testing.fullSynth(stack);
        }).not.toThrow();

        expect(stack).toBeDefined();
        expect(stack.secretsManager).toBeDefined();
        expect(stack.secretsManager.count).toBeGreaterThan(0);
        expect(stack.secretsManager.names).toHaveLength(1);
      });
    });
  });

  describe('Given different configuration combinations', () => {
    describe('When creating development stacks', () => {
      it('Then they should all synthesise successfully with appropriate resources', () => {
        const configVariations = [
          {
            ...config,
            enableEncryption: false,
            enableSecretsManager: false,
            publicSubnetCIDRBlocks: undefined,
          },
          {
            ...config,
            enableEncryption: true,
            enableSecretsManager: true,
            publicSubnetCIDRBlocks: undefined,
          },
          {
            ...config,
            enableEncryption: false,
            enableSecretsManager: true,
            publicSubnetCIDRBlocks: DEFAULT_VPC_PUBLIC_SUBNET_CIDR_BLOCK,
          },
          {
            ...config,
            region: Region.US_EAST,
            enableEncryption: true,
            enableSecretsManager: true,
            publicSubnetCIDRBlocks: DEFAULT_VPC_PUBLIC_SUBNET_CIDR_BLOCK,
          },
        ];

        configVariations.forEach((configVar, index) => {
          const app = new App();
          const stack = new DevelopmentStack(app, `test-dev-stack-${index}`, {
            config: configVar,
          });

          expect(() => {
            Testing.fullSynth(stack);
          }).not.toThrow();

          expect(stack).toBeDefined();
          expect(stack.vpc).toBeDefined();
          expect(stack.kms).toBeDefined();

          if (configVar.enableSecretsManager) {
            expect(stack.secretsManager).toBeDefined();
            expect(stack.secretsManager.count).toBeGreaterThan(0);
          }

          if (configVar.publicSubnetCIDRBlocks?.length) {
            expect(stack.vpc.publicSubnets).toBeDefined();
            expect(stack.vpc.publicSubnets.length).toBeGreaterThan(0);
            expect(stack.vpc.internetGateway).toBeDefined();
          } else {
            expect(stack.vpc.privateSubnets).toBeDefined();
            expect(stack.vpc.privateSubnets.length).toBeGreaterThan(0);
          }
        });
      });
    });
  });

  describe('Given a development stack with public VPC enabled', () => {
    describe('When synthesising', () => {
      it('Then it should create both public and private networking resources with internet access', () => {
        const app = new App();
        const stack = new DevelopmentStack(app, 'test-dev-stack', {
          config: {
            ...config,
            publicSubnetCIDRBlocks: DEFAULT_VPC_PUBLIC_SUBNET_CIDR_BLOCK,
          },
        });

        expect(() => {
          Testing.fullSynth(stack);
        }).not.toThrow();

        expect(stack.vpc).toBeDefined();
        expect(stack.vpc.publicSubnets).toBeDefined();
        expect(stack.vpc.publicSubnets.length).toBeGreaterThan(0);
        expect(stack.vpc.privateSubnets).toBeDefined();
        expect(stack.vpc.privateSubnets.length).toBeGreaterThan(0);
        expect(stack.vpc.internetGateway).toBeDefined();
      });
    });
  });

  describe('Given a development stack with encryption enabled', () => {
    describe('When synthesising', () => {
      it('Then it should create KMS resources and all required Terraform outputs', () => {
        const app = new App();
        const stack = new DevelopmentStack(app, 'test-dev-stack', {
          config,
        });

        expect(() => {
          Testing.fullSynth(stack);
        }).not.toThrow();

        expect(stack.kms).toBeDefined();
        expect(stack.kms.arn).toBeDefined();
        expect(stack.kms.id).toBeDefined();
        expect(stack.secretsManager).toBeDefined();
        expect(stack.secretsManager.count).toBeGreaterThan(0);
      });
    });
  });

  describe('Given a development stack with IAM and Kubernetes resources', () => {
    describe('When synthesising', () => {
      it('Then it should create IAM and EKS resources with expected properties', () => {
        const app = new App();
        const stack = new DevelopmentStack(app, 'test-dev-stack', {
          config,
        });

        expect(() => {
          Testing.fullSynth(stack);
        }).not.toThrow();

        expect(stack.controlPlaneIamRole).toBeDefined();
        expect(stack.controlPlaneIamRole.arn).toBeDefined();
        expect(stack.controlPlaneIamRole.name).toBeDefined();

        expect(stack.eks).toBeDefined();
        expect(stack.eks.name).toBeDefined();
        expect(stack.eks.arn).toBeDefined();
        expect(stack.eks.endpoint).toBeDefined();
      });
    });
  });
});
