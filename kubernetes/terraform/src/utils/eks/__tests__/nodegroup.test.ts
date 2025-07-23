import { App, TerraformStack } from 'cdktf';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';

import { createNodeGroup } from '../nodegroup';
import { NodeGroupArgs } from '../types';
import { Config } from '../../config';
import { Environment, NodeCapacityType, Region, Vendor } from '../../common/enums';
import { EksNodeGroup } from '../../../constructs/aws/compute';
import { TaggingUtility } from '../../tagging';
import { assertStackSynthesis, parseSynthesizedStack } from '../../common';

type TerraformSynthEksNodeGroup = {
  node_group_name: string;
  cluster_name: string;
  node_role_arn: string;
  subnet_ids: string[];
  scaling_config: {
    desired_size: number;
    max_size: number;
    min_size: number;
  };
  instance_types?: string[];
  tags: Record<string, string>;
};

type CreateTestStackConfig = {
  clusterName?: string;
  clusterArn?: string;
  subnetIds?: string[];
  nodeRoleArn?: string;
  nodeGroupConfig?: NodeGroupArgs;
  nodeGroupCounter?: number;
};

class TestStack extends TerraformStack {
  public readonly nodeGroup: EksNodeGroup;

  constructor(
    scope: App,
    id: string,
    config: Config,
    clusterName: string,
    clusterArn: string,
    subnetIds: string[],
    nodeRoleArn: string,
    nodeGroupArgs?: NodeGroupArgs,
    nodeGroupCounter: number = 0
  ) {
    super(scope, id);
    const taggingUtility = new TaggingUtility({ ...config, layer: 'compute' });
    new AwsProvider(this, 'AWS', {
      region: 'ap-southeast-2',
      defaultTags: [{ tags: { ...taggingUtility.getTags() } }],
    });

    this.nodeGroup = createNodeGroup({
      scope: this,
      config,
      clusterName,
      clusterArn,
      nodeRoleArn,
      subnetIds,
      nodeGroupArgs,
      nodeGroupCounter,
    });
  }
}

const testClusterName = 'test-eks-cluster';
const testClusterArn = 'arn:aws:eks:ap-southeast-2:123456789012:cluster/test-eks-cluster';
const testNodeRoleArn = 'arn:aws:iam::123456789012:role/test-node-role';
const testSubnetIds = ['subnet-123', 'subnet-456'];
const testScalingArgs = { desiredSize: 2, maxSize: 3, minSize: 1 };
const testInstanceTypes = ['t3.medium'];

function createConfig(overrides: Partial<Config> = {}): Config {
  const baseConfig: Config = {
    name: 'test-stack',
    resourceType: 'stack',
    vendor: Vendor.AWS,
    environment: Environment.DEVELOPMENT,
    region: Region.AUSTRALIA_EAST,
    terraformOrganisation: 'test-org',
    terraformWorkspace: 'test-workspace',
    terraformHostname: 'app.terraform.io',
    hasEncryption: true,
    hasSecretsManager: true,
    tags: { purpose: 'testing' } as Record<string, string>,
    ...overrides,
  };
  return baseConfig;
}

function createTestStack(app: App, config: Config, options: CreateTestStackConfig = {}): TestStack {
  const {
    clusterName = testClusterName,
    clusterArn = testClusterArn,
    subnetIds = testSubnetIds,
    nodeRoleArn = testNodeRoleArn,
    nodeGroupConfig,
    nodeGroupCounter = 0,
  } = options;

  return new TestStack(
    app,
    'test-stack',
    config,
    clusterName,
    clusterArn,
    subnetIds,
    nodeRoleArn,
    nodeGroupConfig,
    nodeGroupCounter
  );
}

describe('NodeGroup', () => {
  let app: App;
  let config: Config;

  beforeEach((): void => {
    app = new App();
    config = createConfig();
  });

  describe('Given a valid configuration', () => {
    describe('When creating a node group', () => {
      it('Then it should create node group successfully', (): void => {
        const stack = createTestStack(app, config);
        expect(() => assertStackSynthesis(stack)).not.toThrow();
        expect(stack.nodeGroup).toBeDefined();
        expect(stack.nodeGroup.name).toBeDefined();
        expect(stack.nodeGroup.arn).toBeDefined();
      });

      it('Then it should set the correct tags', (): void => {
        const customTags = { owner: 'test-team', project: 'test-project' };
        const options: NodeGroupArgs = { tags: customTags };
        const stack = createTestStack(app, config, {
          clusterName: testClusterName,
          clusterArn: testClusterArn,
          subnetIds: testSubnetIds,
          nodeRoleArn: testNodeRoleArn,
          nodeGroupConfig: options,
        });

        const synthesised = parseSynthesizedStack(stack);
        const nodeGroupResources = synthesised.resource?.aws_eks_node_group || {};
        const nodeGroup: TerraformSynthEksNodeGroup = Object.values(
          nodeGroupResources
        )[0] as TerraformSynthEksNodeGroup;

        expect(nodeGroup.tags.owner).toBe('test-team');
        expect(nodeGroup.tags.project).toBe('test-project');

        expect(nodeGroup.tags.Name).toBe('teststackspot-dev-ng-aue');
      });

      it('Then it should set the correct scaling configuration', (): void => {
        const options: NodeGroupArgs = { scalingArgs: testScalingArgs };
        const stack = createTestStack(app, config, {
          clusterName: testClusterName,
          clusterArn: testClusterArn,
          subnetIds: testSubnetIds,
          nodeRoleArn: testNodeRoleArn,
          nodeGroupConfig: options,
        });

        const synthesised = parseSynthesizedStack(stack);
        const nodeGroupResources = synthesised.resource?.aws_eks_node_group || {};
        const nodeGroup: TerraformSynthEksNodeGroup = Object.values(
          nodeGroupResources
        )[0] as TerraformSynthEksNodeGroup;

        expect(nodeGroup.scaling_config.desired_size).toBe(testScalingArgs.desiredSize);
        expect(nodeGroup.scaling_config.max_size).toBe(testScalingArgs.maxSize);
        expect(nodeGroup.scaling_config.min_size).toBe(testScalingArgs.minSize);
      });

      it('Then it should set the correct instance types', (): void => {
        const options: NodeGroupArgs = { instanceTypes: testInstanceTypes };
        const stack = createTestStack(app, config, {
          clusterName: testClusterName,
          clusterArn: testClusterArn,
          subnetIds: testSubnetIds,
          nodeRoleArn: testNodeRoleArn,
          nodeGroupConfig: options,
        });

        const synthesised = parseSynthesizedStack(stack);
        const nodeGroupResources = synthesised.resource?.aws_eks_node_group || {};
        const nodeGroup: TerraformSynthEksNodeGroup = Object.values(
          nodeGroupResources
        )[0] as TerraformSynthEksNodeGroup;

        expect(nodeGroup.instance_types).toEqual(testInstanceTypes);
      });

      it('Then it should set the correct subnet IDs, node role ARN, and cluster name', (): void => {
        const stack = createTestStack(app, config);

        const synthesised = parseSynthesizedStack(stack);
        const nodeGroupResources = synthesised.resource?.aws_eks_node_group || {};
        const nodeGroup: TerraformSynthEksNodeGroup = Object.values(
          nodeGroupResources
        )[0] as TerraformSynthEksNodeGroup;

        expect(nodeGroup.subnet_ids).toEqual(testSubnetIds);
        expect(nodeGroup.node_role_arn).toBe(testNodeRoleArn);
        expect(nodeGroup.cluster_name).toBe(testClusterName);
      });

      it('Then it should generate the correct node group name', (): void => {
        const stack = createTestStack(app, config);

        const synthesised = parseSynthesizedStack(stack);
        const nodeGroupResources = synthesised.resource?.aws_eks_node_group || {};
        const nodeGroup: TerraformSynthEksNodeGroup = Object.values(
          nodeGroupResources
        )[0] as TerraformSynthEksNodeGroup;

        const expectedName = 'teststackspot-dev-ng-aue';
        expect(nodeGroup.node_group_name).toBe(expectedName);
      });

      it('Then it should use default values when options are not provided', (): void => {
        const stack = createTestStack(app, config);

        const synthesised = parseSynthesizedStack(stack);
        const nodeGroupResources = synthesised.resource?.aws_eks_node_group || {};
        const nodeGroup: TerraformSynthEksNodeGroup = Object.values(
          nodeGroupResources
        )[0] as TerraformSynthEksNodeGroup;

        expect(nodeGroup.scaling_config.desired_size).toBe(1);
        expect(nodeGroup.scaling_config.max_size).toBe(2);
        expect(nodeGroup.scaling_config.min_size).toBe(1);
        expect(nodeGroup.instance_types).toEqual(['t3.small', 't3.micro']);
      });

      it('Then it should create a node group with custom configuration', (): void => {
        const customConfig: NodeGroupArgs = {
          instanceTypes: ['t3.large'],
          capacityType: NodeCapacityType.ON_DEMAND,
          scalingArgs: { desiredSize: 3, maxSize: 5, minSize: 1 },
          labels: { 'custom-label': 'value' },
          taints: [{ key: 'custom-taint', value: 'value', effect: 'NO_SCHEDULE' }],
          tags: { CustomTag: 'value' },
        };

        const stack = createTestStack(app, config, {
          clusterName: testClusterName,
          clusterArn: testClusterArn,
          subnetIds: testSubnetIds,
          nodeRoleArn: testNodeRoleArn,
          nodeGroupConfig: customConfig,
        });
        expect(() => assertStackSynthesis(stack)).not.toThrow();
        expect(stack.nodeGroup).toBeDefined();
      });

      it('Then it should handle different subnet arguments', (): void => {
        const differentSubnets = ['subnet-1', 'subnet-2', 'subnet-3'];
        const stack = createTestStack(app, config, {
          clusterName: testClusterName,
          clusterArn: testClusterArn,
          subnetIds: differentSubnets,
          nodeRoleArn: testNodeRoleArn,
        });
        expect(() => assertStackSynthesis(stack)).not.toThrow();
        expect(stack.nodeGroup).toBeDefined();
      });

      it('Then it should handle different node group counters', (): void => {
        const stack = createTestStack(app, config, {
          clusterName: testClusterName,
          clusterArn: testClusterArn,
          subnetIds: testSubnetIds,
          nodeRoleArn: testNodeRoleArn,
          nodeGroupCounter: 5,
        });
        expect(() => assertStackSynthesis(stack)).not.toThrow();
        expect(stack.nodeGroup).toBeDefined();
      });
    });
  });

  describe('Given different environment arguments', () => {
    describe('When creating node groups in different environments', () => {
      it.each([
        [Environment.DEVELOPMENT, 'development'],
        [Environment.PRODUCTION, 'production'],
      ])('Then it should create node group successfully for %s environment', environment => {
        const envConfig = createConfig({ environment });
        const stack = createTestStack(app, envConfig);
        expect(() => assertStackSynthesis(stack)).not.toThrow();
        expect(stack.nodeGroup).toBeDefined();
      });
    });
  });

  describe('Given an invalid arguments', () => {
    describe('When creating a node group', () => {
      it('Then it should handle missing clusterName gracefully', (): void => {
        expect(() => {
          createTestStack(app, config, {
            clusterName: '',
            clusterArn: testClusterArn,
            subnetIds: testSubnetIds,
            nodeRoleArn: testNodeRoleArn,
          });
        }).toThrow('EksNodeGroup: clusterName is required');
      });

      it('Then it should handle missing clusterArn gracefully', (): void => {
        expect(() => {
          createTestStack(app, config, {
            clusterName: testClusterName,
            clusterArn: '',
            subnetIds: testSubnetIds,
            nodeRoleArn: testNodeRoleArn,
          });
        }).toThrow('EksNodeGroup: clusterArn is required');
      });

      it('Then it should handle missing nodeRoleArn gracefully', (): void => {
        expect(() => {
          createTestStack(app, config, {
            clusterName: testClusterName,
            clusterArn: testClusterArn,
            subnetIds: testSubnetIds,
            nodeRoleArn: '',
          });
        }).toThrow('EksNodeGroup: nodeRoleArn is required');
      });

      it('Then it should handle empty subnetIds gracefully', (): void => {
        expect(() => {
          createTestStack(app, config, {
            clusterName: testClusterName,
            clusterArn: testClusterArn,
            subnetIds: [],
            nodeRoleArn: testNodeRoleArn,
          });
        }).toThrow('EksNodeGroup: subnetIds are required');
      });
    });
  });
});
