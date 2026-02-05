ENVIRONMENT ?= development
REGION ?= AUSTRALIA_EAST
VENDOR ?= AWS

TERRAFORM_WORKSPACE ?= case-studies-kubernetes-$(ENVIRONMENT)
TERRAFORM_HOSTNAME ?= app.terraform.io
	
ENVIRONMENT_DIRECTORY = environments/$(ENVIRONMENT)

-include .env
export

.PHONY: init
init:
	cd $(ENVIRONMENT_DIRECTORY) && terraform init

.PHONY: validate
validate:
	cd $(ENVIRONMENT_DIRECTORY) && terraform validate
	
.PHONY: lint
lint:
	terraform fmt -recursive

.PHONY: plan
plan: validate
	cd $(ENVIRONMENT_DIRECTORY) && terraform plan
	
.PHONY: deploy
deploy:
	cd $(ENVIRONMENT_DIRECTORY) && terraform apply -auto-approve

.PHONY: destroy
destroy:
	cd $(ENVIRONMENT_DIRECTORY) && terraform destroy

.PHONY: clean
clean:
	rm -rf .terraform
