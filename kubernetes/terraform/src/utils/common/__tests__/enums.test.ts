import {
  Vendor,
  Region,
  Environment,
  Confidentiality,
  Criticality,
  SecurityGroupRuleType,
  NodeNetwork,
  NodeCapacityType,
  NodeInstanceFamily,
  NodeInstanceSize,
} from '../enums';

describe('Enums', () => {
  describe('Vendor', () => {
    const testCases = [
      { value: Vendor.OTHERS, expected: 'OTHERS' },
      { value: Vendor.ON_PREMISES, expected: 'ON_PREMISES' },
      { value: Vendor.AWS, expected: 'AWS' },
      { value: Vendor.AZURE, expected: 'AZURE' },
      { value: Vendor.GCP, expected: 'GCP' },
    ];

    testCases.forEach(({ value, expected }) => {
      describe(`Given ${expected} vendor`, () => {
        describe('When accessing enum', () => {
          it(`Then it should return ${expected} string`, () => {
            expect(value).toBe(expected);
          });
        });
      });
    });
  });

  describe('Region', () => {
    const testCases = [
      { value: Region.OTHERS, expected: 'OTHERS' },
      { value: Region.AUSTRALIA_EAST, expected: 'AUSTRALIA_EAST' },
      { value: Region.US_EAST, expected: 'US_EAST' },
      { value: Region.ASIA_SOUTHEAST, expected: 'ASIA_SOUTHEAST' },
      { value: Region.EUROPE_WEST, expected: 'EUROPE_WEST' },
    ];

    testCases.forEach(({ value, expected }) => {
      describe(`Given ${expected} region`, () => {
        describe('When accessing enum', () => {
          it(`Then it should return ${expected} string`, () => {
            expect(value).toBe(expected);
          });
        });
      });
    });
  });

  describe('Environment', () => {
    const testCases = [
      { value: Environment.OTHERS, expected: 'others' },
      { value: Environment.DEVELOPMENT, expected: 'development' },
      { value: Environment.STAGING, expected: 'staging' },
      { value: Environment.PRODUCTION, expected: 'production' },
    ];

    testCases.forEach(({ value, expected }) => {
      describe(`Given ${expected} environment`, () => {
        describe('When accessing enum', () => {
          it(`Then it should return ${expected} string`, () => {
            expect(value).toBe(expected);
          });
        });
      });
    });
  });

  describe('Confidentiality', () => {
    const testCases = [
      { value: Confidentiality.PUBLIC, expected: 0 },
      { value: Confidentiality.INTERNAL, expected: 1 },
      { value: Confidentiality.CONFIDENTIAL, expected: 2 },
      { value: Confidentiality.RESTRICTED, expected: 3 },
      { value: Confidentiality.HIGHLY_RESTRICTED, expected: 4 },
      { value: Confidentiality.TOP_SECRET, expected: 5 },
    ];

    testCases.forEach(({ value, expected }) => {
      describe(`Given level ${expected}`, () => {
        describe('When accessing enum', () => {
          it(`Then it should return ${expected}`, () => {
            expect(value).toBe(expected);
          });
        });
      });
    });
  });

  describe('Criticality', () => {
    const testCases = [
      { value: Criticality.NONE, expected: 0 },
      { value: Criticality.LOW, expected: 1 },
      { value: Criticality.MEDIUM, expected: 2 },
      { value: Criticality.HIGH, expected: 3 },
      { value: Criticality.CRITICAL, expected: 4 },
      { value: Criticality.MISSION_CRITICAL, expected: 5 },
    ];

    testCases.forEach(({ value, expected }) => {
      describe(`Given level ${expected}`, () => {
        describe('When accessing enum', () => {
          it(`Then it should return ${expected}`, () => {
            expect(value).toBe(expected);
          });
        });
      });
    });
  });

  describe('SecurityGroupRuleType', () => {
    const testCases = [
      { value: SecurityGroupRuleType.INGRESS, expected: 'ingress' },
      { value: SecurityGroupRuleType.EGRESS, expected: 'egress' },
    ];

    testCases.forEach(({ value, expected }) => {
      describe(`Given ${expected} rule type`, () => {
        describe('When accessing enum', () => {
          it(`Then it should return ${expected} string`, () => {
            expect(value).toBe(expected);
          });
        });
      });
    });
  });

  describe('NodeNetwork', () => {
    const testCases = [
      { value: NodeNetwork.PRIVATE, expected: 'private' },
      { value: NodeNetwork.PUBLIC, expected: 'public' },
    ];

    testCases.forEach(({ value, expected }) => {
      describe(`Given ${expected} network`, () => {
        describe('When accessing enum', () => {
          it(`Then it should return ${expected} string`, () => {
            expect(value).toBe(expected);
          });
        });
      });
    });
  });

  describe('NodeCapacityType', () => {
    const testCases = [
      { value: NodeCapacityType.SPOT, expected: 'SPOT' },
      { value: NodeCapacityType.ON_DEMAND, expected: 'ON_DEMAND' },
    ];

    testCases.forEach(({ value, expected }) => {
      describe(`Given ${expected} capacity type`, () => {
        describe('When accessing enum', () => {
          it(`Then it should return ${expected} string`, () => {
            expect(value).toBe(expected);
          });
        });
      });
    });
  });

  describe('NodeInstanceFamily', () => {
    const testCases = [
      { value: NodeInstanceFamily.CPU, expected: 'cpu' },
      { value: NodeInstanceFamily.GPU, expected: 'gpu' },
    ];

    testCases.forEach(({ value, expected }) => {
      describe(`Given ${expected} instance family`, () => {
        describe('When accessing enum', () => {
          it(`Then it should return ${expected} string`, () => {
            expect(value).toBe(expected);
          });
        });
      });
    });
  });

  describe('NodeInstanceSize', () => {
    const testCases = [
      { value: NodeInstanceSize.SMALL, expected: 'small' },
      { value: NodeInstanceSize.MEDIUM, expected: 'medium' },
      { value: NodeInstanceSize.LARGE, expected: 'large' },
    ];

    testCases.forEach(({ value, expected }) => {
      describe(`Given ${expected} instance size`, () => {
        describe('When accessing enum', () => {
          it(`Then it should return ${expected} string`, () => {
            expect(value).toBe(expected);
          });
        });
      });
    });
  });
});
