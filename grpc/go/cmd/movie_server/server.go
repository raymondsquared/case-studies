package main

import (
	"context"
	"encoding/json"
	"io"
	"log/slog"
	"sync"
	"time"

	movie "case-studies/grpc/cmd/movie"
	"case-studies/grpc/internal/validation"
)

type server struct {
	movie.UnimplementedGetterServer
	logger            *slog.Logger
	movieDataFilePath string
	mu                sync.Mutex // Protects moviesCountSoFar
}

func (server *server) GetMovieByRatings(ctx context.Context, input *movie.GetMovieInput) (*movie.GetMovieOutput, error) {
	start := time.Now()
	server.logger.Info("get_movies_by_rating: started", "ratings_score", input.GetMinimumRatingsScore())

	if err := validation.ValidateMovieRatings(input.GetMinimumRatingsScore()); err != nil {
		server.logger.Error("get_movies_by_rating: invalid input", "function", "GetMovieByRatings", "ratings_score", input.GetMinimumRatingsScore(), "error", err)
		return nil, err
	}

	sanitisedMinimumRatingsScore := input.GetMinimumRatingsScore()

	movies, err := server.loadMovies()
	if err != nil {
		server.logger.Error("get_movies_by_rating: loadMovies error", "function", "GetMovieByRatings", "error", err)
		return nil, err
	}

	filtered, moviesCount := server.filterMoviesByRating(movies, sanitisedMinimumRatingsScore)

	response := &movie.GetMovieOutput{Movie: filtered, MovieCount: moviesCount}

	duration := time.Since(start)
	server.logger.Info("get_movies_by_rating: success", "ratings_score", sanitisedMinimumRatingsScore, "total_movies", len(filtered), "duration", duration)

	return response, nil
}

func (server *server) GetMovieByRatingsChat(stream movie.Getter_GetMovieByRatingsChatServer) error {
	var moviesCountSoFar int32

	movies, err := server.loadMovies()
	if err != nil {
		server.logger.Error("get_movies_by_rating_chat: loadMovies error", "function", "GetMovieByRatingsChat", "error", err)
		return err
	}

	for {
		getMovieInput, err := stream.Recv()

		if err == io.EOF {
			return nil
		}
		if err != nil {
			server.logger.Error("get_movies_by_rating_chat: stream.Recv error", "function", "GetMovieByRatingsChat", "error", err)
			return err
		}

		start := time.Now()
		server.logger.Info("get_movies_by_rating_chat: started", "ratings_score", getMovieInput.GetMinimumRatingsScore())

		if err := validation.ValidateMovieRatings(getMovieInput.GetMinimumRatingsScore()); err != nil {
			server.logger.Error("get_movies_by_rating_chat: invalid input", "function", "GetMovieByRatingsChat", "ratings_score", getMovieInput.GetMinimumRatingsScore(), "error", err)
			return err
		}

		sanitisedMinimumRatingsScore := getMovieInput.GetMinimumRatingsScore()

		server.mu.Lock()

		filtered, moviesCount := server.filterMoviesByRating(movies, sanitisedMinimumRatingsScore)
		moviesCountSoFar += moviesCount

		server.mu.Unlock()

		if err := stream.Send(
			&movie.GetMovieOutput{
				Movie:           filtered,
				MovieCount:      moviesCount,
				MovieCountSoFar: moviesCountSoFar,
			},
		); err != nil {
			server.logger.Error("get_movies_by_rating_chat: stream.Send error", "function", "GetMovieByRatingsChat", "error", err)
			return err
		}

		duration := time.Since(start)
		server.logger.Info("get_movies_by_rating_chat: success", "ratings_score", sanitisedMinimumRatingsScore, "total_movies", len(filtered), "duration", duration)
	}
}

func (server *server) loadMovies() ([]*movie.Movie, error) {
	reader, err := NewMoviesFileReader(server.movieDataFilePath, server.logger)
	if err != nil {
		server.logger.Error("loadMovies: NewMoviesFileReader error", "function", "loadMovies", "error", err)
		return nil, err
	}
	defer reader.Close()

	var movies []*movie.Movie
	if err := json.NewDecoder(reader).Decode(&movies); err != nil {
		server.logger.Error("loadMovies: decode error", "function", "loadMovies", "error", err)
		return nil, err
	}
	return movies, nil
}

func (server *server) filterMoviesByRating(movies []*movie.Movie, minRating float32) ([]*movie.Movie, int32) {
	filtered := make([]*movie.Movie, 0, len(movies))
	for _, m := range movies {
		if m.GetRatingsScore() > minRating {
			filtered = append(filtered, m)
		}
	}

	server.logger.Info("filterMoviesByRating: filtered", "ratings_score", minRating, "total_movies", len(filtered))
	return filtered, int32(len(filtered))
}
