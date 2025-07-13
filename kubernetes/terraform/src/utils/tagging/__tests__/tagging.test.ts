import { TaggingUtility } from '../tagging';
import { Config } from '../../config/types';
import { Environment, Vendor, Region } from '../../common/enums';
import { Tags } from '../types';

describe('TaggingUtility', () => {
  describe('constructor', () => {
    it('Given a valid config, When creating a TaggingUtility instance, Then it should be created successfully', () => {
      const config: Config = {
        name: 'test-service',
        environment: Environment.DEVELOPMENT,
        resourceType: 'vpc',
        region: Region.AUE,
        vendor: Vendor.AWS,
        layer: 'infrastructure',
        terraformOrganisation: 'test-org',
        terraformWorkspace: 'test-workspace',
        terraformHostname: 'app.terraform.io',
        enableEncryption: true,
        enableSecretsManager: true,
        enablePublicVPC: false,
        tags: {},
      };

      const utility = new TaggingUtility(config);

      expect(utility).toBeInstanceOf(TaggingUtility);
    });
  });

  describe('getTags', () => {
    it('Given a basic config, When getting tags, Then it should return a name tag', () => {
      const config: Config = {
        name: 'test-service',
        environment: Environment.DEVELOPMENT,
        resourceType: 'vpc',
        region: Region.AUE,
        vendor: Vendor.AWS,
        layer: 'infrastructure',
        terraformOrganisation: 'test-org',
        terraformWorkspace: 'test-workspace',
        terraformHostname: 'app.terraform.io',
        enableEncryption: true,
        enableSecretsManager: true,
        enablePublicVPC: false,
        tags: {},
      };
      const utility = new TaggingUtility(config);

      const tags = utility.getTags();

      expect(tags.Name).toBe('testservice-dev-vpc-aue');
    });

    it('Given a config with basic tags, When getting tags, Then it should include config tags', () => {
      const config: Config = {
        name: 'test-service',
        environment: Environment.DEVELOPMENT,
        resourceType: 'vpc',
        region: Region.AUE,
        vendor: Vendor.AWS,
        layer: 'infrastructure',
        terraformOrganisation: 'test-org',
        terraformWorkspace: 'test-workspace',
        terraformHostname: 'app.terraform.io',
        enableEncryption: true,
        enableSecretsManager: true,
        enablePublicVPC: false,
        tags: {
          owner: 'test-team',
          project: 'test-project',
        },
      };
      const utility = new TaggingUtility(config);

      const tags = utility.getTags();

      expect(tags.owner).toBe('test-team');
      expect(tags.project).toBe('test-project');
    });

    it('Given input tags, When getting tags, Then input tags should override config tags', () => {
      const config: Config = {
        name: 'test-service',
        environment: Environment.DEVELOPMENT,
        resourceType: 'vpc',
        region: Region.AUE,
        vendor: Vendor.AWS,
        layer: 'infrastructure',
        terraformOrganisation: 'test-org',
        terraformWorkspace: 'test-workspace',
        terraformHostname: 'app.terraform.io',
        enableEncryption: true,
        enableSecretsManager: true,
        enablePublicVPC: false,
        tags: {
          owner: 'config-owner',
        },
      };
      const utility = new TaggingUtility(config);
      const inputTags: Tags = { owner: 'input-owner' };

      const tags = utility.getTags(inputTags);

      expect(tags.owner).toBe('input-owner');
    });

    it('Given a config with empty name, When getting tags, Then it should throw an error', () => {
      const config: Config = {
        name: '',
        environment: Environment.DEVELOPMENT,
        resourceType: 'vpc',
        region: Region.AUE,
        vendor: Vendor.AWS,
        layer: 'infrastructure',
        terraformOrganisation: 'test-org',
        terraformWorkspace: 'test-workspace',
        terraformHostname: 'app.terraform.io',
        enableEncryption: true,
        enableSecretsManager: true,
        enablePublicVPC: false,
        tags: {},
      };
      const utility = new TaggingUtility(config);

      expect(() => utility.getTags()).toThrow(
        'Config validation error: name is required and cannot be empty.'
      );
    });

    it('Given a config with empty resourceType, When getting tags, Then it should throw an error', () => {
      const config: Config = {
        name: 'test-service',
        environment: Environment.DEVELOPMENT,
        resourceType: '',
        region: Region.AUE,
        vendor: Vendor.AWS,
        layer: 'infrastructure',
        terraformOrganisation: 'test-org',
        terraformWorkspace: 'test-workspace',
        terraformHostname: 'app.terraform.io',
        enableEncryption: true,
        enableSecretsManager: true,
        enablePublicVPC: false,
        tags: {},
      };
      const utility = new TaggingUtility(config);

      expect(() => utility.getTags()).toThrow(
        'Config validation error: resourceType is required and cannot be empty.'
      );
    });

    it('Given input tags with empty name, When getting tags, Then it should throw an error', () => {
      const config: Config = {
        name: 'test-service',
        environment: Environment.DEVELOPMENT,
        resourceType: 'vpc',
        region: Region.AUE,
        vendor: Vendor.AWS,
        layer: 'infrastructure',
        terraformOrganisation: 'test-org',
        terraformWorkspace: 'test-workspace',
        terraformHostname: 'app.terraform.io',
        enableEncryption: true,
        enableSecretsManager: true,
        enablePublicVPC: false,
        tags: {},
      };
      const utility = new TaggingUtility(config);
      const inputTags: Tags = { name: '' };

      expect(() => utility.getTags(inputTags)).toThrow(
        'Name cannot be empty. Please provide a valid name for the resource.'
      );
    });

    it('Given a config with production environment, When getting tags, Then the Name tag should reflect production', () => {
      const config: Config = {
        name: 'test-service',
        environment: Environment.PRODUCTION,
        resourceType: 'vpc',
        region: Region.AUE,
        vendor: Vendor.AWS,
        layer: 'infrastructure',
        terraformOrganisation: 'test-org',
        terraformWorkspace: 'test-workspace',
        terraformHostname: 'app.terraform.io',
        enableEncryption: true,
        enableSecretsManager: true,
        enablePublicVPC: false,
        tags: {},
      };
      const utility = new TaggingUtility(config);

      const tags = utility.getTags();

      expect(tags.Name).toBe('testservice-prod-vpc-aue');
    });

    it('Given a config with special characters in name, When getting tags, Then the Name tag should be cleaned', () => {
      const config: Config = {
        name: 'test@service#123',
        environment: Environment.DEVELOPMENT,
        resourceType: 'vpc',
        region: Region.AUE,
        vendor: Vendor.AWS,
        layer: 'infrastructure',
        terraformOrganisation: 'test-org',
        terraformWorkspace: 'test-workspace',
        terraformHostname: 'app.terraform.io',
        enableEncryption: true,
        enableSecretsManager: true,
        enablePublicVPC: false,
        tags: {},
      };
      const utility = new TaggingUtility(config);

      const tags = utility.getTags();

      expect(tags.Name).toBe('testservice123-dev-vpc-aue');
    });

    it('Given input tags with nameSuffix, When getting tags, Then the name should include the suffix', () => {
      const config: Config = {
        name: 'test-service',
        environment: Environment.DEVELOPMENT,
        resourceType: 'vpc',
        region: Region.AUE,
        vendor: Vendor.AWS,
        layer: 'infrastructure',
        terraformOrganisation: 'test-org',
        terraformWorkspace: 'test-workspace',
        terraformHostname: 'app.terraform.io',
        enableEncryption: true,
        enableSecretsManager: true,
        enablePublicVPC: false,
        tags: {},
      };
      const utility = new TaggingUtility(config);
      const inputTags: Tags = { nameSuffix: 'suffix' };

      const tags = utility.getTags(inputTags);

      expect(tags.name).toBe('test-service-suffix');
      expect(tags.Name).toBe('testservicesuffix-dev-vpc-aue');
    });

    it('Given input tags with custom resourceType, When getting tags, Then the Name tag should use the custom resourceType', () => {
      const config: Config = {
        name: 'test-service',
        environment: Environment.DEVELOPMENT,
        resourceType: 'vpc',
        region: Region.AUE,
        vendor: Vendor.AWS,
        layer: 'infrastructure',
        terraformOrganisation: 'test-org',
        terraformWorkspace: 'test-workspace',
        terraformHostname: 'app.terraform.io',
        enableEncryption: true,
        enableSecretsManager: true,
        enablePublicVPC: false,
        tags: {},
      };
      const utility = new TaggingUtility(config);
      const inputTags: Tags = { resourceType: 'subnet' };

      const tags = utility.getTags(inputTags);

      expect(tags.Name).toBe('testservice-dev-subnet-aue');
    });

    it('Given config with empty tag values, When getting tags, Then empty values should be filtered out', () => {
      const config: Config = {
        name: 'test-service',
        environment: Environment.DEVELOPMENT,
        resourceType: 'vpc',
        region: Region.AUE,
        vendor: Vendor.AWS,
        layer: 'infrastructure',
        terraformOrganisation: 'test-org',
        terraformWorkspace: 'test-workspace',
        terraformHostname: 'app.terraform.io',
        enableEncryption: true,
        enableSecretsManager: true,
        enablePublicVPC: false,
        tags: {
          emptyTag: '',
          nullTag: null as never,
          undefinedTag: undefined as never,
          validTag: 'valid-value',
        },
      };
      const utility = new TaggingUtility(config);

      const tags = utility.getTags();

      expect(tags.emptyTag).toBeUndefined();
      expect(tags.nullTag).toBeUndefined();
      expect(tags.undefinedTag).toBeUndefined();
      expect(tags.validTag).toBe('valid-value');
    });

    it('Given input tags with whitespace-only values, When getting tags, Then whitespace-only values should be filtered out', () => {
      const config: Config = {
        name: 'test-service',
        environment: Environment.DEVELOPMENT,
        resourceType: 'vpc',
        region: Region.AUE,
        vendor: Vendor.AWS,
        layer: 'infrastructure',
        terraformOrganisation: 'test-org',
        terraformWorkspace: 'test-workspace',
        terraformHostname: 'app.terraform.io',
        enableEncryption: true,
        enableSecretsManager: true,
        enablePublicVPC: false,
        tags: {},
      };
      const utility = new TaggingUtility(config);
      const inputTags: Tags = {
        whitespaceTag: '   ',
        validTag: 'valid-value',
      };

      const tags = utility.getTags(inputTags);

      expect(tags.whitespaceTag).toBeUndefined();
      expect(tags.validTag).toBe('valid-value');
    });

    it('Given a config with different region, When getting tags, Then the Name tag should reflect the region', () => {
      const config: Config = {
        name: 'test-service',
        environment: Environment.DEVELOPMENT,
        resourceType: 'vpc',
        region: Region.USE,
        vendor: Vendor.AWS,
        layer: 'infrastructure',
        terraformOrganisation: 'test-org',
        terraformWorkspace: 'test-workspace',
        terraformHostname: 'app.terraform.io',
        enableEncryption: true,
        enableSecretsManager: true,
        enablePublicVPC: false,
        tags: {},
      };
      const utility = new TaggingUtility(config);

      const tags = utility.getTags();

      expect(tags.Name).toBe('testservice-dev-vpc-use');
    });

    it('Given a config with custom values, When getting tags, Then config values should take priority over defaults', () => {
      const config: Config = {
        name: 'custom-name',
        environment: Environment.STAGING,
        resourceType: 'vpc',
        region: Region.AUE,
        vendor: Vendor.AZURE,
        layer: 'infrastructure',
        terraformOrganisation: 'test-org',
        terraformWorkspace: 'test-workspace',
        terraformHostname: 'app.terraform.io',
        enableEncryption: true,
        enableSecretsManager: true,
        enablePublicVPC: false,
        tags: {},
      };
      const utility = new TaggingUtility(config);

      const tags = utility.getTags();

      expect(tags.name).toBe('custom-name');
      expect(tags.environment).toBe('staging');
      expect(tags.vendor).toBe('AZURE');
    });

    it('Given config with boolean properties, When getting tags, Then config properties should become tags', () => {
      const config: Config = {
        name: 'test-service',
        environment: Environment.DEVELOPMENT,
        resourceType: 'vpc',
        region: Region.AUE,
        vendor: Vendor.AWS,
        layer: 'infrastructure',
        terraformOrganisation: 'test-org',
        terraformWorkspace: 'test-workspace',
        terraformHostname: 'app.terraform.io',
        enableEncryption: true,
        enableSecretsManager: false,
        enablePublicVPC: true,
        tags: {},
      };
      const utility = new TaggingUtility(config);

      const tags = utility.getTags();

      expect(tags.enableEncryption).toBe('true');
      expect(tags.enableSecretsManager).toBe('false');
      expect(tags.enablePublicVPC).toBe('true');
    });
  });
});
