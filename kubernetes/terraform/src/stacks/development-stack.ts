import { Construct } from 'constructs';
import { BaseStack, BaseStackArgs } from './base-stack';

export class DevelopmentStack extends BaseStack {
  constructor(scope: Construct, id: string, args: BaseStackArgs) {
    super(scope, id, args);
  }

  protected getSecretsArgs() {
    return [
      {
        name: 'movie-service-secrets',
        description: 'API key for movie API services (development)',
        secretString: JSON.stringify({
          apiKey: 'abcd-efgh-1234-5678',
        }),
      },
    ];
  }
}
