import { App, TerraformStack } from 'cdktf';
import { AwsProvider } from '../../../../.gen/providers/aws/provider';
import { Vpc, VpcProps } from '../networking/vpc';
import { Environment, Region, Vendor } from '../../../utils/common/enums';
import { Config } from '../../../utils/config';
import { TaggingUtility } from '../../../utils/tagging';
import {
  DEFAULT_VPC_PRIVATE_SUBNET_CIDR_BLOCK,
  DEFAULT_VPC_PUBLIC_SUBNET_CIDR_BLOCK,
  DEFAULT_VPC_CIDR_BLOCK,
  assertStackSynthesis,
  getResourceFromStack,
} from '../../../utils/common';

class TestStack extends TerraformStack {
  public readonly vpc: Vpc;

  constructor(scope: App, id: string, config: Config, vpcProps: Partial<VpcProps> = {}) {
    super(scope, id);
    const taggingUtility = new TaggingUtility({ ...config, layer: 'network' });
    new AwsProvider(this, 'AWS', {
      region: 'ap-southeast-2',
      defaultTags: [{ tags: { ...taggingUtility.getTags() } }],
    });
    this.vpc = new Vpc(this, 'test-vpc', { config, ...vpcProps });
  }
}

const testVpcCidrBlock: string = '172.16.0.0/16';
const testVpcCidrBlockAlt: string = '10.0.0.0/16';

function createConfig(overrides: Partial<Config> = {}): Config {
  const baseConfig: Config = {
    name: 'test-vpc',
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
    tags: { purpose: 'testing' } as Record<string, string>,
    ...overrides,
  };
  return baseConfig;
}

function createTestStack(
  app: App,
  config: Config = createConfig(),
  vpcProps: Partial<VpcProps> = {}
): TestStack {
  return new TestStack(app, 'test-stack', config, vpcProps);
}

describe('Vpc', () => {
  let app: App;
  let config: Config;

  beforeEach((): void => {
    app = new App();
    config = createConfig();
  });

  describe('Given a valid configuration', () => {
    describe('When creating a VPC', () => {
      it('Then it should create VPC with default CIDR block', (): void => {
        const stack: TestStack = createTestStack(app, config);
        expect(() => assertStackSynthesis(stack)).not.toThrow();
        expect(stack.vpc.vpc).toBeDefined();
        expect(stack.vpc.vpc.cidrBlock).toBeDefined();
        expect(stack.vpc.vpc.enableDnsHostnames).toBeDefined();
        expect(stack.vpc.vpc.enableDnsSupport).toBeDefined();
      });

      it('Then it should use custom CIDR when specified', (): void => {
        const configWithCustomCidr: Config = createConfig({ vpcCIDRBlock: testVpcCidrBlock });
        const stack: TestStack = createTestStack(app, configWithCustomCidr);
        expect(() => assertStackSynthesis(stack)).not.toThrow();
        const vpc: any = getResourceFromStack(stack, 'aws_vpc');
        expect(vpc.cidr_block).toBe(testVpcCidrBlock);
      });

      it('Then it should create private subnets', (): void => {
        const stack: TestStack = createTestStack(app, config);
        expect(() => assertStackSynthesis(stack)).not.toThrow();
        expect(stack.vpc.privateSubnets).toBeDefined();
        expect(stack.vpc.privateSubnets).toHaveLength(3);
        expect(stack.vpc.privateRouteTable).toBeDefined();
      });

      it('Then it should create public subnets', (): void => {
        const stack: TestStack = createTestStack(app, config);
        expect(() => assertStackSynthesis(stack)).not.toThrow();
        expect(stack.vpc.publicSubnets).toBeDefined();
        expect(stack.vpc.publicSubnets).toHaveLength(3);
        expect(stack.vpc.internetGateway).toBeDefined();
        expect(stack.vpc.publicRouteTable).toBeDefined();
      });

      it('Then it should create security groups', (): void => {
        const stack: TestStack = createTestStack(app, config);
        expect(() => assertStackSynthesis(stack)).not.toThrow();
        expect(stack.vpc.securityGroups).toBeDefined();
        expect(stack.vpc.securityGroups).toHaveLength(1);
        expect(stack.vpc.securityGroups[0].vpcId).toBeDefined();
      });
    });
  });

  describe('Given a configuration with custom options', () => {
    describe('When creating a VPC with custom CIDR', () => {
      it('Then it should use the custom CIDR block', (): void => {
        const customConfig: Config = createConfig({ vpcCIDRBlock: testVpcCidrBlockAlt });
        const stack: TestStack = createTestStack(app, customConfig);
        expect(() => assertStackSynthesis(stack)).not.toThrow();
        const vpc: any = getResourceFromStack(stack, 'aws_vpc');
        expect(vpc.cidr_block).toBe(testVpcCidrBlockAlt);
      });
    });

    describe('When creating a VPC with custom subnet CIDR blocks', () => {
      it('Then it should use the custom subnet configurations', (): void => {
        const customConfig: Config = createConfig({
          publicSubnetCIDRBlocks: ['10.0.1.0/24', '10.0.2.0/24'],
          privateSubnetCIDRBlocks: ['10.0.10.0/24', '10.0.11.0/24'],
        });
        const stack: TestStack = createTestStack(app, customConfig);
        expect(() => assertStackSynthesis(stack)).not.toThrow();
        expect(stack.vpc.publicSubnets).toHaveLength(2);
        expect(stack.vpc.privateSubnets).toHaveLength(2);
      });
    });
  });

  describe('Given different environment configurations', () => {
    describe('When creating VPCs in different environments', () => {
      it.each([
        [Environment.DEVELOPMENT, 'development'],
        [Environment.PRODUCTION, 'production'],
      ])('Then it should create VPC successfully for environment %s', (env: Environment): void => {
        const envConfig: Config = createConfig({ environment: env });
        const stack: TestStack = createTestStack(app, envConfig);
        expect(() => assertStackSynthesis(stack)).not.toThrow();
        expect(stack.vpc.vpc).toBeDefined();
      });
    });

    describe('When creating VPCs with different project names', () => {
      it('Then it should create VPC successfully', (): void => {
        const customConfig: Config = createConfig({ name: 'custom-project' });
        const stack: TestStack = createTestStack(app, customConfig);
        expect(() => assertStackSynthesis(stack)).not.toThrow();
        expect(stack.vpc.vpc).toBeDefined();
      });
    });
  });

  describe('Given a VPC is created', () => {
    describe('When synthesizing the stack', () => {
      it('Then it should create properly configured VPC resources', (): void => {
        const stack: TestStack = createTestStack(app, config);
        const vpc: any = getResourceFromStack(stack, 'aws_vpc');

        expect(vpc.cidr_block).toBe(DEFAULT_VPC_CIDR_BLOCK);
        expect(vpc.enable_dns_hostnames).toBe(true);
        expect(vpc.enable_dns_support).toBe(true);

        const expectedTags: Record<string, string> = {
          environment: 'development',
          name: 'test-vpc-pub',
          purpose: 'testing',
          region: 'AUSTRALIA_EAST',
          resourceType: 'vpc',
          vendor: 'AWS',
          layer: 'network',
        };
        Object.entries(expectedTags).forEach(([key, value]: [string, string]) => {
          expect(vpc.tags[key]).toBe(value);
        });
      });
    });
  });

  describe('Given a configuration without subnet CIDR blocks', () => {
    describe('When creating a VPC', () => {
      it('Then it should create only VPC and security groups', (): void => {
        const configWithoutSubnets: Config = createConfig({
          publicSubnetCIDRBlocks: undefined,
          privateSubnetCIDRBlocks: undefined,
        });
        const stack: TestStack = createTestStack(app, configWithoutSubnets);
        expect(() => assertStackSynthesis(stack)).not.toThrow();

        expect(stack.vpc.vpc).toBeDefined();
        expect(stack.vpc.privateSubnets).toHaveLength(0);
        expect(stack.vpc.publicSubnets).toHaveLength(0);
        expect(stack.vpc.securityGroups).toHaveLength(1);
        expect(stack.vpc.internetGateway).toBeUndefined();
        expect(stack.vpc.publicRouteTable).toBeUndefined();
        expect(stack.vpc.privateRouteTable).toBeUndefined();
      });

      it('Then it should not create private subnets when privateSubnetCIDRBlocks is undefined', (): void => {
        const configWithoutPrivateSubnets: Config = createConfig({
          privateSubnetCIDRBlocks: undefined,
        });
        const stack: TestStack = createTestStack(app, configWithoutPrivateSubnets);
        expect(() => assertStackSynthesis(stack)).not.toThrow();

        expect(stack.vpc.privateSubnets).toHaveLength(0);
        expect(stack.vpc.privateRouteTable).toBeUndefined();
      });

      it('Then it should not create public subnets when publicSubnetCIDRBlocks is undefined', (): void => {
        const configWithoutPublicSubnets: Config = createConfig({
          publicSubnetCIDRBlocks: undefined,
        });
        const stack: TestStack = createTestStack(app, configWithoutPublicSubnets);
        expect(() => assertStackSynthesis(stack)).not.toThrow();

        expect(stack.vpc.publicSubnets).toHaveLength(0);
        expect(stack.vpc.internetGateway).toBeUndefined();
        expect(stack.vpc.publicRouteTable).toBeUndefined();
      });
    });
  });

  describe('Given an invalid configuration', () => {
    describe('When creating a VPC', () => {
      it('Then it should throw an error for missing config', (): void => {
        expect((): void => {
          new Vpc(new App(), 'test-vpc', {} as VpcProps);
        }).toThrow();
      });

      it.each([
        [{ name: undefined }],
        [{ environment: undefined }],
        [{ terraformOrganisation: undefined }],
      ])('Then it should throw an error for missing required field', (overrides: Partial<Config>): void => {
        const invalidConfig: Config = { ...createConfig(), ...overrides } as unknown as Config;
        expect((): void => {
          createTestStack(app, invalidConfig);
        }).toThrow();
      });
    });
  });

  describe('Given NAT gateway configuration', () => {
    describe('When enableNatGateway is true', () => {
      it('Then it should create NAT gateway when public and private subnets exist', (): void => {
        const configWithNatGateway: Config = createConfig({ enableNatGateway: true });
        const stack: TestStack = createTestStack(app, configWithNatGateway);
        expect(() => assertStackSynthesis(stack)).not.toThrow();
        expect(stack.vpc.natGateways).toHaveLength(1);
      });
    });

    describe('When enableNatGateway is false', () => {
      it('Then it should not create NAT gateway even when public and private subnets exist', (): void => {
        const configWithoutNatGateway: Config = createConfig({ enableNatGateway: false });
        const stack: TestStack = createTestStack(app, configWithoutNatGateway);
        expect(() => assertStackSynthesis(stack)).not.toThrow();
        expect(stack.vpc.natGateways).toHaveLength(0);
      });
    });
  });
});
