.PHONY: run-server
run-server:
	go run ../cmd/greeter_server/main.go

.PHONY: run-client
run-client:
	go run ../cmd/greeter_client/main.go

.PHONY: run-all
run-all:
	docker compose -p grpc-greeter -f ../build/package/compose.yaml up -d

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

.PHONY: package-server
package-server:
	docker build -t raymondsquared/grpc-helloworld-server:0.0.1 --platform linux/amd64,linux/arm64 -f ../build/package/Dockerfile.server ../

.PHONY: package-client
package-client:
	docker build -t raymondsquared/grpc-helloworld-client:0.0.1 --platform linux/amd64,linux/arm64 -f ../build/package/Dockerfile.client ../

.PHONY: package-all
package-all: package-server package-client

.PHONE: publish-server
publish-server:
	docker push raymondsquared/grpc-helloworld-server:0.0.1

.PHONE: publish-client
publish-client:
	docker push raymondsquared/grpc-helloworld-client:0.0.1

.PHONE: publish-all
publish-all: publish-server publish-client
