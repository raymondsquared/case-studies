# gRPC Case Studies (Javascript Version)

## Drawbacks

- Protobuf Editions: Protobuf Editions are a newer way of defining .proto files, replacing the syntax = "proto2" and syntax = "proto3" declarations. They offer a more granular, feature-based approach to defining message behaviors, allowing for incremental evolution of the Protobuf language and better control over features like field presence, JSON mapping, and more. Edition 2023 is the first official edition.

- Go's Faster Adoption: Go, often being a primary language for backend gRPC services and having strong ties to Google's development, tends to receive support for new Protobuf features and editions relatively quickly. Recent GitHub issues and merges indicate that protoc-gen-go-grpc (the Go gRPC code generator) has recently added or is actively adding support for Edition 2023. This means Go developers can leverage the latest Protobuf language features and their associated benefits.

- JavaScript's Potential Limitation: JavaScript (and specifically protobuf.js or @grpc/grpc-js and grpc_tools_node_protoc) might indeed lag in full, official support for the very latest Protobuf Editions, including Edition 2023. While protobuf.js is a robust library and can parse .proto files, explicit support for all the nuances of Protobuf Editions might take time to trickle down.

## Usage & Code Examples

### Run Locally

**Example**:

```bash
make proto-generate-js
make run-client
```
