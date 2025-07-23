import { Construct } from 'constructs';
import { IamRole as AwsIamRole, IamRoleInlinePolicy } from '@cdktf/provider-aws/lib/iam-role';

import {
  getCleanEnvironment,
  getCleanRegion,
  getCleanString,
  DEFAULT_IAM_ROLE_MANAGED_POLICY_ARNS,
} from '../../../utils/common';
import { Config } from '../../../utils/config';
import { TaggingUtility } from '../../../utils/tagging';
import { Tags } from '../../../utils/tagging/types';

interface IamRoleArgs {
  readonly config: Config;
  readonly assumeRolePolicy: string;
  readonly managedPolicyArns?: string[];
  readonly inlinePolicies?: IamRoleInlinePolicy[];
  readonly tags?: Tags;
}

export class IamRole extends Construct {
  public readonly role: AwsIamRole;

  constructor(scope: Construct, id: string, args: IamRoleArgs) {
    super(scope, id);

    const { config, assumeRolePolicy, managedPolicyArns, inlinePolicies, tags } = args;
    const taggingUtility = new TaggingUtility(config, { ...tags, layer: 'security' });

    const roleName: string = `${getCleanString(config.name)}-${getCleanEnvironment(
      config.environment
    )}-role-${getCleanRegion(config.region)}`;

    const baseManagedPolicyArns: string[] = DEFAULT_IAM_ROLE_MANAGED_POLICY_ARNS;
    const finalManagedPolicyArns = [...baseManagedPolicyArns, ...(managedPolicyArns ?? [])];

    this.role = new AwsIamRole(this, 'iam_role', {
      name: roleName,
      assumeRolePolicy,
      managedPolicyArns: finalManagedPolicyArns,
      inlinePolicy: inlinePolicies,
      tags: taggingUtility.getTags({ resourceType: 'role' }),
    });
  }

  public get arn(): string {
    return this.role.arn;
  }

  public get name(): string {
    return this.role.name;
  }
}
