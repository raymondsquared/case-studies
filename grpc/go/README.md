## Getting Started

- **Project Structure**: Visual representation of the codebase organisation

### Project Structure

```
grpc/go/
├── bin/                    # Compiled binaries
├── cmd/                    # Application entry points
│   └── helloworld/         # Helloword main package
│       ├── server/         # gRPC server implementation
│       └── client/         # gRPC client implementation
├── deployments/            # Deployment configurations
│   ├── docker/             # Docker configurations
│   └── kubernetes/         # Kubernetes manifests
├── docs/                   # Internal documentations
├── internal/               # Internal packages
│   ├── config/             # Configuration management
│   ├── middleware/         # gRPC middleware
│   ├── movie/              # Common utility for movie
│   ├── observability/      # Obserability for the project
│   └── validation/         # Input validation
├── scripts/                # Utility scripts
├── vendor/                 # Go dependencies
├── Makefile                # Makefile
├── go.mod                  # Go module definition
├── go.sum                  # Go module checksums
└── README.md               # Project documentation
```

## Technologies Used

- **Go 1.24 or higher**: Go programming language

## Setup & Installation

- **[Install Go lang](https://go.dev/doc/install)**

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

### Run with Docker Compose

**Example**:

```bash
make package
make run-e2e
```

### Run in Kubernetes Environment

**Example**:

```bash
make package
make run-k8s
```

## Testing

```bash
make test
```
