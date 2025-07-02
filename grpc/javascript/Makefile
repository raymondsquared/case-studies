# Variables
PROTO_DIRS=../go/cmd/helloworld
PROTO_JS_DIRS=protobuf

# Dependencies
.PHONY: dependencies
dependencies:
	npm install

# Generator
.PHONY: proto-generate-js
proto-generate-js:
	@for dir in $(PROTO_DIRS); do \
		for file in $$dir/*.proto; do \
			echo "Generating JS code from $$file ..."; \
			protoc \
				-I=$$dir \
				--js_out=import_style=commonjs,binary:$(PROTO_JS_DIRS) \
				--grpc_out=grpc_js:$(PROTO_JS_DIRS) \
				--plugin=protoc-gen-grpc=node_modules/grpc-tools/bin/grpc_node_plugin \
				$$file; \
		done \
	done
	@echo "JS code generation complete."

# Run
.PHONY: run-client
run-client:
	npm run start-client
