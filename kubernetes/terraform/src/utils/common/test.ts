import { Testing } from 'cdktf';
import { TerraformStack } from 'cdktf';

// Disabled because test utilities need to handle dynamic Terraform resource structures
// that can have varying shapes and types, making 'any' necessary for flexibility
/* eslint-disable @typescript-eslint/no-explicit-any */

export const assertStackSynthesis = (stack: TerraformStack): void => {
  expect(() => Testing.fullSynth(stack)).not.toThrow();
};

export const getSynthesizedStack = (stack: TerraformStack): string => {
  return Testing.synth(stack);
};

export const parseSynthesizedStack = (stack: TerraformStack): Record<string, any> => {
  return JSON.parse(getSynthesizedStack(stack));
};

const getResourcesByType = (stack: TerraformStack, resourceType: string): Record<string, any>[] => {
  const synthesized = parseSynthesizedStack(stack);
  expect(synthesized.resource[resourceType]).toBeDefined();
  return Object.values(synthesized.resource[resourceType]) as Record<string, any>[];
};

export const getResourceFromStack = (
  stack: TerraformStack,
  resourceType: string
): Record<string, any> => {
  const resources = getResourcesByType(stack, resourceType);
  expect(resources.length).toBeGreaterThan(0);
  return resources[0];
};

export const getAllResourcesFromStack = (
  stack: TerraformStack,
  resourceType: string
): Record<string, any>[] => {
  return getResourcesByType(stack, resourceType);
};
