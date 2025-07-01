.PHONY: dependencies
dependencies:
	go mod vendor

PROTO_DIRS=../cmd/helloworld

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

.PHONY: test
test:
	go test -v ./../...

.PHONY: run-server
run-server:
	go run ../cmd/greeter_server/*.go

.PHONY: run-client
run-client:
	go run ../cmd/greeter_client/*.go

.PHONY: run-e2e
run-e2e:
	docker compose -p grpc-greeter -f ../deployments/docker/compose.yaml up -d

.PHONY: run-k8s
run-k8s:
	kubectl apply -f ../deployments/kubernetes/manifests.yaml

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

.PHONY: package-server
package-server:
	docker build -t raymondsquared/grpc-helloworld-server:0.0.2-20250630a --platform linux/arm64,linux/amd64 -f ../deployments/docker/server/Dockerfile ../

.PHONY: package-client
package-client:
	docker build -t raymondsquared/grpc-helloworld-client:0.0.2-20250630a --platform linux/arm64,linux/amd64 -f ../deployments/docker/client/Dockerfile ../

.PHONY: package-full
package-full:
	docker build -t raymondsquared/grpc-helloworld-full:0.0.2-20250630a --platform linux/arm64,linux/amd64 -f ../deployments/docker/full/Dockerfile ../

.PHONY: package-full-mac
package-full-mac:
	docker build -t raymondsquared/grpc-helloworld-full:0.0.2-20250630a --platform linux/arm64 -f ../deployments/docker/full/Dockerfile ../

.PHONY: package
package: package-server package-client package-full

.PHONE: publish-server
publish-server:
	docker push raymondsquared/grpc-helloworld-server:0.0.2-20250630a

.PHONE: publish-client
publish-client:
	docker push raymondsquared/grpc-helloworld-client:0.0.2-20250630a

.PHONE: publish-full
publish-full:
	docker push raymondsquared/grpc-helloworld-full:0.0.2-20250630a

.PHONE: publish-all
publish-all: publish-server publish-client publish-full
