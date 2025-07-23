import { TerraformOutput, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';

import { Eks, EksNodeGroup } from '../constructs/aws/compute';
import { Vpc } from '../constructs/aws/networking/vpc';
import { Kms } from '../constructs/aws/security/kms';
import { IamRole } from '../constructs/aws/security';
import { SecretsManager, SecretArgs } from '../constructs/aws/security/secrets-manager';
import { Config } from '../utils/config';
import { TaggingUtility } from '../utils/tagging';
import {
  DEFAULT_AWS_REGION,
  DEFAULT_EKS_NODEGROUP_INSTANCE_TYPES,
  DEFAULT_EKS_NODEGROUP_SCALING_CONFIG,
  DEFAULT_EKS_CONTROL_PLANE_ASSUME_ROLE_POLICY,
  DEFAULT_EKS_NODEGROUP_ASSUME_ROLE_POLICY,
  DEFAULT_EKS_NODEGROUP_MANAGED_POLICY_ARNS,
  DEFAULT_SPOT_MAX_PRICE,
} from '../utils/common';
import { createNodeGroup, createNodeGroupArgs } from '../utils/eks';
import { ScalingArgs } from '../utils/eks/types';
import {
  NodeNetwork,
  NodeCapacityType,
  NodeInstanceFamily,
  NodeInstanceSize,
} from '../utils/common/enums';

export interface BaseStackArgs {
  readonly config: Config;
  readonly description?: string;
}

export abstract class BaseStack extends TerraformStack {
  public vpc!: Vpc;
  public kms!: Kms;
  public secretsManager!: SecretsManager;
  public controlPlaneIamRole!: IamRole;
  public nodeGroupIamRole!: IamRole;
  public eks!: Eks;
  public readonly eksNodeGroups: EksNodeGroup[] = [];

  protected readonly config: Config;
  protected readonly taggingUtility: TaggingUtility;
  private nodeGroupCounter = 0;

  constructor(scope: Construct, id: string, args: BaseStackArgs) {
    super(scope, id);

    this.config = args.config;
    this.taggingUtility = new TaggingUtility(this.config);

    const eksNameSuffix: string = this.config.hasEksEndpointPublicAccess ? '-pub' : '-priv';

    this.createProvider();
    this.createNetworking();
    this.createSecurity(eksNameSuffix);
    this.createCompute(eksNameSuffix);
    this.createOutputs();
  }

  // Abstract methods that must be implemented by subclasses
  protected getSecretsArgs(): SecretArgs[] {
    return [];
  }

  protected createNodeGroup(
    name: string,
    config: Config,
    options: {
      instanceTypes?: string[];
      capacityType?: NodeCapacityType;
      scalingArgs?: ScalingArgs;
      subnetIds?: string[];
      tags?: Record<string, string>;
      labels?: { [key: string]: string };
      taints?: Array<{ key: string; value: string; effect: string }>;
      maxPrice?: string;
    } = {}
  ): EksNodeGroup {
    const { subnetIds = this.vpc.privateSubnets.map(s => s.id), ...otherConfig } = options;

    const nodeGroup = createNodeGroup({
      scope: this,
      name,
      config,
      clusterName: this.eks.name,
      clusterArn: this.eks.arn,
      nodeRoleArn: this.nodeGroupIamRole.arn,
      subnetIds,
      args: otherConfig,
      nodeGroupCounter: this.nodeGroupCounter++,
    });

    this.eksNodeGroups.push(nodeGroup);
    return nodeGroup;
  }

  private createProvider(): void {
    new AwsProvider(this, 'AWS', {
      region: DEFAULT_AWS_REGION,
      defaultTags: [{ tags: { ...this.taggingUtility.getTags() } }],
    });
  }

  private createNetworking(): void {
    this.vpc = new Vpc(this, 'vpc', {
      config: this.config,
      tags: this.taggingUtility.getTags({ resourceType: 'vpc' }),
    });
  }

  private createSecurity(nameSuffix: string): void {
    this.kms = new Kms(this, 'kms', {
      config: this.config,
      description: `KMS key for encryption in ${this.config.environment}`,
      tags: this.taggingUtility.getTags({ resourceType: 'kms' }),
    });

    this.secretsManager = new SecretsManager(this, 'secrets-manager', {
      config: this.config,
      secrets: this.getSecretsArgs(),
      kmsKeyId: this.config.hasEncryption ? this.kms.id : undefined,
      tags: this.taggingUtility.getTags({ resourceType: 'secrets' }),
    });

    this.controlPlaneIamRole = this.createControlPlaneIamRole(nameSuffix);
    this.nodeGroupIamRole = this.createNodeGroupIamRole(nameSuffix);
  }

  private createControlPlaneIamRole(nameSuffix: string): IamRole {
    const controlPlaneRoleName = `${this.config.name}-${nameSuffix}-controlplane`;
    return new IamRole(this, 'control-plane-iam-role', {
      config: { ...this.config, name: controlPlaneRoleName },
      assumeRolePolicy: JSON.stringify(DEFAULT_EKS_CONTROL_PLANE_ASSUME_ROLE_POLICY),
      tags: this.taggingUtility.getTags({ name: controlPlaneRoleName, resourceType: 'role' }),
    });
  }

  private createNodeGroupIamRole(nameSuffix: string): IamRole {
    const nodeGroupRoleName = `${this.config.name}-${nameSuffix}-nodegroup`;
    return new IamRole(this, 'node-group-iam-role', {
      config: { ...this.config, name: nodeGroupRoleName },
      assumeRolePolicy: JSON.stringify(DEFAULT_EKS_NODEGROUP_ASSUME_ROLE_POLICY),
      managedPolicyArns: DEFAULT_EKS_NODEGROUP_MANAGED_POLICY_ARNS,
      tags: this.taggingUtility.getTags({ name: nodeGroupRoleName, resourceType: 'role' }),
    });
  }

  private createCompute(nameSuffix: string): void {
    this.config.name = `${this.config.name}-${nameSuffix}`;
    this.eks = new Eks(this, 'eks', {
      config: this.config,
      subnetIds: [
        ...this.vpc.privateSubnets.map(s => s.id),
        ...this.vpc.publicSubnets.map(s => s.id),
      ],
      roleArn: this.controlPlaneIamRole.arn,
      securityGroupIds: this.vpc.securityGroups.map(sg => sg.id),
      tags: this.taggingUtility.getTags({ resourceType: 'eks' }),
    });

    const { nodeGroups, nextCounter } = this.createDefaultSpotNodeGroups();
    this.eksNodeGroups.push(...nodeGroups);
    this.nodeGroupCounter = nextCounter;
  }

  private createDefaultSpotNodeGroups(): { nodeGroups: EksNodeGroup[]; nextCounter: number } {
    const nodeGroups: EksNodeGroup[] = [];
    let counter = this.nodeGroupCounter;

    const privateSubnetIds = this.vpc.privateSubnets.map(s => s.id);
    const publicSubnetIds = this.vpc.publicSubnets.map(s => s.id);

    const shouldCreatePrivate = this.config.nodes?.hasPrivateNodes ?? privateSubnetIds.length > 0;
    const shouldCreatePublic = this.config.nodes?.hasPublicNodes ?? publicSubnetIds.length > 0;

    const defaultMaxPrice = this.config.nodes?.spotMaxPrice || DEFAULT_SPOT_MAX_PRICE;

    if (shouldCreatePrivate && privateSubnetIds.length > 0) {
      const privateNodeGroup = this.createSpotNodeGroup(
        'private-spot',
        privateSubnetIds,
        NodeNetwork.PRIVATE,
        defaultMaxPrice
      );
      nodeGroups.push(privateNodeGroup);
      counter++;
    }

    if (shouldCreatePublic && publicSubnetIds.length > 0) {
      const publicNodeGroup = this.createSpotNodeGroup(
        'public-spot',
        publicSubnetIds,
        NodeNetwork.PUBLIC,
        defaultMaxPrice
      );
      nodeGroups.push(publicNodeGroup);
      counter++;
    }

    return { nodeGroups, nextCounter: counter };
  }

  private createSpotNodeGroup(
    name: string,
    subnetIds: string[],
    network: NodeNetwork,
    maxPrice?: string
  ): EksNodeGroup {
    const { labels, taints } = createNodeGroupArgs({
      network,
      capacityType: NodeCapacityType.SPOT,
      instanceFamily: NodeInstanceFamily.CPU,
      instanceSize: NodeInstanceSize.SMALL,
    });

    return createNodeGroup({
      scope: this,
      name,
      config: this.config,
      clusterName: this.eks.name,
      clusterArn: this.eks.arn,
      nodeRoleArn: this.nodeGroupIamRole.arn,
      subnetIds,
      nodeGroupCounter: this.nodeGroupCounter,
      args: {
        instanceTypes: DEFAULT_EKS_NODEGROUP_INSTANCE_TYPES,
        scalingArgs: DEFAULT_EKS_NODEGROUP_SCALING_CONFIG,
        labels,
        taints,
        maxPrice,
        tags: this.taggingUtility.getTags({ resourceType: 'ng' }),
      },
    });
  }

  private createOutputs(): void {
    this.createCommonOutputs();
    this.createVpcOutputs();
    this.createSecretsOutputs();
    this.createIamOutputs();
    this.createEksOutputs();
  }

  private createCommonOutputs(): void {
    new TerraformOutput(this, 'stack_name', {
      value: this.node.id,
      description: 'Name of the Terraform stack',
    });

    new TerraformOutput(this, 'environment', {
      value: this.config.environment,
      description: 'Deployment environment',
    });
  }

  private createVpcOutputs(): void {
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

    if (this.config.publicSubnetCIDRBlocks?.length) {
      new TerraformOutput(this, 'public_subnet_ids', {
        value: this.vpc.publicSubnets.map(subnet => subnet.id),
        description: 'IDs of the public subnets',
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

  private createIamOutputs(): void {
    new TerraformOutput(this, 'iam_role_arn', {
      value: this.controlPlaneIamRole.arn,
      description: 'ARN of the control plane IAM role',
    });
    new TerraformOutput(this, 'iam_role_name', {
      value: this.controlPlaneIamRole.name,
      description: 'Name of the control plane IAM role',
    });
    new TerraformOutput(this, 'nodegroup_iam_role_arn', {
      value: this.nodeGroupIamRole.arn,
      description: 'ARN of the node group IAM role',
    });
    new TerraformOutput(this, 'nodegroup_iam_role_name', {
      value: this.nodeGroupIamRole.name,
      description: 'Name of the node group IAM role',
    });
  }

  private createEksOutputs(): void {
    new TerraformOutput(this, 'eks_cluster_name', {
      value: this.eks.eksCluster.name,
      description: 'Name of the EKS cluster',
    });
    new TerraformOutput(this, 'eks_cluster_endpoint', {
      value: this.eks.endpoint,
      description: 'Endpoint of the EKS cluster',
    });
    new TerraformOutput(this, 'eks_cluster_arn', {
      value: this.eks.arn,
      description: 'ARN of the EKS cluster',
    });

    this.eksNodeGroups.forEach((nodeGroup, index) => {
      new TerraformOutput(this, `eks_nodegroup_${index}_name`, {
        value: nodeGroup.name,
        description: `Name of EKS node group ${index}`,
      });
      new TerraformOutput(this, `eks_nodegroup_${index}_arn`, {
        value: nodeGroup.arn,
        description: `ARN of EKS node group ${index}`,
      });
    });
  }
}
