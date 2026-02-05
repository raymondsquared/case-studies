variable "name" {
  description = "Name to be used on all resources as prefix"
  type        = string
}

variable "sanitised_name" {
  description = "Sanitised name with special characters removed"
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

variable "vpc_cidr" {
  description = "The CIDR block for the VPC"
  type        = string
}

variable "public_subnet_cidrs" {
  description = "List of CIDR blocks for public subnets"
  type        = list(string)
  default     = []
}

variable "private_subnet_cidrs" {
  description = "List of CIDR blocks for private subnets"
  type        = list(string)
  default     = []
}

variable "data_subnet_cidrs" {
  description = "List of CIDR blocks for data subnets (no internet access)"
  type        = list(string)
  default     = []
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
}

variable "enable_nat_gateway" {
  description = "Should be true if you want to provision NAT Gateways for each of your private networks"
  type        = bool
}

variable "tags" {
  description = "A map of tags to add to all resources"
  type        = map(string)
  default     = {}
}
