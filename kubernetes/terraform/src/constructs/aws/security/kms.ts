import { KmsAlias } from '@cdktf/provider-aws/lib/kms-alias';
import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';
import { TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';

import { Config } from '../../../utils/config';
import { getCleanEnvironment, getCleanString } from '../../../utils/common';
import { TaggingUtility } from '../../../utils/tagging';
import { Tags } from '../../../utils/tagging/types';

export interface KmsArgs {
  readonly config: Config;
  readonly description?: string;
  readonly aliasName?: string;
  readonly tags?: Tags;
}

export class Kms extends Construct {
  public readonly kmsKey: KmsKey;
  public readonly kmsAlias: KmsAlias;

  constructor(scope: Construct, id: string, kmsArgs: KmsArgs) {
    super(scope, id);

    const { config, description, aliasName, tags } = kmsArgs;
    const taggingUtility: TaggingUtility = new TaggingUtility(config, {
      ...tags,
      layer: 'security',
    });

    const awsAccountId: string | undefined = config.awsConfig?.awsAccountId;

    const keyDescription: string = description || `KMS key for encryption in ${config.environment}`;
    const alias: string =
      aliasName ||
      `${getCleanString(config.name)}-${getCleanEnvironment(config.environment)}-kmskey`;

    this.kmsKey = new KmsKey(this, 'kms-key', {
      description: keyDescription,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'Enable IAM User Permissions',
            Effect: 'Allow',
            Principal: { AWS: `arn:aws:iam::${awsAccountId}:root` },
            Action: 'kms:*',
            Resource: '*',
          },
          {
            Sid: 'Allow Secrets Manager to use the key',
            Effect: 'Allow',
            Principal: { Service: 'secretsmanager.amazonaws.com' },
            Action: ['kms:Decrypt', 'kms:GenerateDataKey'],
            Resource: '*',
          },
        ],
      }),
      tags: { ...taggingUtility.getTags({ resourceType: 'kmskey' }), ...config.tags },
    });

    this.kmsAlias = new KmsAlias(this, 'kms-alias', {
      name: `alias/${alias}`,
      targetKeyId: this.kmsKey.id,
    });

    new TerraformOutput(this, 'kms_key_arn', {
      value: this.kmsKey.arn,
      description: 'ARN of the KMS key',
    });

    new TerraformOutput(this, 'kms_key_id', {
      value: this.kmsKey.id,
      description: 'ID of the KMS key',
    });
  }

  public get arn(): string {
    return this.kmsKey.arn;
  }

  public get id(): string {
    return this.kmsKey.id;
  }
}
