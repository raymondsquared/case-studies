import { App, TerraformStack } from 'cdktf';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { EksNodeGroup } from '../compute/eks-nodegroup';
import { Environment, Region, Vendor } from '../../../utils/common/enums';
import { Config } from '../../../utils/config';
import { TaggingUtility } from '../../../utils/tagging';
import { assertStackSynthesis, parseSynthesizedStack } from '../../../utils/common';

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
    scalingArgs?: { desiredSize?: number; maxSize?: number; minSize?: number },
    instanceTypes?: string[],
    tags?: Record<string, string>
  ) {
    super(scope, id);
    const taggingUtility = new TaggingUtility({ ...config, layer: 'compute' });
    new AwsProvider(this, 'AWS', {
      region: 'ap-southeast-2',
      defaultTags: [{ tags: { ...taggingUtility.getTags() } }],
    });
    this.nodeGroup = new EksNodeGroup(this, 'test-eks-nodegroup', {
      config,
      clusterName,
      clusterArn,
      subnetIds,
      nodeRoleArn,
      scalingArgs,
      instanceTypes,
      tags,
    });
  }
}

const testSubnetIds: string[] = ['subnet-123', 'subnet-456'];
const testNodeRoleArn: string = 'arn:aws:iam::123456789012:role/test-node-role';
const testClusterName: string = 'test-eks-cluster';
const testClusterArn: string = 'arn:aws:eks:ap-southeast-2:123456789012:cluster/test-eks-cluster';
const testScalingArgs = { desiredSize: 2, maxSize: 3, minSize: 1 };
const testInstanceTypes = ['t3.medium'];

function createConfig(overrides: Partial<Config> = {}): Config {
  const baseConfig: Config = {
    name: 'test-eks',
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

describe('EksNodeGroup', () => {
  let app: App;
  let config: Config;

  beforeEach((): void => {
    app = new App();
    config = createConfig();
  });

  describe('Given valid config', () => {
    describe('When creating EKS Node Group', () => {
      it('Then it is created successfully', (): void => {
        const stack = new TestStack(
          app,
          'test-stack',
          config,
          testClusterName,
          testClusterArn,
          testSubnetIds,
          testNodeRoleArn,
          testScalingArgs,
          testInstanceTypes
        );
        expect(() => assertStackSynthesis(stack)).not.toThrow();
        expect(stack.nodeGroup.nodeGroup).toBeDefined();
        expect(stack.nodeGroup.arn).toBeDefined();
        expect(stack.nodeGroup.name).toBeDefined();
      });

      it('Then the correct tags are set when custom tags are provided', (): void => {
        const customTags = { owner: 'test-team', project: 'test-project' };
        const stack = new TestStack(
          app,
          'test-stack-tags',
          config,
          testClusterName,
          testClusterArn,
          testSubnetIds,
          testNodeRoleArn,
          testScalingArgs,
          testInstanceTypes,
          customTags
        );
        const synthesised = parseSynthesizedStack(stack);
        const nodeGroupResources = synthesised.resource?.aws_eks_node_group || {};
        const nodeGroup: TerraformSynthEksNodeGroup = Object.values(
          nodeGroupResources
        )[0] as TerraformSynthEksNodeGroup;
        const taggingUtility = new TaggingUtility({ ...config, layer: 'compute' });
        const expectedTags = taggingUtility.getTags({ ...customTags, resourceType: 'ng' });
        Object.entries(expectedTags).forEach(([key, value]) => {
          expect(nodeGroup.tags[key as keyof typeof nodeGroup.tags]).toBe(value);
        });
      });

      it('Then the scaling config is set correctly', (): void => {
        const stack = new TestStack(
          app,
          'test-stack-scaling',
          config,
          testClusterName,
          testClusterArn,
          testSubnetIds,
          testNodeRoleArn,
          testScalingArgs,
          testInstanceTypes
        );
        const synthesised = parseSynthesizedStack(stack);
        const nodeGroupResources = synthesised.resource?.aws_eks_node_group || {};
        const nodeGroup: TerraformSynthEksNodeGroup = Object.values(
          nodeGroupResources
        )[0] as TerraformSynthEksNodeGroup;
        expect(nodeGroup.scaling_config.desired_size).toBe(testScalingArgs.desiredSize);
        expect(nodeGroup.scaling_config.max_size).toBe(testScalingArgs.maxSize);
        expect(nodeGroup.scaling_config.min_size).toBe(testScalingArgs.minSize);
      });

      it('Then instance types are set correctly', (): void => {
        const stack = new TestStack(
          app,
          'test-stack-instance-types',
          config,
          testClusterName,
          testClusterArn,
          testSubnetIds,
          testNodeRoleArn,
          testScalingArgs,
          testInstanceTypes
        );
        const synthesised = parseSynthesizedStack(stack);
        const nodeGroupResources = synthesised.resource?.aws_eks_node_group || {};
        const nodeGroup: TerraformSynthEksNodeGroup = Object.values(
          nodeGroupResources
        )[0] as TerraformSynthEksNodeGroup;
        expect(nodeGroup.instance_types).toEqual(testInstanceTypes);
      });

      it('Then subnet IDs, node role ARN, and cluster name are set correctly', (): void => {
        const stack = new TestStack(
          app,
          'test-stack-ids',
          config,
          testClusterName,
          testClusterArn,
          testSubnetIds,
          testNodeRoleArn,
          testScalingArgs,
          testInstanceTypes
        );
        const synthesised = parseSynthesizedStack(stack);
        const nodeGroupResources = synthesised.resource?.aws_eks_node_group || {};
        const nodeGroup: TerraformSynthEksNodeGroup = Object.values(
          nodeGroupResources
        )[0] as TerraformSynthEksNodeGroup;
        expect(nodeGroup.subnet_ids).toEqual(testSubnetIds);
        expect(nodeGroup.node_role_arn).toBe(testNodeRoleArn);
        expect(nodeGroup.cluster_name).toBe(testClusterName);
      });

      it('Then it generates the correct node group name', (): void => {
        const stack = new TestStack(
          app,
          'test-stack-name-generation',
          config,
          testClusterName,
          testClusterArn,
          testSubnetIds,
          testNodeRoleArn,
          testScalingArgs,
          testInstanceTypes
        );
        const synthesised = parseSynthesizedStack(stack);
        const nodeGroupResources = synthesised.resource?.aws_eks_node_group || {};
        const nodeGroup: TerraformSynthEksNodeGroup = Object.values(
          nodeGroupResources
        )[0] as TerraformSynthEksNodeGroup;

        const expectedName = 'testeks-dev-ng-aue';
        expect(nodeGroup.node_group_name).toBe(expectedName);
      });

      it('Then it generates different names for different environments', (): void => {
        const prodConfig = createConfig({ environment: Environment.PRODUCTION });
        const stack = new TestStack(
          app,
          'test-stack-prod-name',
          prodConfig,
          testClusterName,
          testClusterArn,
          testSubnetIds,
          testNodeRoleArn,
          testScalingArgs,
          testInstanceTypes
        );
        const synthesised = parseSynthesizedStack(stack);
        const nodeGroupResources = synthesised.resource?.aws_eks_node_group || {};
        const nodeGroup: TerraformSynthEksNodeGroup = Object.values(
          nodeGroupResources
        )[0] as TerraformSynthEksNodeGroup;

        const expectedName = 'testeks-prod-ng-aue';
        expect(nodeGroup.node_group_name).toBe(expectedName);
      });
    });
  });

  describe('Given minimal config', () => {
    describe('When creating EKS Node Group', () => {
      it('Then it uses default values', (): void => {
        const stack = new TestStack(
          app,
          'test-stack-minimal',
          config,
          testClusterName,
          testClusterArn,
          testSubnetIds,
          testNodeRoleArn
        );
        const synthesised = parseSynthesizedStack(stack);
        const nodeGroupResources = synthesised.resource?.aws_eks_node_group || {};
        const nodeGroup: TerraformSynthEksNodeGroup = Object.values(
          nodeGroupResources
        )[0] as TerraformSynthEksNodeGroup;
        expect(nodeGroup.scaling_config.desired_size).toBe(1);
        expect(nodeGroup.scaling_config.max_size).toBe(1);
        expect(nodeGroup.scaling_config.min_size).toBe(1);
        expect(nodeGroup.instance_types).toBeUndefined();
      });
    });
  });

  describe('Given missing required fields', () => {
    describe('When creating EKS Node Group', () => {
      it('Then it throws if clusterName is missing', (): void => {
        expect(
          () =>
            new TestStack(
              app,
              'test-stack-missing-cluster',
              config,
              '',
              testClusterArn,
              testSubnetIds,
              testNodeRoleArn
            )
        ).toThrow('EksNodeGroup: clusterName is required');
      });
      it('Then it throws if subnetIds is missing', (): void => {
        expect(
          () =>
            new TestStack(
              app,
              'test-stack-missing-subnets',
              config,
              testClusterName,
              testClusterArn,
              [],
              testNodeRoleArn
            )
        ).toThrow('EksNodeGroup: subnetIds are required');
      });
      it('Then it throws if nodeRoleArn is missing', (): void => {
        expect(
          () =>
            new TestStack(
              app,
              'test-stack-missing-role',
              config,
              testClusterName,
              testClusterArn,
              testSubnetIds,
              ''
            )
        ).toThrow('EksNodeGroup: nodeRoleArn is required');
      });

      it('Then it throws if clusterArn is missing', (): void => {
        expect(
          () =>
            new TestStack(
              app,
              'test-stack-missing-cluster-arn',
              config,
              testClusterName,
              '',
              testSubnetIds,
              testNodeRoleArn
            )
        ).toThrow('EksNodeGroup: clusterArn is required');
      });
    });
  });
});
