import { Construct } from 'constructs';
import { BaseStack, BaseStackArgs } from './base-stack';
import { SecretArgs } from '../constructs/aws/security/secrets-manager';

export class ProductionStack extends BaseStack {
  constructor(scope: Construct, id: string, args: BaseStackArgs) {
    super(scope, id, args);
  }

  protected getSecretsArgs(): SecretArgs[] {
    return [
      {
        name: 'movie-service-secrets',
        description: 'API key for movie API services (production)',
        secretString: JSON.stringify({
          apiKey: 'abcd-efgh-1234-5678',
        }),
      },
    ];
  }
}
