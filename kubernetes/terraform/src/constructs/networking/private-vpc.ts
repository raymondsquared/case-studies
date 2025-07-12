import { Construct } from 'constructs';
import { TerraformOutput } from 'cdktf';
import { Vpc } from '../../../.gen/providers/aws/vpc';
import { Subnet } from '../../../.gen/providers/aws/subnet';
import { InternetGateway } from '../../../.gen/providers/aws/internet-gateway';
import { RouteTable } from '../../../.gen/providers/aws/route-table';
import { Route } from '../../../.gen/providers/aws/route';
import { SecurityGroup } from '../../../.gen/providers/aws/security-group';
import { SecurityGroupRule } from '../../../.gen/providers/aws/security-group-rule';
import { EnvironmentConfig } from '../../config/environment';

export interface PrivateVpcProps {
  readonly config: EnvironmentConfig;
  readonly vpcName: string;
  readonly cidrBlock?: string;
  readonly enableVpnGateway?: boolean;
  readonly tags?: Record<string, string>;
}

export class PrivateVpc extends Construct {
  public readonly vpc: Vpc;
  public readonly privateSubnets: Subnet[];
  public readonly securityGroups: SecurityGroup[];

  constructor(scope: Construct, id: string, props: PrivateVpcProps) {
    super(scope, id);

    const {
      config,
      vpcName,
      cidrBlock = '10.0.0.0/16',
      tags = {},
    } = props;

    // Create VPC
    this.vpc = new Vpc(this, 'vpc', {
      cidrBlock,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        ...config.tags,
        ...tags,
        Name: vpcName,
        Purpose: 'private-vpc',
        Component: 'networking',
      },
    });

    // Create private subnets (for application resources)
    this.privateSubnets = [];
    const privateSubnetCidrs = [
      '10.0.10.0/24',
      '10.0.11.0/24',
      '10.0.12.0/24',
    ];

    privateSubnetCidrs.forEach((cidr, index) => {
      const subnet = new Subnet(this, `private-subnet-${index + 1}`, {
        vpcId: this.vpc.id,
        cidrBlock: cidr,
        availabilityZone: `${config.region}${String.fromCharCode(97 + index)}`,
        mapPublicIpOnLaunch: false,
        tags: {
          ...config.tags,
          ...tags,
          Name: `${vpcName}-private-${index + 1}`,
          Purpose: 'private-subnet',
          Component: 'networking',
          Tier: 'private',
        },
      });
      this.privateSubnets.push(subnet);
    });

    // Create Internet Gateway
    const internetGateway = new InternetGateway(this, 'internet-gateway', {
      vpcId: this.vpc.id,
      tags: {
        ...config.tags,
        ...tags,
        Name: `${vpcName}-igw`,
        Purpose: 'internet-gateway',
        Component: 'networking',
      },
    });

    // Create public route table
    const publicRouteTable = new RouteTable(this, 'public-route-table', {
      vpcId: this.vpc.id,
      tags: {
        ...config.tags,
        ...tags,
        Name: `${vpcName}-public-rt`,
        Purpose: 'public-routes',
        Component: 'networking',
      },
    });

    // Add internet gateway route to public route table
    new Route(this, 'public-internet-gateway-route', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: internetGateway.id,
    });

    // Create security groups
    this.securityGroups = [];

    // Default security group
    const defaultSecurityGroup = new SecurityGroup(this, 'default-security-group', {
      name: `${vpcName}-default-sg`,
      description: 'Default security group for VPC',
      vpcId: this.vpc.id,
      tags: {
        ...config.tags,
        ...tags,
        Name: `${vpcName}-default-sg`,
        Purpose: 'default-security',
        Component: 'networking',
      },
    });

    // Allow all internal traffic
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

    // Web security group (for web servers)
    const webSecurityGroup = new SecurityGroup(this, 'web-security-group', {
      name: `${vpcName}-web-sg`,
      description: 'Security group for web servers',
      vpcId: this.vpc.id,
      tags: {
        ...config.tags,
        ...tags,
        Name: `${vpcName}-web-sg`,
        Purpose: 'web-security',
        Component: 'networking',
      },
    });

    // Allow HTTP and HTTPS from internet
    new SecurityGroupRule(this, 'web-http-allow', {
      securityGroupId: webSecurityGroup.id,
      type: 'ingress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      description: 'Allow HTTP from internet',
    });

    new SecurityGroupRule(this, 'web-https-allow', {
      securityGroupId: webSecurityGroup.id,
      type: 'ingress',
      fromPort: 443,
      toPort: 443,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      description: 'Allow HTTPS from internet',
    });

    this.securityGroups.push(webSecurityGroup);

    // Database security group
    const databaseSecurityGroup = new SecurityGroup(this, 'database-security-group', {
      name: `${vpcName}-db-sg`,
      description: 'Security group for database servers',
      vpcId: this.vpc.id,
      tags: {
        ...config.tags,
        ...tags,
        Name: `${vpcName}-db-sg`,
        Purpose: 'database-security',
        Component: 'networking',
      },
    });

    // Allow database access from web security group
    new SecurityGroupRule(this, 'db-web-allow', {
      securityGroupId: databaseSecurityGroup.id,
      type: 'ingress',
      fromPort: 5432, // PostgreSQL
      toPort: 5432,
      protocol: 'tcp',
      sourceSecurityGroupId: webSecurityGroup.id,
      description: 'Allow PostgreSQL access from web servers',
    });

    new SecurityGroupRule(this, 'db-mysql-allow', {
      securityGroupId: databaseSecurityGroup.id,
      type: 'ingress',
      fromPort: 3306, // MySQL
      toPort: 3306,
      protocol: 'tcp',
      sourceSecurityGroupId: webSecurityGroup.id,
      description: 'Allow MySQL access from web servers',
    });

    this.securityGroups.push(databaseSecurityGroup);

    // Create outputs
    new TerraformOutput(this, 'vpc_id', {
      value: this.vpc.id,
      description: 'ID of the VPC',
    });

    new TerraformOutput(this, 'vpc_cidr', {
      value: this.vpc.cidrBlock,
      description: 'CIDR block of the VPC',
    });

    new TerraformOutput(this, 'private_subnet_ids', {
      value: this.privateSubnets.map(subnet => subnet.id),
      description: 'IDs of the private subnets',
    });

    new TerraformOutput(this, 'security_group_ids', {
      value: this.securityGroups.map(sg => sg.id),
      description: 'IDs of the security groups',
    });
  }
} 