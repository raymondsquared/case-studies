#!/bin/bash

# Variables
HEALTHCHECK_HOST=localhost
HEALTHCHECK_PORT=50051

if ! command -v grpcurl >/dev/null 2>&1; then
  echo "ERROR: grpcurl not installed - cannot check gRPC health"
  exit 1
fi

if grpcurl -plaintext $HEALTHCHECK_HOST:$HEALTHCHECK_PORT grpc.health.v1.Health/Check >/dev/null 2>&1; then
  echo "OK: gRPC health check passed"
  exit 0
else
  echo "ERROR: gRPC health check failed"
  exit 1
fi
