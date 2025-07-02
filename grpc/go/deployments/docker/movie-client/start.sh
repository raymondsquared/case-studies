#!/bin/sh

set -e

echo "Running client for GRPC server on $SERVER_HOST:$SERVER_PORT ..."

exec "$@"
