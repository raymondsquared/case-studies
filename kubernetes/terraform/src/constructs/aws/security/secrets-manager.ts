import { Construct } from 'constructs';
import { TerraformOutput } from 'cdktf';

import { SecretsmanagerSecret } from '@cdktf/provider-aws/lib/secretsmanager-secret';
import { SecretsmanagerSecretVersion } from '@cdktf/provider-aws/lib/secretsmanager-secret-version';
import { Config } from '../../../utils/config';
import { TaggingUtility } from '../../../utils/tagging';
import { Tags } from '../../../utils/tagging/types';
import { cleanEnvironment, cleanString } from '../../../utils/common';

export interface SecretConfig {
  readonly name: string;
  readonly description?: string;
  readonly secretString?: string;
  readonly tags?: Tags;
}

export interface SecretsManagerProps {
  readonly config: Config;
  readonly secrets: SecretConfig[];
  readonly kmsKeyId?: string;
  readonly tags?: Tags;
}

export class SecretsManager extends Construct {
  public readonly secrets: SecretsmanagerSecret[];

  constructor(scope: Construct, id: string, props: SecretsManagerProps) {
    super(scope, id);

    const { config, secrets, kmsKeyId, tags } = props;
    const taggingUtility: TaggingUtility = new TaggingUtility(config, {
      ...tags,
      layer: 'security',
    });

    // Create secrets in AWS Secrets Manager
    this.secrets = secrets.map((secretConfig, index) => {
      const secret: SecretsmanagerSecret = new SecretsmanagerSecret(this, `secret-${index}`, {
        name: [
          cleanString(config.name),
          cleanEnvironment(config.environment),
          secretConfig.name,
        ].join('/'),
        description: secretConfig.description,
        kmsKeyId: kmsKeyId,
        tags: taggingUtility.getTags({ ...secretConfig.tags, resourceType: 'secret' }),
      });

      if (secretConfig.secretString) {
        new SecretsmanagerSecretVersion(this, `secret-version-${index}`, {
          secretId: secret.id,
          secretString: secretConfig.secretString,
        });
      }

      return secret;
    });

    new TerraformOutput(this, 'secrets_arns', {
      value: this.secrets.map(secret => secret.arn),
      description: 'ARNs of the created secrets',
    });

    new TerraformOutput(this, 'secrets_names', {
      value: this.secrets.map(secret => secret.name),
      description: 'Names of the created secrets',
    });
  }

  public get arns(): string[] {
    return this.secrets.map(secret => secret.arn);
  }

  public get names(): string[] {
    return this.secrets.map(secret => secret.name);
  }

  public get count(): number {
    return this.secrets.length;
  }
}
