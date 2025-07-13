import { validateConfig } from '../validator';
import { Environment, Vendor, Region } from '../../common/enums';

describe('validateConfig', () => {
  const baseConfig = {
    name: 'test-config',
    resourceType: 'service',
    environment: Environment.DEVELOPMENT,
    region: Region.AUE,
    vendor: Vendor.AWS,
    terraformOrganisation: 'my-org',
    terraformWorkspace: 'my-workspace',
    terraformHostname: 'app.terraform.io',
    enableEncryption: true,
    enableSecretsManager: false,
    tags: { key: 'value' },
  };

  describe('Given a valid config', () => {
    it('When validateConfig is called, Then it should not throw', () => {
      expect(() => validateConfig(baseConfig)).not.toThrow();
    });
  });

  describe('Given required string field validation', () => {
    const stringFields = [
      'name',
      'resourceType',
      'terraformOrganisation',
      'terraformWorkspace',
      'terraformHostname',
    ];

    stringFields.forEach((field) => {
      it(`When ${field} is empty, Then it should throw a ${field} error`, () => {
        const config = { ...baseConfig, [field]: '' };
        expect(() => validateConfig(config)).toThrow(`${field} is required`);
      });

      it(`When ${field} is undefined, Then it should throw a ${field} error`, () => {
        const config = { ...baseConfig, [field]: undefined } as never;
        expect(() => validateConfig(config)).toThrow(`${field} is required`);
      });
    });
  });

  describe('Given required enum field validation', () => {
    const enumFields = [
      'environment',
      'region',
      'vendor',
    ];

    enumFields.forEach((field) => {
      it(`When ${field} is undefined, Then it should throw a ${field} error`, () => {
        const config = { ...baseConfig, [field]: undefined } as never;
        expect(() => validateConfig(config)).toThrow(`${field} is required`);
      });
    });
  });

  describe('Given required boolean field validation', () => {
    const booleanFields = [
      'enableEncryption',
      'enableSecretsManager',
    ];

    booleanFields.forEach((field) => {
      it(`When ${field} is non-boolean, Then it should throw a ${field} error`, () => {
        const config = { ...baseConfig, [field]: 'invalid' } as never;
        expect(() => validateConfig(config)).toThrow(`${field} is required`);
      });

      it(`When ${field} is undefined, Then it should throw a ${field} error`, () => {
        const config = { ...baseConfig, [field]: undefined } as never;
        expect(() => validateConfig(config)).toThrow(`${field} is required`);
      });
    });
  });

  describe('Given tags validation', () => {
    it('When tags is null, Then it should throw a tags error', () => {
      const config = { ...baseConfig, tags: null } as never;
      expect(() => validateConfig(config)).toThrow('tags is required');
    });

    it('When tags is undefined, Then it should throw a tags error', () => {
      const config = { ...baseConfig, tags: undefined } as never;
      expect(() => validateConfig(config)).toThrow('tags is required');
    });

    it('When tags is an array, Then it should throw a tags error', () => {
      const config = { ...baseConfig, tags: [] } as never;
      expect(() => validateConfig(config)).toThrow('tags is required');
    });

    it('When tags is a string, Then it should throw a tags error', () => {
      const config = { ...baseConfig, tags: 'not-an-object' } as never;
      expect(() => validateConfig(config)).toThrow('tags is required');
    });
  });
});
