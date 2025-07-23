import { Construct } from 'constructs';
import { SecurityGroup as AwsSecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { Config } from '../../../utils/config';
import { TaggingUtility } from '../../../utils/tagging';
import { getCleanEnvironment, getCleanRegion, getCleanString } from '../../../utils/common';

export interface SecurityGroupArgs {
  readonly config: Config;
  readonly vpcId: string;
  readonly vpcCidrBlock: string;
  readonly description?: string;
  readonly tags?: Record<string, string>;
}

export class SecurityGroup extends Construct {
  public readonly securityGroup: AwsSecurityGroup;

  constructor(scope: Construct, id: string, args: SecurityGroupArgs) {
    super(scope, id);

    const taggingUtility = new TaggingUtility(args.config);

    const name: string = `${getCleanString(`${args.config.name}`)}-${getCleanEnvironment(
      args.config.environment
    )}-sg-${getCleanRegion(args.config.region)}`;

    const description = `Security group for ${name}`;

    this.securityGroup = new AwsSecurityGroup(this, 'security-group', {
      name,
      description: args.description || description,
      vpcId: args.vpcId,
      tags: {
        ...taggingUtility.getTags({ resourceType: 'sg' }),
        ...args.tags,
      },
    });
  }

  public get id(): string {
    return this.securityGroup.id;
  }

  public get name(): string {
    return this.securityGroup.name;
  }

  public get arn(): string {
    return this.securityGroup.arn;
  }

  public get description(): string {
    return this.securityGroup.description;
  }

  public get vpcId(): string {
    return this.securityGroup.vpcId;
  }
}
