import { App, RemoteBackend } from 'cdktf';
import { DevelopmentStack } from './src/stacks/development-stack';
import { ProductionStack } from './src/stacks/production-stack';
import { ConfigBuilder } from './src/utils/config/builder';
import { validateConfig } from './src/utils/config/validator';
import { Environment, Region, Vendor } from './src/utils/common/enums';
import { DEFAULT_SERVICE_NAME } from './src/utils/common/constants';
import {
  getRequiredEnvironmentVariableValue,
  getEnumFromRequiredEnvironmentVariable,
} from './src/utils/common';

// Main entry point for Terraform CDK application
function main() {
  try {
    const environment = process.env.ENVIRONMENT || Environment.DEVELOPMENT;
    const region = getEnumFromRequiredEnvironmentVariable(process.env.REGION, Region, 'REGION');
    const vendor = getEnumFromRequiredEnvironmentVariable(process.env.VENDOR, Vendor, 'VENDOR');
    const terraformOrganisation = getRequiredEnvironmentVariableValue('TERRAFORM_ORGANISATION');

    let StackClass;
    let configBuilder = new ConfigBuilder();

    const serviceName = DEFAULT_SERVICE_NAME;
    const serviceNameAndEnvironment = `${serviceName}-${environment}`;
    const serviceResourceType = 'stack';

    // Environment-specific configuration
    switch (environment) {
      case Environment.DEVELOPMENT:
        StackClass = DevelopmentStack;
        configBuilder = configBuilder.withEnvironment(Environment.DEVELOPMENT).withPublicVPC(true);
        break;
      case Environment.PRODUCTION:
        StackClass = ProductionStack;
        configBuilder = configBuilder.withEnvironment(Environment.PRODUCTION);
        break;
      default:
        throw new Error(`Unknown environment: ${environment}`);
    }

    // Vendor-specific configuration
    switch (vendor) {
      case Vendor.AWS: {
        const awsAccountId = getRequiredEnvironmentVariableValue('AWS_ACCOUNT_ID');
        configBuilder = configBuilder.withAWSAccountId(awsAccountId);
        break;
      }
      case Vendor.AZURE:
      case Vendor.GCP:
      case Vendor.OTHERS:
      default:
        break;
    }

    const app = new App();

    const config = configBuilder
      .withName(serviceName)
      .withResourceType(serviceResourceType)
      .withVendor(vendor)
      .withRegion(region)
      .withTerraformConfig(
        serviceNameAndEnvironment,
        terraformOrganisation,
        process.env.TERRAFORM_HOSTNAME
      )
      .build();
    validateConfig(config);

    const stack = new StackClass(app, serviceNameAndEnvironment, {
      config,
      description: `${config.environment} infrastructure for ${config.name} in ${config.environment} environment`,
    });

    // Configure remote backend for state management
    new RemoteBackend(stack, {
      hostname: config.terraformHostname,
      organization: config.terraformOrganisation,
      workspaces: {
        name: config.terraformWorkspace,
      },
    });

    app.synth();

    console.log(
      `Successfully synthesized Terraform configuration for ${config.environment} environment`
    );
  } catch (error) {
    console.error('Failed to synthesize Terraform configuration:', error);
    process.exit(1);
  }
}

main();
