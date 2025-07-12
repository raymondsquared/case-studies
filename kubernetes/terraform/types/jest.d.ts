declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidTerraform(): R;
      toPlanSuccessfully(): R;
      toHaveResource(resourceType: any): R;
      toHaveResourceWithProperties(resourceType: any, properties: any): R;
    }
  }
}

export {}; 