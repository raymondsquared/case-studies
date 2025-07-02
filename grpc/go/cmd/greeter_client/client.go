package main

import (
	"context"
	"fmt"
	"log/slog"

	"case-studies/grpc/cmd/helloworld"
	"case-studies/grpc/internal/validation"
)

func MakeGreeterRequest(ctx context.Context, client helloworld.GreeterClient, name string, logger *slog.Logger) error {
	logger.Info("sending greeting request", "name", name)

	sanitizedName := validation.SanitizeString(name)
	request := &helloworld.HelloRequest{Name: sanitizedName}

	response, err := client.SayHello(ctx, request)

	if err != nil {
		logger.Error("failed to get greeting", "error", err)
		return fmt.Errorf("could not greet: %w", err)
	}

	logger.Info("received greeting response", "message", response.GetMessage())

	return nil
}
