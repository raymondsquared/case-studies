package main

import (
	"context"
	"io"
	"log/slog"
	"os"
	"time"

	"case-studies/grpc/cmd/movie"
	"case-studies/grpc/internal/config"
	"case-studies/grpc/internal/movie/client"

	"google.golang.org/grpc/metadata"
)

func main() {
	cfg := client.LoadConfig(nil)
	logger := client.SetupLogger(cfg.LogLevel)

	logger.Info("startup: starting gRPC client", "function", "main", "host", cfg.Host, "port", cfg.Port)

	conn, err := client.CreateGRPCConnection(cfg, logger)
	if err != nil {
		logger.Error("startup: failed to create connection", "function", "main", "error", err)
		os.Exit(1)
	}
	defer func() {
		if err := conn.Close(); err != nil {
			logger.Error("shutdown: failed to close connection", "function", "main", "error", err)
		}
	}()

	movieClient := movie.NewGetterClient(conn)

	makeGetterRequestStreamWithAPIKey(movieClient, logger, cfg)
	logger.Info("shutdown: client completed successfully", "function", "main")
}

func makeGetterRequestStreamWithAPIKey(client movie.GetterClient, logger *slog.Logger, cfg *config.MovieClientConfig) {
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
		logger.Error("X_API_KEY environment variable or --api-key flag not set", "function", "MakeGetterRequestStreamWithAPIKey")
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()
	ctx = metadata.AppendToOutgoingContext(ctx, "x-api-key", xApiKey)

	stream, err := client.GetMoviesByRatingsStream(ctx)
	if err != nil {
		logger.Error("stream: failed to start GetMoviesByRatingsStream", "function", "MakeGetterRequestStreamWithAPIKey", "error", err)
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
				logger.Error("stream: receive failed", "function", "MakeGetterRequestStreamWithAPIKey", "error", err)
				return
			}
			logger.Info("stream: received movies", "function", "MakeGetterRequestStreamWithAPIKey", "count", in.MovieCount, "total_so_far", in.MovieCountSoFar)
		}
	}()

	// Send
	for _, note := range getMovieInputs {
		time.Sleep(3 * time.Second)
		if err := stream.Send(note); err != nil {
			logger.Error("stream: send failed", "function", "MakeGetterRequestStreamWithAPIKey", "note", note, "error", err)
			return
		}
	}

	stream.CloseSend()
	<-waitc
}
