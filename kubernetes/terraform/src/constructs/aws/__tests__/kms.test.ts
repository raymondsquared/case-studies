import { App, TerraformStack } from 'cdktf';
import { AwsProvider } from '../../../../.gen/providers/aws/provider';
import { Kms, KmsProps } from '../security/kms';
import { Environment, Region, Vendor } from '../../../utils/common/enums';
import { Config } from '../../../utils/config';
import { TaggingUtility } from '../../../utils/tagging';
import {
  assertStackSynthesis,
  parseSynthesizedStack,
  getSynthesizedStack,
} from '../../../utils/common';

type TerraformSynthKms = {
  description: string;
  policy: string;
  tags: {
    Name: string;
    environment: string;
    region: string;
    purpose: string;
    vendor: string;
    resourceType: string;
  };
};

type TerraformSynthKmsAlias = {
  name: string;
  target_key_id: string;
};

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

const testKeyAlias: string = 'custom-test-key';

function createConfig(overrides: Partial<Config> = {}): Config {
  const baseConfig: Config = {
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
    tags: { purpose: 'testing' } as Record<string, string>,
    ...overrides,
  };
  return baseConfig;
}

function createTestStack(app: App, config: Config, kmsProps: Partial<KmsProps> = {}): TestStack {
  return new TestStack(app, 'test-stack', config, kmsProps);
}

describe('Kms', () => {
  let app: App;
  let config: Config;

  beforeEach((): void => {
    app = new App();
    config = createConfig();
  });

  describe('Given a valid configuration', () => {
    describe('When creating a KMS key', () => {
      it('Then it should create KMS key and alias successfully', (): void => {
        const stack: TestStack = createTestStack(app, config);
        expect(() => assertStackSynthesis(stack)).not.toThrow();
        expect(stack.kms.kmsKey).toBeDefined();
        expect(stack.kms.kmsAlias).toBeDefined();
        expect(stack.kms.arn).toBeDefined();
        expect(stack.kms.id).toBeDefined();
      });

      it('Then it should return correct property values', (): void => {
        const stack: TestStack = createTestStack(app, config);
        expect(() => assertStackSynthesis(stack)).not.toThrow();
        expect(stack.kms.arn).toBeDefined();
        expect(stack.kms.id).toBeDefined();
        expect(stack.kms.kmsKey.arn).toBeDefined();
        expect(stack.kms.kmsAlias.targetKeyId).toBeDefined();
      });

      it('Then it should create required Terraform outputs', (): void => {
        const stack: TestStack = createTestStack(app, config);
        expect(() => assertStackSynthesis(stack)).not.toThrow();
        const synthesised: string = getSynthesizedStack(stack);
        expect(synthesised).toContain('kms_key_arn');
        expect(synthesised).toContain('kms_key_id');
      });

      it('Then it should use default alias naming convention', (): void => {
        const stack: TestStack = createTestStack(app, config);
        const expectedAlias: string = `alias/${'testkms'}-${'dev'}-kmskey`;
        const synthesised = parseSynthesizedStack(stack);
        const aliasResources = synthesised.resource?.aws_kms_alias || {};
        const aliasName: string | undefined = (Object.values(aliasResources)[0] as TerraformSynthKmsAlias)?.name;
        expect(aliasName).toBe(expectedAlias);
      });
    });
  });

  describe('Given a configuration with custom options', () => {
    describe('When creating a KMS key with custom description', () => {
      it('Then it should create KMS key with custom description', (): void => {
        const stack: TestStack = createTestStack(app, config, { description: 'Custom KMS key for testing' });
        expect(() => assertStackSynthesis(stack)).not.toThrow();
        expect(stack.kms.kmsKey).toBeDefined();
      });
    });

    describe('When creating a KMS key with custom tags', () => {
      it('Then it should apply the custom tags', (): void => {
        const stack: TestStack = createTestStack(app, config, {
          tags: { environment: 'custom', owner: 'team-a' } as Record<string, string>,
        });
        expect(() => assertStackSynthesis(stack)).not.toThrow();
        expect(stack.kms.kmsKey.tags).toBeDefined();
      });
    });

    describe('When creating a KMS key with custom alias name', () => {
      it('Then it should use the custom alias name', (): void => {
        const stack: TestStack = createTestStack(app, config, { aliasName: testKeyAlias });
        const synthesised = parseSynthesizedStack(stack);
        const aliasResources = synthesised.resource?.aws_kms_alias || {};
        const aliasName: string | undefined = (Object.values(aliasResources)[0] as TerraformSynthKmsAlias)?.name;
        expect(aliasName).toBe(`alias/${testKeyAlias}`);
      });
    });
  });

  describe('Given different environment configurations', () => {
    describe('When creating KMS keys in different environments', () => {
      it.each([
        [Environment.DEVELOPMENT, 'dev'],
        [Environment.PRODUCTION, 'prod'],
      ])(
        'Then it should create KMS key successfully for environment %s',
        (env: Environment): void => {
          const envConfig: Config = createConfig({ environment: env });
          const stack: TestStack = createTestStack(app, envConfig);
          expect(() => assertStackSynthesis(stack)).not.toThrow();
          expect(stack.kms.arn).toBeDefined();
        }
      );
    });

    describe('When creating KMS keys with different project names', () => {
      it('Then it should create KMS key successfully', (): void => {
        const customConfig: Config = createConfig({ name: 'custom-project' });
        const stack: TestStack = createTestStack(app, customConfig);
        expect(() => assertStackSynthesis(stack)).not.toThrow();
        expect(stack.kms.arn).toBeDefined();
      });
    });
  });

  describe('Given a KMS key is created', () => {
    describe('When synthesizing the stack', () => {
      it('Then it should create properly configured KMS resources', (): void => {
        const stack: TestStack = createTestStack(app, config);
        const synthesised = parseSynthesizedStack(stack);

        const kmsResources = synthesised.resource?.aws_kms_key || {};
        expect(kmsResources).toBeDefined();
        const resourceValues = Object.values(kmsResources);
        expect(resourceValues.length).toBeGreaterThan(0);

        for (const resource of resourceValues) {
          const res: TerraformSynthKms = resource as TerraformSynthKms;
          expect(res.description).toBe('KMS key for encryption in development');
          expect(typeof res.policy).toBe('string');
          expect(res.tags.Name).toBe('testkms-dev-kmskey-aue');
          expect(res.tags.environment).toBe('development');
          expect(res.tags.region).toBe('AUSTRALIA_EAST');
          expect(res.tags.purpose).toBe('testing');
          expect(res.tags.vendor).toBe('AWS');
          expect(res.tags.resourceType).toBe('kmskey');
        }

        const kmsAliasResources = synthesised.resource?.aws_kms_alias || {};
        const aliasValues = Object.values(kmsAliasResources);
        expect(aliasValues.length).toBeGreaterThan(0);

        for (const alias of aliasValues) {
          const aliasRes: TerraformSynthKmsAlias = alias as TerraformSynthKmsAlias;
          expect(aliasRes.name).toBe('alias/testkms-dev-kmskey');
          expect(typeof aliasRes.target_key_id).toBe('string');
        }
      });
    });
  });

  describe('Given an invalid configuration', () => {
    describe('When creating a KMS key', () => {
      it('Then it should throw an error for missing config', (): void => {
        expect((): void => {
          new Kms(app, 'test-kms', {} as KmsProps);
        }).toThrow();
      });

      it.each([
        [{ name: undefined }],
        [{ environment: undefined }],
        [{ terraformOrganisation: undefined }],
      ])(
        'Then it should throw an error for missing required field',
        (overrides: Partial<Config>): void => {
          const invalidConfig: Config = { ...createConfig(), ...overrides } as unknown as Config;
          expect((): void => {
            createTestStack(app, invalidConfig, {});
          }).toThrow();
        }
      );
    });
  });
});
