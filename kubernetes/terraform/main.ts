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

    const app = new App();

    let configBuilder: ConfigBuilder;
    let StackClass;

    const serviceName = DEFAULT_SERVICE_NAME;
    const serviceNameAndEnvironment = `${serviceName}-${environment}`;
    const serviceResourceType = 'stack';

    switch (environment) {
      case Environment.DEVELOPMENT:
        StackClass = DevelopmentStack;
        configBuilder = new ConfigBuilder()
          .withEnvironment(Environment.DEVELOPMENT)
          .withPublicVPC(true);
        break;
      case Environment.PRODUCTION:
        StackClass = ProductionStack;
        configBuilder = new ConfigBuilder().withEnvironment(Environment.PRODUCTION);
        break;
      default:
        throw new Error(`Unknown environment: ${environment}`);
    }

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
