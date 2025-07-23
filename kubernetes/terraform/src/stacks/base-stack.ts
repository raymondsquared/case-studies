import { TerraformOutput, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';

import { Eks, EksNodeGroup } from '../constructs/aws/compute';
import { Vpc, SecurityGroup } from '../constructs/aws/networking';
import { SecurityGroupRule } from '../constructs/aws/networking/securitygroup-rule';
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
  SecurityGroupRuleType,
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
  public eksSecurityGroup!: SecurityGroup;
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
    this.createNetworking(eksNameSuffix);
    this.createSecurity(eksNameSuffix);
    this.createCompute(eksNameSuffix);
    this.createOutputs();
  }

  // Abstract methods that must be implemented by subclasses
  protected getSecretsArgs(): SecretArgs[] {
    return [];
  }

  protected createNodeGroup(
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
      availabilityZones?: string[];
    } = {}
  ): EksNodeGroup {
    const { subnetIds = this.vpc.privateSubnets.map(s => s.id), ...otherConfig } = options;

    // Extract availability zones from subnets if not provided
    if (!otherConfig.availabilityZones) {
      otherConfig.availabilityZones = this.getAvailabilityZonesFromSubnetIds(subnetIds);
    }

    const nodeGroup = createNodeGroup({
      scope: this,
      config,
      clusterName: this.eks.name,
      clusterArn: this.eks.arn,
      nodeRoleArn: this.nodeGroupIamRole.arn,
      subnetIds,
      nodeGroupArgs: otherConfig,
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

  private createNetworking(eksNameSuffix: string): void {
    this.vpc = new Vpc(this, 'vpc', {
      config: this.config,
      tags: this.taggingUtility.getTags({ resourceType: 'vpc' }),
    });

    this.createEksSecurityGroup(eksNameSuffix);
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

  private createEksSecurityGroup(nameSuffix: string): void {
    const sgName = `${this.config.name}-${nameSuffix}-controlplane`;
    this.eksSecurityGroup = new SecurityGroup(this, 'eks-security-group', {
      config: { ...this.config, name: sgName },
      vpcId: this.vpc.vpc.id,
      vpcCidrBlock: this.vpc.vpc.cidrBlock,
    });

    this.createSecurityGroupRules(this.vpc.vpc.cidrBlock);
  }

  private createSecurityGroupRules(vpcCidrBlock: string): void {
    new SecurityGroupRule(this, 'internal-allow', {
      securityGroupId: this.eksSecurityGroup.id,
      type: SecurityGroupRuleType.INGRESS,
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: [vpcCidrBlock],
      description: 'Allow all internal traffic within VPC',
    });

    new SecurityGroupRule(this, 'outbound-allow', {
      securityGroupId: this.eksSecurityGroup.id,
      type: SecurityGroupRuleType.EGRESS,
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      description: 'Allow all outbound traffic',
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
      securityGroupIds: [this.eksSecurityGroup.id],
      tags: this.taggingUtility.getTags({ resourceType: 'eks' }),
    });

    const { nodeGroups, nextCounter } = this.createDefaultSpotNodeGroups();
    this.eksNodeGroups.push(...nodeGroups);
    this.nodeGroupCounter = nextCounter;
  }

  private createDefaultSpotNodeGroups(): { nodeGroups: EksNodeGroup[]; nextCounter: number } {
    const nodeGroups: EksNodeGroup[] = [];
    let nodeGroupCounter = this.nodeGroupCounter;

    const privateSubnetIds = this.vpc.privateSubnets.map(s => s.id);
    const publicSubnetIds = this.vpc.publicSubnets.map(s => s.id);

    const shouldCreatePrivate = this.config.nodes?.hasPrivateNodes ?? privateSubnetIds.length > 0;
    const shouldCreatePublic = this.config.nodes?.hasPublicNodes ?? publicSubnetIds.length > 0;

    const defaultMaxPrice = this.config.nodes?.spotMaxPrice || DEFAULT_SPOT_MAX_PRICE;

    if (shouldCreatePrivate && privateSubnetIds.length > 0) {
      const privateNodeGroup = this.createSpotNodeGroup(
        privateSubnetIds,
        NodeNetwork.PRIVATE,
        defaultMaxPrice,
        nodeGroupCounter
      );
      nodeGroups.push(privateNodeGroup);
      nodeGroupCounter++;
    }

    if (shouldCreatePublic && publicSubnetIds.length > 0) {
      const publicNodeGroup = this.createSpotNodeGroup(
        publicSubnetIds,
        NodeNetwork.PUBLIC,
        defaultMaxPrice,
        nodeGroupCounter
      );
      nodeGroups.push(publicNodeGroup);
      nodeGroupCounter++;
    }

    return { nodeGroups, nextCounter: nodeGroupCounter };
  }

  private createSpotNodeGroup(
    subnetIds: string[],
    network: NodeNetwork,
    maxPrice?: string,
    nodeGroupCounter?: number
  ): EksNodeGroup {
    const { labels, taints } = createNodeGroupArgs({
      network,
      capacityType: NodeCapacityType.SPOT,
      instanceFamily: NodeInstanceFamily.CPU,
      instanceSize: NodeInstanceSize.SMALL,
    });

    const availabilityZones = this.getAvailabilityZonesFromSubnetIds(subnetIds);

    return createNodeGroup({
      scope: this,
      config: this.config,
      clusterName: this.eks.name,
      clusterArn: this.eks.arn,
      nodeRoleArn: this.nodeGroupIamRole.arn,
      subnetIds,
      nodeGroupCounter: nodeGroupCounter ?? this.nodeGroupCounter,
      nodeGroupArgs: {
        instanceTypes: DEFAULT_EKS_NODEGROUP_INSTANCE_TYPES,
        scalingArgs: DEFAULT_EKS_NODEGROUP_SCALING_CONFIG,
        labels,
        taints,
        maxPrice,
        tags: this.taggingUtility.getTags({ resourceType: 'ng' }),
        availabilityZones,
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

    new TerraformOutput(this, 'eks_security_group_id', {
      value: this.eksSecurityGroup.id,
      description: 'ID of the EKS security group',
    });
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

  // Getter methods for convenient access to computed properties
  public get stackName(): string {
    return this.node.id;
  }

  public get environment(): string {
    return this.config.environment;
  }

  public get vpcId(): string {
    return this.vpc.vpcId;
  }

  public get vpcCidrBlock(): string {
    return this.vpc.vpcCidrBlock;
  }

  public get privateSubnetIds(): string[] {
    return this.vpc.privateSubnetIds;
  }

  public get publicSubnetIds(): string[] {
    return this.vpc.publicSubnetIds;
  }

  public get allSubnetIds(): string[] {
    return this.vpc.allSubnetIds;
  }

  public get eksClusterName(): string {
    return this.eks.name;
  }

  public get eksClusterArn(): string {
    return this.eks.arn;
  }

  public get eksClusterEndpoint(): string {
    return this.eks.endpoint;
  }

  public get eksSecurityGroupId(): string {
    return this.eksSecurityGroup.id;
  }

  public get kmsKeyArn(): string {
    return this.kms.arn;
  }

  public get kmsKeyId(): string {
    return this.kms.id;
  }

  public get secretsArns(): string[] {
    return this.secretsManager.arns;
  }

  public get secretsCount(): number {
    return this.secretsManager.count;
  }

  public get controlPlaneRoleArn(): string {
    return this.controlPlaneIamRole.arn;
  }

  public get controlPlaneRoleName(): string {
    return this.controlPlaneIamRole.name;
  }

  public get nodeGroupRoleArn(): string {
    return this.nodeGroupIamRole.arn;
  }

  public get nodeGroupRoleName(): string {
    return this.nodeGroupIamRole.name;
  }

  public get nodeGroupCount(): number {
    return this.eksNodeGroups.length;
  }

  public get nodeGroupNames(): string[] {
    return this.eksNodeGroups.map(ng => ng.name);
  }

  public get nodeGroupArns(): string[] {
    return this.eksNodeGroups.map(ng => ng.arn);
  }

  public get hasPublicSubnets(): boolean {
    return this.vpc.hasPublicSubnets;
  }

  public get hasPrivateSubnets(): boolean {
    return this.vpc.hasPrivateSubnets;
  }

  public get hasNatGateways(): boolean {
    return this.vpc.hasNatGateways;
  }

  private getAvailabilityZonesFromSubnetIds(subnetIds: string[]): string[] {
    const allSubnets = [...this.vpc.privateSubnets, ...this.vpc.publicSubnets];
    const availabilityZones: string[] = [];

    subnetIds.forEach(subnetId => {
      const subnet = allSubnets.find(s => s.id === subnetId);
      if (subnet?.availabilityZone) {
        availabilityZones.push(subnet.availabilityZone);
      }
    });

    return [...new Set(availabilityZones)]; // Remove duplicates
  }
}
