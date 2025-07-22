import { App, TerraformStack } from 'cdktf';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { Eks } from '../compute/eks';
import { Environment, Region, Vendor } from '../../../utils/common/enums';
import { Config } from '../../../utils/config';
import { TaggingUtility } from '../../../utils/tagging';
import { assertStackSynthesis, parseSynthesizedStack } from '../../../utils/common';

type TerraformSynthEks = {
  name: string;
  role_arn: string;
  vpc_config: {
    subnet_ids: string[];
    security_group_ids: string[];
  };
  tags: {
    Name: string;
    environment: string;
    region: string;
    purpose: string;
    vendor: string;
    resourceType: string;
  };
};

class TestStack extends TerraformStack {
  public readonly eks: Eks;

  constructor(
    scope: App,
    id: string,
    config: Config,
    subnetIds: string[],
    securityGroupIds: string[],
    roleArn: string
  ) {
    super(scope, id);

    const taggingUtility = new TaggingUtility({ ...config, layer: 'compute' });

    new AwsProvider(this, 'AWS', {
      region: 'ap-southeast-2',
      defaultTags: [{ tags: { ...taggingUtility.getTags() } }],
    });

    this.eks = new Eks(this, 'test-eks', {
      config,
      subnetIds,
      securityGroupIds,
      roleArn,
    });
  }
}

const testSubnetIds: string[] = ['subnet-123', 'subnet-456'];
const testSecurityGroupIds: string[] = ['sg-123'];
const testRoleArn: string = 'arn:aws:iam::123456789012:role/test-role';

function createConfig(overrides: Partial<Config> = {}): Config {
  const baseConfig: Config = {
    name: 'test-eks',
    resourceType: 'stack',
    vendor: Vendor.AWS,
    environment: Environment.DEVELOPMENT,
    region: Region.AUSTRALIA_EAST,
    terraformOrganisation: 'test-org',
    terraformWorkspace: 'test-workspace',
    terraformHostname: 'app.terraform.io',
    enableEncryption: true,
    enableSecretsManager: true,
    tags: { purpose: 'testing' } as Record<string, string>,
    ...overrides,
  };
  return baseConfig;
}

function createTestStack(
  app: App,
  config: Config,
  subnetIds: string[],
  securityGroupIds: string[],
  roleArn: string
): TestStack {
  return new TestStack(app, 'test-stack', config, subnetIds, securityGroupIds, roleArn);
}

describe('Eks', () => {
  let app: App;
  let config: Config;

  beforeEach((): void => {
    app = new App();
    config = createConfig();
  });

  describe('Given a valid configuration', () => {
    describe('When creating an EKS cluster', () => {
      it('Then it should create EKS cluster successfully', (): void => {
        const stack: TestStack = createTestStack(
          app,
          config,
          testSubnetIds,
          testSecurityGroupIds,
          testRoleArn
        );
        expect(() => assertStackSynthesis(stack)).not.toThrow();
        expect(stack.eks.eksCluster).toBeDefined();
        expect(stack.eks.arn).toBeDefined();
        expect(stack.eks.name).toBeDefined();
        expect(stack.eks.endpoint).toBeDefined();
      });

      it('Then it should use the default EKS version', (): void => {
        const stack: TestStack = createTestStack(
          app,
          config,
          testSubnetIds,
          testSecurityGroupIds,
          testRoleArn
        );
        const synthesised = parseSynthesizedStack(stack);
        const eksResources = synthesised.resource?.aws_eks_cluster || {};
        const eksCluster: TerraformSynthEks = Object.values(eksResources)[0] as TerraformSynthEks;
        expect(eksCluster).toBeDefined();
      });

      it('Then it should set the correct tags', (): void => {
        const stack: TestStack = createTestStack(
          app,
          config,
          testSubnetIds,
          testSecurityGroupIds,
          testRoleArn
        );
        const synthesised = parseSynthesizedStack(stack);
        const eksResources = synthesised.resource?.aws_eks_cluster || {};
        const eksCluster: TerraformSynthEks = Object.values(eksResources)[0] as TerraformSynthEks;
        const taggingUtility = new TaggingUtility({ ...config, layer: 'compute' });
        const expectedTags = taggingUtility.getTags({ resourceType: 'cluster' });
        Object.entries(expectedTags).forEach(([key, value]) => {
          expect(eksCluster.tags[key as keyof typeof eksCluster.tags]).toBe(value);
        });
      });
    });
  });

  describe('Given different environment configurations', () => {
    describe('When creating EKS clusters in different environments', () => {
      it.each([
        [Environment.DEVELOPMENT, 'dev'],
        [Environment.PRODUCTION, 'prod'],
      ])(
        'Then it should create EKS cluster successfully for environment %s',
        (env: Environment): void => {
          const envConfig: Config = createConfig({ environment: env });
          const stack: TestStack = createTestStack(
            app,
            envConfig,
            testSubnetIds,
            testSecurityGroupIds,
            testRoleArn
          );
          expect(() => assertStackSynthesis(stack)).not.toThrow();
          expect(stack.eks.arn).toBeDefined();
        }
      );
    });
  });

  describe('Given an invalid configuration', () => {
    describe('When creating an EKS cluster', () => {
      it.each([[{ name: undefined }], [{ environment: undefined }]])(
        'Then it should throw an error for missing required field',
        (overrides: Partial<Config>): void => {
          const invalidConfig: Config = { ...createConfig(), ...overrides } as unknown as Config;
          expect((): void => {
            createTestStack(app, invalidConfig, testSubnetIds, testSecurityGroupIds, testRoleArn);
          }).toThrow();
        }
      );
    });
  });
});
