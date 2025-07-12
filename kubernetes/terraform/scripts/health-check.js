#!/usr/bin/env node

/**
 * Health Check Script
 * 
 * This script performs post-deployment health checks on the infrastructure
 * to ensure everything is working correctly.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(command, description) {
  try {
    log(`🔍 ${description}...`, 'blue');
    const result = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    log(`✅ ${description} - PASSED`, 'green');
    return { success: true, output: result };
  } catch (error) {
    log(`❌ ${description} - FAILED: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

function checkEnvironment() {
  const environment = process.env.ENVIRONMENT || 'dev';
  log(`\n🏥 Starting health checks for ${environment} environment...`, 'blue');
  
  if (!environment) {
    log('❌ ENVIRONMENT variable not set', 'red');
    process.exit(1);
  }
  
  return environment;
}

function checkTerraformState() {
  log('\n📋 Checking Terraform state...', 'blue');
  
  const checks = [
    {
      command: 'cdktf list',
      description: 'List CDK stacks'
    },
    {
      command: 'cdktf output',
      description: 'Get stack outputs'
    }
  ];
  
  let allPassed = true;
  
  for (const check of checks) {
    const result = runCommand(check.command, check.description);
    if (!result.success) {
      allPassed = false;
    }
  }
  
  return allPassed;
}

function checkAWSResources() {
  log('\n☁️  Checking AWS resources...', 'blue');
  
  const environment = process.env.ENVIRONMENT || 'dev';
  const project = process.env.PROJECT || 'case-studies';
  
  const checks = [
    {
      command: `aws s3 ls s3://${project}-${environment}-* --region ap-southeast-2`,
      description: 'Check S3 bucket exists'
    },
    {
      command: 'aws kms list-keys --region ap-southeast-2',
      description: 'Check KMS keys'
    },
    {
      command: 'aws cloudwatch describe-log-groups --region ap-southeast-2',
      description: 'Check CloudWatch log groups'
    }
  ];
  
  let allPassed = true;
  
  for (const check of checks) {
    const result = runCommand(check.command, check.description);
    if (!result.success) {
      allPassed = false;
    }
  }
  
  return allPassed;
}

function checkSecurityCompliance() {
  log('\n🔒 Checking security compliance...', 'blue');
  
  const checks = [
    {
      command: 'aws s3api get-bucket-encryption --bucket $(aws s3 ls | grep case-studies | head -1 | awk "{print \$3}") --region ap-southeast-2',
      description: 'Check S3 bucket encryption'
    },
    {
      command: 'aws s3api get-bucket-public-access-block --bucket $(aws s3 ls | grep case-studies | head -1 | awk "{print \$3}") --region ap-southeast-2',
      description: 'Check S3 public access blocks'
    }
  ];
  
  let allPassed = true;
  
  for (const check of checks) {
    const result = runCommand(check.command, check.description);
    if (!result.success) {
      allPassed = false;
    }
  }
  
  return allPassed;
}

function checkMonitoring() {
  log('\n📊 Checking monitoring setup...', 'blue');
  
  const checks = [
    {
      command: 'aws sns list-topics --region ap-southeast-2',
      description: 'Check SNS topics'
    },
    {
      command: 'aws cloudwatch describe-alarms --region ap-southeast-2',
      description: 'Check CloudWatch alarms'
    }
  ];
  
  let allPassed = true;
  
  for (const check of checks) {
    const result = runCommand(check.command, check.description);
    if (!result.success) {
      allPassed = false;
    }
  }
  
  return allPassed;
}

function generateReport(results) {
  log('\n📄 Generating health check report...', 'blue');
  
  const report = {
    timestamp: new Date().toISOString(),
    environment: process.env.ENVIRONMENT || 'dev',
    checks: results,
    summary: {
      total: Object.keys(results).length,
      passed: Object.values(results).filter(Boolean).length,
      failed: Object.values(results).filter(r => !r).length
    }
  };
  
  // Save report to file
  const reportPath = path.join(__dirname, '..', 'health-check-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  log(`📁 Health check report saved to: ${reportPath}`, 'green');
  
  return report;
}

function main() {
  try {
    const environment = checkEnvironment();
    
    const results = {
      terraformState: checkTerraformState(),
      awsResources: checkAWSResources(),
      securityCompliance: checkSecurityCompliance(),
      monitoring: checkMonitoring()
    };
    
    const report = generateReport(results);
    
    log('\n🏁 Health Check Summary:', 'blue');
    log(`Environment: ${environment}`, 'blue');
    log(`Total Checks: ${report.summary.total}`, 'blue');
    log(`Passed: ${report.summary.passed}`, 'green');
    log(`Failed: ${report.summary.failed}`, report.summary.failed > 0 ? 'red' : 'green');
    
    if (report.summary.failed > 0) {
      log('\n❌ Some health checks failed. Please review the report and fix any issues.', 'red');
      process.exit(1);
    } else {
      log('\n✅ All health checks passed! Infrastructure is healthy.', 'green');
    }
    
  } catch (error) {
    log(`\n💥 Health check failed with error: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Run health checks
main(); 