#!/bin/sh

set -e

echo "Running client for gRPC server on $SERVER_HOST:$SERVER_PORT ..."

exec "$@"
