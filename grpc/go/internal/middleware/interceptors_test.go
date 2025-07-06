package middleware

import (
	"context"
	"errors"
	"testing"
	"time"

	"case-studies/grpc/internal/observability"

	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"
)

type mockHandler struct {
	response interface{}
	err      error
	panic    bool
}

func (h *mockHandler) handle(ctx context.Context, req interface{}) (interface{}, error) {
	if h.panic {
		panic("test panic")
	}
	return h.response, h.err
}

func assertGRPCError(t *testing.T, err error, expectedErr error, context string) {
	if expectedErr == nil {
		if err != nil {
			t.Errorf("Given %s, When intercepted, Then expected no error, got %v", context, err)
		}
		return
	}

	if err == nil {
		t.Errorf("Given %s, When intercepted, Then expected error %v, got nil", context, expectedErr)
		return
	}

	if st, ok := status.FromError(err); ok {
		if expectedSt, expectedOk := status.FromError(expectedErr); expectedOk {
			if st.Code() != expectedSt.Code() {
				t.Errorf("Given %s, When intercepted, Then expected status code %v, got %v", context, expectedSt.Code(), st.Code())
			}
		}
	} else {
		t.Errorf("Given %s, When intercepted, Then expected gRPC status error, got %v", context, err)
	}
}

func TestLoggingInterceptor(t *testing.T) {
	observability.SetupLogger("debug")

	tests := []struct {
		name           string
		request        interface{}
		response       interface{}
		err            error
		metadata       metadata.MD
		expectedMethod string
	}{
		{
			name:           "successful request",
			request:        "test request",
			response:       "test response",
			err:            nil,
			metadata:       metadata.New(map[string]string{"user-agent": "test-agent"}),
			expectedMethod: "/test.Service/Method",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Given
			handler := &mockHandler{
				response: tt.response,
				err:      tt.err,
			}

			interceptor := LoggingInterceptor()
			info := &grpc.UnaryServerInfo{
				FullMethod: tt.expectedMethod,
			}

			ctx := context.Background()
			if tt.metadata != nil {
				ctx = metadata.NewIncomingContext(ctx, tt.metadata)
			}

			// When
			start := time.Now()
			resp, err := interceptor(ctx, tt.request, info, handler.handle)
			duration := time.Since(start)

			// Then
			if resp != tt.response {
				t.Errorf("Given request %v, When intercepted, Then expected response %v, got %v", tt.request, tt.response, resp)
			}
			if err != tt.err {
				t.Errorf("Given request %v, When intercepted, Then expected error %v, got %v", tt.request, tt.err, err)
			}
			if duration > 100*time.Millisecond {
				t.Errorf("Given request %v, When intercepted, Then expected handler duration <= 100ms, got %v", tt.request, duration)
			}
		})
	}
}

func TestErrorInterceptor(t *testing.T) {
	observability.SetupLogger("info")

	tests := []struct {
		name           string
		request        interface{}
		response       interface{}
		err            error
		expectedErr    error
		expectedMethod string
	}{
		{
			name:           "successful request",
			request:        "test request",
			response:       "test response",
			err:            nil,
			expectedErr:    nil,
			expectedMethod: "/test.Service/Method",
		},
		{
			name:           "gRPC status error",
			request:        "test request",
			response:       nil,
			err:            status.Error(codes.NotFound, "not found"),
			expectedErr:    status.Error(codes.NotFound, "not found"),
			expectedMethod: "/test.Service/Method",
		},
		{
			name:           "non-gRPC error",
			request:        "test request",
			response:       nil,
			err:            errors.New("some error"),
			expectedErr:    status.Error(codes.Internal, "internal server error: some error"),
			expectedMethod: "/test.Service/Method",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Given
			handler := &mockHandler{
				response: tt.response,
				err:      tt.err,
			}

			interceptor := ErrorInterceptor()
			info := &grpc.UnaryServerInfo{
				FullMethod: tt.expectedMethod,
			}

			ctx := context.Background()

			// When
			resp, err := interceptor(ctx, tt.request, info, handler.handle)

			// Then
			if resp != tt.response {
				t.Errorf("Given request %v, When intercepted, Then expected response %v, got %v", tt.request, tt.response, resp)
			}

			assertGRPCError(t, err, tt.expectedErr, "request "+tt.name)
		})
	}
}

func TestRecoveryInterceptor(t *testing.T) {
	observability.SetupLogger("info")

	tests := []struct {
		name           string
		request        interface{}
		response       interface{}
		err            error
		panic          bool
		expectedErr    error
		expectedMethod string
	}{
		{
			name:           "successful request",
			request:        "test request",
			response:       "test response",
			err:            nil,
			panic:          false,
			expectedErr:    nil,
			expectedMethod: "/test.Service/Method",
		},
		{
			name:           "handler panic",
			request:        "test request",
			response:       nil,
			err:            nil,
			panic:          true,
			expectedErr:    status.Error(codes.Internal, "internal server error"),
			expectedMethod: "/test.Service/Method",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Given
			handler := &mockHandler{
				response: tt.response,
				err:      tt.err,
				panic:    tt.panic,
			}

			interceptor := RecoveryInterceptor()
			info := &grpc.UnaryServerInfo{
				FullMethod: tt.expectedMethod,
			}

			ctx := context.Background()

			// When
			resp, err := interceptor(ctx, tt.request, info, handler.handle)

			// Then
			if !tt.panic {
				if resp != tt.response {
					t.Errorf("Given request %v, When intercepted, Then expected response %v, got %v", tt.request, tt.response, resp)
				}
			}

			assertGRPCError(t, err, tt.expectedErr, "request "+tt.name)
		})
	}
}

func TestClientLoggingInterceptor(t *testing.T) {
	observability.SetupLogger("debug")

	tests := []struct {
		name           string
		request        interface{}
		response       interface{}
		err            error
		expectedMethod string
	}{
		{
			name:           "successful client request",
			request:        "test request",
			response:       "test response",
			err:            nil,
			expectedMethod: "/test.Service/Method",
		},
		{
			name:           "client request with error",
			request:        "test request",
			response:       nil,
			err:            status.Error(codes.Unavailable, "service unavailable"),
			expectedMethod: "/test.Service/Method",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockInvoker := func(ctx context.Context, method string, req, reply interface{}, cc *grpc.ClientConn, opts ...grpc.CallOption) error {
				if tt.response != nil {
					if replyPtr, ok := reply.(*string); ok {
						*replyPtr = tt.response.(string)
					}
				}
				return tt.err
			}

			interceptor := ClientLoggingInterceptor()

			ctx := context.Background()
			err := interceptor(ctx, tt.expectedMethod, tt.request, tt.response, nil, mockInvoker)

			if err != tt.err {
				t.Errorf("Expected error %v, got %v", tt.err, err)
			}
		})
	}
}

func TestAPIKeyAuthInterceptor(t *testing.T) {
	observability.SetupLogger("info")

	tests := []struct {
		name           string
		apiKey         string
		metadata       metadata.MD
		expectedErr    error
		expectedMethod string
	}{
		{
			name:           "valid API key",
			apiKey:         "abcd-efgh-1234-5678",
			metadata:       metadata.New(map[string]string{"x-api-key": "abcd-efgh-1234-5678"}),
			expectedErr:    nil,
			expectedMethod: "/test.Service/Method",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Given
			handler := &mockHandler{
				response: "test response",
				err:      nil,
			}

			interceptor := APIKeyAuthInterceptor([]string{tt.apiKey})
			info := &grpc.UnaryServerInfo{
				FullMethod: tt.expectedMethod,
			}

			ctx := context.Background()
			if tt.metadata != nil {
				ctx = metadata.NewIncomingContext(ctx, tt.metadata)
			}

			// When
			resp, err := interceptor(ctx, "test request", info, handler.handle)

			// Then
			if resp != "test response" {
				t.Errorf("Given request %v, When intercepted, Then expected response 'test response', got %v", "test request", resp)
			}

			assertGRPCError(t, err, tt.expectedErr, "request "+tt.name)
		})
	}
}

func TestAPIKeyAuthInterceptorCaseSensitivity(t *testing.T) {
	validAPIKeys := []string{"Key1", "key2", "KEY3"}

	tests := []struct {
		name          string
		apiKey        string
		expectedError error
	}{
		{
			name:          "exact match",
			apiKey:        "Key1",
			expectedError: nil,
		},
		{
			name:          "exact match uppercase",
			apiKey:        "KEY3",
			expectedError: nil,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Given
			handler := &mockHandler{
				response: "test response",
				err:      nil,
			}

			interceptor := APIKeyAuthInterceptor(validAPIKeys)
			info := &grpc.UnaryServerInfo{
				FullMethod: "/test.Service/Method",
			}

			md := metadata.New(map[string]string{"x-api-key": tt.apiKey})
			ctx := metadata.NewIncomingContext(context.Background(), md)

			// When
			resp, err := interceptor(ctx, "test request", info, handler.handle)

			// Then
			assertGRPCError(t, err, tt.expectedError, "request "+tt.name)
			if tt.expectedError == nil && resp != "test response" {
				t.Errorf("Given request %v, When intercepted, Then expected response 'test response', got %v", "test request", resp)
			}
		})
	}
}
