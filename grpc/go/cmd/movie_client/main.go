package main

import (
	"context"
	"fmt"
	"log/slog"
	"os"
	"path/filepath"

	"google.golang.org/grpc/metadata"

	"case-studies/grpc/cmd/movie"
	"case-studies/grpc/internal/movie/client"
)

func WriteMoviesToFile(response *movie.GetMovieOutput, filePath string, logger *slog.Logger) error {
	w, err := NewMovieFileWriter(filepath.Join(filePath, "movie-data.textpb"))
	if err != nil {
		return fmt.Errorf("could not create file writer: %w", err)
	}
	defer w.Close()

	if err := WriteMovieResponse(w, response); err != nil {
		return err
	}

	logger.Info("movie data written to file", "path", filepath.Join(filePath, "movie-data.textpb"))
	return nil
}

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

	// Use background context for request, with x-api-key metadata
	xApiKey := cfg.APIKey
	if xApiKey == "" {
		logger.Error("startup: X_API_KEY environment variable or --api-key flag not set", "function", "main")
		os.Exit(1)
	}
	ctx := metadata.AppendToOutgoingContext(context.Background(), "x-api-key", cfg.APIKey)

	response, err := makeGetterRequest(ctx, movieClient, 0.1, logger)
	if err != nil {
		logger.Error("request: failed", "function", "main", "error", err)
		os.Exit(1)
	}

	logger.Info("request: first request completed successfully", "function", "main")

	if err := WriteMoviesToFile(response, cfg.MovieDataFilePath, logger); err != nil {
		logger.Error("request: failed to write movies to file", "function", "main", "error", err)
		os.Exit(1)
	}

	logger.Info("shutdown: client completed successfully", "function", "main")
}

func makeGetterRequest(ctx context.Context, client movie.GetterClient, ratings float32, logger *slog.Logger) (*movie.GetMovieOutput, error) {
	logger.Debug("request: sending get movies by rating", "function", "MakeGetterRequest", "ratings", ratings)

	sanitisedRatingsScore := ratings
	request := &movie.GetMovieInput{MinimumRatingsScore: sanitisedRatingsScore}

	response, err := client.GetMoviesByRatings(ctx, request)
	if err != nil {
		logger.Error("request: failed to get movies", "function", "MakeGetterRequest", "error", err)
		return nil, fmt.Errorf("could not get movies: %w", err)
	}

	logger.Debug("request: received get movies by rating response", "function", "MakeGetterRequest", "total_movies", len(response.GetMovie()))
	return response, nil
}
