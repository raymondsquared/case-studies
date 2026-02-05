resource "aws_subnet" "data_subnet" {
  count             = length(var.data_subnet_cidrs)
  vpc_id            = aws_vpc.vpc.id
  cidr_block        = var.data_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]

  tags = merge(
    var.tags,
    {
      Name = "${var.sanitised_name}-${var.environment_short}-${var.region_short}-data-subnet-${count.index + 1}"
      name = "${var.name}-${var.environment_short}-${var.region_short}-data-subnet-${count.index + 1}"
    }
  )
}

resource "aws_route_table" "data_rt" {
  vpc_id = aws_vpc.vpc.id

  tags = merge(
    var.tags,
    {
      Name = "${var.sanitised_name}-${var.environment_short}-${var.region_short}-data-rt"
      name = "${var.name}-${var.environment_short}-${var.region_short}-data-rt"
    }
  )
}

resource "aws_route_table_association" "data_rta" {
  count          = length(var.data_subnet_cidrs)
  subnet_id      = aws_subnet.data_subnet[count.index].id
  route_table_id = aws_route_table.data_rt.id
}
