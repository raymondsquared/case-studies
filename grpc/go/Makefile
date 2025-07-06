# Variables
ENVIRONMENT ?= development
PROTO_DIRS=cmd/helloworld cmd/movie
CONTAINER_IMAGE_VERSION ?= 0.0.2-202507006local
X_API_KEY ?= abcd-efgh-1234-5678
DOCKER_REGISTRY ?= raymondsquared
TLS_SANS=DNS:localhost,IP:127.0.0.1,IP:0.0.0.0,DNS:host.docker.internal

# Dependencies
.PHONY: dependencies
dependencies:
	go mod vendor

# Generator
.PHONY: proto-generate-go
proto-generate-go:
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
	@echo "Go code generation complete."

# Tests
.PHONY: test
test:
	go test -v ./...

.PHONY: test-coverage
test-coverage:
	go test -v -coverprofile=coverage.out -coverpkg=./internal/... ./...
	go tool cover -func=coverage.out

# Security
.PHONY: tls-ca
tls-ca:
	mkdir -p assets/tls
	openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
		-subj "/CN=grpc-ca" \
		-addext "subjectAltName=DNS:localhost,IP:127.0.0.1,IP:0.0.0.0,DNS:host.docker.internal" \
		-keyout assets/tls/ca-private.key -out assets/tls/ca-public.key

.PHONY: tls-server
tls-server: 
	openssl genrsa -out assets/tls/server-private.key 2048
	openssl req -new -key assets/tls/server-private.key -out assets/tls/server.csr \
		-subj "/CN=grpc-server" \
		-addext "subjectAltName=$(TLS_SANS)"
	printf "[v3_req]\nsubjectAltName=$(TLS_SANS)\n" > assets/tls/server-ext.conf
	openssl x509 -req -in assets/tls/server.csr -CA assets/tls/ca-public.key -CAkey assets/tls/ca-private.key \
		-CAcreateserial -out assets/tls/server-public.key -days 3650 \
		-extensions v3_req -extfile assets/tls/server-ext.conf
	rm -f assets/tls/server.csr assets/tls/server-ext.conf

.PHONY: tls-client
tls-client:
	openssl genrsa -out assets/tls/client-private.key 2048
	openssl req -new -key assets/tls/client-private.key -out assets/tls/client.csr \
		-subj "/CN=grpc-client" \
		-addext "subjectAltName=$(TLS_SANS)"
	printf "[v3_req]\nsubjectAltName=$(TLS_SANS)\n" > assets/tls/client-ext.conf
	openssl x509 -req -in assets/tls/client.csr -CA assets/tls/ca-public.key -CAkey assets/tls/ca-private.key \
		-CAcreateserial -out assets/tls/client-public.key -days 3650 \
		-extensions v3_req -extfile assets/tls/client-ext.conf
	rm -f assets/tls/client.csr assets/tls/client-ext.conf

.PHONY: tls
tls: tls-ca tls-server tls-client
	
# Run
.PHONY: run-helloworld-server
run-helloworld-server:
	ENVIRONMENT=$(ENVIRONMENT) go run cmd/helloworld/server/*.go

.PHONY: run-movie-server
run-movie-server:
	ENVIRONMENT=$(ENVIRONMENT) go run cmd/movie/server/*.go
	
.PHONY: run-movie-rest-server
run-movie-rest-server:
	ENVIRONMENT=$(ENVIRONMENT) go run cmd/movie/rest/server/*.go \
		-server_cert assets/tls/server-public.key \
		-server_key assets/tls/server-private.key \
		-ca_cert assets/tls/ca-public.key

.PHONY: run-helloworld-client
run-helloworld-client:
	ENVIRONMENT=$(ENVIRONMENT) go run cmd/helloworld/client/*.go

.PHONY: run-movie-client
run-movie-client:
	ENVIRONMENT=$(ENVIRONMENT) X_API_KEY=$(X_API_KEY) go run cmd/movie/client/*.go

.PHONY: run-movie-stream-client
run-movie-stream-client:
	ENVIRONMENT=$(ENVIRONMENT) X_API_KEY=$(X_API_KEY) go run cmd/movie/stream/client/*.go

.PHONY: run-movie-rest-client
run-movie-rest-client:
	ENVIRONMENT=$(ENVIRONMENT) go run cmd/movie/rest/client/*.go \
		-client_cert assets/tls/client-public.key \
		-client_key assets/tls/client-private.key \
		-ca_cert assets/tls/ca-public.key

.PHONY: run-helloworld-e2e
run-helloworld-e2e:
	CONTAINER_IMAGE_VERSION=$(CONTAINER_IMAGE_VERSION) \
		docker compose -p grpc-helloworld \
		-f deployments/docker/helloworld-compose.yaml up -d

.PHONY: run-movie-e2e
run-movie-e2e:
	CONTAINER_IMAGE_VERSION=$(CONTAINER_IMAGE_VERSION) \
		docker compose -p grpc-movie \
		-f deployments/docker/movie-compose.yaml up -d

.PHONY: prepare-k8s
prepare-k8s: 
	helm template local-release \
		-f deployments/kubernetes/helm/grpc-go/values.yaml \
		deployments/kubernetes/helm/grpc-go > \
		deployments/kubernetes/helm-output.yaml

.PHONY: run-k8s
run-k8s: prepare-k8s
	kubectl apply -f deployments/kubernetes/helm-output.yaml

.PHONY: health-check
health-check:
	./scripts/health-check.sh

# Clean
.PHONY: clean-k8s
clean-k8s:
	kubectl delete -f deployments/kubernetes/helm-output.yaml

.PHONY: clean-coverage
clean-coverage:
	rm -f coverage.out coverage.html

# Build
.PHONY: build-server
build-server:
	go build -o bin/grpc-helloworld-server ./cmd/helloworld/server/
	go build -o bin/grpc-movie-server ./cmd/movie/server/

.PHONY: build-client
build-client:
	go build -o bin/grpc-helloworld-client ./cmd/helloworld/client/
	go build -o bin/grpc-movie-client ./cmd/movie/client/
	go build -o bin/grpc-movie-stream-client ./cmd/movie/stream/client/

.PHONY: build
build: build-server build-client

.PHONY: build-linux-server
build-linux-server:
	CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -ldflags="-w -s" \
		-o bin/grpc-helloworld-server ./cmd/helloworld/server/
	CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -ldflags="-w -s" \
		-o bin/grpc-movie-server ./cmd/movie/server/

.PHONY: build-linux-client
build-linux-client:
	CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -ldflags="-w -s" \
		-o bin/grpc-helloworld-client ./cmd/helloworld/client/
	CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -ldflags="-w -s" \
		-o bin/grpc-movie-client ./cmd/movie/client/
	CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -ldflags="-w -s" \
		-o bin/grpc-movie-stream-client ./cmd/movie/stream/client/

# Package
.PHONY: package-helloworld-server
package-helloworld-server:
	docker build -t $(DOCKER_REGISTRY)/grpc-helloworld-server:$(CONTAINER_IMAGE_VERSION) \
		--platform linux/amd64 -f deployments/docker/helloworld-server/Dockerfile .

.PHONY: package-helloworld-client
package-helloworld-client:
	docker build -t $(DOCKER_REGISTRY)/grpc-helloworld-client:$(CONTAINER_IMAGE_VERSION) \
		--platform linux/amd64 -f deployments/docker/helloworld-client/Dockerfile .

.PHONY: package-helloworld-full
package-helloworld-full:
	docker build -t $(DOCKER_REGISTRY)/grpc-helloworld-full:$(CONTAINER_IMAGE_VERSION) \
		--platform linux/amd64 -f deployments/docker/helloworld-full/Dockerfile .

.PHONY: package-helloworld-server-arm
package-helloworld-server-arm:
	docker build -t $(DOCKER_REGISTRY)/grpc-helloworld-server:$(CONTAINER_IMAGE_VERSION) \
		--platform linux/arm64 -f deployments/docker/helloworld-server/Dockerfile .

.PHONY: package-helloworld-client-arm
package-helloworld-client-arm:
	docker build -t $(DOCKER_REGISTRY)/grpc-helloworld-client:$(CONTAINER_IMAGE_VERSION) \
		--platform linux/arm64 -f deployments/docker/helloworld-client/Dockerfile .

.PHONY: package-helloworld-full-arm
package-helloworld-full-arm:
	docker build -t $(DOCKER_REGISTRY)/grpc-helloworld-full:$(CONTAINER_IMAGE_VERSION) \
		--platform linux/arm64 -f deployments/docker/helloworld-full/Dockerfile .

.PHONY: package-movie-server
package-movie-server:
	docker build -t $(DOCKER_REGISTRY)/grpc-movie-server:$(CONTAINER_IMAGE_VERSION) \
		--platform linux/amd64 -f deployments/docker/movie-server/Dockerfile .

.PHONY: package-movie-client
package-movie-client:
	docker build -t $(DOCKER_REGISTRY)/grpc-movie-client:$(CONTAINER_IMAGE_VERSION) \
		--platform linux/amd64 -f deployments/docker/movie-client/Dockerfile .

.PHONY: package-movie-server-arm
package-movie-server-arm:
	docker build -t $(DOCKER_REGISTRY)/grpc-movie-server:$(CONTAINER_IMAGE_VERSION) \
		--platform linux/arm64 -f deployments/docker/movie-server/Dockerfile .

.PHONY: package-movie-client-arm
package-movie-client-arm:
	docker build -t $(DOCKER_REGISTRY)/grpc-movie-client:$(CONTAINER_IMAGE_VERSION) \
		--platform linux/arm64 -f deployments/docker/movie-client/Dockerfile .

.PHONY: package-helloworld
package-helloworld: package-helloworld-server package-helloworld-client

.PHONY: package-movie
package-movie: package-movie-server package-movie-client

.PHONY: package-helloworld-arm
package-helloworld-arm: package-helloworld-server-arm package-helloworld-client-arm package-helloworld-full-arm

.PHONY: package-movie-arm
package-movie-arm: package-movie-server-arm package-movie-client-arm

# Publish
.PHONY: publish-helloworld-server
publish-helloworld-server:
	docker push $(DOCKER_REGISTRY)/grpc-helloworld-server:$(CONTAINER_IMAGE_VERSION)

.PHONY: publish-helloworld-client
publish-helloworld-client:
	docker push $(DOCKER_REGISTRY)/grpc-helloworld-client:$(CONTAINER_IMAGE_VERSION)

.PHONY: publish-helloworld-full
publish-helloworld-full:
	docker push $(DOCKER_REGISTRY)/grpc-helloworld-full:$(CONTAINER_IMAGE_VERSION)

.PHONY: publish-movie-server
publish-movie-server:
	docker push $(DOCKER_REGISTRY)/grpc-movie-server:$(CONTAINER_IMAGE_VERSION)

.PHONY: publish-movie-client
publish-movie-client:
	docker push $(DOCKER_REGISTRY)/grpc-movie-client:$(CONTAINER_IMAGE_VERSION)

.PHONY: publish-helloworld-all
publish-helloworld-all: publish-helloworld-server publish-helloworld-client publish-helloworld-full

.PHONY: publish-movie-all
publish-movie-all: publish-movie-server publish-movie-client 