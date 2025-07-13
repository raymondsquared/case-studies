import {
  getRequiredEnvironmentVariableValue,
  getEnumFromRequiredEnvironmentVariable,
} from '../environment';
import { Vendor, Region, Environment, Confidentiality, Criticality } from '../enums';

const originalEnv = process.env;
const testVarName = 'TEST_VAR';

describe('getRequiredEnvironmentVariableValue', () => {
  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Given an environment variable is set', () => {
    describe('When getting its value', () => {
      it('Then it should return the value', () => {
        process.env[testVarName] = 'test-value';
        expect(getRequiredEnvironmentVariableValue(testVarName)).toBe('test-value');
      });
    });
  });

  describe('Given an environment variable is not set', () => {
    describe('When getting its value', () => {
      it('Then it should throw an error', () => {
        delete process.env[testVarName];
        expect(() => getRequiredEnvironmentVariableValue(testVarName)).toThrow(
          `${testVarName} environment variable is required but not set.`
        );
      });
    });
  });

  describe('Given an environment variable is empty string', () => {
    describe('When getting its value', () => {
      it('Then it should throw an error', () => {
        process.env[testVarName] = '';
        expect(() => getRequiredEnvironmentVariableValue(testVarName)).toThrow(
          `${testVarName} environment variable is required but not set.`
        );
      });
    });
  });
});

describe('getEnumFromRequiredEnvironmentVariable', () => {
  describe('Given valid enum values', () => {
    const validTestCases = [
      { input: 'OTHERS', enumType: Vendor, name: 'VENDOR', expected: Vendor.OTHERS },
      { input: 'ON_PREMISES', enumType: Vendor, name: 'VENDOR', expected: Vendor.ON_PREMISES },
      { input: 'AWS', enumType: Vendor, name: 'VENDOR', expected: Vendor.AWS },
      { input: 'AZURE', enumType: Vendor, name: 'VENDOR', expected: Vendor.AZURE },
      { input: 'GCP', enumType: Vendor, name: 'VENDOR', expected: Vendor.GCP },
      { input: 'OTHERS', enumType: Region, name: 'REGION', expected: Region.OTHERS },
      {
        input: 'AUSTRALIA_EAST',
        enumType: Region,
        name: 'REGION',
        expected: Region.AUSTRALIA_EAST,
      },
      { input: 'US_EAST', enumType: Region, name: 'REGION', expected: Region.US_EAST },
      {
        input: 'ASIA_SOUTHEAST',
        enumType: Region,
        name: 'REGION',
        expected: Region.ASIA_SOUTHEAST,
      },
      { input: 'EUROPE_WEST', enumType: Region, name: 'REGION', expected: Region.EUROPE_WEST },
      {
        input: 'DEVELOPMENT',
        enumType: Environment,
        name: 'ENVIRONMENT',
        expected: Environment.DEVELOPMENT,
      },
      {
        input: 'OTHERS',
        enumType: Environment,
        name: 'OTHERS',
        expected: Environment.OTHERS,
      },
      {
        input: 'STAGING',
        enumType: Environment,
        name: 'ENVIRONMENT',
        expected: Environment.STAGING,
      },
      {
        input: 'PRODUCTION',
        enumType: Environment,
        name: 'ENVIRONMENT',
        expected: Environment.PRODUCTION,
      },
      {
        input: 'PUBLIC',
        enumType: Confidentiality,
        name: 'CONFIDENTIALITY',
        expected: Confidentiality.PUBLIC,
      },
      {
        input: 'INTERNAL',
        enumType: Confidentiality,
        name: 'CONFIDENTIALITY',
        expected: Confidentiality.INTERNAL,
      },
      {
        input: 'CONFIDENTIAL',
        enumType: Confidentiality,
        name: 'CONFIDENTIALITY',
        expected: Confidentiality.CONFIDENTIAL,
      },
      {
        input: 'RESTRICTED',
        enumType: Confidentiality,
        name: 'CONFIDENTIALITY',
        expected: Confidentiality.RESTRICTED,
      },
      {
        input: 'HIGHLY_RESTRICTED',
        enumType: Confidentiality,
        name: 'CONFIDENTIALITY',
        expected: Confidentiality.HIGHLY_RESTRICTED,
      },
      {
        input: 'TOP_SECRET',
        enumType: Confidentiality,
        name: 'CONFIDENTIALITY',
        expected: Confidentiality.TOP_SECRET,
      },
      { input: 'NONE', enumType: Criticality, name: 'CRITICALITY', expected: Criticality.NONE },
      { input: 'LOW', enumType: Criticality, name: 'CRITICALITY', expected: Criticality.LOW },
      { input: 'MEDIUM', enumType: Criticality, name: 'CRITICALITY', expected: Criticality.MEDIUM },
      { input: 'HIGH', enumType: Criticality, name: 'CRITICALITY', expected: Criticality.HIGH },
      {
        input: 'CRITICAL',
        enumType: Criticality,
        name: 'CRITICALITY',
        expected: Criticality.CRITICAL,
      },
      {
        input: 'MISSION_CRITICAL',
        enumType: Criticality,
        name: 'CRITICALITY',
        expected: Criticality.MISSION_CRITICAL,
      },
    ];

    validTestCases.forEach(({ input, enumType, name, expected }) => {
      describe(`When calling getEnumFromEnv with ${name} string "${input}"`, () => {
        it('Then it should return enum value', () => {
          expect(getEnumFromRequiredEnvironmentVariable(input, enumType, name)).toBe(expected);
        });
      });
    });
  });

  describe('Given undefined enum values', () => {
    const undefinedTestCases = [
      { enumType: Vendor, name: 'VENDOR' },
      { enumType: Region, name: 'REGION' },
      { enumType: Environment, name: 'ENVIRONMENT' },
    ];

    undefinedTestCases.forEach(({ enumType, name }) => {
      describe(`When calling getEnumFromEnv with undefined ${name.toLowerCase()}`, () => {
        it('Then it should throw error', () => {
          expect(() => getEnumFromRequiredEnvironmentVariable(undefined, enumType, name)).toThrow(
            /Invalid or missing/
          );
        });
      });
    });
  });

  describe('Given invalid enum values', () => {
    const invalidTestCases = [
      { input: 'INVALID_VENDOR', enumType: Vendor, name: 'VENDOR' },
      { input: 'INVALID_REGION', enumType: Region, name: 'REGION' },
      { input: 'INVALID_ENV', enumType: Environment, name: 'ENVIRONMENT' },
      { input: 'INVALID_LEVEL', enumType: Confidentiality, name: 'CONFIDENTIALITY' },
    ];

    invalidTestCases.forEach(({ input, enumType, name }) => {
      describe(`When calling getEnumFromEnv with invalid ${name.toLowerCase()} "${input}"`, () => {
        it('Then it should throw error', () => {
          expect(() => getEnumFromRequiredEnvironmentVariable(input, enumType, name)).toThrow(
            /Invalid or missing/
          );
        });
      });
    });
  });

  describe('Given invalid vendor', () => {
    describe('When error is thrown', () => {
      it('Then message should include all vendor options', () => {
        try {
          getEnumFromRequiredEnvironmentVariable('INVALID', Vendor, 'VENDOR');
          fail('Expected error to be thrown');
        } catch (error) {
          const errorMessage = (error as Error).message;
          expect(errorMessage).toContain('AWS');
          expect(errorMessage).toContain('AZURE');
          expect(errorMessage).toContain('GCP');
          expect(errorMessage).toContain('OTHERS');
          expect(errorMessage).toContain('ON_PREMISES');
        }
      });
    });
  });

  describe('Given invalid region', () => {
    describe('When error is thrown', () => {
      it('Then message should include all region options', () => {
        try {
          getEnumFromRequiredEnvironmentVariable('INVALID', Region, 'REGION');
          fail('Expected error to be thrown');
        } catch (error) {
          const errorMessage = (error as Error).message;
          expect(errorMessage).toContain('AUSTRALIA_EAST');
          expect(errorMessage).toContain('US_EAST');
          expect(errorMessage).toContain('EUROPE_WEST');
          expect(errorMessage).toContain('ASIA_SOUTHEAST');
          expect(errorMessage).toContain('OTHERS');
        }
      });
    });
  });
});
