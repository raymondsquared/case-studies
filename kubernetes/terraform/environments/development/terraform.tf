terraform {
  required_version = ">= 1.12.2"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }

  cloud {
    hostname     = "app.terraform.io"
    organization = "pawlution"

    workspaces {
      name = "case-studies-kubernetes-development"
    }
  }
}
