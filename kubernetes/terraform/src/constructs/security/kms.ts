import { Construct } from 'constructs';
import { TerraformOutput } from 'cdktf';

import { KmsKey } from '../../../.gen/providers/aws/kms-key';
import { KmsAlias } from '../../../.gen/providers/aws/kms-alias';
import { Config } from '../../utils/config';
import { TaggingUtility } from '../../utils/tagging';
import { Tags } from '../../utils/tagging/types';
import { cleanEnvironment, cleanString } from '../../utils/common';

export interface KmsProps {
  readonly config: Config;
  readonly description?: string;
  readonly aliasName?: string;
  readonly tags?: Tags;
}

export class Kms extends Construct {
  public readonly kmsKey: KmsKey;
  public readonly kmsAlias: KmsAlias;

  constructor(scope: Construct, id: string, props: KmsProps) {
    super(scope, id);

    const { config, description, aliasName, tags } = props;
    const taggingUtility = new TaggingUtility({ ...config, layer: 'security' });

    const awsAccountId = config.awsConfig?.awsAccountId;

    const keyDescription = description || `KMS key for encryption in ${config.environment}`;
    const alias =
      aliasName || `${cleanString(config.name)}-${cleanEnvironment(config.environment)}-key`;

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
            Sid: 'Allow Secrets Manager to US_EAST the key',
            Effect: 'Allow',
            Principal: { Service: 'secretsmanager.amazonaws.com' },
            Action: ['kms:Decrypt', 'kms:GenerateDataKey'],
            Resource: '*',
          },
        ],
      }),
      tags: { ...taggingUtility.getTags({ resourceType: 'kmskey' }), ...tags },
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
