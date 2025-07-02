# --- BUILD STAGE ---
# Use an official Go image for building. Choose a specific version for stability.
FROM golang:1.24-bookworm AS builder

WORKDIR /app

COPY . .

# RUN pwd
# RUN ls -al

RUN cd scripts && make dependencies

RUN cd scripts && make build-linux-client

# --- FINAL STAGE ---
# Use a minimal base image for the final runtime.
# 'scratch' is another good option if we do need basic OS utilities (like a shell for debugging).
FROM golang:1.24-alpine

RUN addgroup -g 1000 appgroup && adduser -u 1000 -D -G appgroup -S appuser

WORKDIR /app

RUN chown appuser:appgroup /app

COPY --from=builder --chown=appuser:appgroup /app/bin/grpc-movie-client .
COPY --from=builder --chown=appuser:appgroup /app/deployments/docker/movie-client/start.sh .

USER appuser

# RUN pwd
# RUN ls -al

# Use ENTRYPOINT to always execute your start.sh script
ENTRYPOINT ["./start.sh"]

# Use CMD to provide default arguments to the ENTRYPOINT
CMD ["./grpc-movie-client"]
