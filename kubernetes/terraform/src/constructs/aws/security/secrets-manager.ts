import { Construct } from 'constructs';
import { TerraformOutput } from 'cdktf';

import { SecretsmanagerSecret } from '@cdktf/provider-aws/lib/secretsmanager-secret';
import { SecretsmanagerSecretVersion } from '@cdktf/provider-aws/lib/secretsmanager-secret-version';
import { Config } from '../../../utils/config';
import { TaggingUtility } from '../../../utils/tagging';
import { Tags } from '../../../utils/tagging/types';
import { getCleanEnvironment, getCleanString } from '../../../utils/common';

export interface SecretArgs {
  readonly name: string;
  readonly description?: string;
  readonly secretString?: string;
  readonly tags?: Tags;
}

export interface SecretsManagerArgs {
  readonly config: Config;
  readonly secrets: SecretArgs[];
  readonly kmsKeyId?: string;
  readonly tags?: Tags;
}

export class SecretsManager extends Construct {
  public readonly secrets: SecretsmanagerSecret[];

  constructor(scope: Construct, id: string, args: SecretsManagerArgs) {
    super(scope, id);

    const { config, secrets, kmsKeyId, tags } = args;
    const taggingUtility: TaggingUtility = new TaggingUtility(config, {
      ...tags,
      layer: 'security',
    });

    this.secrets = secrets.map((secretArgs, index) => {
      const secret: SecretsmanagerSecret = new SecretsmanagerSecret(this, `secret-${index}`, {
        name: [
          getCleanString(config.name),
          getCleanEnvironment(config.environment),
          secretArgs.name,
        ].join('/'),
        description: secretArgs.description,
        kmsKeyId: config.hasEncryption ? kmsKeyId : undefined,
        tags: taggingUtility.getTags({ ...secretArgs.tags, resourceType: 'secret' }),
      });

      if (secretArgs.secretString) {
        new SecretsmanagerSecretVersion(this, `secret-version-${index}`, {
          secretId: secret.id,
          secretString: secretArgs.secretString,
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
