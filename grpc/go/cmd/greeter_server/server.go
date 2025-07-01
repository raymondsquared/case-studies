package main

import (
	"context"
	"fmt"
	"log/slog"
	"time"

	helloworldLocal "case-studies/grpc/cmd/helloworld"
	"case-studies/grpc/internal/validation"
)

// server is used to implement helloworldLocal.GreeterServer.
type server struct {
	helloworldLocal.UnimplementedGreeterServer
	logger *slog.Logger
}

// SayHello implements helloworldLocal.GreeterServer
func (s *server) SayHello(ctx context.Context, in *helloworldLocal.HelloRequest) (*helloworldLocal.HelloReply, error) {
	start := time.Now()

	s.logger.Info("processing greeting request", "name", in.GetName())

	// Validate input
	if err := validation.ValidateName(in.GetName()); err != nil {
		s.logger.Error("invalid request",
			"name", in.GetName(),
			"error", err)
		return nil, err
	}

	// Sanitize input
	sanitizedName := validation.SanitizeString(in.GetName())

	// Process the request
	message := fmt.Sprintf("Hello %s! Welcome to gRPC server.", sanitizedName)
	response := &helloworldLocal.HelloReply{Message: &message}

	duration := time.Since(start)
	s.logger.Info("processed greeting request",
		"name", sanitizedName,
		"message", message,
		"duration", duration)

	return response, nil
}
