import { App, TerraformStack } from 'cdktf';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { IamRole } from '../security/iam-role';
import { Environment, Region, Vendor } from '../../../utils/common/enums';
import { Config } from '../../../utils/config';
import { TaggingUtility } from '../../../utils/tagging';
import { assertStackSynthesis, parseSynthesizedStack } from '../../../utils/common';

type TerraformSynthIamRole = {
  name: string;
  assume_role_policy: string;
  managed_policy_arns: string[];
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
  public readonly iamRole: IamRole;

  constructor(
    scope: App,
    id: string,
    config: Config,
    assumeRolePolicy: string,
    managedPolicyArns?: string[]
  ) {
    super(scope, id);

    const taggingUtility = new TaggingUtility({ ...config, layer: 'security' });

    new AwsProvider(this, 'AWS', {
      region: 'ap-southeast-2',
      defaultTags: [{ tags: { ...taggingUtility.getTags() } }],
    });

    this.iamRole = new IamRole(this, 'test-iam-role', {
      config,
      assumeRolePolicy,
      managedPolicyArns,
    });
  }
}

const testAssumeRolePolicy: string = JSON.stringify({
  Version: '2012-10-17',
  Statement: [
    {
      Action: 'sts:AssumeRole',
      Effect: 'Allow',
      Sid: '',
      Principal: {
        Service: 'ec2.amazonaws.com',
      },
    },
  ],
});

function createConfig(overrides: Partial<Config> = {}): Config {
  const baseConfig: Config = {
    name: 'test-iam-role',
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
  assumeRolePolicy: string,
  managedPolicyArns?: string[]
): TestStack {
  return new TestStack(app, 'test-stack', config, assumeRolePolicy, managedPolicyArns);
}

describe('IamRole', () => {
  let app: App;
  let config: Config;

  beforeEach((): void => {
    app = new App();
    config = createConfig();
  });

  describe('Given a valid configuration', () => {
    describe('When creating an IAM role', () => {
      it('Then it should create IAM role successfully', (): void => {
        const stack: TestStack = createTestStack(app, config, testAssumeRolePolicy);
        expect(() => assertStackSynthesis(stack)).not.toThrow();
        expect(stack.iamRole.role).toBeDefined();
        expect(stack.iamRole.arn).toBeDefined();
        expect(stack.iamRole.name).toBeDefined();
      });

      it('Then it should use the default managed policies', (): void => {
        const stack: TestStack = createTestStack(app, config, testAssumeRolePolicy);
        const synthesised = parseSynthesizedStack(stack);
        const roleResources = synthesised.resource?.aws_iam_role || {};
        const role: TerraformSynthIamRole = Object.values(
          roleResources
        )[0] as TerraformSynthIamRole;
        expect(role.managed_policy_arns).toBeDefined();
      });

      it('Then it should set the correct assume role policy', (): void => {
        const stack: TestStack = createTestStack(app, config, testAssumeRolePolicy);
        const synthesised = parseSynthesizedStack(stack);
        const roleResources = synthesised.resource?.aws_iam_role || {};
        const role: TerraformSynthIamRole = Object.values(
          roleResources
        )[0] as TerraformSynthIamRole;
        expect(role.assume_role_policy).toEqual(testAssumeRolePolicy);
      });

      it('Then it should set the correct tags', (): void => {
        const stack: TestStack = createTestStack(app, config, testAssumeRolePolicy);
        const synthesised = parseSynthesizedStack(stack);
        const roleResources = synthesised.resource?.aws_iam_role || {};
        const role: TerraformSynthIamRole = Object.values(
          roleResources
        )[0] as TerraformSynthIamRole;
        const taggingUtility = new TaggingUtility({ ...config, layer: 'security' });
        const expectedTags = taggingUtility.getTags({ resourceType: 'role' });
        Object.entries(expectedTags).forEach(([key, value]) => {
          expect(role.tags[key as keyof typeof role.tags]).toBe(value);
        });
      });
    });
  });

  describe('Given a configuration with custom options', () => {
    describe('When creating an IAM role with custom managed policies', () => {
      it('Then it should attach the custom policies', (): void => {
        const customPolicies: string[] = ['arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess'];
        const stack: TestStack = createTestStack(app, config, testAssumeRolePolicy, customPolicies);
        const synthesised = parseSynthesizedStack(stack);
        const roleResources = synthesised.resource?.aws_iam_role || {};
        const role: TerraformSynthIamRole = Object.values(
          roleResources
        )[0] as TerraformSynthIamRole;
        expect(role.managed_policy_arns).toContain(
          'arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess'
        );
      });
    });
  });

  describe('Given different environment configurations', () => {
    describe('When creating IAM roles in different environments', () => {
      it.each([
        [Environment.DEVELOPMENT, 'dev'],
        [Environment.PRODUCTION, 'prod'],
      ])(
        'Then it should create IAM role successfully for environment %s',
        (env: Environment): void => {
          const envConfig: Config = createConfig({ environment: env });
          const stack: TestStack = createTestStack(app, envConfig, testAssumeRolePolicy);
          expect(() => assertStackSynthesis(stack)).not.toThrow();
          expect(stack.iamRole.arn).toBeDefined();
        }
      );
    });
  });

  describe('Given an invalid configuration', () => {
    describe('When creating an IAM role', () => {
      it.each([[{ name: undefined }], [{ environment: undefined }]])(
        'Then it should throw an error for missing required field',
        (overrides: Partial<Config>): void => {
          const invalidConfig: Config = { ...createConfig(), ...overrides } as unknown as Config;
          expect((): void => {
            createTestStack(app, invalidConfig, testAssumeRolePolicy);
          }).toThrow();
        }
      );
    });
  });
});
