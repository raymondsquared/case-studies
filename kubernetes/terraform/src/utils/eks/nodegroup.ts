import { EksNodeGroup } from '../../constructs/aws/compute';
import {
  DEFAULT_EKS_NODEGROUP_INSTANCE_TYPES,
  DEFAULT_EKS_NODEGROUP_CAPACITY_TYPE,
  DEFAULT_EKS_NODEGROUP_SCALING_CONFIG,
  EKS_NODEGROUP_STANDARD_FIELDS,
} from '../common/constants';
import { CreateNodeGroupParams, NodeAttributes } from './types';

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

export function createNodeGroupArgs(params: NodeAttributes) {
  const { network, capacityType, instanceFamily, instanceSize } = params;

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

export function createNodeGroup(params: CreateNodeGroupParams): EksNodeGroup {
  const {
    scope,
    name,
    config,
    clusterName,
    clusterArn,
    nodeRoleArn,
    subnetIds,
    args = {},
    nodeGroupCounter,
  } = params;

  const {
    instanceTypes = DEFAULT_EKS_NODEGROUP_INSTANCE_TYPES,
    capacityType = DEFAULT_EKS_NODEGROUP_CAPACITY_TYPE,
    scalingArgs = DEFAULT_EKS_NODEGROUP_SCALING_CONFIG,
    tags = {},
    labels = {},
    taints = [],
    maxPrice,
  } = args;

  const nodeGroupArgs = {
    ...config,
    name: `${config.name}-${name}`,
  };

  const stackName = `${name}-nodegroup-${nodeGroupCounter}`;
  const nodeGroup = new EksNodeGroup(scope, stackName, {
    config: nodeGroupArgs,
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
    tags: {
      Name: `${config.name}-ng`,
      Environment: config.environment,
      ResourceType: 'nodegroup',
      ...tags,
    },
  });

  return nodeGroup;
}
