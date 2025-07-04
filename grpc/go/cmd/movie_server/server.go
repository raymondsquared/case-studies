package main

import (
	"context"
	"encoding/json"
	"io"
	"log/slog"
	"sort"
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
	movies            []*movie.Movie
}

func (server *server) GetMoviesByRatings(ctx context.Context, input *movie.GetMovieInput) (*movie.GetMovieOutput, error) {
	start := time.Now()
	server.logger.Debug("get_movies_by_rating: started", "ratings_score", input.GetMinimumRatingsScore())

	if err := validation.ValidateMovieRatings(input.GetMinimumRatingsScore()); err != nil {
		server.logger.Error("get_movies_by_rating: invalid input", "function", "GetMoviesByRatings", "ratings_score", input.GetMinimumRatingsScore(), "error", err)
		return nil, err
	}

	sanitisedMinimumRatingsScore := input.GetMinimumRatingsScore()

	filtered, moviesCount := server.filterMoviesByRating(server.movies, sanitisedMinimumRatingsScore)

	response := &movie.GetMovieOutput{Movie: filtered, MovieCount: moviesCount}

	duration := time.Since(start)
	server.logger.Debug("get_movies_by_rating: success", "ratings_score", sanitisedMinimumRatingsScore, "total_movies", len(filtered), "duration", duration)

	return response, nil
}

func (server *server) GetMoviesByRatingsStream(stream movie.Getter_GetMoviesByRatingsStreamServer) error {
	var moviesCountSoFar int32

	movies := server.movies

	for {
		getMovieInput, err := stream.Recv()

		if err == io.EOF {
			return nil
		}
		if err != nil {
			server.logger.Error("get_movies_by_ratings_stream: stream.Recv error", "function", "GetMoviesByRatingsStream", "error", err)
			return err
		}

		start := time.Now()
		server.logger.Debug("get_movies_by_ratings_stream: started", "ratings_score", getMovieInput.GetMinimumRatingsScore())

		if err := validation.ValidateMovieRatings(getMovieInput.GetMinimumRatingsScore()); err != nil {
			server.logger.Error("get_movies_by_ratings_stream: invalid input", "function", "GetMoviesByRatingsStream", "ratings_score", getMovieInput.GetMinimumRatingsScore(), "error", err)
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
			server.logger.Error("get_movies_by_ratings_stream: stream.Send error", "function", "GetMoviesByRatingsStream", "error", err)
			return err
		}

		duration := time.Since(start)
		server.logger.Debug("get_movies_by_ratings_stream: success", "ratings_score", sanitisedMinimumRatingsScore, "total_movies", len(filtered), "duration", duration)
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

	// Sort movies by rating score for efficient filtering
	sort.Slice(movies, func(i, j int) bool {
		return movies[i].GetRatingsScore() < movies[j].GetRatingsScore()
	})

	return movies, nil
}

func (server *server) filterMoviesByRating(movies []*movie.Movie, minRating float32) ([]*movie.Movie, int32) {
	var filtered []*movie.Movie
	for _, m := range movies {
		if m.GetRatingsScore() >= minRating {
			filtered = append(filtered, m)
		}
	}

	server.logger.Debug("filterMoviesByRating: filtered", "ratings_score", minRating, "total_movies", len(filtered))
	return filtered, int32(len(filtered))
}
