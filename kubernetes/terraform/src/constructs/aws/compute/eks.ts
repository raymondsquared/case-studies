import { EksAddon } from '@cdktf/provider-aws/lib/eks-addon';
import { EksCluster } from '@cdktf/provider-aws/lib/eks-cluster';
import { Construct } from 'constructs';

import { Config } from '../../../utils/config';
import {
  cleanEnvironment,
  cleanRegion,
  cleanString,
  DEFAULT_EKS_CONTROL_PLANE_LOG_TYPES,
  DEFAULT_EKS_CORE_ADD_ONS,
  DEFAULT_EKS_VERSION,
} from '../../../utils/common';
import { TaggingUtility } from '../../../utils/tagging';
import { Tags } from '../../../utils/tagging/types';

export interface EksProps {
  readonly config: Config;
  readonly subnetIds?: string[];
  readonly securityGroupIds?: string[];
  readonly roleArn?: string;
  readonly addOns?: Record<string, string>;
  readonly tags?: Tags;
}

export class Eks extends Construct {
  public readonly eksCluster: EksCluster;

  constructor(scope: Construct, id: string, props: EksProps) {
    super(scope, id);

    const { config, tags } = props;

    const subnetIds: string[] = props.subnetIds || [];
    const securityGroupIds: string[] = props.securityGroupIds || [];
    const roleArn: string = props.roleArn || '';
    const version: string = config.eksVersion || DEFAULT_EKS_VERSION;
    const endpointPublicAccess: boolean = config.eksEndpointPublicAccess ?? false;
    const endpointPrivateAccess: boolean = !config.eksEndpointPublicAccess;
    const controlPlaneLogTypes: string[] =
      config.eksControlPlaneLogTypes || DEFAULT_EKS_CONTROL_PLANE_LOG_TYPES;

    const eksClusterName: string = `${cleanString(config.name)}-${cleanEnvironment(
      config.environment
    )}-cluster-${cleanRegion(config.region)}`;

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
        endpointPrivateAccess,
        endpointPublicAccess,
      },
      version,
      enabledClusterLogTypes: controlPlaneLogTypes,
      tags: taggingUtility.getTags({ resourceType: 'cluster' }),
    });

    const finalAddOns: Record<string, string> = {
      ...DEFAULT_EKS_CORE_ADD_ONS,
      ...(props.addOns || {}),
    };

    Object.entries(finalAddOns).forEach(([addOn, version]: [string, string]) => {
      new EksAddon(this, `eks-addon-${cleanString(addOn)}`, {
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
