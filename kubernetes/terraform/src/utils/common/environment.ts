export function getRequiredEnvironmentVariableValue(envVarName: string): string {
  const value = process.env[envVarName];
  if (!value) {
    throw new Error(`${envVarName} environment variable is required but not set.`);
  }
  return value;
}

// Utility function to retrieve a value from an enum using an environment variable.
// Throws an error if the environment variable is missing or invalid.
export function getEnumFromRequiredEnvironmentVariable<T extends Record<string, unknown>>(
  envVar: string | undefined,
  enumType: T,
  name: string
): T[keyof T] {
  if (!envVar || !(envVar in enumType)) {
    throw new Error(
      `Invalid or missing ${name} environment variable. Must be one of: ${Object.keys(enumType).join(', ')}`
    );
  }
  return enumType[envVar] as T[keyof T];
}
