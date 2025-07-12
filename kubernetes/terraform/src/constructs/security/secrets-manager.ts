import { Construct } from 'constructs';
import { TerraformOutput } from 'cdktf';
import { SecretsmanagerSecret } from '../../../.gen/providers/aws/secretsmanager-secret';
import { SecretsmanagerSecretVersion } from '../../../.gen/providers/aws/secretsmanager-secret-version';
import { KmsKey } from '../../../.gen/providers/aws/kms-key';
import { KmsAlias } from '../../../.gen/providers/aws/kms-alias';
import { IamRole } from '../../../.gen/providers/aws/iam-role';
import { IamRolePolicy } from '../../../.gen/providers/aws/iam-role-policy';
import { IamRolePolicyAttachment } from '../../../.gen/providers/aws/iam-role-policy-attachment';
import { EnvironmentConfig } from '../../config/environment';

export interface SecretConfig {
  readonly name: string;
  readonly description?: string;
  readonly secretString?: string;
  readonly secretBinary?: string;
  readonly recoveryWindowInDays?: number;
  readonly enableRotation?: boolean;
  readonly rotationLambdaArn?: string;
  readonly tags?: Record<string, string>;
}

export interface SecretsManagerProps {
  readonly config: EnvironmentConfig;
  readonly secrets: SecretConfig[];
  readonly enableRotation?: boolean;
  readonly tags?: Record<string, string>;
}

export class SecretsManager extends Construct {
  public readonly kmsKey?: KmsKey;
  public readonly secrets: SecretsmanagerSecret[];
  public readonly rotationRole?: IamRole;

  constructor(scope: Construct, id: string, props: SecretsManagerProps) {
    super(scope, id);

    const {
      config,
      secrets,
      enableRotation = true,
      tags = {},
    } = props;

    this.secrets = [];

    // Create KMS key for secrets encryption if encryption is enabled
    if (config.enableEncryption) {
      this.kmsKey = new KmsKey(this, 'secrets-kms-key', {
        description: `KMS key for Secrets Manager encryption in ${config.environment}`,
        enableKeyRotation: true,
        deletionWindowInDays: 7,
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Sid: 'Enable IAM User Permissions',
              Effect: 'Allow',
              Principal: {
                AWS: 'arn:aws:iam::*:root',
              },
              Action: 'kms:*',
              Resource: '*',
            },
            {
              Sid: 'Allow Secrets Manager to use the key',
              Effect: 'Allow',
              Principal: {
                Service: 'secretsmanager.amazonaws.com',
              },
              Action: [
                'kms:Decrypt',
                'kms:GenerateDataKey',
              ],
              Resource: '*',
            },
            {
              Sid: 'Allow Lambda to use the key for rotation',
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
              Action: [
                'kms:Decrypt',
                'kms:GenerateDataKey',
              ],
              Resource: '*',
              Condition: {
                StringEquals: {
                  'aws:RequestTag/Service': 'secrets-rotation',
                },
              },
            },
          ],
        }),
        tags: {
          ...config.tags,
          ...tags,
          Name: `${config.project}-${config.environment}-secrets-key`,
          Purpose: 'secrets-encryption',
          Component: 'security',
        },
      });

      new KmsAlias(this, 'secrets-kms-alias', {
        name: `alias/${config.project}-${config.environment}-secrets-key`,
        targetKeyId: this.kmsKey.id,
      });
    }

    // Create IAM role for secret rotation if enabled
    if (enableRotation) {
      this.rotationRole = new IamRole(this, 'secrets-rotation-role', {
        name: `${config.project}-${config.environment}-secrets-rotation-role`,
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: {
          ...config.tags,
          ...tags,
          Name: `${config.project}-${config.environment}-secrets-rotation-role`,
          Purpose: 'secrets-rotation',
          Component: 'security',
        },
      });

      // Attach Secrets Manager rotation policy
      new IamRolePolicyAttachment(this, 'secrets-rotation-policy', {
        role: this.rotationRole.name,
        policyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaRole',
      });

      // Custom policy for secrets rotation
      new IamRolePolicy(this, 'secrets-rotation-custom-policy', {
        name: `${config.project}-${config.environment}-secrets-rotation-policy`,
        role: this.rotationRole.id,
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'secretsmanager:DescribeSecret',
                'secretsmanager:GetSecretValue',
                'secretsmanager:PutSecretValue',
                'secretsmanager:UpdateSecretVersionStage',
              ],
              Resource: '*',
            },
            {
              Effect: 'Allow',
              Action: [
                'kms:Decrypt',
                'kms:GenerateDataKey',
              ],
              Resource: this.kmsKey?.arn || '*',
            },
            {
              Effect: 'Allow',
              Action: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
              ],
              Resource: 'arn:aws:logs:*:*:*',
            },
          ],
        }),
      });
    }

    // Create secrets
    secrets.forEach((secretConfig, index) => {
      const secret = new SecretsmanagerSecret(this, `secret-${index}`, {
        name: `${config.project}-${config.environment}-${secretConfig.name}`,
        description: secretConfig.description || `Secret for ${secretConfig.name} in ${config.environment}`,
        recoveryWindowInDays: secretConfig.recoveryWindowInDays || 7,
        kmsKeyId: this.kmsKey?.id,
        tags: {
          ...config.tags,
          ...tags,
          ...secretConfig.tags,
          Name: `${config.project}-${config.environment}-${secretConfig.name}`,
          Purpose: 'application-secret',
          Component: 'security',
          SecretType: secretConfig.name,
        },
      });

      // Add initial secret value if provided
      if (secretConfig.secretString || secretConfig.secretBinary) {
        new SecretsmanagerSecretVersion(this, `secret-version-${index}`, {
          secretId: secret.id,
          secretString: secretConfig.secretString,
          secretBinary: secretConfig.secretBinary,
        });
      }

      // Configure rotation if enabled
      if (enableRotation && secretConfig.enableRotation && this.rotationRole) {
        // Note: Rotation configuration would be added here
        // This requires additional AWS provider resources for rotation
      }

      this.secrets.push(secret);
    });

    // Create outputs
    if (this.kmsKey) {
      new TerraformOutput(this, 'secrets_kms_key_arn', {
        value: this.kmsKey.arn,
        description: 'ARN of the KMS key used for secrets encryption',
      });
    }

    new TerraformOutput(this, 'secrets_arns', {
      value: this.secrets.map(secret => secret.arn),
      description: 'ARNs of the created secrets',
    });

    new TerraformOutput(this, 'secrets_names', {
      value: this.secrets.map(secret => secret.name),
      description: 'Names of the created secrets',
    });

    if (this.rotationRole) {
      new TerraformOutput(this, 'secrets_rotation_role_arn', {
        value: this.rotationRole.arn,
        description: 'ARN of the IAM role for secrets rotation',
      });
    }
  }
} 