#!/bin/sh

set -e

echo "Running gRPC server on: $SERVER_HOST:$SERVER_PORT ..."

exec "$@"
