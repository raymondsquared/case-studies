import { Eip } from '@cdktf/provider-aws/lib/eip';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { Vpc as AwsVpc } from '@cdktf/provider-aws/lib/vpc';
import { DefaultRouteTable } from '@cdktf/provider-aws/lib/default-route-table';
import { TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';

import { DEFAULT_VPC_CIDR_BLOCK } from '../../../utils/common';
import { Config } from '../../../utils/config';
import { TaggingUtility, Tags } from '../../../utils/tagging';
import { getAwsRegion } from '../../../utils/vendor';

export interface VpcProps {
  readonly config: Config;
  readonly tags?: Tags;
}

export class Vpc extends Construct {
  public readonly vpc: AwsVpc;
  public readonly privateSubnets: Subnet[];
  public readonly publicSubnets: Subnet[];
  public natGateways: NatGateway[] = [];

  public internetGateway?: InternetGateway;
  public publicRouteTable?: RouteTable;
  public privateRouteTable?: RouteTable;
  public securityGroups: SecurityGroup[] = [];

  constructor(scope: Construct, id: string, props: VpcProps) {
    super(scope, id);

    const { config, tags } = props;

    const vpcCIDRBlock: string = config.vpcCIDRBlock ?? DEFAULT_VPC_CIDR_BLOCK;
    const publicSubnetCIDRBlocks: string[] | undefined = config.publicSubnetCIDRBlocks;
    const privateSubnetCIDRBlocks: string[] | undefined = config.privateSubnetCIDRBlocks;

    const awsRegion: string = getAwsRegion(config.vendor, config.region);

    const vpcNameSuffix: string = publicSubnetCIDRBlocks?.length ? '-pub' : '-priv';
    const vpcName: string = `${config.name}${vpcNameSuffix}`;
    const taggingUtility: TaggingUtility = new TaggingUtility(
      { ...config, name: vpcName },
      { ...tags, layer: 'network' }
    );

    this.vpc = new AwsVpc(this, 'vpc', {
      cidrBlock: vpcCIDRBlock,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: taggingUtility.getTags({ resourceType: 'vpc' }),
    });

    new DefaultRouteTable(this, 'default-route-table', {
      defaultRouteTableId: this.vpc.defaultRouteTableId,
      tags: taggingUtility.getTags({ resourceType: 'defaultrt' }),
    });

    this.privateSubnets = [] as Subnet[];
    this.publicSubnets = [] as Subnet[];
    this.natGateways = [] as NatGateway[];

    if (publicSubnetCIDRBlocks?.length) {
      this.createPublicSubnets(publicSubnetCIDRBlocks, awsRegion, taggingUtility);
    }

    if (privateSubnetCIDRBlocks?.length) {
      this.createPrivateSubnets(privateSubnetCIDRBlocks, awsRegion, taggingUtility, config);
    }

    this.createSecurityGroups(vpcCIDRBlock, taggingUtility);
    this.createOutputs();
  }

  private createPublicSubnets(
    publicSubnetCIDRBlocks: string[],
    awsRegion: string,
    taggingUtility: TaggingUtility
  ): void {
    publicSubnetCIDRBlocks.forEach((cidrBlock: string, index: number): void => {
      const availabilityZone: string = this.getAvailabilityZone(awsRegion, index);
      const subnet: Subnet = new Subnet(this, `public-subnet-${index + 1}`, {
        vpcId: this.vpc.id,
        cidrBlock: cidrBlock,
        availabilityZone,
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

    this.publicSubnets.forEach((subnet: Subnet, index: number): void => {
      new RouteTableAssociation(this, `public-subnet-${index + 1}-association`, {
        routeTableId: this.publicRouteTable!.id,
        subnetId: subnet.id,
      });
    });
  }

  private createPrivateSubnets(
    privateSubnetCIDRBlocks: string[],
    awsRegion: string,
    taggingUtility: TaggingUtility,
    config: Config
  ): void {
    privateSubnetCIDRBlocks.forEach((cidrBlock: string, index: number): void => {
      const availabilityZone: string = this.getAvailabilityZone(awsRegion, index);
      const subnet: Subnet = new Subnet(this, `private-subnet-${index + 1}`, {
        vpcId: this.vpc.id,
        cidrBlock: cidrBlock,
        availabilityZone,
        mapPublicIpOnLaunch: false,
        tags: taggingUtility.getTags({ nameSuffix: 'priv', resourceType: 'subnet' }),
      });
      this.privateSubnets.push(subnet);
    });

    this.privateRouteTable = new RouteTable(this, 'private-route-table', {
      vpcId: this.vpc.id,
      tags: taggingUtility.getTags({ nameSuffix: 'priv', resourceType: 'rt' }),
    });

    if (this.publicSubnets.length > 0 && config.enableNatGateway !== false) {
      this.createNatGateway(taggingUtility);
    }

    this.privateSubnets.forEach((subnet: Subnet, index: number): void => {
      new RouteTableAssociation(this, `private-subnet-${index + 1}-association`, {
        routeTableId: this.privateRouteTable!.id,
        subnetId: subnet.id,
      });
    });
  }

  private createNatGateway(taggingUtility: TaggingUtility): void {
    const natElasticIp: Eip = new Eip(this, 'nat-elastic-ip', {
      domain: 'vpc',
      tags: taggingUtility.getTags({ nameSuffix: 'nat', resourceType: 'eip' }),
    });

    const natGateway: NatGateway = new NatGateway(this, 'nat-gateway', {
      allocationId: natElasticIp.id,
      subnetId: this.publicSubnets[0].id,
      tags: taggingUtility.getTags({ resourceType: 'nat' }),
    });

    this.natGateways.push(natGateway);

    new Route(this, 'private-nat-gateway-route', {
      routeTableId: this.privateRouteTable!.id,
      destinationCidrBlock: '0.0.0.0/0',
      natGatewayId: natGateway.id,
    });
  }

  private createSecurityGroups(vpcCIDRBlock: string, taggingUtility: TaggingUtility): void {
    this.securityGroups = [] as SecurityGroup[];

    const defaultSecurityGroup: SecurityGroup = new SecurityGroup(this, 'default-security-group', {
      description: 'Default security group for VPC',
      vpcId: this.vpc.id,
      tags: taggingUtility.getTags({ resourceType: 'sg' }),
    });

    // Allow all internal traffic within VPC
    new SecurityGroupRule(this, 'default-internal-allow', {
      securityGroupId: defaultSecurityGroup.id,
      type: 'ingress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: [vpcCIDRBlock],
      description: 'Allow all internal traffic within VPC',
    });

    // Allow all outbound traffic
    new SecurityGroupRule(this, 'default-outbound-allow', {
      securityGroupId: defaultSecurityGroup.id,
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      description: 'Allow all outbound traffic',
    });

    this.securityGroups.push(defaultSecurityGroup);
  }

  private createOutputs(): void {
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
        value: this.privateSubnets.map((subnet: Subnet): string => subnet.id),
        description: 'IDs of the private subnets',
      });
    }

    if (this.publicSubnets.length > 0) {
      new TerraformOutput(this, 'public_subnet_ids', {
        value: this.publicSubnets.map((subnet: Subnet): string => subnet.id),
        description: 'IDs of the public subnets',
      });
    }

    new TerraformOutput(this, 'security_group_ids', {
      value: this.securityGroups.map((sg: SecurityGroup): string => sg.id),
      description: 'IDs of the security groups',
    });

    if (this.internetGateway) {
      new TerraformOutput(this, 'internet_gateway_id', {
        value: this.internetGateway.id,
        description: 'ID of the Internet Gateway',
      });
    }

    if (this.natGateways.length > 0) {
      new TerraformOutput(this, 'nat_gateway_ids', {
        value: this.natGateways.map((nat: NatGateway): string => nat.id),
        description: 'IDs of the NAT Gateways',
      });
    }
  }

  private getAvailabilityZone(awsRegion: string, index: number): string {
    const maxAzs: number = 3;
    const azIndex: number = index % maxAzs;
    const azSuffixes: string[] = ['a', 'b', 'c'];
    return `${awsRegion}${azSuffixes[azIndex]}`;
  }
}
