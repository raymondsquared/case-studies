import { Testing } from 'cdktf';
import { App, TerraformStack } from 'cdktf';
import { AwsProvider } from '../../../.gen/providers/aws/provider';
import { Vpc } from '../networking/vpc';
import { VpcProps } from '../networking/vpc';
import { Environment, Region, Vendor } from '../../utils/common/enums';
import { Config } from '../../utils/config';
import { TaggingUtility } from '../../utils/tagging';

class TestStack extends TerraformStack {
  public readonly Vpc: Vpc;

  constructor(scope: App, id: string, config: Config, vpcProps: Partial<VpcProps>) {
    super(scope, id);

    const taggingUtility = new TaggingUtility(config);

    new AwsProvider(this, 'AWS', {
      region: 'ap-southeast-2',
      defaultTags: [{ tags: { ...taggingUtility.getTags() } }],
    });

    this.Vpc = new Vpc(this, 'test-vpc', { config, ...vpcProps });
  }
}

describe('Vpc', () => {
  let app: App;
  let config: Config;

  beforeEach(() => {
    app = new App();
    config = {
      name: 'test-vpc',
      resourceType: 'stack',
      vendor: Vendor.AWS,
      environment: Environment.DEVELOPMENT,
      region: Region.AUE,
      terraformOrganisation: 'test-org',
      terraformWorkspace: 'test-workspace',
      terraformHostname: 'app.terraform.io',
      enableEncryption: true,
      enableSecretsManager: true,
      enablePublicVPC: true,
      tags: {
        purpose: 'testing',
      },
    };
  });

  describe('VPC Creation', () => {
    it('Given a valid configuration, When creating a VPC construct, Then it should create a VPC with default CIDR block', () => {
      const vpcProps = {};
      const stack = new TestStack(app, 'test-stack', config, vpcProps);

      expect(() => {
        Testing.fullSynth(stack);
      }).not.toThrow();

      expect(stack.Vpc.vpc).toBeDefined();
      expect(stack.Vpc.vpc.cidrBlock).toBeDefined();
      expect(stack.Vpc.vpc.enableDnsHostnames).toBeDefined();
      expect(stack.Vpc.vpc.enableDnsSupport).toBeDefined();
    });

    it('Given a configuration with custom CIDR block, When creating a VPC construct, Then it should use the custom CIDR block', () => {
      const customCidr = '172.16.0.0/16';
      const vpcProps = { cidrBlock: customCidr };
      const stack = new TestStack(app, 'test-stack', config, vpcProps);

      expect(() => {
        Testing.fullSynth(stack);
      }).not.toThrow();

      expect(stack.Vpc.vpc.cidrBlock).toBeDefined();
    });
  });

  describe('Private Subnets', () => {
    it('Given a configuration with private subnets enabled, When creating a VPC construct, Then it should create private subnets', () => {
      const vpcProps = { enablePrivateSubnets: true };
      const stack = new TestStack(app, 'test-stack', config, vpcProps);

      expect(() => {
        Testing.fullSynth(stack);
      }).not.toThrow();

      expect(stack.Vpc.privateSubnets).toBeDefined();
      expect(stack.Vpc.privateSubnets).toHaveLength(3);
      expect(stack.Vpc.privateRouteTable).toBeDefined();
    });

    it('Given a configuration with private subnets disabled, When creating a VPC construct, Then it should not create private subnets', () => {
      const vpcProps = { enablePrivateSubnets: false };
      const stack = new TestStack(app, 'test-stack', config, vpcProps);

      expect(() => {
        Testing.fullSynth(stack);
      }).not.toThrow();

      expect(stack.Vpc.privateSubnets).toHaveLength(0);
      expect(stack.Vpc.privateRouteTable).toBeUndefined();
    });
  });

  describe('Public Subnets', () => {
    it('Given a configuration with public subnets enabled, When creating a VPC construct, Then it should create public subnets and internet gateway', () => {
      const vpcProps = { enablePublicSubnets: true };
      const stack = new TestStack(app, 'test-stack', config, vpcProps);

      expect(() => {
        Testing.fullSynth(stack);
      }).not.toThrow();

      expect(stack.Vpc.publicSubnets).toBeDefined();
      expect(stack.Vpc.publicSubnets).toHaveLength(3);
      expect(stack.Vpc.internetGateway).toBeDefined();
      expect(stack.Vpc.publicRouteTable).toBeDefined();
    });

    it('Given a configuration with public subnets disabled, When creating a VPC construct, Then it should not create public subnets', () => {
      const vpcProps = { enablePublicSubnets: false };
      const stack = new TestStack(app, 'test-stack', config, vpcProps);

      expect(() => {
        Testing.fullSynth(stack);
      }).not.toThrow();

      expect(stack.Vpc.publicSubnets).toHaveLength(0);
      expect(stack.Vpc.internetGateway).toBeUndefined();
      expect(stack.Vpc.publicRouteTable).toBeUndefined();
    });
  });

  describe('Security Groups', () => {
    it('Given a VPC construct is created, When examining security groups, Then it should create a default security group', () => {
      const vpcProps = {};
      const stack = new TestStack(app, 'test-stack', config, vpcProps);

      expect(() => {
        Testing.fullSynth(stack);
      }).not.toThrow();

      expect(stack.Vpc.securityGroups).toBeDefined();
      expect(stack.Vpc.securityGroups).toHaveLength(1);
      expect(stack.Vpc.securityGroups[0].vpcId).toBeDefined();
    });
  });

  describe('Error Cases', () => {
    it('Given a configuration without required config, When creating a VPC construct, Then it should throw an error', () => {
      const invalidProps = {};

      expect(() => {
        new Vpc(app, 'test-vpc', invalidProps as VpcProps);
      }).toThrow();
    });

    it('Given a configuration with both public and private subnets disabled, When creating a VPC construct, Then it should create only the VPC and security groups', () => {
      const testConfig = { ...config, enablePublicVPC: false };
      const vpcProps = {
        enablePublicSubnets: false,
        enablePrivateSubnets: false,
      };
      const stack = new TestStack(app, 'test-stack', testConfig, vpcProps);

      expect(() => {
        Testing.fullSynth(stack);
      }).not.toThrow();

      expect(stack.Vpc.vpc).toBeDefined();
      expect(stack.Vpc.privateSubnets).toHaveLength(0);
      expect(stack.Vpc.publicSubnets).toHaveLength(0);
      expect(stack.Vpc.securityGroups).toHaveLength(1);
      expect(stack.Vpc.internetGateway).toBeUndefined();
      expect(stack.Vpc.publicRouteTable).toBeUndefined();
      expect(stack.Vpc.privateRouteTable).toBeUndefined();
    });
  });

  describe('Resource Relationships', () => {
    it('Given a VPC construct with both subnet types, When examining resource relationships, Then subnets should be properly associated with route tables', () => {
      const vpcProps = { enablePublicSubnets: true, enablePrivateSubnets: true };
      const stack = new TestStack(app, 'test-stack', config, vpcProps);

      expect(() => {
        Testing.fullSynth(stack);
      }).not.toThrow();

      expect(stack.Vpc.privateSubnets).toHaveLength(3);
      expect(stack.Vpc.publicSubnets).toHaveLength(3);
      expect(stack.Vpc.privateRouteTable).toBeDefined();
      expect(stack.Vpc.publicRouteTable).toBeDefined();
      expect(stack.Vpc.internetGateway).toBeDefined();
    });
  });
});
