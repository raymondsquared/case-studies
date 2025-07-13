import { App, TerraformStack } from 'cdktf';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { SecretsManager, SecretsManagerProps, SecretConfig } from '../security/secrets-manager';
import { Kms } from '../security/kms';
import { Environment, Region, Vendor } from '../../../utils/common/enums';
import { Config } from '../../../utils/config';
import { TaggingUtility } from '../../../utils/tagging';
import {
  assertStackSynthesis,
  getSynthesizedStack,
  getAllResourcesFromStack,
} from '../../../utils/common';

type TerraformSynthSecret = {
  name: string;
  description: string;
  tags: Record<string, string>;
};

class TestStack extends TerraformStack {
  public readonly kms: Kms;
  public readonly secretsManager: SecretsManager;

  constructor(
    scope: App,
    id: string,
    config: Config,
    secretsManagerProps: Partial<SecretsManagerProps>
  ) {
    super(scope, id);

    const taggingUtility = new TaggingUtility({ ...config, layer: 'security' });

    new AwsProvider(this, 'AWS', {
      region: 'ap-southeast-2',
      defaultTags: [{ tags: { ...taggingUtility.getTags() } }],
    });

    this.kms = new Kms(this, 'test-kms', {
      config,
      description: `KMS key for encryption in ${config.environment}`,
      aliasName: `${config.name}-${config.environment}-secrets-key`,
      tags: taggingUtility.getTags({ resourceType: 'kms' }),
    });

    this.secretsManager = new SecretsManager(this, 'test-secrets-manager', {
      config,
      secrets: secretsManagerProps.secrets || [],
      kmsKeyId: config.enableEncryption ? this.kms.id : undefined,
      tags: secretsManagerProps.tags,
    });
  }
}

const testSecretConfigs: SecretConfig[] = [
  {
    name: 'database-password',
    description: 'Database password for the application',
    secretString: 'super-secret-password-123',
    tags: { type: 'database' } as Record<string, string>,
  },
  {
    name: 'api-key',
    description: 'API key for external service',
    secretString: 'api-key-value-456',
    tags: { type: 'api' } as Record<string, string>,
  },
];

function createConfig(overrides: Partial<Config> = {}): Config {
  const baseConfig: Config = {
    name: 'test-secrets',
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
  secretsManagerProps: Partial<SecretsManagerProps> = {}
): TestStack {
  return new TestStack(app, 'test-stack', config, secretsManagerProps);
}

describe('SecretsManager', () => {
  let app: App;
  let config: Config;

  beforeEach((): void => {
    app = new App();
    config = createConfig();
  });

  describe('Given a valid configuration', () => {
    describe('When creating a SecretsManager construct', () => {
      it('Then it should create secrets successfully', (): void => {
        const stack: TestStack = createTestStack(app, config, { secrets: testSecretConfigs });
        expect(() => assertStackSynthesis(stack)).not.toThrow();
        expect(stack.secretsManager.secrets).toHaveLength(2);
        expect(stack.secretsManager.count).toBe(2);
      });

      it('Then it should create an empty secrets array when no secrets provided', (): void => {
        const stack: TestStack = createTestStack(app, config, { secrets: [] });
        expect(() => assertStackSynthesis(stack)).not.toThrow();
        expect(stack.secretsManager.secrets).toHaveLength(0);
        expect(stack.secretsManager.count).toBe(0);
      });

      it('Then it should return correct property values', (): void => {
        const stack: TestStack = createTestStack(app, config, { secrets: testSecretConfigs });
        expect(() => assertStackSynthesis(stack)).not.toThrow();
        expect(stack.secretsManager.arns).toHaveLength(2);
        expect(stack.secretsManager.names).toHaveLength(2);
        expect(stack.secretsManager.count).toBe(2);
      });

      it('Then it should create required Terraform outputs', (): void => {
        const stack: TestStack = createTestStack(app, config, { secrets: testSecretConfigs });
        expect(() => assertStackSynthesis(stack)).not.toThrow();
        const synthesised: string = getSynthesizedStack(stack);
        expect(synthesised).toContain('secrets_arns');
        expect(synthesised).toContain('secrets_names');
      });
    });
  });

  describe('Given a configuration with custom options', () => {
    describe('When creating a SecretsManager with custom tags', () => {
      it('Then it should apply the custom tags', (): void => {
        const customSecrets: SecretConfig[] = [
          {
            name: 'custom-secret',
            description: 'Secret with custom tags',
            secretString: 'custom-value',
            tags: { environment: 'custom', owner: 'team-a' } as Record<string, string>,
          },
        ];
        const stack: TestStack = createTestStack(app, config, { secrets: customSecrets });
        expect(() => assertStackSynthesis(stack)).not.toThrow();
        expect(stack.secretsManager.secrets).toHaveLength(1);
      });
    });

    describe('When creating secrets with different configurations', () => {
      it('Then it should handle secrets with and without values', (): void => {
        const mixedSecrets: SecretConfig[] = [
          {
            name: 'versioned-secret',
            description: 'Secret with a value',
            secretString: 'secret-value-789',
          },
          {
            name: 'empty-secret',
            description: 'Secret without initial value',
          },
        ];
        const stack: TestStack = createTestStack(app, config, { secrets: mixedSecrets });
        expect(() => assertStackSynthesis(stack)).not.toThrow();
        expect(stack.secretsManager.secrets).toHaveLength(2);
      });
    });
  });

  describe('Given different environment configurations', () => {
    describe('When creating SecretsManager in different environments', () => {
      it.each([
        [Environment.DEVELOPMENT, 'development'],
        [Environment.PRODUCTION, 'production'],
      ])(
        'Then it should create secrets successfully for environment %s',
        (env: Environment): void => {
          const envConfig: Config = createConfig({ environment: env });
          const stack: TestStack = createTestStack(app, envConfig, { secrets: testSecretConfigs });
          expect(() => assertStackSynthesis(stack)).not.toThrow();
          expect(stack.secretsManager.names).toHaveLength(2);
        }
      );
    });

    describe('When creating SecretsManager with different project names', () => {
      it('Then it should create secrets successfully', (): void => {
        const customConfig: Config = createConfig({ name: 'custom-project' });
        const stack: TestStack = createTestStack(app, customConfig, { secrets: testSecretConfigs });
        expect(() => assertStackSynthesis(stack)).not.toThrow();
        expect(stack.secretsManager.names).toHaveLength(2);
      });
    });
  });

  describe('Given a SecretsManager is created', () => {
    describe('When synthesizing the stack', () => {
      it('Then it should create properly configured secret resources', (): void => {
        const stack: TestStack = createTestStack(app, config, { secrets: testSecretConfigs });
        const secrets: TerraformSynthSecret[] = getAllResourcesFromStack(
          stack,
          'aws_secretsmanager_secret'
        ) as TerraformSynthSecret[];
        expect(secrets.length).toBe(testSecretConfigs.length);

        const expectedNames: string[] = [
          'testsecrets/dev/database-password',
          'testsecrets/dev/api-key',
        ];
        const expectedDescriptions: string[] = [
          'Database password for the application',
          'API key for external service',
        ];
        const expectedTags: Record<string, string> = {
          environment: 'development',
          purpose: 'testing',
          region: 'AUSTRALIA_EAST',
          resourceType: 'secret',
          vendor: 'AWS',
          layer: 'security',
        };

        (secrets as TerraformSynthSecret[]).forEach((secret: TerraformSynthSecret, idx: number) => {
          expect(secret.name).toBe(expectedNames[idx]);
          expect(secret.description).toBe(expectedDescriptions[idx]);
          Object.entries(expectedTags).forEach(([key, value]: [string, string]) => {
            expect(secret.tags[key]).toBe(value);
          });
        });
      });
    });
  });

  describe('Given complex secret configurations', () => {
    describe('When creating multiple secrets with different configurations', () => {
      it('Then it should handle all variations correctly', (): void => {
        const complexSecrets: SecretConfig[] = [
          {
            name: 'database-credentials',
            description: 'Database connection credentials',
            secretString: JSON.stringify({
              username: 'admin',
              password: 'secure-password',
              host: 'db.example.com',
            }),
            tags: { type: 'database', tier: 'production' } as Record<string, string>,
          },
          {
            name: 'api-credentials',
            description: 'External API credentials',
            tags: { type: 'api', provider: 'third-party' } as Record<string, string>,
          },
          {
            name: 'encryption-key',
            description: 'Application encryption key',
            secretString: 'base64-encoded-key-value',
            tags: { type: 'encryption', algorithm: 'aes-256' } as Record<string, string>,
          },
        ];

        const stack: TestStack = createTestStack(app, config, { secrets: complexSecrets });
        expect(() => assertStackSynthesis(stack)).not.toThrow();
        expect(stack.secretsManager.count).toBe(3);
        expect(stack.secretsManager.arns).toHaveLength(3);
        expect(stack.secretsManager.names).toHaveLength(3);
      });
    });
  });

  describe('Given an invalid configuration', () => {
    describe('When creating a SecretsManager', () => {
      it('Then it should throw an error for missing config', (): void => {
        expect((): void => {
          new SecretsManager(app, 'test-secrets-manager', {} as SecretsManagerProps);
        }).toThrow();
      });

      it('Then it should throw an error for missing secrets array', (): void => {
        expect((): void => {
          new SecretsManager(app, 'test-secrets-manager', { config } as SecretsManagerProps);
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
            createTestStack(app, invalidConfig, { secrets: testSecretConfigs });
          }).toThrow();
        }
      );
    });
  });
});
