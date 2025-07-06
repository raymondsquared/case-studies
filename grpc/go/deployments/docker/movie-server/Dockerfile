# --- BUILD STAGE ---
# Use an official Go image for building. Choose a specific version for stability.
FROM golang:1.24-bookworm AS builder

WORKDIR /app

COPY . .

# RUN pwd
# RUN ls -al

RUN make dependencies

RUN make build-linux-server

RUN GRPC_HEALTH_PROBE_VERSION=v0.4.13 && \
    wget -qO/bin/grpc_health_probe https://github.com/grpc-ecosystem/grpc-health-probe/releases/download/${GRPC_HEALTH_PROBE_VERSION}/grpc_health_probe-linux-amd64 && \
    chmod +x /bin/grpc_health_probe

# --- FINAL STAGE ---
# Use a minimal base image for the final runtime.
# 'scratch' is another good option if we do need basic OS utilities (like a shell for debugging).
FROM golang:1.24-alpine

RUN addgroup -g 1000 appgroup && adduser -u 1000 -D -G appgroup -S appuser

WORKDIR /app

RUN chown appuser:appgroup /app

COPY --from=builder --chown=appuser:appgroup /app/assets/api-config.yaml ./assets/
COPY --from=builder --chown=appuser:appgroup /app/assets/tls/ca-public.key ./assets/tls/
COPY --from=builder --chown=appuser:appgroup /app/assets/tls/server-public.key ./assets/tls/
COPY --from=builder --chown=appuser:appgroup /app/assets/tls/server-private.key ./assets/tls/
COPY --from=builder --chown=appuser:appgroup /app/assets/movie-data.json ./assets/

COPY --from=builder --chown=appuser:appgroup /app/bin/grpc-movie-server .
COPY --from=builder --chown=appuser:appgroup /app/deployments/docker/movie-server/start.sh .
COPY --from=builder --chown=appuser:appgroup /bin/grpc_health_probe .

USER appuser

EXPOSE 50051

# RUN pwd
RUN ls -al

# Use ENTRYPOINT to always execute your start.sh script
ENTRYPOINT ["./start.sh"]

# Use CMD to provide default arguments to the ENTRYPOINT
CMD ["./grpc-movie-server"]