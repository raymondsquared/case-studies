.PHONY: run-server
run-server:
	go run ../cmd/greeter_server/main.go

.PHONY: run-client
run-client:
	go run ../cmd/greeter_client/main.go

.PHONY: run-e2e
run-e2e:
	docker compose -p grpc-greeter -f ../deployments/compose.yaml up -d

.PHONY: run-k8s
run-k8s:
	kubectl apply -f ../deployments/kubernetes/manifests.yaml

.PHONY: build-server
build-server:
	go build -o grpc-greeter-server ../cmd/greeter_server/

.PHONY: build-client
build-client:
	go build -o grpc-greeter-client ../cmd/greeter_client/

.PHONY: build-all
build-all: build-server build-client

.PHONY: build-linux-server
build-linux-server:
	CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -ldflags="-w -s" -o grpc-greeter-server ../cmd/greeter_server/

.PHONY: build-linux-client
build-linux-client:
	CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -ldflags="-w -s" -o grpc-greeter-client ../cmd/greeter_client/

.PHONY: build-linux-all
build-linux-all: build-linux-server build-linux-client

.PHONY: package-server
package-server:
	docker build -t raymondsquared/grpc-helloworld-server:0.0.2-20250625a --platform linux/amd64,linux/arm64 -f ../deployments/Dockerfile.server ../

.PHONY: package-client
package-client:
	docker build -t raymondsquared/grpc-helloworld-client:0.0.2-20250625a --platform linux/amd64,linux/arm64 -f ../deployments/Dockerfile.client ../

.PHONY: package-full
package-full:
	docker build -t raymondsquared/grpc-helloworld-full:0.0.2-20250625b --platform linux/amd64,linux/arm64 -f ../deployments/Dockerfile.full ../

.PHONY: package-all
package-all: package-server package-client package-full

.PHONE: publish-server
publish-server:
	docker push raymondsquared/grpc-helloworld-server:0.0.2-20250625a

.PHONE: publish-client
publish-client:
	docker push raymondsquared/grpc-helloworld-client:0.0.2-20250625a

.PHONE: publish-full
publish-full:
	docker push raymondsquared/grpc-helloworld-full:0.0.2-20250625b

.PHONE: publish-all
publish-all: publish-server publish-client publish-full
