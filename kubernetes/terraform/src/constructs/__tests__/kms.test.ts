import { Testing } from 'cdktf';
import { App, TerraformStack } from 'cdktf';
import { AwsProvider } from '../../../.gen/providers/aws/provider';
import { Kms, KmsProps } from '../security/kms';
import { Environment, Region, Vendor } from '../../utils/common/enums';
import { Config } from '../../utils/config';
import { TaggingUtility } from '../../utils/tagging';

class TestStack extends TerraformStack {
  public readonly kms: Kms;

  constructor(scope: App, id: string, config: Config, kmsProps: Partial<KmsProps>) {
    super(scope, id);

    const taggingUtility = new TaggingUtility({ ...config, layer: 'security' });

    new AwsProvider(this, 'AWS', {
      region: 'ap-southeast-2',
      defaultTags: [{ tags: { ...taggingUtility.getTags() } }],
    });

    this.kms = new Kms(this, 'test-kms', {
      config,
      description: kmsProps.description,
      aliasName: kmsProps.aliasName,
      tags: kmsProps.tags,
    });
  }
}

describe('Kms', () => {
  let app: App;
  let config: Config;

  beforeEach(() => {
    app = new App();
    config = {
      name: 'test-kms',
      resourceType: 'stack',
      vendor: Vendor.AWS,
      environment: Environment.DEVELOPMENT,
      region: Region.AUSTRALIA_EAST,
      terraformOrganisation: 'test-org',
      terraformWorkspace: 'test-workspace',
      terraformHostname: 'app.terraform.io',
      enableEncryption: true,
      enableSecretsManager: true,
      enablePublicVPC: true,
      tags: { purpose: 'testing' },
    };
  });

  describe('KMS Key Creation', () => {
    it('Given a valid configuration, When creating a Kms, Then it should create KMS key and alias', () => {
      const stack = new TestStack(app, 'test-stack', config, {});

      expect(() => Testing.fullSynth(stack)).not.toThrow();
      expect(stack.kms.kmsKey).toBeDefined();
      expect(stack.kms.kmsAlias).toBeDefined();
      expect(stack.kms.arn).toBeDefined();
      expect(stack.kms.id).toBeDefined();
    });

    it('Given a configuration with custom description, When creating a Kms, Then it should create KMS key successfully', () => {
      const customDescription = 'Custom KMS key for testing';
      const stack = new TestStack(app, 'test-stack', config, { description: customDescription });

      expect(() => Testing.fullSynth(stack)).not.toThrow();
      expect(stack.kms.kmsKey).toBeDefined();
    });

    it('Given a configuration with custom tags, When creating a Kms, Then it should apply the custom tags', () => {
      const customTags = { environment: 'custom', owner: 'team-a' };
      const stack = new TestStack(app, 'test-stack', config, { tags: customTags });

      expect(() => Testing.fullSynth(stack)).not.toThrow();
      expect(stack.kms.kmsKey.tags).toBeDefined();
    });

    it('Given a configuration with custom alias name, When creating a Kms, Then it should synthesize the correct alias name', () => {
      const customAlias = 'custom-test-key';
      const stack = new TestStack(app, 'test-stack', config, { aliasName: customAlias });
      let synthesized = Testing.synth(stack);
      if (typeof synthesized === 'string') {
        synthesized = JSON.parse(synthesized);
      }
      const aliasResources = (synthesized as any).resource?.aws_kms_alias || {};
      const aliasName = (Object.values(aliasResources)[0] as any)?.name;
      expect(aliasName).toBe(`alias/${customAlias}`);
    });

    it('Given no custom alias, When creating a Kms, Then it should use cleanString and cleanEnvironment for the alias name', () => {
      const stack = new TestStack(app, 'test-stack', config, {});
      const expectedAlias = `alias/${'testkms'}-${'dev'}-key`;
      let synthesized = Testing.synth(stack);
      if (typeof synthesized === 'string') {
        synthesized = JSON.parse(synthesized);
      }
      const aliasResources = (synthesized as any).resource?.aws_kms_alias || {};
      const aliasName = (Object.values(aliasResources)[0] as any)?.name;
      expect(aliasName).toBe(expectedAlias);
    });
  });

  describe('KMS Key Properties', () => {
    it('Given a Kms is created, When accessing properties, Then it should return correct values', () => {
      const stack = new TestStack(app, 'test-stack', config, {});

      expect(() => Testing.fullSynth(stack)).not.toThrow();
      expect(stack.kms.arn).toBeDefined();
      expect(stack.kms.id).toBeDefined();
      expect(stack.kms.kmsKey.arn).toBeDefined();
      expect(stack.kms.kmsAlias.targetKeyId).toBeDefined();
    });
  });

  describe('Terraform Outputs', () => {
    it('Given a Kms, When synthesizing the stack, Then it should create required outputs', () => {
      const stack = new TestStack(app, 'test-stack', config, {});

      expect(() => Testing.fullSynth(stack)).not.toThrow();

      const synthesized = Testing.synth(stack);
      expect(synthesized).toContain('kms_key_arn');
      expect(synthesized).toContain('kms_key_id');
    });
  });

  describe('Environment Variations', () => {
    it('Given different environments, When creating Kms, Then it should create KMS key successfully', () => {
      const productionConfig = { ...config, environment: Environment.PRODUCTION };
      const stack = new TestStack(app, 'test-stack', productionConfig, {});

      expect(() => Testing.fullSynth(stack)).not.toThrow();
      expect(stack.kms.arn).toBeDefined();
    });

    it('Given different project names, When creating Kms, Then it should create KMS key successfully', () => {
      const customConfig = { ...config, name: 'custom-project' };
      const stack = new TestStack(app, 'test-stack', customConfig, {});

      expect(() => Testing.fullSynth(stack)).not.toThrow();
      expect(stack.kms.arn).toBeDefined();
    });
  });

  describe('Bad Path Scenarios', () => {
    it('Given an invalid configuration with missing name, When creating a Kms, Then it should throw an error', () => {
      const invalidConfig = {
        resourceType: 'stack',
        vendor: Vendor.AWS,
        environment: Environment.DEVELOPMENT,
        region: Region.AUSTRALIA_EAST,
        terraformOrganisation: 'test-org',
        terraformWorkspace: 'test-workspace',
        terraformHostname: 'app.terraform.io',
        enableEncryption: true,
        enableSecretsManager: true,
        enablePublicVPC: true,
        tags: { purpose: 'testing' },
      } as unknown as Config;

      expect(() => {
        new TestStack(app, 'test-stack', invalidConfig, {});
      }).toThrow();
    });

    it('Given an invalid configuration with missing environment, When creating a Kms, Then it should throw an error', () => {
      const invalidConfig = {
        name: 'test-kms',
        resourceType: 'stack',
        vendor: Vendor.AWS,
        region: Region.AUSTRALIA_EAST,
        terraformOrganisation: 'test-org',
        terraformWorkspace: 'test-workspace',
        terraformHostname: 'app.terraform.io',
        enableEncryption: true,
        enableSecretsManager: true,
        enablePublicVPC: true,
        tags: { purpose: 'testing' },
      } as unknown as Config;

      expect(() => {
        new TestStack(app, 'test-stack', invalidConfig, {});
      }).toThrow();
    });

    it('Given an invalid configuration with missing terraformOrganisation, When creating a Kms, Then it should throw an error', () => {
      const invalidConfig = {
        name: 'test-kms',
        resourceType: 'stack',
        vendor: Vendor.AWS,
        environment: Environment.DEVELOPMENT,
        region: Region.AUSTRALIA_EAST,
        terraformWorkspace: 'test-workspace',
        terraformHostname: 'app.terraform.io',
        enableEncryption: true,
        enableSecretsManager: true,
        enablePublicVPC: true,
        tags: { purpose: 'testing' },
      } as unknown as Config;

      expect(() => {
        new TestStack(app, 'test-stack', invalidConfig, {});
      }).toThrow();
    });
  });
});

describe('Debugging KMS Synth Output', () => {
  it('Given a Kms, When synthesizing the stack, Then it should log all KMS resources', () => {
    const app = new App();
    const config = {
      name: 'test-kms',
      resourceType: 'stack',
      vendor: Vendor.AWS,
      environment: Environment.DEVELOPMENT,
      region: Region.AUSTRALIA_EAST,
      terraformOrganisation: 'test-org',
      terraformWorkspace: 'test-workspace',
      terraformHostname: 'app.terraform.io',
      enableEncryption: true,
      enableSecretsManager: true,
      enablePublicVPC: true,
      tags: { purpose: 'testing' },
    };
    const stack = new TestStack(app, 'test-stack', config, {});
    let synthesized = Testing.synth(stack);
    if (typeof synthesized === 'string') {
      synthesized = JSON.parse(synthesized);
    }
    const kmsResources = (synthesized as any).resource?.aws_kms_key || {};
    expect(kmsResources).toBeDefined();
    const resourceValues = Object.values(kmsResources);
    expect(resourceValues.length).toBeGreaterThan(0);
    for (const resource of resourceValues) {
      const res = resource as any;
      expect(res.description).toBe('KMS key for encryption in development');
      expect(typeof res.policy).toBe('string');
      expect(res.tags.Name).toBe('testkms-dev-kmskey-aue');
      expect(res.tags.environment).toBe('development');
      expect(res.tags.region).toBe('AUSTRALIA_EAST');
      expect(res.tags.purpose).toBe('testing');
      expect(res.tags.terraformOrganisation).toBe('test-org');
      expect(res.tags.terraformWorkspace).toBe('test-workspace');
      expect(res.tags.vendor).toBe('AWS');
      expect(res.tags.resourceType).toBe('kmskey');
    }

    // Check KMS Alias resource
    const kmsAliasResources = (synthesized as any).resource?.aws_kms_alias || {};
    const aliasValues = Object.values(kmsAliasResources);
    expect(aliasValues.length).toBeGreaterThan(0);
    for (const alias of aliasValues) {
      const aliasRes = alias as any;
      expect(aliasRes.name).toBe('alias/testkms-dev-key');
      expect(typeof aliasRes.target_key_id).toBe('string');
    }
  });
});
