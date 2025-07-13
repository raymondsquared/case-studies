import { Testing } from 'cdktf';
import { App, TerraformStack } from 'cdktf';
import { AwsProvider } from '../../../.gen/providers/aws/provider';
import { SecretsManager, SecretsManagerProps, SecretConfig } from '../security/secrets-manager';
import { Kms } from '../security/kms';
import { Environment, Region, Vendor } from '../../utils/common/enums';
import { Config } from '../../utils/config';
import { TaggingUtility } from '../../utils/tagging';

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

describe('SecretsManager', () => {
  let app: App;
  let config: Config;
  let baseSecrets: SecretConfig[];

  beforeEach(() => {
    app = new App();
    config = {
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
      enablePublicVPC: true,
      tags: { purpose: 'testing' },
    };

    baseSecrets = [
      {
        name: 'database-password',
        description: 'Database password for the application',
        secretString: 'super-secret-password-123',
        tags: { type: 'database' },
      },
      {
        name: 'api-key',
        description: 'API key for external service',
        secretString: 'api-key-value-456',
        tags: { type: 'api' },
      },
    ];
  });

  describe('Secrets Creation', () => {
    it('Given a valid configuration with secrets, When creating a SecretsManager construct, Then it should create secrets successfully', () => {
      const stack = new TestStack(app, 'test-stack', config, { secrets: baseSecrets });

      expect(() => Testing.fullSynth(stack)).not.toThrow();
      expect(stack.secretsManager.secrets).toHaveLength(2);
      expect(stack.secretsManager.count).toBe(2);
    });

    it('Given a configuration with no secrets, When creating a SecretsManager construct, Then it should create an empty secrets array', () => {
      const stack = new TestStack(app, 'test-stack', config, { secrets: [] });

      expect(() => Testing.fullSynth(stack)).not.toThrow();
      expect(stack.secretsManager.secrets).toHaveLength(0);
      expect(stack.secretsManager.count).toBe(0);
    });

    it('Given secrets with custom tags, When creating a SecretsManager construct, Then it should apply the custom tags', () => {
      const customSecrets = [
        {
          name: 'custom-secret',
          description: 'Secret with custom tags',
          secretString: 'custom-value',
          tags: { environment: 'custom', owner: 'team-a' },
        },
      ];
      const stack = new TestStack(app, 'test-stack', config, { secrets: customSecrets });

      expect(() => Testing.fullSynth(stack)).not.toThrow();
      expect(stack.secretsManager.secrets).toHaveLength(1);
    });
  });

  describe('Secret Versions', () => {
    it('Given secrets with secretString values, When creating a SecretsManager construct, Then it should create secret versions', () => {
      const secretsWithValues = [
        {
          name: 'versioned-secret',
          description: 'Secret with a value',
          secretString: 'secret-value-789',
        },
      ];
      const stack = new TestStack(app, 'test-stack', config, { secrets: secretsWithValues });

      expect(() => Testing.fullSynth(stack)).not.toThrow();
      expect(stack.secretsManager.secrets).toHaveLength(1);
    });

    it('Given secrets without secretString values, When creating a SecretsManager construct, Then it should create secrets without versions', () => {
      const secretsWithoutValues = [
        {
          name: 'empty-secret',
          description: 'Secret without initial value',
        },
      ];
      const stack = new TestStack(app, 'test-stack', config, { secrets: secretsWithoutValues });

      expect(() => Testing.fullSynth(stack)).not.toThrow();
      expect(stack.secretsManager.secrets).toHaveLength(1);
    });
  });

  describe('Resource Properties', () => {
    it('Given a SecretsManager construct is created, When accessing properties, Then it should return correct values', () => {
      const stack = new TestStack(app, 'test-stack', config, { secrets: baseSecrets });

      expect(() => Testing.fullSynth(stack)).not.toThrow();
      expect(stack.secretsManager.arns).toHaveLength(2);
      expect(stack.secretsManager.names).toHaveLength(2);
      expect(stack.secretsManager.count).toBe(2);
    });
  });

  describe('Environment Variations', () => {
    it('Given different environments, When creating SecretsManager constructs, Then it should create secrets successfully', () => {
      const productionConfig = { ...config, environment: Environment.PRODUCTION };
      const stack = new TestStack(app, 'test-stack', productionConfig, { secrets: baseSecrets });

      expect(() => Testing.fullSynth(stack)).not.toThrow();
      expect(stack.secretsManager.names).toHaveLength(2);
    });

    it('Given different project names, When creating SecretsManager constructs, Then it should create secrets successfully', () => {
      const customConfig = { ...config, name: 'custom-project' };
      const stack = new TestStack(app, 'test-stack', customConfig, { secrets: baseSecrets });

      expect(() => Testing.fullSynth(stack)).not.toThrow();
      expect(stack.secretsManager.names).toHaveLength(2);
    });
  });

  describe('Terraform Outputs', () => {
    it('Given a SecretsManager construct, When synthesizing the stack, Then it should create required outputs', () => {
      const stack = new TestStack(app, 'test-stack', config, { secrets: baseSecrets });

      expect(() => Testing.fullSynth(stack)).not.toThrow();

      const synthesized = Testing.synth(stack);
      expect(synthesized).toContain('secrets_arns');
      expect(synthesized).toContain('secrets_names');
    });
  });

  describe('Error Cases', () => {
    it('Given a configuration without required config, When creating a SecretsManager construct, Then it should throw an error', () => {
      expect(() => {
        new SecretsManager(app, 'test-secrets-manager', {} as SecretsManagerProps);
      }).toThrow();
    });

    it('Given a configuration without secrets array, When creating a SecretsManager construct, Then it should throw an error', () => {
      expect(() => {
        new SecretsManager(app, 'test-secrets-manager', { config } as SecretsManagerProps);
      }).toThrow();
    });
  });

  describe('Complex Scenarios', () => {
    it('Given multiple secrets with different configurations, When creating a SecretsManager construct, Then it should handle all variations correctly', () => {
      const complexSecrets: SecretConfig[] = [
        {
          name: 'database-credentials',
          description: 'Database connection credentials',
          secretString: JSON.stringify({
            username: 'admin',
            password: 'secure-password',
            host: 'db.example.com',
          }),
          tags: { type: 'database', tier: 'production' },
        },
        {
          name: 'api-credentials',
          description: 'External API credentials',
          tags: { type: 'api', provider: 'third-party' },
        },
        {
          name: 'encryption-key',
          description: 'Application encryption key',
          secretString: 'base64-encoded-key-value',
          tags: { type: 'encryption', algorithm: 'aes-256' },
        },
      ];

      const stack = new TestStack(app, 'test-stack', config, { secrets: complexSecrets });

      expect(() => Testing.fullSynth(stack)).not.toThrow();
      expect(stack.secretsManager.count).toBe(3);
      expect(stack.secretsManager.arns).toHaveLength(3);
      expect(stack.secretsManager.names).toHaveLength(3);
    });
  });

  describe('Synth Output Fields', () => {
    it('Given a SecretsManager construct, When synthesizing the stack, Then the synthesized output should have correct fields', () => {
      const stack = new TestStack(app, 'test-stack', config, { secrets: baseSecrets });
      let synthesized: any = Testing.synth(stack);
      if (typeof synthesized === 'string') {
        synthesized = JSON.parse(synthesized) as any;
      }

      const secrets = Object.values(synthesized.resource.aws_secretsmanager_secret);
      expect(secrets.length).toBe(baseSecrets.length);

      const expectedNames = [
        'testsecrets/dev/database-password',
        'testsecrets/dev/api-key',
      ];
      const expectedDescriptions = [
        'Database password for the application',
        'API key for external service',
      ];
      const expectedTags = {
        environment: 'development',
        name: 'test-secrets',
        purpose: 'testing',
        region: 'AUSTRALIA_EAST',
        resourceType: 'secret',
        terraformOrganisation: 'test-org',
        terraformWorkspace: 'test-workspace',
        vendor: 'AWS',
        layer: 'security',
      };
      
      secrets.forEach((secret: any, idx: number) => {
        expect(secret.name).toBe(expectedNames[idx]);
        expect(secret.description).toBe(expectedDescriptions[idx]);
        // Tags may include more than expectedTags, but should match at least these
        Object.entries(expectedTags).forEach(([key, value]) => {
          expect(secret.tags[key]).toBe(value);
        });
      });
    });
  });
});
