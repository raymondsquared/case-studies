package main

import (
	"context"
	"fmt"
	"os"
	"path/filepath"

	"google.golang.org/grpc/metadata"

	"case-studies/grpc/cmd/movie"
	"case-studies/grpc/internal/movie/client"
	"case-studies/grpc/internal/observability"
)

const (
	AppType = "grpc-client"
	AppName = "movie"
)

func WriteMoviesToFile(response *movie.GetMovieOutput, filePath string) error {
	w, err := NewMovieFileWriter(filepath.Join(filePath, "movie-data.textpb"))
	if err != nil {
		return fmt.Errorf("could not create file writer: %w", err)
	}
	defer w.Close()

	if err := WriteMovieResponse(w, response); err != nil {
		return err
	}

	observability.LogSuccess("movie-data-write", "WriteMoviesToFile", map[string]interface{}{
		"path": filepath.Join(filePath, "movie-data.textpb"),
	})
	return nil
}

func main() {
	cfg := client.LoadConfig()
	observability.SetupLogger(cfg.LogLevel)

	observability.LogStartup(AppType, AppName, map[string]interface{}{
		"host":        cfg.Host,
		"port":        cfg.Port,
		"environment": cfg.Environment,
	})
	observability.LogConfig(cfg.LogLevel)

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

	// Use background context for request, with x-api-key metadata
	xApiKey := cfg.APIKey
	if xApiKey == "" {
		observability.LogError("config-validation", "main", fmt.Errorf("X_API_KEY not set"), map[string]interface{}{
			"field": "api_key",
		})
		os.Exit(1)
	}
	ctx := metadata.AppendToOutgoingContext(context.Background(), "x-api-key", cfg.APIKey)

	response, err := makeGetterRequest(ctx, movieClient, 0.1)
	if err != nil {
		observability.LogError("movie-request", "main", err, nil)
		os.Exit(1)
	}

	observability.LogSuccess("movie-request", "main", map[string]interface{}{
		"request_count": 1,
	})

	if err := WriteMoviesToFile(response, cfg.AssetsFilePath); err != nil {
		observability.LogError("movie-data-write", "main", err, nil)
		os.Exit(1)
	}

	observability.LogSuccess("client-completion", "main", nil)
}

func makeGetterRequest(ctx context.Context, client movie.GetterClient, ratings float32) (*movie.GetMovieOutput, error) {
	observability.LogSuccess("movie-request-start", "makeGetterRequest", map[string]interface{}{
		"ratings": ratings,
	})

	sanitisedRatingsScore := ratings
	request := &movie.GetMovieInput{MinimumRatingsScore: sanitisedRatingsScore}

	response, err := client.GetMoviesByRatings(ctx, request)
	if err != nil {
		return nil, fmt.Errorf("could not get movies: %w", err)
	}

	observability.LogSuccess("movie-request", "makeGetterRequest", map[string]interface{}{
		"total_movies": len(response.GetMovie()),
	})
	return response, nil
}
