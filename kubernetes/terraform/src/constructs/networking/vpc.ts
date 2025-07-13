import { Construct } from 'constructs';
import { TerraformOutput } from 'cdktf';

import { Vpc as AwsVpc } from '../../../.gen/providers/aws/vpc';
import { Subnet } from '../../../.gen/providers/aws/subnet';
import { InternetGateway } from '../../../.gen/providers/aws/internet-gateway';
import { RouteTable } from '../../../.gen/providers/aws/route-table';
import { Route } from '../../../.gen/providers/aws/route';
import { SecurityGroup } from '../../../.gen/providers/aws/security-group';
import { SecurityGroupRule } from '../../../.gen/providers/aws/security-group-rule';
import { RouteTableAssociation } from '../../../.gen/providers/aws/route-table-association';
import { DefaultRouteTable } from '../../../.gen/providers/aws/default-route-table';
import { Config } from '../../utils/config';
import { TaggingUtility } from '../../utils/tagging';
import { Tags } from '../../utils/tagging/types';
import { getAwsRegion } from '../../utils/vendor';

export interface VpcProps {
  readonly config: Config;
  readonly cidrBlock?: string;
  readonly enablePublicSubnets?: boolean;
  readonly enablePrivateSubnets?: boolean;
  readonly tags?: Tags;
}

const VPC_CIDR = '10.0.0.0/16';
const VPC_PRIVATE_SUBNET_CIDR = ['10.0.0.0/20', '10.0.16.0/20', '10.0.32.0/20'];
const VPC_PUBLIC_SUBNET_CIDR = ['10.0.128.0/20', '10.0.144.0/20', '10.0.160.0/20'];

export class Vpc extends Construct {
  public readonly vpc: AwsVpc;
  public readonly privateSubnets: Subnet[];
  public readonly publicSubnets: Subnet[];
  public readonly securityGroups: SecurityGroup[];
  public readonly internetGateway?: InternetGateway;
  public readonly publicRouteTable?: RouteTable;
  public readonly privateRouteTable?: RouteTable;

  constructor(scope: Construct, id: string, props: VpcProps) {
    super(scope, id);

    const {
      config,
      cidrBlock = VPC_CIDR,
      enablePublicSubnets = config.enablePublicVPC,
      enablePrivateSubnets = true,
    } = props;

    const awsRegion = getAwsRegion(config.vendor, config.region);

    const vpcNameSuffix = enablePublicSubnets ? '-pub' : '-priv';
    const vpcName = `${config.name}${vpcNameSuffix}`;
    const taggingUtility = new TaggingUtility({ ...config, name: vpcName, layer: 'network' });

    this.vpc = new AwsVpc(this, 'vpc', {
      cidrBlock,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: taggingUtility.getTags({ resourceType: 'vpc' }),
    });

    new DefaultRouteTable(this, 'default-route-table', {
      defaultRouteTableId: this.vpc.defaultRouteTableId,
      tags: taggingUtility.getTags({ resourceType: 'defroutetable' }),
    });

    this.privateSubnets = [];
    this.publicSubnets = [];

    // Create private subnets for internal resources
    if (enablePrivateSubnets) {
      const privateSubnetCidrs = VPC_PRIVATE_SUBNET_CIDR;

      privateSubnetCidrs.forEach((cidr, index) => {
        const subnet = new Subnet(this, `private-subnet-${index + 1}`, {
          vpcId: this.vpc.id,
          cidrBlock: cidr,
          availabilityZone: `${awsRegion}${String.fromCharCode(97 + index)}`,
          mapPublicIpOnLaunch: false,
          tags: taggingUtility.getTags({ nameSuffix: 'priv', resourceType: 'subnet' }),
        });
        this.privateSubnets.push(subnet);
      });

      this.privateRouteTable = new RouteTable(this, 'private-route-table', {
        vpcId: this.vpc.id,
        tags: taggingUtility.getTags({ nameSuffix: 'priv', resourceType: 'rt' }),
      });

      this.privateSubnets.forEach((subnet, index) => {
        new RouteTableAssociation(this, `private-subnet-${index + 1}-association`, {
          routeTableId: this.privateRouteTable!.id,
          subnetId: subnet.id,
        });
      });
    }

    // Create public subnets with internet access
    if (enablePublicSubnets) {
      const publicSubnetCidrs = VPC_PUBLIC_SUBNET_CIDR;

      publicSubnetCidrs.forEach((cidr, index) => {
        const subnet = new Subnet(this, `public-subnet-${index + 1}`, {
          vpcId: this.vpc.id,
          cidrBlock: cidr,
          availabilityZone: `${awsRegion}${String.fromCharCode(97 + index)}`,
          mapPublicIpOnLaunch: true,
          tags: taggingUtility.getTags({ nameSuffix: 'pub', resourceType: 'subnet' }),
        });
        this.publicSubnets.push(subnet);
      });

      this.internetGateway = new InternetGateway(this, 'internet-gateway', {
        vpcId: this.vpc.id,
        tags: taggingUtility.getTags({ nameSuffix: 'pub', resourceType: 'ig' }),
      });

      this.publicRouteTable = new RouteTable(this, 'public-route-table', {
        vpcId: this.vpc.id,
        tags: taggingUtility.getTags({ nameSuffix: 'public', resourceType: 'rt' }),
      });

      new Route(this, 'public-internet-gateway-route', {
        routeTableId: this.publicRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: this.internetGateway.id,
      });

      this.publicSubnets.forEach((subnet, index) => {
        new RouteTableAssociation(this, `public-subnet-${index + 1}-association`, {
          routeTableId: this.publicRouteTable!.id,
          subnetId: subnet.id,
        });
      });
    }

    this.securityGroups = [];

    const defaultSecurityGroup = new SecurityGroup(this, 'default-security-group', {
      description: 'Default security group for VPC',
      vpcId: this.vpc.id,
      tags: taggingUtility.getTags({ resourceType: 'sg' }),
    });

    new SecurityGroupRule(this, 'default-internal-allow', {
      securityGroupId: defaultSecurityGroup.id,
      type: 'ingress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: [cidrBlock],
      description: 'Allow all internal traffic',
    });

    this.securityGroups.push(defaultSecurityGroup);

    new TerraformOutput(this, 'vpc_id', {
      value: this.vpc.id,
      description: 'ID of the VPC',
    });

    new TerraformOutput(this, 'vpc_cidr', {
      value: this.vpc.cidrBlock,
      description: 'CIDR block of the VPC',
    });

    if (this.privateSubnets.length > 0) {
      new TerraformOutput(this, 'private_subnet_ids', {
        value: this.privateSubnets.map(subnet => subnet.id),
        description: 'IDs of the private subnets',
      });
    }

    if (this.publicSubnets.length > 0) {
      new TerraformOutput(this, 'public_subnet_ids', {
        value: this.publicSubnets.map(subnet => subnet.id),
        description: 'IDs of the public subnets',
      });
    }

    new TerraformOutput(this, 'security_group_ids', {
      value: this.securityGroups.map(sg => sg.id),
      description: 'IDs of the security groups',
    });

    if (this.internetGateway) {
      new TerraformOutput(this, 'internet_gateway_id', {
        value: this.internetGateway.id,
        description: 'ID of the Internet Gateway',
      });
    }
  }
}
