import {
  EksNodeGroup as AwsEksNodeGroup,
  EksNodeGroupConfig as AwsEksNodeGroupArgs,
  EksNodeGroupRemoteAccess,
  EksNodeGroupUpdateConfig,
} from '@cdktf/provider-aws/lib/eks-node-group';
import { LaunchTemplate } from '@cdktf/provider-aws/lib/launch-template';
import { Construct } from 'constructs';

import { Config } from '../../../utils/config';
import {
  getCleanString,
  getCleanEnvironment,
  getCleanRegion,
  DEFAULT_EKS_NODEGROUP_INSTANCE_TYPES,
  DEFAULT_EKS_NODEGROUP_IMAGE_ID,
} from '../../../utils/common';
import { NodeCapacityType } from '../../../utils/common/enums';
import { TaggingUtility } from '../../../utils/tagging';
import { Tags } from '../../../utils/tagging/types';

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
  readonly remoteAccess?: EksNodeGroupRemoteAccess;
  readonly updateArgs?: EksNodeGroupUpdateConfig;
  readonly capacityType?: NodeCapacityType;
  readonly labels?: { [key: string]: string };
  readonly taints?: TaintInputArgs[];
  readonly diskSize?: number;
  readonly amiType?: string;
  readonly releaseVersion?: string;
  readonly maxPrice?: string;
  readonly tags?: Tags;
  readonly availabilityZones?: string[];
}

export class EksNodeGroup extends Construct {
  public readonly nodeGroup: AwsEksNodeGroup;
  public readonly launchTemplate?: LaunchTemplate;

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
      availabilityZones,
    } = eksNodeGroupArgs;

    if (!clusterName) throw new Error('EksNodeGroup: clusterName is required');
    if (!clusterArn) throw new Error('EksNodeGroup: clusterArn is required');
    if (!subnetIds || subnetIds.length === 0)
      throw new Error('EksNodeGroup: subnetIds are required');
    if (!nodeRoleArn) throw new Error('EksNodeGroup: nodeRoleArn is required');

    const nodeGroupName = EksNodeGroup.getNodeGroupName(config);
    
    const tagsWithAz = availabilityZones?.length 
      ? { ...tags, availabilityZone: availabilityZones.join(',') }
      : tags;
    
    const taggingUtility = new TaggingUtility(config, { ...tagsWithAz, layer: 'compute' });

    const ec2Tags = availabilityZones?.length 
      ? { ...taggingUtility.getTags({ resourceType: 'ec2' }), availabilityZone: availabilityZones.join(',') }
      : taggingUtility.getTags({ resourceType: 'ec2' });

    this.launchTemplate = new LaunchTemplate(this, 'launch-template', {
      name: `${getCleanString(config.name)}${getCleanEnvironment(config.environment)}-lt-${getCleanRegion(config.region)}`,
      imageId: DEFAULT_EKS_NODEGROUP_IMAGE_ID,
      instanceType: instanceTypes?.[0] || DEFAULT_EKS_NODEGROUP_INSTANCE_TYPES[0],
      vpcSecurityGroupIds: [],
      tagSpecifications: [
        {
          resourceType: 'instance',
          tags: ec2Tags,
        },
        {
          resourceType: 'volume',
          tags: taggingUtility.getTags({ resourceType: 'ebs' }),
        },
      ],
      tags: taggingUtility.getTags({ resourceType: 'lt' }),
    });

    const nodeGroupArgs: AwsEksNodeGroupArgs = {
      clusterName,
      nodeGroupName,
      nodeRoleArn,
      subnetIds,
      scalingConfig: EksNodeGroup.buildScalingArgs(scalingArgs),
      tags: taggingUtility.getTags({ resourceType: 'ng' }),
      ...(instanceTypes ? { instanceTypes } : {}),
      ...(remoteAccess ? { remoteAccess } : {}),
      ...(updateArgs ? { updateConfig: updateArgs } : {}),
      ...(capacityType ? { capacityType } : {}),
      ...(labels ? { labels } : {}),
      ...EksNodeGroup.getTaints(taints),
      ...(diskSize ? { diskSize } : {}),
      ...(amiType ? { amiType } : {}),
      ...(releaseVersion ? { releaseVersion } : {}),
      ...(maxPrice ? { maxPrice } : {}),
      ...(this.launchTemplate
        ? {
            launchTemplate: {
              id: this.launchTemplate.id,
              version: this.launchTemplate.latestVersion.toString(),
            },
          }
        : {}),
    };

    this.nodeGroup = new AwsEksNodeGroup(this, 'eks-nodegroup', nodeGroupArgs);
  }

  private static getNodeGroupName(config: Config): string {
    const name = getCleanString(config.name);
    const env = getCleanEnvironment(config.environment);
    const region = getCleanRegion(config.region);
    return `${name}-${env}-ng-${region}`;
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

  // private static getRemoteAccessArgs(args?: RemoteAccessArgs): RemoteAccessArgs {
  //   if (!args?.remoteAccess) return {};
  //   const { ec2SshKey, sourceSecurityGroupIds } = args.remoteAccess;
  //   if (!ec2SshKey && !sourceSecurityGroupIds) return {};
  //   return {
  //     remoteAccess: {
  //       ...(ec2SshKey ? { ec2SshKey } : {}),
  //       ...(sourceSecurityGroupIds ? { sourceSecurityGroupIds } : {}),
  //     },
  //   };
  // }

  // private static getUpdateConfig(args?: UpdateConfigArgs): UpdateConfigArgs {
  //   if (!args?.updateConfig) return {};
  //   const { maxUnavailable, maxUnavailablePercentage } = args.updateConfig;
  //   if (maxUnavailable === undefined && maxUnavailablePercentage === undefined) return {};
  //   return {
  //     updateConfig: {
  //       ...(maxUnavailable !== undefined ? { maxUnavailable } : {}),
  //       ...(maxUnavailablePercentage !== undefined ? { maxUnavailablePercentage } : {}),
  //     },
  //   };
  // }

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
