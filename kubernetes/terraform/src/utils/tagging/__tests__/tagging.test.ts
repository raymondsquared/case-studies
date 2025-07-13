import { TaggingUtility } from '../tagging';
import { Config } from '../../config/types';
import { Environment, Vendor, Region } from '../../common/enums';
import { Tags } from '../types';

function getConfig(config: Partial<Config> = {}): Config {
  return {
    name: 'test-service',
    environment: Environment.DEVELOPMENT,
    resourceType: 'vpc',
    region: Region.AUSTRALIA_EAST,
    vendor: Vendor.AWS,
    layer: 'test-layer',
    terraformOrganisation: 'test-org',
    terraformWorkspace: 'test-workspace',
    terraformHostname: 'app.terraform.io',
    enableEncryption: true,
    enableSecretsManager: true,
    enableNatGateway: true,
    tags: {},
    ...config,
  };
}
function getTaggingUtility(config: Partial<Config> = {}) {
  return new TaggingUtility(getConfig(config));
}

describe('TaggingUtility', () => {
  describe('getTags', () => {
    it('Given a basic config, When getting tags, Then it should return a name tag', () => {
      const utility = getTaggingUtility();
      const tags = utility.getTags();
      expect(tags.Name).toBe('testservice-dev-vpc-aue');
    });

    it('Given a config with tags, When getting tags, Then it should include config tags', () => {
      const utility = getTaggingUtility({
        tags: { owner: 'test-team', project: 'test-project' },
      });
      const tags = utility.getTags();
      expect(tags.owner).toBe('test-team');
      expect(tags.project).toBe('test-project');
    });

    it('Given config tags and input tags, When input tags override config tags, Then input tags should take precedence', () => {
      const utility = getTaggingUtility({ tags: { owner: 'config-owner' } });
      const inputTags: Tags = { owner: 'input-owner' };
      const tags = utility.getTags(inputTags);
      expect(tags.owner).toBe('input-owner');
    });

    it.each([
      [
        { environment: Environment.PRODUCTION },
        undefined,
        'testservice-prod-vpc-aue',
        'production environment reflected in Name tag',
      ],
      [
        { name: 'test@service#123' },
        undefined,
        'testservice123-dev-vpc-aue',
        'special characters in name are cleaned',
      ],
      [
        {},
        { nameSuffix: 'suffix' },
        'testservicesuffix-dev-vpc-aue',
        'nameSuffix in inputTags is appended',
      ],
      [
        {},
        { resourceType: 'subnet' },
        'testservice-dev-subnet-aue',
        'custom resourceType in inputTags is used',
      ],
      [
        { region: Region.US_EAST },
        undefined,
        'testservice-dev-vpc-use',
        'region reflected in Name tag',
      ],
    ])(
      'Given config %p and inputTags %p, When getting tags, Then the Name tag should be %s (%s)',
      (configOverrides, inputTags, expectedName, _desc) => {
        const utility = getTaggingUtility(configOverrides);
        const tags = utility.getTags(inputTags);
        expect(tags.Name).toBe(expectedName);
      }
    );

    it('Given input tags with nameSuffix, When getting tags, Then the name should include the suffix', () => {
      const utility = getTaggingUtility();
      const tags = utility.getTags({ nameSuffix: 'suffix' });
      expect(tags.Name).toBe('testservicesuffix-dev-vpc-aue');
      expect(tags.name).toBeUndefined();
    });

    it('Given a config with invalid tag values, When getting tags, Then empty/null/undefined values from config should be filtered out', () => {
      const utility = getTaggingUtility({
        tags: {
          emptyTag: '',
          nullTag: null as never,
          undefinedTag: undefined as never,
          validTag: 'valid-value',
        },
      });
      const tags = utility.getTags();
      expect(tags.emptyTag).toBeUndefined();
      expect(tags.nullTag).toBeUndefined();
      expect(tags.undefinedTag).toBeUndefined();
      expect(tags.validTag).toBe('valid-value');
    });

    it('Given input tags with whitespace-only values, When getting tags, Then whitespace-only values from inputTags should be filtered out', () => {
      const utility = getTaggingUtility();
      const tags = utility.getTags({ whitespaceTag: '   ', validTag: 'valid-value' });
      expect(tags.whitespaceTag).toBeUndefined();
      expect(tags.validTag).toBe('valid-value');
    });

    it('Given a config with various tag properties, When getting tags, Then only BaseTags properties should be added as tags', () => {
      const utility = getTaggingUtility({
        enableEncryption: true,
        enableSecretsManager: false,
        vpcCIDRBlock: '10.0.0.0/16',
        publicSubnetCIDRBlocks: ['10.0.1.0/24', '10.0.2.0/24'],
        privateSubnetCIDRBlocks: ['10.0.10.0/24', '10.0.11.0/24'],
        awsConfig: { awsAccountId: '123456789012' },
      });
      const tags = utility.getTags();
      expect(tags.enableEncryption).toBeUndefined();
      expect(tags.enableSecretsManager).toBeUndefined();
      expect(tags.vpcCIDRBlock).toBeUndefined();
      expect(tags.publicSubnetCIDRBlocks).toBeUndefined();
      expect(tags.privateSubnetCIDRBlocks).toBeUndefined();
      expect(tags.awsConfig).toBeUndefined();
      expect(tags.terraformOrganisation).toBeUndefined();
      expect(tags.terraformWorkspace).toBeUndefined();
      expect(tags.terraformHostname).toBeUndefined();
    });

    it('Given a config with default values, When getting tags, Then BaseTags properties should be added as tags', () => {
      const utility = getTaggingUtility();
      const tags = utility.getTags();
      expect(tags.name).toBeUndefined();
      expect(tags.environment).toBe('development');
      expect(tags.vendor).toBe('AWS');
      expect(tags.layer).toBe('test-layer');
      expect(tags.region).toBe('AUSTRALIA_EAST');
    });

    it('Given a config with custom values, When getting tags, Then config values should take priority over defaults', () => {
      const utility = getTaggingUtility({
        name: 'custom-name',
        environment: Environment.STAGING,
        vendor: Vendor.AZURE,
      });
      const tags = utility.getTags();
      expect(tags.name).toBeUndefined();
      expect(tags.environment).toBe('staging');
      expect(tags.vendor).toBe('AZURE');
    });

    it.each([
      [{ name: '' }, undefined, 'Config validation error: name is required and cannot be empty.'],
      [
        { resourceType: '' },
        undefined,
        'Config validation error: resourceType is required and cannot be empty.',
      ],
      [{}, { name: '' }, 'Name cannot be empty. Please provide a valid name for the resource.'],
    ])(
      'Given config %p and inputTags %p, When getting tags, Then it should throw "%s"',
      (configOverrides, inputTags, expectedError) => {
        const utility = getTaggingUtility(configOverrides);
        const call = () => utility.getTags(inputTags);
        expect(call).toThrow(expectedError);
      }
    );

    it('Given a set of tags, When getting tags, Then the tags should be sorted by key', () => {
      const utility = getTaggingUtility({
        tags: {
          zeta: 'zeta',
          alpha: 'alpha',
          gamma: 'gamma',
        },
      });
      const tags = utility.getTags();
      const tagKeys = Object.keys(tags);
      const sortedKeys = [...tagKeys].sort((a, b) => a.localeCompare(b));
      expect(tagKeys).toEqual(sortedKeys);
    });
  });
});
