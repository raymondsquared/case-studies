# Variables
PROTO_DIRS=../cmd/helloworld ../cmd/movie
PROTO_JS_DIRS=../../javascript/protobuf
CONTAINER_IMAGE_VERSION=0.0.2-20250701local

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
	go test -v ./../...

# Run
.PHONY: run-helloworld-server
run-helloworld-server:
	go run ../cmd/greeter_server/*.go

.PHONY: run-movie-server
run-movie-server:
	go run ../cmd/movie_server/*.go

.PHONY: run-helloworld-client
run-helloworld-client:
	go run ../cmd/greeter_client/*.go

.PHONY: run-movie-client
run-movie-client:
	go run ../cmd/movie_client/*.go

.PHONY: run-helloworld-e2e
run-helloworld-e2e:
	CONTAINER_IMAGE_VERSION=$(CONTAINER_IMAGE_VERSION) docker compose -p grpc-greeter -f ../deployments/docker/helloworld-compose.yaml up -d

.PHONY: run-movie-e2e
run-movie-e2e:
	CONTAINER_IMAGE_VERSION=$(CONTAINER_IMAGE_VERSION) docker compose -p grpc-movie -f ../deployments/docker/movie-compose.yaml up -d

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
	go build -o ../bin/grpc-movie-server ../cmd/movie_server/

.PHONY: build-client
build-client:
	go build -o ../bin/grpc-greeter-client ../cmd/greeter_client/
	go build -o ../bin/grpc-movie-client ../cmd/movie_client/

.PHONY: build
build: build-server build-client

.PHONY: build-linux-server
build-linux-server:
	CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -ldflags="-w -s" -o ../bin/grpc-greeter-server ../cmd/greeter_server/
	CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -ldflags="-w -s" -o ../bin/grpc-movie-server ../cmd/movie_server/

.PHONY: build-linux-client
build-linux-client:
	CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -ldflags="-w -s" -o ../bin/grpc-greeter-client ../cmd/greeter_client/
	CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -ldflags="-w -s" -o ../bin/grpc-movie-client ../cmd/movie_client/

# Package
.PHONY: package-helloworld-server
package-helloworld-server:
	docker build -t raymondsquared/grpc-helloworld-server:$(CONTAINER_IMAGE_VERSION) --platform linux/amd64 -f ../deployments/docker/helloworld-server/Dockerfile ../

.PHONY: package-helloworld-client
package-helloworld-client:
	docker build -t raymondsquared/grpc-helloworld-client:$(CONTAINER_IMAGE_VERSION) --platform linux/amd64 -f ../deployments/docker/helloworld-client/Dockerfile ../

.PHONY: package-helloworld-full
package-helloworld-full:
	docker build -t raymondsquared/grpc-helloworld-full:$(CONTAINER_IMAGE_VERSION) --platform linux/amd64 -f ../deployments/docker/helloworld-full/Dockerfile ../

.PHONY: package-helloworld-server-arm
package-helloworld-server-arm:
	docker build -t raymondsquared/grpc-helloworld-server:$(CONTAINER_IMAGE_VERSION) --platform linux/arm64 -f ../deployments/docker/helloworld-server/Dockerfile ../

.PHONY: package-helloworld-client-arm
package-helloworld-client-arm:
	docker build -t raymondsquared/grpc-helloworld-client:$(CONTAINER_IMAGE_VERSION) --platform linux/arm64 -f ../deployments/docker/helloworld-client/Dockerfile ../

.PHONY: package-helloworld-full-arm
package-helloworld-full-arm:
	docker build -t raymondsquared/grpc-helloworld-full:$(CONTAINER_IMAGE_VERSION) --platform linux/arm64 -f ../deployments/docker/helloworld-full/Dockerfile ../

.PHONY: package-movie-server
package-movie-server:
	docker build -t raymondsquared/grpc-movie-server:$(CONTAINER_IMAGE_VERSION) --platform linux/amd64 -f ../deployments/docker/movie-server/Dockerfile ../

.PHONY: package-movie-client
package-movie-client:
	docker build -t raymondsquared/grpc-movie-client:$(CONTAINER_IMAGE_VERSION) --platform linux/amd64 -f ../deployments/docker/movie-client/Dockerfile ../

.PHONY: package-movie-server-arm
package-movie-server-arm:
	docker build -t raymondsquared/grpc-movie-server:$(CONTAINER_IMAGE_VERSION) --platform linux/arm64 -f ../deployments/docker/movie-server/Dockerfile ../

.PHONY: package-movie-client-arm
package-movie-client-arm:
	docker build -t raymondsquared/grpc-movie-client:$(CONTAINER_IMAGE_VERSION) --platform linux/arm64 -f ../deployments/docker/movie-client/Dockerfile ../

.PHONY: package-helloworld
package-helloworld: package-helloworld-server package-helloworld-client

.PHONY: package-movie
package-movie: package-movie-server package-movie-client

.PHONY: package-helloworld-arm
package-helloworld-arm: package-helloworld-server-arm package-helloworld-client-arm package-helloworld-full-arm

.PHONY: package-movie-arm
package-movie-arm: package-movie-server-arm package-movie-client-arm

# Publish
.PHONE: publish-helloworld-server
publish-helloworld-server:
	docker push raymondsquared/grpc-helloworld-server:$(CONTAINER_IMAGE_VERSION)

.PHONE: publish-helloworld-client
publish-helloworld-client:
	docker push raymondsquared/grpc-helloworld-client:$(CONTAINER_IMAGE_VERSION)

.PHONE: publish-helloworld-full
publish-helloworld-full:
	docker push raymondsquared/grpc-helloworld-full:$(CONTAINER_IMAGE_VERSION)

.PHONE: publish-movie-server
publish-movie-server:
	docker push raymondsquared/grpc-movie-server:$(CONTAINER_IMAGE_VERSION)

.PHONE: publish-movie-client
publish-movie-client:
	docker push raymondsquared/grpc-movie-client:$(CONTAINER_IMAGE_VERSION)

.PHONE: publish-helloworld-all
publish-helloworld-all: publish-helloworld-server publish-helloworld-client publish-helloworld-full

.PHONE: publish-movie-all
publish-movie-all: publish-movie-server publish-movie-client
