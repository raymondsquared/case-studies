import { Config } from '../../utils/config';
import { validateConfig } from '../config/validator';
import {
  DEFAULT_SERVICE_LAYER,
  DEFAULT_SERVICE_NAME,
  DEFAULT_SERVICE_VERSION,
  Confidentiality,
  Criticality,
  Vendor,
  Environment,
  Region,
  cleanEnvironment,
  cleanString,
  cleanRegion,
} from '../common';
import { BaseTags, Tags } from './types';

export class TaggingUtility {
  private config: Config;
  private tags?: Tags;

  constructor(config: Config, tags?: Tags) {
    this.config = config;
    this.tags = tags;
  }

  getTags(inputTags: Tags = {}): Tags {
    validateConfig(this.config);
    this.validateTags(inputTags);

    let tags: Tags = {};

    tags = {
      ...tags,
      ...TaggingUtility.getValidTags(this.getTagsFromBaseTags(this.getBaseTags())),
    };
    tags = { ...tags, ...TaggingUtility.getValidTags(this.getTagsfromConfig(this.config)) };
    tags = { ...tags, ...TaggingUtility.getValidTags(this.tags ?? {}) };
    tags = { ...tags, ...TaggingUtility.getValidTags(inputTags) };

    let name: string = tags['name'] || this.config.name;
    if (tags['nameSuffix']) {
      name = `${name}-${tags['nameSuffix']}`;
      tags['name'] = name;
    }

    const _env: string | undefined = tags['environment'];
    const inputResourceType: string | undefined = inputTags['resourceType'];
    const resourceType: string =
      inputResourceType !== undefined ? inputResourceType : this.config.resourceType;

    // Actual AWS tagging for Name
    const resourceName: string = `${cleanString(name)}-${cleanEnvironment(
      _env as Environment,
    )}-${cleanString(resourceType)}-${cleanRegion(this.config.region)}`;
    tags['Name'] = resourceName;

    return tags;
  }

  private validateTags(inputTags: Tags): void {
    const inputName: string | undefined = inputTags['name'];
    const name: string = inputName !== undefined ? inputName : this.config.name;
    if (!name || name.trim() === '') {
      throw new Error('Name cannot be empty. Please provide a valid name for the resource.');
    }

    const inputResourceType: string | undefined = inputTags['resourceType'];
    const resourceType: string =
      inputResourceType !== undefined ? inputResourceType : this.config.resourceType;
    if (!resourceType || resourceType.trim() === '') {
      throw new Error(
        'Resource type cannot be empty. Please provide a valid resource type for the resource.'
      );
    }
  }

  private getBaseTags(): BaseTags {
    return {
      name: DEFAULT_SERVICE_NAME,
      environment: this.config.environment,
      version: DEFAULT_SERVICE_VERSION,
      layer: DEFAULT_SERVICE_LAYER,
      vendor: Vendor.OTHERS,
      region: Region.OTHERS,
      confidentiality: Confidentiality.INTERNAL,
      criticality: Criticality.MEDIUM,
      owner: '',
      project: '',
      costCenter: '',
      compliance: '',
      customer: 'internal',
      runningSchedule: 'all the time',
      backupSchedule: '',
    };
  }

  private getTagsFromBaseTags(baseTags: BaseTags): Tags {
    return Object.fromEntries(Object.entries(baseTags).map(([key, value]) => [key, String(value)]));
  }

  private getTagsfromConfig(config: Config): Tags {
    const tag: Tags = {};

    this.getTagFromConfigProperties(config, tag);
    this.getTagFromConfigTagsProperties(config.tags, tag);

    return tag;
  }

  private getTagFromConfigProperties(config: Config, tag: Tags): void {
    const baseTagsKeys: string[] = Object.keys(this.getBaseTags());

    for (const [key, value] of Object.entries(config)) {
      if (key === 'tags') continue;

      if (baseTagsKeys.includes(key) && TaggingUtility.isValidValue(value)) {
        tag[key] = String(value);
      }
    }
  }

  private getTagFromConfigTagsProperties(configTags: Tags | undefined, tag: Tags): void {
    if (!configTags || typeof configTags !== 'object') {
      return;
    }

    for (const [key, value] of Object.entries(configTags)) {
      if (TaggingUtility.isValidValue(value)) {
        tag[key] = String(value);
      }
    }
  }

  private static isValidValue(value: unknown): boolean {
    return value !== null && value !== undefined && String(value).trim() !== '';
  }

  private static getValidTags(obj: Tags): Tags {
    const filtered: Tags = {};
    for (const key in obj) {
      const value: string = obj[key];
      if (TaggingUtility.isValidValue(value)) {
        filtered[key] = value;
      }
    }
    return filtered;
  }
}
