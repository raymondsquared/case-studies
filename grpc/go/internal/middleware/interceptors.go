package middleware

import (
	"context"
	"log/slog"
	"time"

	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"
)

// LoggingInterceptor provides structured logging for gRPC requests
func LoggingInterceptor(logger *slog.Logger) grpc.UnaryServerInterceptor {
	return func(ctx context.Context, req interface{}, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (interface{}, error) {
		start := time.Now()

		// Extract metadata
		md, _ := metadata.FromIncomingContext(ctx)
		userAgent := "unknown"
		if ua := md.Get("user-agent"); len(ua) > 0 {
			userAgent = ua[0]
		}

		peer := "unknown"
		if p := md.Get("x-forwarded-for"); len(p) > 0 {
			peer = p[0]
		}

		logger.Info("gRPC request started",
			"method", info.FullMethod,
			"user_agent", userAgent,
			"peer", peer)

		// Call the handler
		resp, err := handler(ctx, req)

		duration := time.Since(start)
		code := codes.OK
		if err != nil {
			if st, ok := status.FromError(err); ok {
				code = st.Code()
			} else {
				code = codes.Unknown
			}
		}

		logger.Info("gRPC request completed",
			"method", info.FullMethod,
			"duration", duration,
			"status_code", code.String(),
			"error", err)

		return resp, err
	}
}

// ErrorInterceptor provides consistent error handling
func ErrorInterceptor() grpc.UnaryServerInterceptor {
	return func(ctx context.Context, req interface{}, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (interface{}, error) {
		resp, err := handler(ctx, req)

		if err != nil {
			// Log the error with context
			slog.Error("gRPC error occurred",
				"method", info.FullMethod,
				"error", err)

			// Ensure we return a proper gRPC status
			if _, ok := status.FromError(err); !ok {
				err = status.Errorf(codes.Internal, "internal server error: %v", err)
			}
		}

		return resp, err
	}
}

// RecoveryInterceptor provides panic recovery
func RecoveryInterceptor(logger *slog.Logger) grpc.UnaryServerInterceptor {
	return func(ctx context.Context, req interface{}, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (resp interface{}, err error) {
		defer func() {
			if r := recover(); r != nil {
				logger.Error("panic recovered in gRPC handler",
					"method", info.FullMethod,
					"panic", r)
				err = status.Errorf(codes.Internal, "internal server error")
			}
		}()

		return handler(ctx, req)
	}
}

// ClientLoggingInterceptor provides logging for client requests
func ClientLoggingInterceptor(logger *slog.Logger) grpc.UnaryClientInterceptor {
	return func(ctx context.Context, method string, req, reply interface{}, cc *grpc.ClientConn, invoker grpc.UnaryInvoker, opts ...grpc.CallOption) error {
		start := time.Now()

		logger.Info("gRPC client request started",
			"method", method)

		err := invoker(ctx, method, req, reply, cc, opts...)

		duration := time.Since(start)
		code := codes.OK
		if err != nil {
			if st, ok := status.FromError(err); ok {
				code = st.Code()
			} else {
				code = codes.Unknown
			}
		}

		logger.Info("gRPC client request completed",
			"method", method,
			"duration", duration,
			"status_code", code.String(),
			"error", err)

		return err
	}
}
