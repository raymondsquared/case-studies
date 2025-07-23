# EKS Cluster Security Groups in CDKTF

This document explains how to set cluster security groups in CDKTF for EKS clusters.

## Overview

In CDKTF, you can set security groups for EKS clusters in several ways:

1. **Use existing VPC security groups** (current approach)
2. **Create dedicated EKS security groups** (enhanced approach)
3. **Custom security group configuration**

## Current Implementation

The current EKS construct accepts `securityGroupIds` as a parameter and passes them to the EKS cluster's `vpcConfig`:

```typescript
this.eksCluster = new EksCluster(this, 'eks-cluster', {
  name: eksClusterName,
  roleArn,
  vpcConfig: {
    subnetIds,
    securityGroupIds: [
      ...this.vpc.privateSubnets.map(s => s.id),
      ...this.vpc.publicSubnets.map(s => s.id),
    ],
    endpointPrivateAccess: true,
    endpointPublicAccess: hasEndpointPublicAccess,
  },
  // ... other config
});
```

## Approach 1: Use Existing VPC Security Groups

This is the current approach used in the base stack:

```typescript
const eks = new Eks(this, 'eks', {
  config: this.config,
  subnetIds: [
    ...this.vpc.privateSubnets.map(s => s.id),
    ...this.vpc.publicSubnets.map(s => s.id),
  ],
  roleArn: this.controlPlaneIamRole.arn,
  securityGroupIds: this.vpc.securityGroups.map(sg => sg.id), // Use VPC security groups
  tags: this.taggingUtility.getTags({ nameSuffix, resourceType: 'eks' }),
});
```

**Pros:**
- Simple and straightforward
- Reuses existing security groups
- Less resource overhead

**Cons:**
- Less granular control
- Security groups are shared with other resources
- May not follow EKS best practices

## Approach 2: Create Dedicated EKS Security Groups

The enhanced EKS construct can create dedicated security groups specifically for the cluster:

```typescript
const eks = new Eks(this, 'eks', {
  config: this.config,
  subnetIds: [
    ...this.vpc.privateSubnets.map(s => s.id),
    ...this.vpc.publicSubnets.map(s => s.id),
  ],
  roleArn: this.controlPlaneIamRole.arn,
  createDedicatedSecurityGroups: true, // Enable dedicated security groups
  vpcId: this.vpc.vpc.id, // Required for creating security groups
  tags: this.taggingUtility.getTags({ nameSuffix, resourceType: 'eks' }),
});
```

This creates two dedicated security groups:

1. **Cluster Security Group**: For the EKS control plane
2. **Node Group Security Group**: For EKS node groups

### Security Group Rules Created

#### Cluster Security Group
- **Egress**: Allows cluster to communicate with nodes (all protocols)

#### Node Group Security Group
- **Ingress**: Allows nodes to communicate with cluster (all protocols)
- **Ingress**: Allows nodes to communicate with each other (all protocols)
- **Egress**: Allows all outbound traffic from nodes

**Pros:**
- Follows EKS best practices
- Granular control over security
- Isolated security groups for EKS resources
- Better security posture

**Cons:**
- More complex configuration
- Additional resources created

## Approach 3: Custom Security Group Configuration

You can create custom security groups and pass them to the EKS construct:

```typescript
// Create custom security group for EKS cluster
const eksClusterSg = new SecurityGroup(this, 'eks-cluster-sg', {
  name: 'eks-cluster-security-group',
  description: 'Security group for EKS cluster',
  vpcId: this.vpc.vpc.id,
  tags: { Name: 'eks-cluster-sg' },
});

// Add custom rules
new SecurityGroupRule(this, 'eks-cluster-https', {
  securityGroupId: eksClusterSg.id,
  type: 'ingress',
  fromPort: 443,
  toPort: 443,
  protocol: 'tcp',
  cidrBlocks: ['10.0.0.0/8'], // Your VPC CIDR
  description: 'Allow HTTPS access to EKS cluster',
});

// Use custom security group
const eks = new Eks(this, 'eks', {
  config: this.config,
  subnetIds: [...],
  securityGroupIds: [eksClusterSg.id], // Use custom security group
  roleArn: this.controlPlaneIamRole.arn,
  tags: this.taggingUtility.getTags({ resourceType: 'eks' }),
});
```

## Security Group Best Practices for EKS

### 1. **Principle of Least Privilege**
- Only allow necessary traffic
- Use specific port ranges instead of all ports when possible
- Use security group references instead of CIDR blocks when possible

### 2. **EKS-Specific Rules**
- **Control Plane**: Usually needs HTTPS (443) access from nodes
- **Nodes**: Need to communicate with control plane and each other
- **Worker Nodes**: May need access to external services (internet, databases, etc.)

### 3. **Network Policies**
- Consider using Kubernetes Network Policies for pod-level security
- Security groups provide network-level security
- Network policies provide application-level security

### 4. **Monitoring and Logging**
- Enable VPC Flow Logs to monitor traffic
- Use CloudWatch Logs for EKS control plane logs
- Monitor security group changes

## Example: Production-Ready Security Groups

```typescript
// Production EKS with enhanced security
const eks = new Eks(this, 'eks', {
  config: this.config,
  subnetIds: this.vpc.privateSubnets.map(s => s.id), // Private subnets only
  roleArn: this.controlPlaneIamRole.arn,
  createDedicatedSecurityGroups: true,
  vpcId: this.vpc.vpc.id,
  tags: this.taggingUtility.getTags({ 
    nameSuffix: '-prod', 
    resourceType: 'eks',
    security: 'high'
  }),
});

// Additional security group for external access (if needed)
const externalAccessSg = new SecurityGroup(this, 'eks-external-access', {
  name: 'eks-external-access-sg',
  description: 'Security group for external access to EKS',
  vpcId: this.vpc.vpc.id,
  tags: { Name: 'eks-external-access-sg' },
});

// Allow specific external access (e.g., from corporate network)
new SecurityGroupRule(this, 'corporate-access', {
  securityGroupId: externalAccessSg.id,
  type: 'ingress',
  fromPort: 443,
  toPort: 443,
  protocol: 'tcp',
  cidrBlocks: ['192.168.1.0/24'], // Corporate network
  description: 'Allow corporate network access to EKS',
});
```

## Migration Guide

To migrate from existing VPC security groups to dedicated EKS security groups:

1. **Update the EKS construct call**:
   ```typescript
   // Before
   securityGroupIds: this.vpc.securityGroups.map(sg => sg.id),
   
   // After
   createDedicatedSecurityGroups: true,
   vpcId: this.vpc.vpc.id,
   ```

2. **Update node group security groups** (if applicable):
   ```typescript
   // Use the dedicated node group security group
   securityGroupIds: [eks.clusterSecurityGroups[1].id], // Node group SG
   ```

3. **Test the deployment**:
   ```bash
   cdktf deploy
   ```

4. **Monitor the cluster** to ensure all communication works correctly

## Troubleshooting

### Common Issues

1. **Node groups can't communicate with control plane**
   - Check security group rules between node and cluster security groups
   - Verify VPC routing

2. **Pods can't communicate with each other**
   - Check node group security group rules
   - Verify Kubernetes network policies

3. **External access issues**
   - Check security group egress rules
   - Verify NAT Gateway configuration

### Debugging Commands

```bash
# Check security group rules
aws ec2 describe-security-groups --group-ids sg-xxxxxxxxx

# Check EKS cluster status
aws eks describe-cluster --name your-cluster-name

# Check node group status
aws eks describe-nodegroup --cluster-name your-cluster-name --nodegroup-name your-nodegroup-name
```

## References

- [AWS EKS Security Groups Documentation](https://docs.aws.amazon.com/eks/latest/userguide/security-groups.html)
- [CDKTF AWS Provider Documentation](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/eks_cluster)
- [EKS Best Practices](https://aws.github.io/aws-eks-best-practices/) 