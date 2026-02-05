resource "aws_subnet" "private_subnet" {
  count             = length(var.private_subnet_cidrs)
  vpc_id            = aws_vpc.vpc.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]

  tags = merge(
    var.tags,
    {
      Name = "${var.sanitised_name}-${var.environment_short}-${var.region_short}-priv-subnet-${count.index + 1}"
      name = "${var.name}-${var.environment_short}-${var.region_short}-priv-subnet-${count.index + 1}"
    }
  )
}

resource "aws_route_table" "private_rt" {
  vpc_id = aws_vpc.vpc.id

  tags = merge(
    var.tags,
    {
      Name = "${var.sanitised_name}-${var.environment_short}-${var.region_short}-priv-rt"
      name = "${var.name}-${var.environment_short}-${var.region_short}-priv-rt"
    }
  )
}

resource "aws_route_table_association" "private_rta" {
  count          = length(var.private_subnet_cidrs)
  subnet_id      = aws_subnet.private_subnet[count.index].id
  route_table_id = aws_route_table.private_rt.id
}

resource "aws_route" "private_nat_gw" {
  count                  = var.enable_nat_gateway ? 1 : 0
  route_table_id         = aws_route_table.private_rt.id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.nat_gw[0].id
}
