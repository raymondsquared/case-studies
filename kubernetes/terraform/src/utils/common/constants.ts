import { Region, Vendor } from './enums';

export const DEFAULT_SERVICE_NAME = 'case-studies-kubernetes';
export const DEFAULT_VENDOR = Vendor.AWS;
export const DEFAULT_REGION = Region.AUSTRALIA_EAST;

export const DEFAULT_SERVICE_VERSION = '0.0.1';
export const DEFAULT_SERVICE_LAYER = 'infrastructure';

export const DEFAULT_TERRAFORM_HOSTNAME = 'app.terraform.io';

export const DEFAULT_VPC_CIDR_BLOCK = '10.0.0.0/16';
export const DEFAULT_VPC_PRIVATE_SUBNET_CIDR_BLOCK = ['10.0.1.0/24', '10.0.2.0/24', '10.0.3.0/24'];
export const DEFAULT_VPC_PUBLIC_SUBNET_CIDR_BLOCK = [
  '10.0.101.0/24',
  '10.0.102.0/24',
  '10.0.103.0/24',
];

