import { Construct } from 'constructs';
import { TerraformStack, TerraformOutput } from 'cdktf';
import { AwsProvider } from '../../.gen/providers/aws/provider';
import { PrivateVpc } from '../constructs/networking/private-vpc';
import { SecretsManager } from '../constructs/security/secrets-manager';
import { EnvironmentConfig } from '../config/environment';
import { createTaggingUtility } from '../utils/tagging';

export interface BaseStackProps {
  readonly config: EnvironmentConfig;
  readonly description?: string;
  readonly environmentName: string;
}

export abstract class BaseStack extends TerraformStack {
  public readonly privateVpc: PrivateVpc;
  public readonly secretsManager: SecretsManager;

  constructor(scope: Construct, id: string, props: BaseStackProps) {
    super(scope, id);

    const { config, environmentName } = props;

    // Create tagging utility
    const taggingUtility = createTaggingUtility(config);

    // Configure AWS Provider with enhanced tagging
    new AwsProvider(this, 'AWS', {
      region: config.region,
      defaultTags: [
        {
          tags: taggingUtility.generateTags(),
        },
      ],
    });

    // Create private VPC with networking infrastructure
    this.privateVpc = new PrivateVpc(this, 'private-vpc', {
      config,
      vpcName: `${config.project}-${config.environment}-vpc`,
      cidrBlock: this.getVpcCidrBlock(),
      tags: taggingUtility.generateNetworkTags({
        service: 'vpc',
        customTags: {
          Purpose: `${environmentName}-private-vpc`,
        },
      }),
    });

    // Create secrets management with KMS encryption
    this.secretsManager = new SecretsManager(this, 'secrets-manager', {
      config,
      secrets: this.getSecretsConfig(),
      enableRotation: this.shouldEnableRotation(),
      tags: taggingUtility.generateSecurityResourceTags({
        service: 'secrets',
        dataClassification: this.getDataClassification(),
        customTags: {
          Purpose: `${environmentName}-secrets`,
        },
      }),
    });

    // Create common outputs
    this.createCommonOutputs(config);
    this.createVpcOutputs();
    this.createSecretsOutputs();
  }

  // Abstract methods that subclasses must implement
  protected abstract getVpcCidrBlock(): string;
  protected abstract getSecretsConfig(): any[];
  protected abstract shouldEnableRotation(): boolean;
  protected abstract getDataClassification(): 'public' | 'internal' | 'confidential' | 'restricted';

  private createCommonOutputs(config: EnvironmentConfig): void {
    new TerraformOutput(this, 'stack_name', {
      value: this.node.id,
      description: 'Name of the Terraform stack',
    });

    new TerraformOutput(this, 'environment', {
      value: config.environment,
      description: 'Deployment environment',
    });

    new TerraformOutput(this, 'region', {
      value: config.region,
      description: 'AWS region',
    });

    new TerraformOutput(this, 'project', {
      value: config.project,
      description: 'Project name',
    });

    new TerraformOutput(this, 'owner', {
      value: config.owner,
      description: 'Resource owner',
    });

    new TerraformOutput(this, 'cost_center', {
      value: config.costCenter,
      description: 'Cost center for billing',
    });
  }

  private createVpcOutputs(): void {
    new TerraformOutput(this, 'vpc_id', {
      value: this.privateVpc.vpc.id,
      description: 'ID of the VPC',
    });

    new TerraformOutput(this, 'vpc_cidr', {
      value: this.privateVpc.vpc.cidrBlock,
      description: 'CIDR block of the VPC',
    });

    new TerraformOutput(this, 'private_subnet_ids', {
      value: this.privateVpc.privateSubnets.map(subnet => subnet.id),
      description: 'IDs of the private subnets',
    });
  }

  private createSecretsOutputs(): void {
    if (this.secretsManager.kmsKey) {
      new TerraformOutput(this, 'secrets_kms_key_arn', {
        value: this.secretsManager.kmsKey.arn,
        description: 'ARN of the KMS key used for secrets encryption',
      });
    }

    new TerraformOutput(this, 'secrets_arns', {
      value: this.secretsManager.secrets.map(secret => secret.arn),
      description: 'ARNs of the created secrets',
    });
  }
}
