# Testing Suite Documentation

This directory contains comprehensive tests for the production-grade Terraform CDK infrastructure. The testing strategy follows a three-tier approach focusing on the most critical aspects of production infrastructure.

## 🎯 Testing Strategy

### 1. Security-Focused Tests (`security-tests.ts`)
**Priority: HIGHEST** - Security is the foundation of production infrastructure.

**What it tests:**
- ✅ Encryption policies on all storage resources
- ✅ IAM roles with least-privilege permissions
- ✅ Public access blocking by default
- ✅ Security group rules and network security
- ✅ Compliance controls (CloudTrail, GuardDuty)
- ✅ Environment-specific security measures

**Why it's critical:**
- Prevents security breaches and compliance violations
- Ensures proper access controls are in place
- Validates encryption and security monitoring

### 2. Construct Unit Tests (`construct-unit-tests.ts`)
**Priority: HIGH** - Ensures each component works correctly before integration.

**What it tests:**
- ✅ Individual construct resource creation
- ✅ Proper property configuration
- ✅ Error handling and validation
- ✅ Tagging and naming conventions
- ✅ Environment-specific configurations
- ✅ Resource dependencies and relationships

**Why it's important:**
- Catches issues early in the development cycle
- Ensures reliability of individual components
- Prevents cascading failures in the full stack

### 3. Infrastructure Validation Tests (`infrastructure-validation-tests.ts`)
**Priority: HIGH** - Ensures the generated Terraform code is deployable and follows best practices.

**What it tests:**
- ✅ Terraform code validity and syntax
- ✅ Successful planning capability
- ✅ Resource limits and quotas
- ✅ Backup and retention policies
- ✅ Disaster recovery configurations
- ✅ Performance and scalability considerations
- ✅ Security best practices enforcement

**Why it's important:**
- Ensures infrastructure can actually be deployed
- Validates compliance with AWS best practices
- Prevents deployment failures in production

## 🚀 Running Tests

### Quick Start
```bash
# Run all tests
make test

# Run specific test suites
make test-security      # Security-focused tests only
make test-constructs    # Construct unit tests only
make test-validation    # Infrastructure validation tests only

# Run with npm directly
npm run test:all
npm run test:security
npm run test:constructs
npm run test:validation
```

### Pre-commit Checks
```bash
# Run all pre-commit checks including tests
make pre-commit
```

### Test Coverage
```bash
# Generate test coverage report
npm run test:coverage
```

## 📋 Test Categories

### Security Tests
- **S3 Bucket Security**: Encryption, public access blocking, versioning
- **VPC Security**: Private subnets, security groups, Gateway
- **Secrets Manager**: KMS encryption, rotation policies
- **Compliance Monitoring**: CloudTrail, GuardDuty
- **IAM Security**: Role permissions, trust relationships
- **Environment Security**: Production vs development security measures

### Construct Unit Tests
- **SecureS3Bucket**: Bucket creation, encryption, lifecycle policies
- **PrivateVpc**: VPC creation, subnet distribution, routing
- **SecretsManager**: Secret creation, KMS integration
- **CloudWatchAlarms**: Alarm configuration, SNS integration
- **Security Services**: CloudTrail, GuardDuty, Security Hub
- **Error Handling**: Invalid configurations, validation errors

### Infrastructure Validation Tests
- **Terraform Validation**: Code syntax, planning capability
- **Resource Limits**: AWS service quotas, CIDR allocations
- **Backup & Retention**: Log retention, S3 versioning, lifecycle policies
- **Disaster Recovery**: Multi-region CloudTrail, KMS rotation
- **Performance**: Subnet distribution, resource tagging
- **Compliance**: Naming conventions, cost allocation tags

## 🔧 Test Configuration

### Environment Setup
Tests use a mock configuration that simulates production settings:
```typescript
const config = {
  environment: 'test',
  region: 'us-east-1',
  project: 'test-project',
  owner: 'test-owner',
  costCenter: 'test-cost-center',
  // ... other configuration
};
```

### Test Dependencies
- **Jest**: Testing framework
- **CDKTF Testing**: Infrastructure testing utilities
- **TypeScript**: Type checking and compilation

## 📊 Test Metrics

### Coverage Goals
- **Security Tests**: 100% coverage of security controls
- **Construct Tests**: 90%+ coverage of all constructs
- **Validation Tests**: 100% coverage of critical infrastructure patterns

### Performance Targets
- **Test Execution**: < 30 seconds for all tests
- **Memory Usage**: < 500MB during test execution
- **Reliability**: 99%+ test pass rate

## 🐛 Troubleshooting

### Common Issues

1. **Import Errors**
   ```bash
   # Regenerate CDKTF types
   cdktf get
   ```

2. **Test Failures**
   ```bash
   # Clear Jest cache
   npm run test -- --clearCache
   ```

3. **Type Errors**
   ```bash
   # Check TypeScript compilation
   npm run type-check
   ```

### Debug Mode
```bash
# Run tests with verbose output
npm run test -- --verbose

# Run specific test with debugging
npm run test -- --testNamePattern="should enforce encryption"
```

## 📈 Continuous Integration

### CI/CD Pipeline Integration
Tests are automatically run in the CI/CD pipeline:
1. **Security Tests**: Run on every commit
2. **Construct Tests**: Run on pull requests
3. **Validation Tests**: Run before deployment

### Quality Gates
- All security tests must pass
- 90%+ test coverage required
- No critical security findings
- Infrastructure validation must succeed

## 🔄 Test Maintenance

### Adding New Tests
1. Identify the test category (security, construct, validation)
2. Add test to appropriate file
3. Update documentation
4. Ensure test follows naming conventions

### Updating Tests
1. Update test when infrastructure changes
2. Maintain backward compatibility
3. Update documentation
4. Verify test coverage

### Test Naming Conventions
- **Security Tests**: `should enforce [security control]`
- **Construct Tests**: `should create [resource] with [properties]`
- **Validation Tests**: `should [validation requirement]`

## 📚 Additional Resources

- [CDKTF Testing Documentation](https://cdk.tf/testing)
- [Jest Testing Framework](https://jestjs.io/)
- [AWS Security Best Practices](https://aws.amazon.com/security/)
- [Terraform Testing Best Practices](https://www.terraform.io/docs/testing/)

---

**Note**: These tests are designed to ensure production readiness and should be run before any infrastructure deployment to production environments. 