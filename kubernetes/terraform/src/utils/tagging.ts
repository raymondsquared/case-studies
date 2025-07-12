import { EnvironmentConfig } from '../config/environment';

export interface TagSet {
  [key: string]: string;
}

export interface TaggingOptions {
  readonly component?: string;
  readonly service?: string;
  readonly tier?: 'public' | 'private' | 'data' | 'compute' | 'storage' | 'network';
  readonly dataClassification?: 'public' | 'internal' | 'confidential' | 'restricted';
  readonly backupSchedule?: 'none' | 'daily' | 'weekly' | 'hourly';
  readonly compliance?: 'basic' | 'soc2' | 'hipaa' | 'pci' | 'gdpr';
  readonly securityLevel?: 'low' | 'medium' | 'high' | 'critical';
  readonly costCenter?: string;
  readonly project?: string;
  readonly customTags?: Record<string, string>;
}

export class TaggingUtility {
  private config: EnvironmentConfig;

  constructor(config: EnvironmentConfig) {
    this.config = config;
  }

  /**
   * Generate comprehensive tags for AWS resources
   */
  generateTags(options: TaggingOptions = {}): TagSet {
    const baseTags = this.getBaseTags();
    const componentTags = this.getComponentTags(options);
    const complianceTags = this.getComplianceTags(options);
    const operationalTags = this.getOperationalTags(options);
    const customTags = options.customTags || {};

    return {
      ...baseTags,
      ...componentTags,
      ...complianceTags,
      ...operationalTags,
      ...customTags,
    };
  }

  /**
   * Generate tags for networking resources
   */
  generateNetworkTags(options: TaggingOptions = {}): TagSet {
    return this.generateTags({
      ...options,
      component: 'networking',
      tier: options.tier || 'network',
    });
  }

  /**
   * Generate tags for storage resources
   */
  generateStorageTags(options: TaggingOptions = {}): TagSet {
    return this.generateTags({
      ...options,
      component: 'storage',
      tier: options.tier || 'data',
    });
  }

  /**
   * Generate tags for compute resources
   */
  generateComputeTags(options: TaggingOptions = {}): TagSet {
    return this.generateTags({
      ...options,
      component: 'compute',
      tier: options.tier || 'compute',
    });
  }

  /**
   * Generate tags for security resources
   */
  generateSecurityResourceTags(options: TaggingOptions = {}): TagSet {
    return this.generateTags({
      ...options,
      component: 'security',
      tier: options.tier || 'private',
      securityLevel: options.securityLevel || 'high',
    });
  }

  /**
   * Generate tags for monitoring resources
   */
  generateMonitoringTags(options: TaggingOptions = {}): TagSet {
    return this.generateTags({
      ...options,
      component: 'monitoring',
      tier: options.tier || 'private',
    });
  }

  /**
   * Generate tags for database resources
   */
  generateDatabaseTags(options: TaggingOptions = {}): TagSet {
    return this.generateTags({
      ...options,
      component: 'database',
      tier: options.tier || 'private',
      dataClassification: options.dataClassification || 'confidential',
      backupSchedule: options.backupSchedule || 'daily',
    });
  }

  /**
   * Generate tags for application resources
   */
  generateApplicationTags(options: TaggingOptions = {}): TagSet {
    return this.generateTags({
      ...options,
      component: 'application',
      tier: options.tier || 'private',
    });
  }

  /**
   * Get base tags that apply to all resources
   */
  private getBaseTags(): TagSet {
    return {
      Environment: this.config.environment,
      Project: this.config.project,
      Owner: this.config.owner,
      CostCenter: this.config.costCenter,
      ManagedBy: 'terraform',
      CreatedAt: new Date().toISOString(),
      Version: '1.0.0',
      Region: this.config.region,
    };
  }

  /**
   * Get component-specific tags
   */
  private getComponentTags(options: TaggingOptions): TagSet {
    const tags: TagSet = {};

    if (options.component) {
      tags.Component = options.component;
    }

    if (options.service) {
      tags.Service = options.service;
    }

    if (options.tier) {
      tags.Tier = options.tier;
    }

    return tags;
  }

  /**
   * Get compliance and security tags
   */
  private getComplianceTags(options: TaggingOptions): TagSet {
    const tags: TagSet = {};

    if (options.dataClassification) {
      tags.DataClassification = options.dataClassification;
    }

    if (options.compliance) {
      tags.Compliance = options.compliance;
    }

    if (options.securityLevel) {
      tags.SecurityLevel = options.securityLevel;
    }

    // Add environment-specific compliance tags
    if (this.config.environment === 'prod') {
      tags.Compliance = options.compliance || 'soc2';
      tags.SecurityLevel = options.securityLevel || 'high';
      tags.DataClassification = options.dataClassification || 'confidential';
    }

    return tags;
  }

  /**
   * Get operational tags
   */
  private getOperationalTags(options: TaggingOptions): TagSet {
    const tags: TagSet = {};

    if (options.backupSchedule) {
      tags.Backup = options.backupSchedule;
    }

    if (options.costCenter) {
      tags.CostCenter = options.costCenter;
    }

    if (options.project) {
      tags.Project = options.project;
    }

    // Add environment-specific operational tags
    switch (this.config.environment) {
      case 'dev':
        tags.Backup = options.backupSchedule || 'daily';
        tags.DisasterRecovery = 'disabled';
        break;
      case 'staging':
        tags.Backup = options.backupSchedule || 'daily';
        tags.DisasterRecovery = 'basic';
        break;
      case 'prod':
        tags.Backup = options.backupSchedule || 'hourly';
        tags.DisasterRecovery = 'enabled';
        tags.Monitoring = 'enabled';
        tags.Alerting = 'enabled';
        break;
    }

    return tags;
  }

  /**
   * Generate cost allocation tags
   */
  generateCostAllocationTags(): TagSet {
    return {
      Environment: this.config.environment,
      Project: this.config.project,
      CostCenter: this.config.costCenter,
      Owner: this.config.owner,
      ManagedBy: 'terraform',
    };
  }

  /**
   * Generate security tags
   */
  generateSecurityTags(): TagSet {
    return {
      Environment: this.config.environment,
      DataClassification: this.config.environment === 'prod' ? 'confidential' : 'internal',
      Compliance: this.config.environment === 'prod' ? 'soc2' : 'basic',
      SecurityLevel: this.config.environment === 'prod' ? 'high' : 'medium',
      Encryption: this.config.enableEncryption ? 'enabled' : 'disabled',
      Monitoring: this.config.enableMonitoring ? 'enabled' : 'disabled',
    };
  }

  /**
   * Generate backup tags
   */
  generateBackupTags(): TagSet {
    const backupSchedule = this.config.environment === 'prod' ? 'hourly' : 'daily';
    
    return {
      Environment: this.config.environment,
      Backup: backupSchedule,
      Retention: this.config.environment === 'prod' ? '365' : '30',
      DisasterRecovery: this.config.environment === 'prod' ? 'enabled' : 'disabled',
    };
  }
}

/**
 * Factory function to create tagging utility
 */
export function createTaggingUtility(config: EnvironmentConfig): TaggingUtility {
  return new TaggingUtility(config);
}

/**
 * Predefined tag sets for common resource types
 */
export const CommonTagSets = {
  networking: {
    Component: 'networking',
    Tier: 'network',
    Purpose: 'connectivity',
  },
  storage: {
    Component: 'storage',
    Tier: 'data',
    Purpose: 'data-persistence',
  },
  compute: {
    Component: 'compute',
    Tier: 'compute',
    Purpose: 'application-runtime',
  },
  security: {
    Component: 'security',
    Tier: 'private',
    Purpose: 'access-control',
  },
  monitoring: {
    Component: 'monitoring',
    Tier: 'private',
    Purpose: 'observability',
  },
  database: {
    Component: 'database',
    Tier: 'private',
    Purpose: 'data-storage',
  },
  application: {
    Component: 'application',
    Tier: 'private',
    Purpose: 'business-logic',
  },
} as const; 