import { Construct } from 'constructs';
import { BaseStack, BaseStackProps } from './base-stack';
import { SecretConfig } from '../constructs/aws/security/secrets-manager';

export interface ProductionStackProps extends Omit<BaseStackProps, 'environmentName'> {
  readonly description?: string;
}

export class ProductionStack extends BaseStack {
  constructor(scope: Construct, id: string, props: ProductionStackProps) {
    super(scope, id, {
      ...props,
      environmentName: 'production',
      description: props.description || 'Production infrastructure stack',
    });
  }

  protected getSecretsConfig(): SecretConfig[] {
    return [
      {
        name: 'movie-grpc-api-key',
        description: 'API key for movie grpc services (production)',
        secretString: JSON.stringify({
          apiKey: 'abcd-efgh-1234-5678',
        }),
      },
    ];
  }
}
