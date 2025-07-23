import {
  EksNodeGroup as AwsEksNodeGroup,
  EksNodeGroupConfig as AwsEksNodeGroupArgs,
} from '@cdktf/provider-aws/lib/eks-node-group';
import { Construct } from 'constructs';

import { Config } from '../../../utils/config';
import { getCleanString, getCleanEnvironment, getCleanRegion } from '../../../utils/common';
import { NodeCapacityType } from '../../../utils/common/enums';
import { TaggingUtility } from '../../../utils/tagging';
import { Tags } from '../../../utils/tagging/types';

interface RemoteAccessInputArgs {
  ec2SshKey?: string;
  sourceSecurityGroupIds?: string[];
}

interface RemoteAccessOutputArgs {
  remoteAccess?: {
    ec2SshKey?: string;
    sourceSecurityGroupIds?: string[];
  };
}

interface UpdateConfigInputArgs {
  maxUnavailable?: number;
  maxUnavailablePercentage?: number;
}

interface UpdateConfigOutputArgs {
  updateConfig?: {
    maxUnavailable?: number;
    maxUnavailablePercentage?: number;
  };
}

interface TaintInputArgs {
  key: string;
  value: string;
  effect: string;
}

interface TaintOutputArgs {
  taint?: Array<{ key: string; value: string; effect: string }>;
}

export interface EksNodeGroupArgs {
  readonly config: Config;
  readonly clusterName: string;
  readonly clusterArn: string;
  readonly subnetIds: string[];
  readonly nodeRoleArn: string;
  readonly scalingArgs?: {
    desiredSize?: number;
    maxSize?: number;
    minSize?: number;
  };
  readonly instanceTypes?: string[];
  readonly securityGroupIds?: string[];
  readonly remoteAccess?: RemoteAccessInputArgs;
  readonly updateArgs?: UpdateConfigInputArgs;
  readonly capacityType?: NodeCapacityType;
  readonly labels?: { [key: string]: string };
  readonly taints?: TaintInputArgs[];
  readonly diskSize?: number;
  readonly amiType?: string;
  readonly releaseVersion?: string;
  readonly maxPrice?: string;
  readonly tags?: Tags;
}

export class EksNodeGroup extends Construct {
  public readonly nodeGroup: AwsEksNodeGroup;

  constructor(scope: Construct, id: string, eksNodeGroupArgs: EksNodeGroupArgs) {
    super(scope, id);

    const {
      config,
      clusterName,
      clusterArn,
      subnetIds,
      nodeRoleArn,
      scalingArgs,
      instanceTypes,
      remoteAccess,
      updateArgs,
      capacityType,
      labels,
      taints,
      diskSize,
      amiType,
      releaseVersion,
      maxPrice,
      tags,
    } = eksNodeGroupArgs;

    if (!clusterName) throw new Error('EksNodeGroup: clusterName is required');
    if (!clusterArn) throw new Error('EksNodeGroup: clusterArn is required');
    if (!subnetIds || subnetIds.length === 0)
      throw new Error('EksNodeGroup: subnetIds are required');
    if (!nodeRoleArn) throw new Error('EksNodeGroup: nodeRoleArn is required');

    const nodeGroupName = EksNodeGroup.getNodeGroupName(config);
    const taggingUtility = new TaggingUtility(config, { ...tags, layer: 'compute' });

    const nodeGroupArgs: AwsEksNodeGroupArgs = {
      clusterName,
      nodeGroupName,
      nodeRoleArn,
      subnetIds,
      scalingConfig: EksNodeGroup.buildScalingArgs(scalingArgs),
      tags: taggingUtility.getTags({ resourceType: 'nodegroup' }),
      ...(instanceTypes ? { instanceTypes } : {}),
      ...EksNodeGroup.getRemoteAccessArgs(remoteAccess),
      ...EksNodeGroup.getUpdateConfig(updateArgs),
      ...(capacityType ? { capacityType } : {}),
      ...(labels ? { labels } : {}),
      ...EksNodeGroup.getTaints(taints),
      ...(diskSize ? { diskSize } : {}),
      ...(amiType ? { amiType } : {}),
      ...(releaseVersion ? { releaseVersion } : {}),
      ...(maxPrice ? { maxPrice } : {}),
    };

    this.nodeGroup = new AwsEksNodeGroup(this, 'eks-nodegroup', nodeGroupArgs);
  }

  private static getNodeGroupName(config: Config): string {
    const name = getCleanString(config.name);
    const env = getCleanEnvironment(config.environment);
    const region = getCleanRegion(config.region);
    return `${name}-${env}-nodegroup-${region}`;
  }

  private static buildScalingArgs(scalingArgs?: {
    desiredSize?: number;
    maxSize?: number;
    minSize?: number;
  }): { desiredSize: number; maxSize: number; minSize: number } {
    if (
      scalingArgs?.desiredSize != null &&
      scalingArgs?.maxSize != null &&
      scalingArgs?.minSize != null
    ) {
      const { desiredSize, maxSize, minSize } = scalingArgs;
      return { desiredSize, maxSize, minSize };
    }
    return { desiredSize: 1, maxSize: 1, minSize: 1 };
  }

  private static getRemoteAccessArgs(remoteAccess?: RemoteAccessInputArgs): RemoteAccessOutputArgs {
    if (!remoteAccess) return {};
    const { ec2SshKey, sourceSecurityGroupIds } = remoteAccess;
    if (!ec2SshKey && !sourceSecurityGroupIds) return {};
    return {
      remoteAccess: {
        ...(ec2SshKey ? { ec2SshKey } : {}),
        ...(sourceSecurityGroupIds ? { sourceSecurityGroupIds } : {}),
      },
    };
  }

  private static getUpdateConfig(updateArgs?: UpdateConfigInputArgs): UpdateConfigOutputArgs {
    if (!updateArgs) return {};
    const { maxUnavailable, maxUnavailablePercentage } = updateArgs;
    if (maxUnavailable === undefined && maxUnavailablePercentage === undefined) return {};
    return {
      updateConfig: {
        ...(maxUnavailable !== undefined ? { maxUnavailable } : {}),
        ...(maxUnavailablePercentage !== undefined ? { maxUnavailablePercentage } : {}),
      },
    };
  }

  private static getTaints(taints?: TaintInputArgs[]): TaintOutputArgs {
    if (!taints?.length) return {};
    return {
      taint: taints.map(({ key, value, effect }) => ({ key, value, effect })),
    };
  }

  public get name(): string {
    return this.nodeGroup.nodeGroupName;
  }

  public get arn(): string {
    return this.nodeGroup.arn;
  }
}
