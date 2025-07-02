package main

import (
	"context"
	"fmt"
	"log/slog"

	"case-studies/grpc/cmd/movie"
)

func MakeGetterRequest(ctx context.Context, client movie.GetterClient, ratings float32, logger *slog.Logger) (*movie.GetMovieOutput, error) {
	logger.Info("sending getting movies with minimum ratings_score request", "ratings", ratings)

	sanitisedRatingsScore := ratings
	request := &movie.GetMovieInput{MinimumRatingsScore: sanitisedRatingsScore}

	response, err := client.GetMovieByRatings(ctx, request)
	if err != nil {
		logger.Error("failed to get movies", "error", err)
		return nil, fmt.Errorf("could not get movies: %w", err)
	}

	logger.Info("received get movies with minimum ratings_score response", "total movies", len(response.GetMovie()))
	return response, nil
}
