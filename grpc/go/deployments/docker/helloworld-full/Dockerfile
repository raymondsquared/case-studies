# --- BUILD STAGE ---
# Use an official Go image for building. Choose a specific version for stability.
FROM golang:1.24-bookworm AS builder

WORKDIR /app

COPY . .

# RUN pwd
# RUN ls -al

RUN make dependencies

RUN make build-linux-server
RUN make build-linux-client

RUN wget https://github.com/fullstorydev/grpcurl/releases/download/v1.9.3/grpcurl_1.9.3_linux_x86_64.tar.gz
RUN tar -zxvf grpcurl_1.9.3_linux_x86_64.tar.gz

RUN wget https://github.com/fullstorydev/grpcui/releases/download/v1.4.3/grpcui_1.4.3_linux_x86_64.tar.gz
RUN tar -zxvf grpcui_1.4.3_linux_x86_64.tar.gz

# RUN pwd
# RUN ls -al

# --- FINAL STAGE ---
# Use a minimal base image for the final runtime.
# 'alpine' is another good option if you need basic OS utilities (like a shell for debugging).
FROM golang:1.24-alpine

RUN addgroup -g 1000 appgroup && adduser -u 1000 -D -G appgroup -S appuser

WORKDIR /app

RUN chown appuser:appgroup /app

COPY --from=builder --chown=appuser:appgroup /app/assets/api-config.yaml ./assets/
COPY --from=builder --chown=appuser:appgroup /app/assets/tls/ca-public.key ./assets/tls/
COPY --from=builder --chown=appuser:appgroup /app/assets/tls/server-public.key ./assets/tls/
COPY --from=builder --chown=appuser:appgroup /app/assets/tls/server-private.key ./assets/tls/
COPY --from=builder --chown=appuser:appgroup /app/assets/tls/client-public.key ./assets/tls/
COPY --from=builder --chown=appuser:appgroup /app/assets/tls/client-private.key ./assets/tls/
COPY --from=builder --chown=appuser:appgroup /app/assets/movie-data.json ./assets/

COPY --from=builder --chown=appuser:appgroup /app/bin/grpc-helloworld-server .
COPY --from=builder --chown=appuser:appgroup /app/bin/grpc-helloworld-client .
COPY --from=builder --chown=appuser:appgroup /app/bin/grpc-movie-server .
COPY --from=builder --chown=appuser:appgroup /app/bin/grpc-movie-client .
COPY --from=builder --chown=appuser:appgroup /app/bin/grpc-movie-stream-client .
COPY --from=builder --chown=appuser:appgroup /app/grpcurl .
COPY --from=builder --chown=appuser:appgroup /app/grpcui .
COPY --from=builder --chown=appuser:appgroup /app/deployments/docker/helloworld-full/start.sh .
COPY --from=builder --chown=appuser:appgroup /app/assets/movie-data.json .

USER appuser

EXPOSE 8080

# RUN pwd
# RUN ls -al

# Run the application when the container starts.

# Use ENTRYPOINT to always execute your start.sh script
ENTRYPOINT ["./start.sh"]

# Use CMD to provide default arguments to the ENTRYPOINT
CMD ["./grpcui", "-plaintext", "-open-browser=false"]
