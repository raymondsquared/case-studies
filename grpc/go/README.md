# gRPC Case Studies

## Overview

This repository demonstrates the power of gRPC (Google Remote Procedure Call) through practical examples and real-world use cases.
gRPC is a high-performance, open-source universal RPC framework that enables efficient communication between services in a distributed system.

## Features

- **gRPC Server & Client**: Complete implementation of a service

  - Server: Implements a gRPC service that handles incoming requests, processes data, and returns responses. [See screenshot](#screenshot---grpc-server).
  - Client: Connects to the gRPC server primarily for sending requests to the server.

- **Protocol Buffers**: See [Protocol Buffers](#protocol-buffers) section below for more details.

- **[HTTP/2](https://http2.github.io/)** is a replacement for HTTP/1.x.

  - Binary support: Uses a binary framing layer, being a successor of the text-based HTTP/1.x.
  - Data compression of HTTP headers.
  - HTTP/2 Server Push: Allows servers to proactively send resources to clients without an explicit request.
    - But it's not truly full-duplex: Communication is still initiated by the client.
  - Multiplexing multiple requests over a single TCP connection, graceful shutdown using [GOAWAY](https://httpwg.org/specs/rfc9113.html#rfc.section.6.8) frames.

- **Streaming**: Supports for client-server, and bidirectional streaming, enabling efficient handling of high-volume data sets and real-time communication.

  Bidirectional streaming avoids the overhead of establishing a new connection for each message, reducing latency and improving throughput compared to traditional request/response models.

  See [stream](cmd/movie/movie_services.proto) example.

  - What does it mean for [WebSockets](https://websocket.org/) then?

    While HTTP/2 now addresses many use cases previously handled by WebSockets,
    One key distinction is in the ability to push of raw binary data from a server directly to a JavaScript client within a web browser.
    While HTTP/2 is designed with bidirectional binary streaming capabilities,

    - current browser JavaScript APIs do not yet offer native support for consuming these binary data frames directly.
    - Browser APIs (like Fetch) often don't expose HTTP/2's full-duplex capabilities for request-response.

- **Security and Auth**: Supports security, authentication and authorisation mechanisms, including SSL/TLS and mTLS for encrypted communication, token-based authentication, and integration with existing identity providers.

  - See [security](assets/certificate.crt) example.
  - See [auth](assets/api-config.yaml) example.

- **Performance**: High performance, using HTTP/2 for multiplexed streams, header compression, and efficient binary serialisation via Protocol Buffers.

### Protocol Buffers

Type-safe message definitions in a compressed format.

- Compact Data Storage: Protobuf encodes data in a compact binary format, which significantly reduces payload size.
  - | [JSON](assets/movie-data.json) | [Protocol Buffer](assets/movie-data.textpb) |
    | ------------------------------ | ------------------------------------------- |
    | 622 KB                         | 209 KB                                      |
- Strongly Typed & Schema-Driven: Protobuf uses predefined schemas (`.proto` files) that clearly define data structures, providing: compile-time type checking and self-documenting service contracts
  - [messages](cmd/movie/movie_messages.proto)
  - [services](cmd/movie/movie_services.proto)
- Cross-Language Support: Protobuf enables communication between services written in different languages (e.g., Go, Python, Java, C#, Node.js) by generating client and server code from the same `.proto` definitions.
  - [Javascript](../javascript/)
- Optimised Code Generation: Automatically generates efficient classes using [protoc](https://pkg.go.dev/github.com/golang/protobuf/protoc-gen-go).
  - [messages](cmd/helloworld/helloworld_messages.pb.go)
  - [services](cmd/helloworld/helloworld_services.pb.go)
  - [gRPC](cmd/helloworld/helloworld_services_grpc.pb.go)
- Backward & Forward Compatibility: Protobuf's schema evolution.

  1. Don't Re-use a Tag Number

  2. Do Reserve Names and Tag Numbers for Deleted Fields

  3. Don't Change the Type of a Field

     It messes up deserialisation. There could be serialised versions of proto somewhere.

     ```proto
     message Movie {
       string movie_id = 1;

       // Deprecated property
       // string title = 2;

       // Good: Reserve Names and Tag Numbers
       reserved "title";
       reserved 2;

       // Good: new a Tag Name and Number
       string good_new_title = 3;

       // Bad: It messes up deserialisation with older version of proto
       int32 title = 2;

       // Bad: It messes up deserialisation with older version of proto
       string good_new_title = 2;
     }
     ```

  4. Include a Version Field to Allow for Consistent Reads

  5. Don't Include Primitive Types in a Top-level Request or Response Proto

     Your top-level proto should almost always be a container for other messages that can grow independently.

     ```proto
     message VersionInfo {
       int64 timestamp = 1;
       string source_id = 2;
     }
     ```

     ```proto
     message GetMovieOuput {
       repeated Movie movies = 1;
       VersionInfo version_info = 2;
     }
     ```

     ```proto
     message Movie {
       string movie_id = 1;
       string title = 2;
       Director director = 3;
     }
     ```

  6. For Mutations, Support Partial Updates or Append-Only Updates, Not Full Replaces

## Drawbacks

- Protocol buffers tend to assume that entire messages can be loaded into memory at once and are not larger than an object graph. For data that exceeds a few megabytes, consider a different solution; when working with larger data, you may effectively end up with several copies of the data due to serialised copies, which can cause surprising spikes in memory usage.
- When protocol buffers are serialised, the same data can have many different binary serialisations. You cannot compare two messages for equality without fully parsing them.
- gRPC are not well supported in non-object-oriented languages popular in scientific computing, such as Fortran and IDL.
- Protocol buffer messages don't inherently self-describe their data, but they have a fully reflective schema that you can use to implement self-description. That is, you cannot fully interpret one without access to its corresponding `.proto` file.
- gRPC are not a formal standard of any organisation. This makes them unsuitable for use in environments with legal or other requirements to build on top of standards.

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

### Run Kuebrentes

**Example**:

```bash
make package
make run-k8s
```

## Screenshots

#### Screenshot - GRPC Server

<img src="assets/grpc-server.png" alt="gRPC Server" width="400" />

## Testing

```bash
make test
```

## API Reference

#### Hello World

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

#### Movie

- [messages](cmd/movie/movie_messages.proto)
- [services](cmd/movie/movie_services.proto)

## Inspiration

- [3musketeers](https://3musketeers.io/)
- [Protocol Buffers](https://protobuf.dev/)
- [gRPC](https://grpc.io/)
- [Golang - Project Layout](https://github.com/golang-standards/project-layout)
- TODO

## Contact

Repository by [Raymond](https://github.com/raymondsquared).  
For questions, feedback, or collaboration opportunities, feel free to reach out via GitHub or LinkedIn.
