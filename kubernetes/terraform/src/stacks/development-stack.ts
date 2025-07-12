import { Construct } from 'constructs';
import { BaseStack, BaseStackProps } from './base-stack';

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

  protected getVpcCidrBlock(): string {
    return '10.0.0.0/16';
  }

  protected getSecretsConfig(): any[] {
    return [
      {
        name: 'database-password',
        description: 'Database password for development application',
        secretString: JSON.stringify({
          username: 'devuser',
          password: 'devpassword', // This should be replaced with actual secret
        }),
        enableRotation: true,
      },
      {
        name: 'api-key',
        description: 'API key for external services (development)',
        secretString: JSON.stringify({
          apiKey: 'dev-api-key', // This should be replaced with actual secret
        }),
        enableRotation: true,
      },
    ];
  }

  protected shouldEnableRotation(): boolean {
    return true; // Enable rotation for development
  }

  protected getDataClassification(): 'public' | 'internal' | 'confidential' | 'restricted' {
    return 'internal'; // Development data is internal
  }
}
