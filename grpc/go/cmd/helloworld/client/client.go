package main

import (
	"context"
	"fmt"

	"case-studies/grpc/cmd/helloworld"
	"case-studies/grpc/internal/observability"
	"case-studies/grpc/internal/validation"
)

func MakeGreeterRequest(ctx context.Context, client helloworld.GreeterClient, name string) error {
	observability.LogSuccess("greeter-request-start", "MakeGreeterRequest", map[string]interface{}{
		"name": name,
	})

	sanitizedName := validation.SanitiseString(name)
	request := &helloworld.HelloRequest{Name: sanitizedName}

	response, err := client.SayHello(ctx, request)

	if err != nil {
		observability.LogError("greeter-request", "MakeGreeterRequest", err, nil)
		return fmt.Errorf("could not greet: %w", err)
	}

	observability.LogSuccess("greeter-request", "MakeGreeterRequest", map[string]interface{}{
		"message": response.GetMessage(),
	})

	return nil
}
