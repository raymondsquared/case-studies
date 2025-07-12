import { Construct } from 'constructs';
import { BaseStack, BaseStackProps } from './base-stack';

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
        description: 'Database password for application',
        secretString: JSON.stringify({
          username: 'dbuser',
          password: 'changeme', // Replace with actual secret
        }),
        enableRotation: true,
      },
      {
        name: 'api-key',
        description: 'API key for external services',
        secretString: JSON.stringify({
          apiKey: 'changeme', // Replace with actual secret
        }),
        enableRotation: true,
      },
    ];
  }

  protected shouldEnableRotation(): boolean {
    return true;
  }

  protected getDataClassification(): 'public' | 'internal' | 'confidential' | 'restricted' {
    return 'confidential';
  }


} 