#!/usr/bin/env node
import { App, RemoteBackend } from 'cdktf';
import { ProductionStack } from './src/stacks/production-stack';
import { getEnvironmentConfig } from './src/config/environment';

/**
 * Production-grade Terraform CDK application
 * 
 * This application creates a secure, compliant, and monitored infrastructure
 * with proper environment separation, security controls, and operational features.
 */

function main() {
  try {
    // Initialize the CDK app
    const app = new App();

    // Get environment configuration
    const config = getEnvironmentConfig();

    // Create the production stack
    const stack = new ProductionStack(app, `case-studies-kubernetes-${config.environment}`, {
      config,
      description: `Production infrastructure for ${config.project} in ${config.environment} environment`,
    });

    // Configure remote backend for state management
    new RemoteBackend(stack, {
      hostname: config.terraformHostname,
      organization: config.terraformOrganization,
      workspaces: {
        name: config.terraformWorkspace,
      },
    });

    // Synthesize the CDK app
    app.synth();

    console.log(`✅ Successfully synthesized Terraform configuration for ${config.environment} environment`);
    console.log(`📦 Stack: case-studies-kubernetes-${config.environment}`);
    console.log(`🌍 Region: ${config.region}`);
    console.log(`🏢 Organization: ${config.terraformOrganization}`);
    console.log(`💼 Workspace: ${config.terraformWorkspace}`);
    console.log(`🔐 Security features enabled: ${config.enableEncryption ? 'Yes' : 'No'}`);
    console.log(`📊 Monitoring enabled: ${config.enableMonitoring ? 'Yes' : 'No'}`);
    console.log(`📝 Logging enabled: ${config.enableLogging ? 'Yes' : 'No'}`);

  } catch (error) {
    console.error('❌ Failed to synthesize Terraform configuration:', error);
    process.exit(1);
  }
}

// Run the application
main();
