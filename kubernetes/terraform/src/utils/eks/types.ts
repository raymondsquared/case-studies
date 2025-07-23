import { Construct } from 'constructs';

import { Config } from '../config';
import {
  NodeCapacityType,
  NodeInstanceFamily,
  NodeInstanceSize,
  NodeNetwork,
} from '../common/enums';

export interface ScalingArgs {
  desiredSize: number;
  maxSize: number;
  minSize: number;
}

export interface NodeAttributes {
  network?: NodeNetwork;
  capacityType?: NodeCapacityType;
  instanceFamily?: NodeInstanceFamily;
  instanceSize?: NodeInstanceSize;
}

export type NodeLabels = NodeAttributes;

export type NodeTaints = NodeAttributes;

export interface NodeGroupArgs {
  instanceTypes?: string[];
  capacityType?: NodeCapacityType;
  scalingArgs?: ScalingArgs;
  subnetIds?: string[];
  tags?: Record<string, string>;
  labels?: { [key: string]: string };
  taints?: Array<{ key: string; value: string; effect: string }>;
  maxPrice?: string;
  availabilityZones?: string[];
}

export interface CreateNodeGroupArgs {
  scope: Construct;
  config: Config;
  clusterName: string;
  clusterArn: string;
  nodeRoleArn: string;
  subnetIds: string[];
  nodeGroupArgs?: NodeGroupArgs;
  nodeGroupCounter: number;
}
