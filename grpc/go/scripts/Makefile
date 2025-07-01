# Variables
PROTO_DIRS=../cmd/helloworld ../cmd/movie
CONTAINER_IMAGE_VERSION=0.0.2-20250701local

# Dependencies
.PHONY: dependencies
dependencies:
	go mod vendor

# Generator
.PHONY: proto-generate
proto-generate:
	@for dir in $(PROTO_DIRS); do \
		echo "Generating Go code from proto files in $$dir ..."; \
		protoc \
			-I=$$dir \
			--go_out=$$dir \
			--go_opt=paths=source_relative \
			--go-grpc_out=$$dir \
			--go-grpc_opt=paths=source_relative \
			$$dir/*.proto; \
	done
	@echo "Generation complete."

# Tests
.PHONY: test
test:
	go test -v ./../...

# Run
.PHONY: run-server
run-server:
	go run ../cmd/greeter_server/*.go

.PHONY: run-client
run-client:
	go run ../cmd/greeter_client/*.go

.PHONY: run-e2e
run-e2e:
	CONTAINER_IMAGE_VERSION=$(CONTAINER_IMAGE_VERSION) docker compose -p grpc-greeter -f ../deployments/docker/compose.yaml up -d

.PHONY: prepare-k8s
prepare-k8s: 
	helm template local-release -f ../deployments/kubernetes/helm/grpc-go/values.yaml ../deployments/kubernetes/helm/grpc-go > ../deployments/kubernetes/helm-output.yaml

.PHONY: run-k8s
run-k8s: prepare-k8s
	kubectl apply -f ../deployments/kubernetes/helm-output.yaml

# Clean
.PHONY: clean-k8s
clean-k8s:
	kubectl delete -f ../deployments/kubernetes/helm-output.yaml

# Build
.PHONY: build-server
build-server:
	go build -o ../bin/grpc-greeter-server ../cmd/greeter_server/

.PHONY: build-client
build-client:
	go build -o ../bin/grpc-greeter-client ../cmd/greeter_client/

.PHONY: build
build: build-server build-client

.PHONY: build-linux-server
build-linux-server:
	CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -ldflags="-w -s" -o ../bin/grpc-greeter-server ../cmd/greeter_server/

.PHONY: build-linux-client
build-linux-client:
	CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -ldflags="-w -s" -o ../bin/grpc-greeter-client ../cmd/greeter_client/

# Package
.PHONY: package-server
package-server:
	docker build -t raymondsquared/grpc-helloworld-server:$(CONTAINER_IMAGE_VERSION) --platform linux/amd64 -f ../deployments/docker/server/Dockerfile ../

.PHONY: package-client
package-client:
	docker build -t raymondsquared/grpc-helloworld-client:$(CONTAINER_IMAGE_VERSION) --platform linux/amd64 -f ../deployments/docker/client/Dockerfile ../

.PHONY: package-full
package-full:
	docker build -t raymondsquared/grpc-helloworld-full:$(CONTAINER_IMAGE_VERSION) --platform linux/amd64 -f ../deployments/docker/full/Dockerfile ../

.PHONY: package-server-arm
package-server-arm:
	docker build -t raymondsquared/grpc-helloworld-server:$(CONTAINER_IMAGE_VERSION) --platform linux/arm64 -f ../deployments/docker/server/Dockerfile ../

.PHONY: package-client-arm
package-client-arm:
	docker build -t raymondsquared/grpc-helloworld-client:$(CONTAINER_IMAGE_VERSION) --platform linux/arm64 -f ../deployments/docker/client/Dockerfile ../

.PHONY: package-full-arm
package-full-arm:
	docker build -t raymondsquared/grpc-helloworld-full:$(CONTAINER_IMAGE_VERSION) --platform linux/arm64 -f ../deployments/docker/full/Dockerfile ../

.PHONY: package
package: package-server package-client

.PHONY: package-arm
package-arm: package-server-arm package-client-arm package-full-arm

# Publish
.PHONE: publish-server
publish-server:
	docker push raymondsquared/grpc-helloworld-server:$(CONTAINER_IMAGE_VERSION)

.PHONE: publish-client
publish-client:
	docker push raymondsquared/grpc-helloworld-client:$(CONTAINER_IMAGE_VERSION)

.PHONE: publish-full
publish-full:
	docker push raymondsquared/grpc-helloworld-full:$(CONTAINER_IMAGE_VERSION)

.PHONE: publish-all
publish-all: publish-server publish-client publish-full
