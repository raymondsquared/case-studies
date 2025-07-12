# Production-grade Terraform CDK Makefile
# This Makefile provides commands for managing infrastructure across environments

# Default environment
ENVIRONMENT ?= development

# Terraform configuration
TERRAFORM_ORGANISATION ?= pawlution
TERRAFORM_WORKSPACE ?= case-studies-kubernetes-$(ENVIRONMENT)
TERRAFORM_HOSTNAME ?= app.terraform.io

# AWS configuration
AWS_REGION ?= ap-southeast-2
AWS_PROFILE ?= default

# Validation and security
SECURITY_SCAN ?= true
COST_ANALYSIS ?= true

# Colors for output
RED := \033[0;31m
GREEN := \033[0;32m
YELLOW := \033[0;33m
BLUE := \033[0;34m
NC := \033[0m # No Color

.PHONY: help
help: ## Show this help message
	@echo "$(BLUE)Production Terraform CDK Commands:$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-20s$(NC) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(YELLOW)Environment Variables:$(NC)"
	@echo "  ENVIRONMENT           Environment to deploy (development/staging/production) [default: development]"
	@echo "  TERRAFORM_ORGANISATION Terraform Cloud organization [default: pawlution]"
	@echo "  AWS_REGION            AWS region [default: ap-southeast-2]"
	@echo "  AWS_PROFILE           AWS profile [default: default]"
	@echo "  SECURITY_SCAN         Enable security scanning [default: true]"
	@echo "  COST_ANALYSIS         Enable cost analysis [default: true]"

.PHONY: setup
setup: ## Install dependencies and setup the project
	@echo "$(BLUE)🔧 Setting up Terraform CDK project...$(NC)"
	npm install
	cdktf get
	@echo "$(GREEN)✅ Setup complete!$(NC)"

.PHONY: validate
validate: ## Validate the Terraform configuration
	@echo "$(BLUE)🔍 Validating Terraform configuration for $(ENVIRONMENT)...$(NC)"
	ENVIRONMENT=$(ENVIRONMENT) \
	TERRAFORM_ORGANISATION=$(TERRAFORM_ORGANISATION) \
	TERRAFORM_WORKSPACE=$(TERRAFORM_WORKSPACE) \
	TERRAFORM_HOSTNAME=$(TERRAFORM_HOSTNAME) \
	cdktf synth
	@echo "$(GREEN)✅ Validation successful!$(NC)"

.PHONY: plan
plan: validate ## Generate and show execution plan
	@echo "$(BLUE)📋 Generating execution plan for $(ENVIRONMENT)...$(NC)"
	ENVIRONMENT=$(ENVIRONMENT) \
	TERRAFORM_ORGANISATION=$(TERRAFORM_ORGANISATION) \
	TERRAFORM_WORKSPACE=$(TERRAFORM_WORKSPACE) \
	TERRAFORM_HOSTNAME=$(TERRAFORM_HOSTNAME) \
	cdktf plan
	@echo "$(GREEN)✅ Plan generated successfully!$(NC)"

.PHONY: deploy
deploy: ## Deploy the infrastructure
	@echo "$(BLUE)🚀 Deploying infrastructure to $(ENVIRONMENT)...$(NC)"
	@if [ "$(ENVIRONMENT)" = "production" ]; then \
		echo "$(YELLOW)⚠️  PRODUCTION DEPLOYMENT - Are you sure? (y/N)$$(NC)"; \
		read -r response; \
		if [ "$$response" != "y" ] && [ "$$response" != "Y" ]; then \
			echo "$(RED)❌ Deployment cancelled$(NC)"; \
			exit 1; \
		fi; \
	fi
	ENVIRONMENT=$(ENVIRONMENT) \
	TERRAFORM_ORGANISATION=$(TERRAFORM_ORGANISATION) \
	TERRAFORM_WORKSPACE=$(TERRAFORM_WORKSPACE) \
	TERRAFORM_HOSTNAME=$(TERRAFORM_HOSTNAME) \
	cdktf deploy --auto-approve
	@echo "$(GREEN)✅ Deployment successful!$(NC)"

.PHONY: destroy
destroy: ## Destroy the infrastructure
	@echo "$(RED)🗑️  Destroying infrastructure in $(ENVIRONMENT)...$(NC)"
	@echo "$(YELLOW)⚠️  WARNING: This will permanently delete all resources! (y/N)$$(NC)"
	@read -r response; \
	if [ "$$response" != "y" ] && [ "$$response" != "Y" ]; then \
		echo "$(RED)❌ Destruction cancelled$(NC)"; \
		exit 1; \
	fi
	ENVIRONMENT=$(ENVIRONMENT) \
	TERRAFORM_ORGANISATION=$(TERRAFORM_ORGANISATION) \
	TERRAFORM_WORKSPACE=$(TERRAFORM_WORKSPACE) \
	TERRAFORM_HOSTNAME=$(TERRAFORM_HOSTNAME) \
	cdktf destroy --auto-approve
	@echo "$(GREEN)✅ Destruction completed!$(NC)"

.PHONY: test
test: ## Run all tests
	@echo "$(BLUE)🧪 Running all tests...$(NC)"
	npm run test:all
	@echo "$(GREEN)✅ All tests completed!$(NC)"

.PHONY: test-security
test-security: ## Run security-focused tests
	@echo "$(BLUE)🔒 Running security tests...$(NC)"
	npm run test:security
	@echo "$(GREEN)✅ Security tests completed!$(NC)"

.PHONY: test-constructs
test-constructs: ## Run construct unit tests
	@echo "$(BLUE)🧩 Running construct unit tests...$(NC)"
	npm run test:constructs
	@echo "$(GREEN)✅ Construct unit tests completed!$(NC)"

.PHONY: test-validation
test-validation: ## Run infrastructure validation tests
	@echo "$(BLUE)✅ Running infrastructure validation tests...$(NC)"
	npm run test:validation
	@echo "$(GREEN)✅ Infrastructure validation tests completed!$(NC)"

.PHONY: security-scan
security-scan: ## Run security scanning
	@echo "$(BLUE)🔒 Running security scan...$(NC)"
	@if [ "$(SECURITY_SCAN)" = "true" ]; then \
		echo "$(YELLOW)Security scanning enabled - add your security tools here$(NC)"; \
		# Add security scanning commands here \
		# Example: tfsec, checkov, etc. \
	else \
		echo "$(YELLOW)Security scanning disabled$(NC)"; \
	fi

.PHONY: cost-analysis
cost-analysis: ## Run cost analysis
	@echo "$(BLUE)💰 Running cost analysis...$(NC)"
	@if [ "$(COST_ANALYSIS)" = "true" ]; then \
		echo "$(YELLOW)Cost analysis enabled - add your cost analysis tools here$(NC)"; \
		# Add cost analysis commands here \
		# Example: infracost, etc. \
	else \
		echo "$(YELLOW)Cost analysis disabled$(NC)"; \
	fi

.PHONY: clean
clean: ## Clean build artifacts
	@echo "$(BLUE)🧹 Cleaning build artifacts...$(NC)"
	rm -rf cdktf.out/
	rm -rf .gen/
	rm -rf node_modules/
	@echo "$(GREEN)✅ Clean completed!$(NC)"

.PHONY: development
development: ## Deploy to development environment
	@echo "$(BLUE)🛠️  Deploying to development environment...$(NC)"
	$(MAKE) ENVIRONMENT=development deploy

.PHONY: staging
staging: ## Deploy to staging environment
	@echo "$(BLUE)🔍 Deploying to staging environment...$(NC)"
	$(MAKE) ENVIRONMENT=staging deploy

.PHONY: production
production: ## Deploy to production environment
	@echo "$(BLUE)🚀 Deploying to production environment...$(NC)"
	$(MAKE) ENVIRONMENT=production deploy

.PHONY: plan-development
plan-development: ## Plan for development environment
	$(MAKE) ENVIRONMENT=development plan

.PHONY: plan-staging
plan-staging: ## Plan for staging environment
	$(MAKE) ENVIRONMENT=staging plan

.PHONY: plan-production
plan-production: ## Plan for production environment
	$(MAKE) ENVIRONMENT=production plan

.PHONY: validate-all
validate-all: ## Validate all environments
	@echo "$(BLUE)🔍 Validating all environments...$(NC)"
	$(MAKE) ENVIRONMENT=development validate
	$(MAKE) ENVIRONMENT=staging validate
	$(MAKE) ENVIRONMENT=production validate
	@echo "$(GREEN)✅ All environments validated!$(NC)"

.PHONY: security-check
security-check: security-scan cost-analysis ## Run all security and cost checks
	@echo "$(GREEN)✅ Security and cost checks completed!$(NC)"

.PHONY: pre-commit
pre-commit: validate test-security test-constructs test-validation security-check ## Run pre-commit checks
	@echo "$(GREEN)✅ Pre-commit checks passed!$(NC)"
