import { validateConfig } from '../validator';
import { Environment, Vendor, Region } from '../../common/enums';

const testConfig = {
  name: 'test-config',
  resourceType: 'service',
  environment: Environment.DEVELOPMENT,
  region: Region.AUSTRALIA_EAST,
  vendor: Vendor.AWS,
  terraformOrganisation: 'my-org',
  terraformWorkspace: 'my-workspace',
  terraformHostname: 'app.terraform.io',
  enableEncryption: true,
  enableSecretsManager: false,
  enableNatGateway: true,
  tags: { key: 'value' },
};

describe('validateConfig', () => {
  describe('Given a valid config', () => {
    describe('When validateConfig is called', () => {
      it('Then it should not throw', () => {
        expect(() => validateConfig(testConfig)).not.toThrow();
      });
    });
  });

  describe('Given required field validation', () => {
    describe('When string fields are invalid', () => {
      const stringFields = [
        'name',
        'resourceType',
        'terraformOrganisation',
        'terraformWorkspace',
        'terraformHostname',
      ];

      stringFields.forEach((field) => {
        describe(`When ${field} is empty`, () => {
          it('Then it should throw a field error', () => {
            const config = { ...testConfig, [field]: '' };
            expect(() => validateConfig(config)).toThrow(`${field} is required`);
          });
        });

        describe(`When ${field} is undefined`, () => {
          it('Then it should throw a field error', () => {
            const config = { ...testConfig, [field]: undefined } as never;
            expect(() => validateConfig(config)).toThrow(`${field} is required`);
          });
        });
      });
    });

    describe('When enum fields are invalid', () => {
      const enumFields = [
        'environment',
        'region',
        'vendor',
      ];

      enumFields.forEach((field) => {
        describe(`When ${field} is undefined`, () => {
          it('Then it should throw a field error', () => {
            const config = { ...testConfig, [field]: undefined } as never;
            expect(() => validateConfig(config)).toThrow(`${field} is required`);
          });
        });
      });
    });

    describe('When boolean fields are invalid', () => {
      const booleanFields = [
        'enableEncryption',
        'enableSecretsManager',
      ];

      booleanFields.forEach((field) => {
        describe(`When ${field} is non-boolean`, () => {
          it('Then it should throw a field error', () => {
            const config = { ...testConfig, [field]: 'invalid' } as never;
            expect(() => validateConfig(config)).toThrow(`${field} is required`);
          });
        });

        describe(`When ${field} is undefined`, () => {
          it('Then it should throw a field error', () => {
            const config = { ...testConfig, [field]: undefined } as never;
            expect(() => validateConfig(config)).toThrow(`${field} is required`);
          });
        });
      });
    });
  });

  describe('Given tags validation', () => {
    describe('When tags is null', () => {
      it('Then it should throw a tags error', () => {
        const config = { ...testConfig, tags: null } as never;
        expect(() => validateConfig(config)).toThrow('Config validation error: tags must be an object with string values if provided.');
      });
    });

    describe('When tags is an array', () => {
      it('Then it should throw a tags error', () => {
        const config = { ...testConfig, tags: [] } as never;
        expect(() => validateConfig(config)).toThrow('Config validation error: tags must be an object with string values if provided.');
      });
    });

    describe('When tags is a string', () => {
      it('Then it should throw a tags error', () => {
        const config = { ...testConfig, tags: 'not-an-object' } as never;
        expect(() => validateConfig(config)).toThrow('Config validation error: tags must be an object with string values if provided.');
      });
    });
  });
});
