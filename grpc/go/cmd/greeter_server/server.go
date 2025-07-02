package main

import (
	"context"
	"fmt"
	"log/slog"
	"time"

	"case-studies/grpc/cmd/helloworld"
	"case-studies/grpc/internal/validation"
)

type server struct {
	helloworld.UnimplementedGreeterServer
	logger *slog.Logger
}

func (s *server) SayHello(ctx context.Context, in *helloworld.HelloRequest) (*helloworld.HelloReply, error) {
	start := time.Now()
	s.logger.Info("processing greeting request", "name", in.GetName())

	if err := validation.ValidateName(in.GetName()); err != nil {
		s.logger.Error("invalid request",
			"name", in.GetName(),
			"error", err)
		return nil, err
	}

	sanitizedName := validation.SanitizeString(in.GetName())

	message := fmt.Sprintf("Hello %s! Welcome to gRPC server.", sanitizedName)
	response := &helloworld.HelloReply{Message: message}

	duration := time.Since(start)
	s.logger.Info("processed greeting request",
		"name", sanitizedName,
		"message", message,
		"duration", duration)

	return response, nil
}
