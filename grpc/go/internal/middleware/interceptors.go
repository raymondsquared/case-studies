package middleware

import (
	"context"
	"fmt"
	"time"

	"case-studies/grpc/internal/observability"

	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"
)

// LoggingInterceptor provides structured logging for gRPC requests
func LoggingInterceptor() grpc.UnaryServerInterceptor {
	return func(ctx context.Context, req interface{}, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (interface{}, error) {
		start := time.Now()

		md, _ := metadata.FromIncomingContext(ctx)
		userAgent := "unknown"
		if ua := md.Get("user-agent"); len(ua) > 0 {
			userAgent = ua[0]
		}

		peer := "unknown"
		if p := md.Get("x-forwarded-for"); len(p) > 0 {
			peer = p[0]
		}

		observability.LogInfrastructureInput("gRPC request started", map[string]interface{}{
			"method":     info.FullMethod,
			"user_agent": userAgent,
			"peer":       peer,
		})

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

		observability.LogInfrastructureOutput("gRPC request completed", map[string]interface{}{
			"method":      info.FullMethod,
			"duration":    duration,
			"status_code": code.String(),
			"error":       err,
		})

		return resp, err
	}
}

// ErrorInterceptor provides consistent error handling
func ErrorInterceptor() grpc.UnaryServerInterceptor {
	return func(ctx context.Context, req interface{}, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (interface{}, error) {
		resp, err := handler(ctx, req)

		if err != nil {
			observability.LogInfrastructureError("gRPC error occurred", err, map[string]interface{}{
				"method": info.FullMethod,
			})

			if _, ok := status.FromError(err); !ok {
				err = status.Errorf(codes.Internal, "internal server error: %v", err)
			}
		}

		return resp, err
	}
}

// RecoveryInterceptor provides panic recovery
func RecoveryInterceptor() grpc.UnaryServerInterceptor {
	return func(ctx context.Context, req interface{}, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (resp interface{}, err error) {
		defer func() {
			if r := recover(); r != nil {
				observability.LogInfrastructureError("panic recovered in gRPC handler", fmt.Errorf("panic: %v", r), map[string]interface{}{
					"method": info.FullMethod,
					"panic":  r,
				})
				err = status.Errorf(codes.Internal, "internal server error")
			}
		}()

		return handler(ctx, req)
	}
}

// ClientLoggingInterceptor provides logging for client requests
func ClientLoggingInterceptor() grpc.UnaryClientInterceptor {
	return func(ctx context.Context, method string, req, reply interface{}, cc *grpc.ClientConn, invoker grpc.UnaryInvoker, opts ...grpc.CallOption) error {
		start := time.Now()

		observability.LogInfrastructureInput("gRPC client request started", map[string]interface{}{
			"method": method,
		})

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

		observability.LogInfrastructureOutput("gRPC client request completed", map[string]interface{}{
			"method":      method,
			"duration":    duration,
			"status_code": code.String(),
			"error":       err,
		})

		return err
	}
}

// APIKeyAuthInterceptor checks for a valid x-api-key in the gRPC metadata
func APIKeyAuthInterceptor(validAPIKeys []string) grpc.UnaryServerInterceptor {
	return func(ctx context.Context, req interface{}, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (interface{}, error) {
		md, ok := metadata.FromIncomingContext(ctx)
		if !ok {
			return nil, status.Error(codes.Unauthenticated, "missing metadata")
		}
		apiKeys := md.Get("x-api-key")
		if len(apiKeys) == 0 {
			return nil, status.Error(codes.Unauthenticated, "invalid or missing API key")
		}
		incomingKey := apiKeys[0]
		for _, valid := range validAPIKeys {
			if incomingKey == valid {
				return handler(ctx, req)
			}
		}
		return nil, status.Error(codes.Unauthenticated, "invalid or missing API key")
	}
}
