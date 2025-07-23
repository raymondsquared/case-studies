# Spot Instance Budget Configuration

This document explains how to configure budget controls for spot instances in EKS node groups.

## Overview

Spot instances provide significant cost savings (up to 90% off on-demand prices) but can be terminated when AWS needs the capacity back. To control costs and set maximum prices for spot instances, you can configure the `maxPrice` parameter.

## Configuration Options

### 1. Global Default Configuration

Set a default maximum price for all spot instances in your stack:

```typescript
const config = configBuilder
  .withNodesConfig({
    hasPrivateNodes: true,
    hasPublicNodes: false,
    spotMaxPrice: "0.50" // $0.50 per hour maximum
  })
  .build();
```

### 2. Per Node Group Configuration

Override the default for specific node groups:

```typescript
// In your stack class
protected createCustomNodeGroup(): EksNodeGroup {
  return this.createNodeGroup(
    'high-performance-spot',
    this.config,
    {
      instanceTypes: ['c5.2xlarge', 'c5a.2xlarge'],
      capacityType: NodeCapacityType.SPOT,
      maxPrice: "1.20", // $1.20 per hour maximum for this specific node group
      scalingArgs: {
        desiredSize: 2,
        maxSize: 5,
        minSize: 1
      }
    }
  );
}
```

## Price Format

The `maxPrice` parameter accepts a string representing the maximum price per hour:

- `"0.50"` = $0.50 per hour
- `"1.25"` = $1.25 per hour
- `"2.00"` = $2.00 per hour

## How It Works

1. **Price Control**: When you set a `maxPrice`, AWS will only launch spot instances if the current spot price is at or below your specified maximum.

2. **Instance Termination**: If the spot price exceeds your maximum price, AWS will terminate your instances after a 2-minute warning.

3. **Fallback Behavior**: If no spot instances are available at or below your price, the node group will not scale up until prices drop.

## Best Practices

### 1. Monitor Spot Prices
- Use AWS Spot Instance Advisor to check historical prices
- Set realistic maximum prices based on your budget
- Consider using multiple instance types for better availability

### 2. Instance Type Selection
```typescript
// Use multiple instance types for better spot availability
const instanceTypes = [
  't3.medium',    // General purpose
  't3a.medium',   // AMD alternative
  'm5.large',     // General purpose larger
  'm5a.large'     // AMD alternative larger
];
```

### 3. Scaling Configuration
```typescript
const scalingArgs = {
  desiredSize: 2,
  maxSize: 5,     // Allow scaling up when prices are good
  minSize: 1      // Keep at least one node running
};
```

### 4. Cost Monitoring
- Set up AWS Cost Explorer alerts
- Monitor spot instance interruptions
- Use AWS CloudWatch for spot price monitoring

## Example Configuration

```typescript
// Development environment with strict budget
const devConfig = configBuilder
  .withNodesConfig({
    hasPrivateNodes: true,
    hasPublicNodes: false,
    spotMaxPrice: "0.30" // Conservative budget for dev
  })
  .build();

// Production environment with higher budget
const prodConfig = configBuilder
  .withNodesConfig({
    hasPrivateNodes: true,
    hasPublicNodes: true,
    spotMaxPrice: "1.00" // Higher budget for production
  })
  .build();
```

## Troubleshooting

### No Spot Instances Available
If your node group isn't scaling up:
1. Check current spot prices in your region
2. Increase the `maxPrice` if needed
3. Add more instance types to the `instanceTypes` array
4. Consider using on-demand instances for critical workloads

### Frequent Terminations
If instances are being terminated frequently:
1. Check spot price trends
2. Consider using Spot Fleet for better availability
3. Implement proper application-level fault tolerance
4. Use multiple availability zones

## Related Documentation

- [AWS Spot Instances](https://aws.amazon.com/ec2/spot/)
- [EKS Node Groups](https://docs.aws.amazon.com/eks/latest/userguide/managed-node-groups.html)
- [Spot Instance Advisor](https://aws.amazon.com/ec2/spot/instance-advisor/) 