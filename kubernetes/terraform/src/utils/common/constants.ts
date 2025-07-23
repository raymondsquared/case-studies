import { Region, Vendor, NodeCapacityType } from './enums';

export const DEFAULT_SERVICE_NAME = 'case-studies-kubernetes';
export const DEFAULT_VENDOR = Vendor.AWS;
export const DEFAULT_REGION = Region.AUSTRALIA_EAST;

export const DEFAULT_SERVICE_VERSION = '0.0.1';
export const DEFAULT_SERVICE_LAYER = 'infrastructure';

export const DEFAULT_TERRAFORM_HOSTNAME = 'app.terraform.io';

export const DEFAULT_AWS_REGION = 'ap-southeast-2';

export const DEFAULT_VPC_CIDR_BLOCK = '10.0.0.0/16';
export const DEFAULT_VPC_PRIVATE_SUBNET_CIDR_BLOCK = ['10.0.1.0/24', '10.0.2.0/24', '10.0.3.0/24'];
export const DEFAULT_VPC_PUBLIC_SUBNET_CIDR_BLOCK = [
  '10.0.101.0/24',
  '10.0.102.0/24',
  '10.0.103.0/24',
];

export const DEFAULT_IAM_ROLE_MANAGED_POLICY_ARNS = [
  'arn:aws:iam::aws:policy/AmazonEKSClusterPolicy',
];

export const DEFAULT_EKS_CONTROL_PLANE_ASSUME_ROLE_POLICY = {
  Version: '2012-10-17',
  Statement: [
    {
      Action: 'sts:AssumeRole',
      Effect: 'Allow',
      Principal: {
        Service: 'eks.amazonaws.com',
      },
    },
  ],
};

export const DEFAULT_EKS_NODEGROUP_ASSUME_ROLE_POLICY = {
  Version: '2012-10-17',
  Statement: [
    {
      Action: 'sts:AssumeRole',
      Effect: 'Allow',
      Principal: {
        Service: 'ec2.amazonaws.com',
      },
    },
  ],
};

export const DEFAULT_EKS_NODEGROUP_MANAGED_POLICY_ARNS = [
  'arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy',
  'arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy',
  'arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly',
];

export const DEFAULT_EKS_VERSION = '1.33';
export const DEFAULT_EKS_CONTROL_PLANE_LOG_TYPES = ['api', 'audit', 'authenticator'];

export const DEFAULT_EKS_CORE_ADD_ONS: Record<string, string> = {
  'vpc-cni': 'v1.19.6-eksbuild.7',
  'kube-proxy': 'v1.33.0-eksbuild.2',
  // coredns: 'v1.12.2-eksbuild.4',
};

export const DEFAULT_EKS_NODEGROUP_INSTANCE_TYPES = ['t3.small', 't3.micro'];
export const DEFAULT_EKS_NODEGROUP_CAPACITY_TYPE = NodeCapacityType.SPOT;
export const DEFAULT_EKS_NODEGROUP_IMAGE_ID = 'ami-0f128c26233296da0';
export const DEFAULT_EKS_NODEGROUP_SCALING_CONFIG = {
  desiredSize: 1,
  maxSize: 2,
  minSize: 1,
};
export const EKS_NODEGROUP_STANDARD_FIELDS = {
  network: 'node.kubernetes.io/network',
  capacityType: 'node.kubernetes.io/capacity-type',
  instanceFamily: 'node.kubernetes.io/instance-family',
  instanceSize: 'node.kubernetes.io/instance-size',
};

export const DEFAULT_SPOT_MAX_PRICE = '0.50';
