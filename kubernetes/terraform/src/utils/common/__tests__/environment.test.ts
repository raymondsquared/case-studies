import { getRequiredEnvironmentVariableValue, getEnumFromRequiredEnvironmentVariable } from '../environment';
import { Vendor, Region, Environment, Confidentiality, Criticality } from '../enums';

describe('getRequiredEnvironmentVariableValue', () => {
  const originalEnv = process.env;
  const testVarName = 'TEST_VAR';

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('Given an environment variable is set, When getting its value, Then it should return the value', () => {
    process.env[testVarName] = 'test-value';
    expect(getRequiredEnvironmentVariableValue(testVarName)).toBe('test-value');
  });

  it.each([
    ['not set', () => delete process.env[testVarName]],
    [
      'empty string',
      () => {
        process.env[testVarName] = '';
      },
    ],
  ])(
    'Given an environment variable is %s, When getting its value, Then it should throw an error',
    (_, setup) => {
      setup();
      expect(() => getRequiredEnvironmentVariableValue(testVarName)).toThrow(
        `${testVarName} environment variable is required but not set.`
      );
    }
  );
});

describe('getEnumFromRequiredEnvironmentVariable', () => {
  describe('valid values', () => {
    const validTestCases = [
      { input: 'OTHERS', enumType: Vendor, name: 'VENDOR', expected: Vendor.OTHERS },
      { input: 'ON_PREMISES', enumType: Vendor, name: 'VENDOR', expected: Vendor.ON_PREMISES },
      { input: 'AWS', enumType: Vendor, name: 'VENDOR', expected: Vendor.AWS },
      { input: 'AZURE', enumType: Vendor, name: 'VENDOR', expected: Vendor.AZURE },
      { input: 'GCP', enumType: Vendor, name: 'VENDOR', expected: Vendor.GCP },
      { input: 'OTHERS', enumType: Region, name: 'REGION', expected: Region.OTHERS },
      { input: 'AUE', enumType: Region, name: 'REGION', expected: Region.AUE },
      { input: 'USE', enumType: Region, name: 'REGION', expected: Region.USE },
      { input: 'ASIASE', enumType: Region, name: 'REGION', expected: Region.ASIASE },
      { input: 'EUW', enumType: Region, name: 'REGION', expected: Region.EUW },
      {
        input: 'DEVELOPMENT',
        enumType: Environment,
        name: 'ENVIRONMENT',
        expected: Environment.DEVELOPMENT,
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
      it(`Given valid ${name} string "${input}", When calling getEnumFromEnv, Then it should return enum value`, () => {
        expect(getEnumFromRequiredEnvironmentVariable(input, enumType, name)).toBe(expected);
      });
    });
  });

  describe('invalid values', () => {
    const invalidTestCases = [
      { input: undefined, enumType: Vendor, name: 'VENDOR' },
      { input: undefined, enumType: Region, name: 'REGION' },
      { input: undefined, enumType: Environment, name: 'ENVIRONMENT' },
      { input: 'INVALID_VENDOR', enumType: Vendor, name: 'VENDOR' },
      { input: 'INVALID_REGION', enumType: Region, name: 'REGION' },
      { input: 'INVALID_ENV', enumType: Environment, name: 'ENVIRONMENT' },
      { input: 'INVALID_LEVEL', enumType: Confidentiality, name: 'CONFIDENTIALITY' },
    ];

    invalidTestCases.forEach(({ input, enumType, name }) => {
      it(`Given ${input === undefined ? 'undefined' : `invalid ${name.toLowerCase()}`} "${input}", When calling getEnumFromEnv, Then it should throw error`, () => {
        expect(() => getEnumFromRequiredEnvironmentVariable(input, enumType, name)).toThrow(
          /Invalid or missing/
        );
      });
    });
  });

  describe('error messages', () => {
    it('Given invalid vendor, When error is thrown, Then message should include all vendor options', () => {
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

    it('Given invalid region, When error is thrown, Then message should include all region options', () => {
      try {
        getEnumFromRequiredEnvironmentVariable('INVALID', Region, 'REGION');
        fail('Expected error to be thrown');
      } catch (error) {
        const errorMessage = (error as Error).message;
        expect(errorMessage).toContain('AUE');
        expect(errorMessage).toContain('USE');
        expect(errorMessage).toContain('EUW');
        expect(errorMessage).toContain('ASIASE');
        expect(errorMessage).toContain('OTHERS');
      }
    });
  });
}); 