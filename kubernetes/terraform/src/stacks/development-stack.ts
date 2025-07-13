import { Construct } from 'constructs';

import { BaseStack, BaseStackProps } from './base-stack';
import { SecretConfig } from '../constructs/security/secrets-manager';

export interface DevelopmentStackProps extends Omit<BaseStackProps, 'environmentName'> {
  readonly description?: string;
}

export class DevelopmentStack extends BaseStack {
  constructor(scope: Construct, id: string, props: DevelopmentStackProps) {
    super(scope, id, {
      ...props,
      environmentName: 'development',
      description: props.description || 'Development infrastructure stack',
    });
  }

  protected getSecretsConfig(): SecretConfig[] {
    return [
      {
        name: 'movie-api-secret',
        description: 'API key for movie API services (development)',
        secretString: JSON.stringify({
          apiKey: 'abcd-efgh-1234-5678',
        }),
      },
    ];
  }
}
