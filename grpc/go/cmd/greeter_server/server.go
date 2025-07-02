package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"time"

	helloworldLocal "case-studies/grpc/cmd/helloworld"
	movie "case-studies/grpc/cmd/movie"
	"case-studies/grpc/internal/validation"
)

type server struct {
	helloworldLocal.UnimplementedGreeterServer
	movie.UnimplementedGetterServer
	logger            *slog.Logger
	movieDataFilePath string
}

func (s *server) SayHello(ctx context.Context, in *helloworldLocal.HelloRequest) (*helloworldLocal.HelloReply, error) {
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
	response := &helloworldLocal.HelloReply{Message: message}

	duration := time.Since(start)
	s.logger.Info("processed greeting request",
		"name", sanitizedName,
		"message", message,
		"duration", duration)

	return response, nil
}

func (s *server) GetMovieByRatings(ctx context.Context, input *movie.GetMovieInput) (*movie.GetMovieOutput, error) {
	start := time.Now()
	s.logger.Info("processing getting movies with minimum", "ratings_score", input.GetMinimumRatingsScore())

	if err := validation.ValidateMovieRatings(input.GetMinimumRatingsScore()); err != nil {
		s.logger.Error("invalid request",
			"ratings_score", input.GetMinimumRatingsScore(),
			"error", err)
		return nil, err
	}

	sanitisedMinimumRatingsScore := input.GetMinimumRatingsScore()

	reader, err := NewMoviesFileReader(s.movieDataFilePath, s.logger)
	if err != nil {
		return nil, err
	}
	defer reader.Close()

	var ms []*movie.Movie
	if err := json.NewDecoder(reader).Decode(&ms); err != nil {
		s.logger.Error("failed to decode movies data", "error", err)
		return nil, err
	}

	filtered := make([]*movie.Movie, 0, len(ms))
	for _, m := range ms {
		if m.GetRatingsScore() > sanitisedMinimumRatingsScore {
			filtered = append(filtered, m)
		}
	}

	response := &movie.GetMovieOutput{Movie: filtered}

	duration := time.Since(start)
	s.logger.Info("processed getting movies by ratings_score request",
		"ratings_score", sanitisedMinimumRatingsScore,
		"total_movies", len(filtered),
		"duration", duration)

	return response, nil
}
