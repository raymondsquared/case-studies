# gRPC Case Studies

## Overview

This repository demonstrates the power of gRPC (Google Remote Procedure Call) through practical examples and real-world use cases.
gRPC is a high-performance, open-source universal RPC framework that enables efficient communication between services in a distributed system.

## Features

- **gRPC Server & Client**: Complete implementation of a service
  - Server: Implements a gRPC service that handles incoming requests, processes data, and returns responses. [See screenshot](#screenshot---grpc-server).
  - Client: Connects to the gRPC server primarily for sending requests to the server.
  
- **Protocol Buffers**: Type-safe message definitions in a compressed format.

  - Compact Data Storage: Protobuf encodes data in a compact binary format, which significantly reduces payload size.
  - Strongly Typed & Schema-Driven: Protobuf uses predefined schemas (`.proto` files) that clearly define data structures, providing:
    - Compile-time type checking
    - Self-documenting service contracts
  - Cross-Language Support: Protobuf enables communication between services written in different languages (e.g., Go, Python, Java, C#, Node.js) by generating client and server code from the same `.proto` definitions.
  - Optimized Code Generation: Automatically generates efficient classes using [protoc](https://pkg.go.dev/github.com/golang/protobuf/protoc-gen-go).
    - [messages](cmd/helloworld/helloworld_messages.pb.go)
    - [services](cmd/helloworld/helloworld_services.pb.go)
    - [gRPC](cmd/helloworld/helloworld_services_grpc.pb.go)
  - Backward & Forward Compatibility: Protobuf's schema evolution.

- **Streaming**: Demonstrates gRPC's support for client-server, and bidirectional streaming, enabling efficient handling of large data sets and real-time communication.
- **Auth**: Supports authentication and authorization mechanisms, including SSL/TLS for encrypted communication, token-based authentication, and integration with existing identity providers.
- **Performance**: High performance, using HTTP/2 for multiplexed streams, header compression, and efficient binary serialisation via Protocol Buffers.

## Drawbacks

- Protocol buffers tend to assume that entire messages can be loaded into memory at once and are not larger than an object graph. For data that exceeds a few megabytes, consider a different solution; when working with larger data, you may effectively end up with several copies of the data due to serialised copies, which can cause surprising spikes in memory usage.
- When protocol buffers are serialised, the same data can have many different binary serializations. You cannot compare two messages for equality without fully parsing them.
- Protocol buffers are not well supported in non-object-oriented languages popular in scientific computing, such as Fortran and IDL.
- Protocol buffer messages don't inherently self-describe their data, but they have a fully reflective schema that you can use to implement self-description. That is, you cannot fully interpret one without access to its corresponding `.proto` file.
- Protocol buffers are not a formal standard of any organisation. This makes them unsuitable for use in environments with legal or other requirements to build on top of standards.

## Getting Started

- **Prerequisites**: List of required tools and versions
- **Project Structure**: Visual representation of the codebase organisation

### Project Structure

```
grpc/go/
├── cmd/                    # Application entry points
│   ├── greeter_client/     # gRPC client implementation
│   ├── greeter_server/     # gRPC server implementation
│   └── helloworld/         # Protocol Buffer definitions
├── internal/               # Internal packages
│   ├── config/             # Configuration management
│   ├── middleware/         # gRPC middleware
│   └── validation/         # Input validation
├── deployments/            # Deployment configurations
│   ├── docker/             # Docker configurations
│   └── kubernetes/         # Kubernetes manifests
├── scripts/                # Build and deployment scripts
│   └── Makefile            # Makefile
├── bin/                    # Compiled binaries
├── vendor/                 # Go dependencies
├── go.mod                  # Go module definition
├── go.sum                  # Go module checksums
└── README.md               # Project documentation
```

## Technologies Used

- **Makefile**: Build automation
- **Go 1.24 or higher**: Programming language

## Setup & Installation

- **Install Go lang**
- **Install Go dependencies**:
  ```bash
  make dependencies
  ```

## Usage & Code Examples

### Run Locally

**Example**:

```bash
make run-server
make run-client
```

### Run Docker Compose

**Example**:

```bash
make package
make run-e2e
```

## Screenshots

#### Screenshot - GRPC Server
<img src="assets/grpc-server.png" alt="gRPC Server" width="400" />

## Testing

```bash
make test
```

## API Reference

The project implements a simple Hello World gRPC service:

```protobuf
service Greeter {
  rpc SayHello (HelloRequest) returns (HelloReply) {}
}
```

```protobuf
message HelloRequest {
  string name = 1;
}

message HelloReply {
  string message = 1;
}
```

## Inspiration

- [3musketeers](https://3musketeers.io/)
- [gRPC](https://grpc.io/)
- [Golang - Project Layout](https://github.com/golang-standards/project-layout)
- TODO

## Contact

Repository by [Raymond](https://github.com/raymondsquared).  
For questions, feedback, or collaboration opportunities, feel free to reach out via GitHub or LinkedIn.
