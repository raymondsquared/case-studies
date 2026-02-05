provider "aws" {
  region = var.aws_region
}

locals {
  sanitised_name = var.sanitised_name != "" ? var.sanitised_name : replace(var.name, "/[^a-zA-Z0-9]/", "")
}

module "vpc" {
  source = "../../modules/aws_vpc"

  name                 = var.name
  sanitised_name       = local.sanitised_name
  environment_short    = var.environment_short
  region_short         = var.region_short
  vpc_cidr             = var.aws_vpc_cidr
  public_subnet_cidrs  = var.aws_vpc_public_subnet_cidrs
  private_subnet_cidrs = var.aws_vpc_private_subnet_cidrs
  data_subnet_cidrs    = var.aws_vpc_data_subnet_cidrs
  availability_zones   = var.aws_availability_zones
  enable_nat_gateway   = var.aws_enable_nat_gateway

  tags = merge(
    var.common_tags,
    {
      name    = var.name,
      project = var.project,
      version = var.tag_version,
      layer   = "network",
    }
  )
}
