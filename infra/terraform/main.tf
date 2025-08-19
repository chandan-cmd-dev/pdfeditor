// Example Terraform configuration to provision a minimal infrastructure for
// running the PDF editor on AWS.  This example is not complete and should
// be adapted to your organisation's standards.  It provisions an S3 bucket
// for storing PDFs and an RDS PostgreSQL instance.  For Kubernetes you can
// use EKS or another managed service – see `eks.tf` for a template.

terraform {
  required_version = ">= 1.2.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "project_name" {
  type    = string
  default = "pdf-editor"
}

resource "aws_s3_bucket" "pdf_storage" {
  bucket = "${var.project_name}-bucket-${random_id.suffix.hex}"
  acl    = "private"
  versioning {
    enabled = true
  }
  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        sse_algorithm = "AES256"
      }
    }
  }
}

resource "random_id" "suffix" {
  byte_length = 4
}

resource "aws_db_instance" "postgres" {
  allocated_storage    = 20
  storage_type         = "gp2"
  engine               = "postgres"
  engine_version       = "15.3"
  instance_class       = "db.t3.micro"
  name                 = "pdfeditor"
  username             = var.db_username
  password             = var.db_password
  parameter_group_name = "default.postgres15"
  skip_final_snapshot  = true
}

variable "db_username" {
  type    = string
  default = "postgres"
}

variable "db_password" {
  type    = string
  default = "postgres"
}

output "s3_bucket_name" {
  value = aws_s3_bucket.pdf_storage.bucket
}

output "db_endpoint" {
  value = aws_db_instance.postgres.address
}
