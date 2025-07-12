# Production-Grade Terraform CDK Infrastructure

This repository contains a production-ready Terraform CDK (CDKTF) infrastructure with enterprise-grade security, compliance, monitoring, and operational features.

## 🏗️ Architecture Overview

The infrastructure is designed with the following production principles:

- **Environment Separation**: Dev, Staging, and Production environments with isolated resources
- **Security First**: Encryption, IAM roles, security groups, and compliance controls
- **Infrastructure Management**: Multi-environment deployment with proper tagging
- **Cost Optimization**: Lifecycle policies, cost analysis, and resource tagging
- **Compliance**: SOC2, GDPR, and industry-standard security controls

## 🚀 Features

### Security & Compliance
- ✅ **KMS Encryption**: Server-side encryption with customer-managed keys
- ✅ **IAM Roles & Policies**: Least-privilege access with proper role separation
- ✅ **Secrets Management**: AWS Secrets Manager with automatic rotation
- ✅ **Private VPC**: Isolated networking
- ✅ **Security Groups**: Network-level access controls
- ✅ **Comprehensive Tagging**: Resource categorization and compliance tracking

### Cost Management
- ✅ **Resource Tagging**: Comprehensive tagging for cost allocation

## 📁 Project Structure

```
terraform/
├── src/
│   ├── config/
│   │   └── environment.ts          # Environment configuration management
│   ├── constructs/
│   │   ├── networking/
│   │   │   └── private-vpc.ts      # Private VPC with networking infrastructure
│   │   └── security/
│   │       └── secrets-manager.ts  # AWS Secrets Manager with KMS encryption
│   ├── stacks/
│   │   ├── base-stack.ts           # Base infrastructure stack
│   │   ├── development-stack.ts    # Development environment stack
│   │   ├── staging-stack.ts        # Staging environment stack
│   │   └── production-stack.ts     # Production environment stack
│   └── utils/
│       └── tagging.ts              # Comprehensive tagging utility
├── main.ts                         # CDK application entry point
├── Makefile                        # Production deployment commands
├── package.json                    # Dependencies and scripts
├── cdktf.json                      # CDKTF configuration
└── README.md                       # This file
```

## 🛠️ Prerequisites

- **Node.js** >= 20.9
- **AWS CLI** configured with appropriate credentials
- **Terraform Cloud** account and organization
- **AWS Account** with appropriate permissions

## 🚀 Quick Start

### 1. Setup the Project

```bash
# Clone the repository
git clone <repository-url>
cd kubernetes/terraform

# Install dependencies
make setup
```

### 2. Configure Environment Variables

```bash
# Required environment variables
export ENVIRONMENT=dev                    # dev, staging, or prod
export TERRAFORM_ORGANISATION=your-org    # Your Terraform Cloud organization
export TERRAFORM_WORKSPACE=your-workspace # Terraform Cloud workspace name
export AWS_PROFILE=default                # AWS profile to use
```

### 3. Deploy Infrastructure

```bash
# Deploy to development environment
make dev

# Deploy to staging environment
make staging

# Deploy to production environment (requires confirmation)
make prod
```

## 📋 Available Commands

### Environment Management
```bash
make dev          # Deploy to development
make staging      # Deploy to staging
make prod         # Deploy to production
```

### Planning & Validation
```bash
make plan-dev     # Plan for development
make plan-staging # Plan for staging
make plan-prod    # Plan for production
make validate-all # Validate all environments
```

### Security & Compliance
```bash
make security-scan   # Run security scanning
make cost-analysis   # Run cost analysis
make security-check  # Run all security checks
```

### Operations
```bash
make deploy      # Deploy current environment
make destroy     # Destroy infrastructure (with confirmation)
make clean       # Clean build artifacts
make test        # Run tests
```

### Help
```bash
make help        # Show all available commands
```

## 🔧 Configuration

### Environment Configuration

The infrastructure supports three environments with different configurations:

| Feature | Dev | Staging | Production |
|---------|-----|---------|------------|
| **Log Retention** | 30 days | 60 days | 365 days |
| **Public Access** | Disabled | Disabled | Disabled |
| **Force Destroy** | Enabled | Disabled | Disabled |
| **Data Classification** | Internal | Internal | Confidential |
| **Compliance** | Basic | Basic | SOC2 |

### Customizing Configuration

Edit `src/config/environment.ts` to modify environment-specific settings:

```typescript
// Example: Customize production settings
case 'prod':
  return new EnvironmentConfigBuilder()
    .withEnvironment('prod')
    .withRegion('ap-southeast-2')
    .withProject('case-studies')
    .withOwner('your-name')
    .withCostCenter('engineering')
    .withLogging(true)      // Logging enabled
    .withEncryption(true)        // Enable encryption
    .withMonitoring(true)        // Enable monitoring
    .build();
```

## 🔒 Security Features

### Encryption
- **Server-Side Encryption**: All secrets encrypted at rest using AWS KMS
- **In-Transit Encryption**: TLS 1.2+ for all data transfers
- **Key Rotation**: Automatic KMS key rotation enabled

### Secrets Management
- **AWS Secrets Manager**: Centralized secrets storage with automatic rotation
- **KMS Integration**: All secrets encrypted with customer-managed keys
- **IAM Roles**: Least-privilege access for secret retrieval
- **Rotation Policies**: Automated secret rotation for enhanced security

### Network Security
- **Private VPC**: Isolated network environment with controlled access
- **Security Groups**: Network-level access controls and traffic filtering
- **Public/Private Subnets**: Proper network segmentation

### Access Controls
- **IAM Roles**: Least-privilege access with specific permissions
- **Public Access Block**: All public access blocked by default
- **Cross-Account Access**: Configurable for multi-account setups

### Compliance
- **Data Classification**: Environment-specific data handling
- **AWS Foundational Security**: Best practices enforcement
- **Resource Tagging**: Comprehensive tagging for compliance tracking

## 📊 Infrastructure Components

### Networking
- **Private VPC**: Isolated network environment with controlled access
- **Security Groups**: Network-level access controls and traffic filtering
- **Public/Private Subnets**: Proper network segmentation

### Secrets Management
- **AWS Secrets Manager**: Centralized secrets storage with automatic rotation
- **KMS Integration**: All secrets encrypted with customer-managed keys
- **IAM Roles**: Least-privilege access for secret retrieval
- **Rotation Policies**: Automated secret rotation for enhanced security 