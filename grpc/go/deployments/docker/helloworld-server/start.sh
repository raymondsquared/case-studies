#!/bin/sh

set -e

echo "Running GRPC server on: $SERVER_HOST:$SERVER_PORT ..."

exec "$@"
