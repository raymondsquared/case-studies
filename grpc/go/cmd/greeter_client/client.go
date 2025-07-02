package main

import (
	"context"
	"fmt"
	"log/slog"
	"path/filepath"

	"case-studies/grpc/cmd/helloworld"
	"case-studies/grpc/cmd/movie"
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

func MakeGetterRequest(ctx context.Context, client movie.GetterClient, ratings float32, filePath string, logger *slog.Logger) error {
	logger.Info("sending getting movies with minimum ratings_score request", "ratings", ratings)

	sanitisedRatingsScore := ratings
	request := &movie.GetMovieInput{MinimumRatingsScore: sanitisedRatingsScore}

	response, err := client.GetMovieByRatings(ctx, request)

	if err != nil {
		logger.Error("failed to get movies", "error", err)
		return fmt.Errorf("could not get movies: %w", err)
	}

	logger.Info("received get movies with minimum ratings_score response", "total movies", len(response.GetMovie()))

	w, err := NewMovieFileWriter(filepath.Join(filePath, "movie-data.pb"))
	if err != nil {
		return fmt.Errorf("could not create file writer: %w", err)
	}
	defer w.Close()

	if err := WriteMovieResponse(w, response); err != nil {
		return err
	}

	return nil
}
