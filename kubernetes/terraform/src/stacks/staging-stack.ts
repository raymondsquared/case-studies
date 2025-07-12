import { Construct } from 'constructs';
import { BaseStack, BaseStackProps } from './base-stack';

export interface StagingStackProps extends Omit<BaseStackProps, 'environmentName'> {
  readonly description?: string;
}

export class StagingStack extends BaseStack {
  constructor(scope: Construct, id: string, props: StagingStackProps) {
    super(scope, id, {
      ...props,
      environmentName: 'staging',
      description: props.description || 'Staging infrastructure stack',
    });
  }

  protected getVpcCidrBlock(): string {
    return '10.0.0.0/16';
  }

  protected shouldEnableNatGateway(): boolean {
    return true;
  }

  protected getSecretsConfig(): any[] {
    return [
      {
        name: 'database-password',
        description: 'Database password for staging application',
        secretString: JSON.stringify({
          username: 'staginguser',
          password: 'stagingpassword', // Replace with actual secret
        }),
        enableRotation: true,
      },
      {
        name: 'api-key',
        description: 'API key for external services (staging)',
        secretString: JSON.stringify({
          apiKey: 'staging-api-key', // Replace with actual secret
        }),
        enableRotation: true,
      },
    ];
  }

  protected shouldEnableRotation(): boolean {
    return true;
  }

  protected getDataClassification(): 'public' | 'internal' | 'confidential' | 'restricted' {
    return 'internal';
  }


} 