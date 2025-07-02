#!/bin/sh

set -e

# sleep infinity
echo "Running UI on $UI_HOST:$UI_PORT, GRPC server on $SERVER_HOST:$SERVER_PORT ..."

exec "$@" -bind=$UI_HOST -port=$UI_PORT $SERVER_HOST:$SERVER_PORT
