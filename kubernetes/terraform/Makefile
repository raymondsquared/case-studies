ENVIRONMENT ?= development
REGION ?= AUSTRALIA_EAST
VENDOR ?= AWS

TERRAFORM_WORKSPACE ?= case-studies-kubernetes-$(ENVIRONMENT)
TERRAFORM_HOSTNAME ?= app.terraform.io

AWS_REGION ?= ap-southeast-2

EKS_VERSION ?= 1.33

.PHONY: dependencies
dependencies:
	npm install
	cdktf get

.PHONY: lint
lint:
	npx prettier --write .
	npm run lint

.PHONY: test-build
test-build:
	npm run test:build

.PHONY: test
test: test-build
	npm run test

.PHONY: test-coverage
test-coverage:
	npm test -- --coverage \
		--collectCoverageFrom='src/**/*.ts'\
		--collectCoverageFrom='!src/**/*.d.ts' \
		--collectCoverageFrom='!**/node_modules/**' \
		--collectCoverageFrom='!**/.gen/**'

.PHONY: validate
validate:
	ENVIRONMENT=$(ENVIRONMENT) \
	REGION=$(REGION) \
	VENDOR=$(VENDOR) \
 	TERRAFORM_WORKSPACE=$(TERRAFORM_WORKSPACE) \
	TERRAFORM_HOSTNAME=$(TERRAFORM_HOSTNAME) \
	cdktf synth

.PHONY: plan
plan: validate
	ENVIRONMENT=$(ENVIRONMENT) \
	REGION=$(REGION) \
	VENDOR=$(VENDOR) \
	TERRAFORM_WORKSPACE=$(TERRAFORM_WORKSPACE) \
	TERRAFORM_HOSTNAME=$(TERRAFORM_HOSTNAME) \
	cdktf plan

.PHONY: deploy
deploy:
	ENVIRONMENT=$(ENVIRONMENT) \
	REGION=$(REGION) \
	VENDOR=$(VENDOR) \
	TERRAFORM_WORKSPACE=$(TERRAFORM_WORKSPACE) \
	TERRAFORM_HOSTNAME=$(TERRAFORM_HOSTNAME) \
	cdktf deploy --auto-approve

.PHONY: destroy
destroy:
	ENVIRONMENT=$(ENVIRONMENT) \
	REGION=$(REGION) \
	VENDOR=$(VENDOR) \
	TERRAFORM_WORKSPACE=$(TERRAFORM_WORKSPACE) \
	TERRAFORM_HOSTNAME=$(TERRAFORM_HOSTNAME) \
	cdktf destroy

.PHONY: clean
clean:
	rm -rf cdktf.out/
	rm -rf .gen/
	rm -rf node_modules/
