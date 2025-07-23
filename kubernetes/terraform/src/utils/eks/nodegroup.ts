import { EksNodeGroup } from '../../constructs/aws/compute';
import {
  DEFAULT_EKS_NODEGROUP_INSTANCE_TYPES,
  DEFAULT_EKS_NODEGROUP_CAPACITY_TYPE,
  DEFAULT_EKS_NODEGROUP_SCALING_CONFIG,
  EKS_NODEGROUP_STANDARD_FIELDS,
} from '../common/constants';
import { CreateNodeGroupArgs, NodeAttributes } from './types';

function getStandardFields(data: NodeAttributes): Record<string, string> {
  const result: Record<string, string> = {};

  Object.entries(EKS_NODEGROUP_STANDARD_FIELDS).forEach(([field, labelKey]) => {
    if (data[field as keyof typeof data]) {
      result[labelKey] = data[field as keyof typeof data]!;
    }
  });

  return result;
}

export function getLabels(labels: NodeAttributes): { [key: string]: string } {
  return getStandardFields(labels);
}

export function getTaints(
  taints: NodeAttributes
): Array<{ key: string; value: string; effect: string }> {
  const standard = getStandardFields(taints);
  const kubernetesTaints: Array<{ key: string; value: string; effect: string }> = [];

  Object.entries(standard).forEach(([key, value]) => {
    kubernetesTaints.push({
      key,
      value,
      effect: 'NO_SCHEDULE',
    });
  });

  return kubernetesTaints;
}

export function createNodeGroupArgs(args: NodeAttributes) {
  const { network, capacityType, instanceFamily, instanceSize } = args;

  const labels = getLabels({
    network,
    capacityType,
    instanceFamily,
    instanceSize,
  });

  const taints = getTaints({
    network,
    capacityType,
    instanceFamily,
    instanceSize,
  });

  return { labels, taints };
}

export function createNodeGroup(args: CreateNodeGroupArgs): EksNodeGroup {
  const {
    scope,
    config,
    clusterName,
    clusterArn,
    nodeRoleArn,
    subnetIds,
    nodeGroupArgs = {},
    nodeGroupCounter,
  } = args;

  const {
    instanceTypes = DEFAULT_EKS_NODEGROUP_INSTANCE_TYPES,
    capacityType = DEFAULT_EKS_NODEGROUP_CAPACITY_TYPE,
    scalingArgs = DEFAULT_EKS_NODEGROUP_SCALING_CONFIG,
    tags = {},
    labels = {},
    taints = [],
    maxPrice,
    availabilityZones,
  } = nodeGroupArgs;

  const finalConfig = {
    ...config,
    name: `${config.name}-${capacityType}`,
  };

  const stackName = `${finalConfig.name}-nodegroup-${nodeGroupCounter}`;
  const nodeGroup = new EksNodeGroup(scope, stackName, {
    config: finalConfig,
    clusterName,
    clusterArn,
    subnetIds,
    nodeRoleArn,
    scalingArgs,
    instanceTypes,
    capacityType,
    labels,
    taints,
    maxPrice,
    availabilityZones,
    tags: {
      Name: `${config.name}-ng`,
      Environment: config.environment,
      ResourceType: 'nodegroup',
      ...tags,
    },
  });

  return nodeGroup;
}
