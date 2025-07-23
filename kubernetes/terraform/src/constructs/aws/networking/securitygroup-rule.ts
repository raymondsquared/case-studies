import { Construct } from 'constructs';
import {
  SecurityGroupRule as AwsSecurityGroupRule,
  SecurityGroupRuleConfig,
} from '@cdktf/provider-aws/lib/security-group-rule';

export class SecurityGroupRule extends Construct {
  public readonly securityGroupRule: AwsSecurityGroupRule;

  constructor(scope: Construct, id: string, args: SecurityGroupRuleConfig) {
    super(scope, id);

    this.securityGroupRule = new AwsSecurityGroupRule(this, 'sg-rule', args);
  }

  public get id(): string {
    return this.securityGroupRule.id;
  }

  public get securityGroupId(): string {
    return this.securityGroupRule.securityGroupId;
  }

  public get type(): string {
    return this.securityGroupRule.type;
  }
}
