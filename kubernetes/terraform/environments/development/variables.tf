
variable "name" {
  description = "Name of the service"
  type        = string
}

variable "sanitised_name" {
  description = "Sanitised name with special characters removed. If not provided, will be auto-generated from name"
  type        = string
  default     = ""
}

variable "project" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Deployment environment"
  type        = string
}

variable "environment_short" {
  description = "Deployment environment short name"
  type        = string
}

variable "region_short" {
  description = "Region short name"
  type        = string
}

variable "tag_version" {
  description = "Version of the tag"
  type        = string
}

variable "terraform_organisation" {
  description = "Terraform Cloud organization name"
  type        = string
}

variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
}

variable "aws_vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
}

variable "aws_vpc_private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = []
}

variable "aws_vpc_public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = []
}

variable "aws_vpc_data_subnet_cidrs" {
  description = "CIDR blocks for data subnets"
  type        = list(string)
  default     = []
}

variable "aws_availability_zones" {
  description = "List of availability zones"
  type        = list(string)
}

variable "aws_enable_nat_gateway" {
  description = "Enable NAT Gateway for private subnets"
  type        = bool
  default     = false
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default = {
    Name : "",
    project : "",
    version : ""
    layer : "infrastructure",
    vendor : "AWS",
    region : "AUSTRALIA_EAST",
    owner : "",
    costCenter : "",
    compliance : "",
    customer : "",
    runningSchedule : "",
    backupSchedule : "",

    # OTHERS = 0,
    # SANDBOX = 1,
    # DEVELOPMENT = 2,
    # STAGING = 3,
    # UAT = 4,
    # PRODUCTION = 5,
    environment : 0,

    # PUBLIC = 0,
    # INTERNAL = 1,
    # CONFIDENTIAL = 2,
    # RESTRICTED = 3,
    # HIGHLY_RESTRICTED = 4,
    # TOP_SECRET = 5,
    confidentiality : 1,

    # NONE = 0,
    # LOW = 1,
    # MEDIUM = 2,
    # HIGH = 3,
    # CRITICAL = 4,
    # MISSION_CRITICAL = 5,
    criticality : 3,
  }
}
