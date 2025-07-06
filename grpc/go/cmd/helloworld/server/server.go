package main

import (
	"context"
	"fmt"
	"time"

	"case-studies/grpc/cmd/helloworld"
	"case-studies/grpc/internal/observability"
	"case-studies/grpc/internal/validation"
)

type server struct {
	helloworld.UnimplementedGreeterServer
}

func (s *server) SayHello(ctx context.Context, in *helloworld.HelloRequest) (*helloworld.HelloReply, error) {
	start := time.Now()
	observability.LogSuccess("greeting-request-start", "SayHello", map[string]interface{}{
		"name": in.GetName(),
	})

	if err := validation.ValidateName(in.GetName()); err != nil {
		observability.LogError("validation", "SayHello", err, map[string]interface{}{
			"name": in.GetName(),
		})
		return nil, err
	}

	sanitizedName := validation.SanitiseString(in.GetName())

	message := fmt.Sprintf("Hello %s! Welcome to gRPC server.", sanitizedName)
	response := &helloworld.HelloReply{Message: message}

	duration := time.Since(start)
	observability.LogSuccess("greeting-request", "SayHello", map[string]interface{}{
		"name":     sanitizedName,
		"message":  message,
		"duration": duration,
	})

	return response, nil
}
