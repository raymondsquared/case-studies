resource "aws_vpc" "vpc" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(
    var.tags,
    {
      Name = "${var.sanitised_name}-${var.environment_short}-${var.region_short}-vpc",
      name : "${var.name}-${var.environment_short}-${var.region_short}-vpc",
    }
  )
}

resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.vpc.id

  tags = merge(
    var.tags,
    {
      Name = "${var.sanitised_name}-${var.environment_short}-${var.region_short}-igw"
      name : "${var.name}-${var.environment_short}-${var.region_short}-igw",
    }
  )
}

resource "aws_eip" "nat_eip" {
  count  = var.enable_nat_gateway ? 1 : 0
  domain = "vpc"

  tags = merge(
    var.tags,
    {
      Name = "${var.sanitised_name}-${var.environment_short}-${var.region_short}-nateip"
      name = "${var.name}-${var.environment_short}-${var.region_short}-nateip"
    }
  )

  depends_on = [aws_internet_gateway.igw]
}

resource "aws_nat_gateway" "nat_gw" {
  count         = var.enable_nat_gateway ? 1 : 0
  allocation_id = aws_eip.nat_eip[0].id
  subnet_id     = aws_subnet.public_subnet[0].id

  tags = merge(
    var.tags,
    {
      Name = "${var.sanitised_name}-${var.environment_short}-${var.region_short}-natgw"
      name = "${var.name}-${var.environment_short}-${var.region_short}-natgw"
    }
  )

  depends_on = [aws_internet_gateway.igw]
}
