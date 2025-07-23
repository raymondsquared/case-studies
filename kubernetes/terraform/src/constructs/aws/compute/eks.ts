import { EksAddon } from '@cdktf/provider-aws/lib/eks-addon';
import { EksCluster } from '@cdktf/provider-aws/lib/eks-cluster';
import { Construct } from 'constructs';

import { Config } from '../../../utils/config';
import {
  getCleanEnvironment,
  getCleanRegion,
  getCleanString,
  DEFAULT_EKS_CONTROL_PLANE_LOG_TYPES,
  DEFAULT_EKS_CORE_ADD_ONS,
  DEFAULT_EKS_VERSION,
} from '../../../utils/common';
import { TaggingUtility } from '../../../utils/tagging';
import { Tags } from '../../../utils/tagging/types';

export interface EksArgs {
  readonly config: Config;
  readonly subnetIds?: string[];
  readonly securityGroupIds?: string[];
  readonly roleArn?: string;
  readonly addOns?: Record<string, string>;
  readonly tags?: Tags;
}

export class Eks extends Construct {
  public readonly eksCluster: EksCluster;

  constructor(scope: Construct, id: string, args: EksArgs) {
    super(scope, id);

    const { config, tags } = args;

    const subnetIds: string[] = args.subnetIds || [];
    const securityGroupIds: string[] = args.securityGroupIds || [];
    const roleArn: string = args.roleArn || '';
    const version: string = config.eksVersion || DEFAULT_EKS_VERSION;
    const hasEndpointPublicAccess: boolean = config.hasEksEndpointPublicAccess ?? false;
    const controlPlaneLogTypes: string[] =
      config.eksControlPlaneLogTypes || DEFAULT_EKS_CONTROL_PLANE_LOG_TYPES;

    const eksClusterName: string = `${getCleanString(config.name)}-${getCleanEnvironment(
      config.environment
    )}-cluster-${getCleanRegion(config.region)}`;

    const taggingUtility: TaggingUtility = new TaggingUtility(config, {
      ...tags,
      layer: 'compute',
    });

    this.eksCluster = new EksCluster(this, 'eks-cluster', {
      name: eksClusterName,
      roleArn,
      vpcConfig: {
        subnetIds,
        securityGroupIds,
        endpointPrivateAccess: true,
        endpointPublicAccess: hasEndpointPublicAccess,
      },
      version,
      enabledClusterLogTypes: controlPlaneLogTypes,
      tags: taggingUtility.getTags({ resourceType: 'cluster' }),
    });

    const finalAddOns: Record<string, string> = {
      ...DEFAULT_EKS_CORE_ADD_ONS,
      ...(args.addOns || {}),
    };

    Object.entries(finalAddOns).forEach(([addOn, version]: [string, string]) => {
      new EksAddon(this, `eks-addon-${getCleanString(addOn)}`, {
        clusterName: this.eksCluster.name,
        addonName: addOn,
        addonVersion: version,
        resolveConflictsOnUpdate: 'PRESERVE',
      });
    });
  }

  public get name(): string {
    return this.eksCluster.name;
  }

  public get arn(): string {
    return this.eksCluster.arn;
  }

  public get endpoint(): string {
    return this.eksCluster.endpoint;
  }
}
