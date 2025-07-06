package main

import (
	"context"
	"io"
	"os"
	"time"

	"case-studies/grpc/cmd/movie"
	"case-studies/grpc/internal/config"
	"case-studies/grpc/internal/movie/client"
	"case-studies/grpc/internal/observability"

	"google.golang.org/grpc/metadata"
)

const (
	AppType = "grpc-stream-client"
	AppName = "movie"
)

func main() {
	cfg := client.LoadConfig()
	observability.SetupLogger(cfg.LogLevel)

	observability.LogStartup(AppType, AppName, map[string]interface{}{
		"host":        cfg.Host,
		"port":        cfg.Port,
		"environment": cfg.Environment,
	})

	conn, err := client.CreateGRPCConnection(cfg)
	if err != nil {
		observability.LogError("grpc-connect", "main", err, nil)
		os.Exit(1)
	}
	defer func() {
		if err := conn.Close(); err != nil {
			observability.LogError("grpc-disconnect", "main", err, nil)
		}
	}()

	movieClient := movie.NewGetterClient(conn)

	makeGetterRequestStreamWithAPIKey(movieClient, cfg)
	observability.LogSuccess("client-completion", "main", nil)
}

func makeGetterRequestStreamWithAPIKey(client movie.GetterClient, cfg *config.MovieClientConfig) {
	getMovieInputs := []*movie.GetMovieInput{
		{MinimumRatingsScore: 9.99},
		{MinimumRatingsScore: 9},
		{MinimumRatingsScore: 8},
		{MinimumRatingsScore: 7},
		{MinimumRatingsScore: 6},
		{MinimumRatingsScore: 5},
		{MinimumRatingsScore: 4},
		{MinimumRatingsScore: 5},
		{MinimumRatingsScore: 2},
		{MinimumRatingsScore: 1},
	}

	xApiKey := cfg.APIKey
	if xApiKey == "" {
		observability.LogError("config-validation", "makeGetterRequestStreamWithAPIKey",
			io.EOF, map[string]interface{}{"field": "api_key"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()
	ctx = metadata.AppendToOutgoingContext(ctx, "x-api-key", xApiKey)

	stream, err := client.GetMoviesByRatingsStream(ctx)
	if err != nil {
		observability.LogError("stream-start", "makeGetterRequestStreamWithAPIKey", err, nil)
		return
	}

	waitc := make(chan struct{})

	// Receive
	go func() {
		for {
			in, err := stream.Recv()
			if err == io.EOF {
				close(waitc)
				return
			}
			if err != nil {
				observability.LogError("stream-receive", "makeGetterRequestStreamWithAPIKey", err, nil)
				return
			}
			observability.LogSuccess("stream-receive", "makeGetterRequestStreamWithAPIKey", map[string]interface{}{
				"count":        in.MovieCount,
				"total_so_far": in.MovieCountSoFar,
			})
		}
	}()

	// Send
	for _, note := range getMovieInputs {
		time.Sleep(3 * time.Second)
		if err := stream.Send(note); err != nil {
			observability.LogError("stream-send", "makeGetterRequestStreamWithAPIKey", err, map[string]interface{}{
				"note": note,
			})
			return
		}
	}

	stream.CloseSend()
	<-waitc
}
