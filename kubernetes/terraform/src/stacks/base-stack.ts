import { Construct } from 'constructs';
import { TerraformStack, TerraformOutput } from 'cdktf';

import { AwsProvider } from '../../.gen/providers/aws/provider';
import { Vpc } from '../constructs/aws/networking/vpc';
import { SecretsManager, SecretConfig } from '../constructs/aws/security/secrets-manager';
import { Kms } from '../constructs/aws/security/kms';
import { Config } from '../utils/config';
import { TaggingUtility } from '../utils/tagging';

export interface BaseStackProps {
  readonly config: Config;
  readonly description?: string;
  readonly environmentName: string;
}

export abstract class BaseStack extends TerraformStack {
  public readonly vpc: Vpc;
  public readonly kms: Kms;
  public readonly secretsManager: SecretsManager;

  constructor(scope: Construct, id: string, props: BaseStackProps) {
    super(scope, id);

    const { config } = props;

    const taggingUtility: TaggingUtility = new TaggingUtility(config);

    new AwsProvider(this, 'AWS', {
      region: 'ap-southeast-2',
      defaultTags: [{ tags: { ...taggingUtility.getTags() } }],
    });

    this.vpc = new Vpc(this, 'vpc', {
      config,
      tags: taggingUtility.getTags({ resourceType: 'vpc' }),
    });

    this.kms = new Kms(this, 'kms', {
      config,
      description: `KMS key for encryption in ${config.environment}`,
      tags: taggingUtility.getTags({ resourceType: 'kms' }),
    });

    this.secretsManager = new SecretsManager(this, 'secrets-manager', {
      config,
      secrets: this.getSecretsConfig(),
      kmsKeyId: config.enableEncryption ? this.kms.id : undefined,
      tags: taggingUtility.getTags({ resourceType: 'secrets' }),
    });

    this.createCommonOutputs(config);
    this.createVpcOutputs(config);
    this.createSecretsOutputs();
  }

  // Abstract methods that must be implemented by subclasses
  protected getSecretsConfig(): SecretConfig[] {
    return [];
  }

  private createCommonOutputs(config: Config): void {
    new TerraformOutput(this, 'stack_name', {
      value: this.node.id,
      description: 'Name of the Terraform stack',
    });

    new TerraformOutput(this, 'environment', {
      value: config.environment,
      description: 'Deployment environment',
    });
  }

  private createVpcOutputs(config: Config): void {
    new TerraformOutput(this, 'vpc_id', {
      value: this.vpc.vpc.id,
      description: 'ID of the VPC',
    });

    new TerraformOutput(this, 'vpc_cidr', {
      value: this.vpc.vpc.cidrBlock,
      description: 'CIDR block of the VPC',
    });

    new TerraformOutput(this, 'private_subnet_ids', {
      value: this.vpc.privateSubnets.map(subnet => subnet.id),
      description: 'IDs of the private subnets',
    });

    if (config.publicSubnetCIDRBlocks?.length) {
      new TerraformOutput(this, 'public_subnet_ids', {
        value: this.vpc.publicSubnets.map(subnet => subnet.id),
        description: 'IDs of the private subnets',
      });
    }
  }

  private createSecretsOutputs(): void {
    new TerraformOutput(this, 'secrets_kms_key_arn', {
      value: this.kms.arn,
      description: 'ARN of the KMS key used for secrets encryption',
    });
    new TerraformOutput(this, 'secrets_arns', {
      value: this.secretsManager.arns,
      description: 'ARNs of the created secrets',
    });
  }
}
