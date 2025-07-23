import type { Config } from './types';

export function validateConfig(config: Config): void {
  if (!config.name || config.name.trim() === '') {
    throw new Error('Config validation error: name is required and cannot be empty.');
  }
  if (!config.resourceType || config.resourceType.trim() === '') {
    throw new Error('Config validation error: resourceType is required and cannot be empty.');
  }
  if (config.environment === undefined || config.environment === null) {
    throw new Error('Config validation error: environment is required.');
  }
  if (config.region === undefined || config.region === null) {
    throw new Error('Config validation error: region is required.');
  }
  if (config.vendor === undefined || config.vendor === null) {
    throw new Error('Config validation error: vendor is required.');
  }
  if (
    typeof config.terraformOrganisation !== 'string' ||
    config.terraformOrganisation.trim() === ''
  ) {
    throw new Error(
      'Config validation error: terraformOrganisation is required and cannot be empty.'
    );
  }
  if (typeof config.terraformWorkspace !== 'string' || config.terraformWorkspace.trim() === '') {
    throw new Error('Config validation error: terraformWorkspace is required and cannot be empty.');
  }
  if (typeof config.terraformHostname !== 'string' || config.terraformHostname.trim() === '') {
    throw new Error('Config validation error: terraformHostname is required and cannot be empty.');
  }
  if (typeof config.hasEncryption !== 'boolean') {
    throw new Error('Config validation error: hasEncryption is required and must be a boolean.');
  }
  if (typeof config.hasSecretsManager !== 'boolean') {
    throw new Error(
      'Config validation error: hasSecretsManager is required and must be a boolean.'
    );
  }
  if (config.tags !== undefined) {
    if (typeof config.tags !== 'object' || config.tags === null || Array.isArray(config.tags)) {
      throw new Error(
        'Config validation error: tags must be an object with string values if provided.'
      );
    }
  }
}
