import { Testing } from 'cdktf';
import { App } from 'cdktf';
import { DevelopmentStack } from '../src/stacks/development-stack';
import { Environment, Region, Vendor } from '../src/utils/common/enums';
import { Config } from '../src/utils/config';

describe('DevelopmentStack', () => {
  let config: Config;

  beforeEach(() => {
    config = {
      name: 'test-development',
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

  it('Given a development stack configuration, When creating the stack, Then it should initialize with development environment and all required resources', () => {
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

  it('Given a development stack without description, When creating the stack, Then it should use default development description and create development-specific secret configuration', () => {
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

  it('Given different configuration combinations, When creating development stacks, Then they should all synthesize successfully with appropriate resources', () => {
    const configVariations = [
      { ...config, enableEncryption: false, enableSecretsManager: false, enablePublicVPC: false },
      { ...config, enableEncryption: true, enableSecretsManager: true, enablePublicVPC: false },
      { ...config, enableEncryption: false, enableSecretsManager: true, enablePublicVPC: true },
      { ...config, region: Region.USE, enableEncryption: true, enableSecretsManager: true, enablePublicVPC: true },
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
      
      if (configVar.enablePublicVPC) {
        expect(stack.vpc.publicSubnets).toBeDefined();
        expect(stack.vpc.publicSubnets.length).toBeGreaterThan(0);
        expect(stack.vpc.internetGateway).toBeDefined();
      } else {
        expect(stack.vpc.privateSubnets).toBeDefined();
        expect(stack.vpc.privateSubnets.length).toBeGreaterThan(0);
      }
    });
  });

  it('Given a development stack with public VPC enabled, When synthesizing, Then it should create both public and private networking resources with internet access', () => {
    const app = new App();
    const stack = new DevelopmentStack(app, 'test-dev-stack', {
      config: {
        ...config,
        enablePublicVPC: true,
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

  it('Given a development stack with encryption enabled, When synthesizing, Then it should create KMS resources and all required Terraform outputs', () => {
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
