package main

import (
	"context"
	"encoding/json"
	"io"
	"sort"
	"sync"
	"time"

	movie "case-studies/grpc/cmd/movie"
	"case-studies/grpc/internal/observability"
	"case-studies/grpc/internal/validation"
)

type server struct {
	movie.UnimplementedGetterServer
	assetsFilePath string
	movies         []*movie.Movie

	// Protects moviesCountSoFar
	mu sync.Mutex
}

func (server *server) GetMoviesByRatings(ctx context.Context, input *movie.GetMovieInput) (*movie.GetMovieOutput, error) {
	start := time.Now()
	observability.LogSuccess("movie-request-start", "GetMoviesByRatings", map[string]interface{}{
		"ratings_score": input.GetMinimumRatingsScore(),
	})

	if err := validation.ValidateMovieRatings(input.GetMinimumRatingsScore()); err != nil {
		observability.LogError("validation", "GetMoviesByRatings", err, map[string]interface{}{
			"ratings_score": input.GetMinimumRatingsScore(),
		})
		return nil, err
	}

	sanitisedMinimumRatingsScore := input.GetMinimumRatingsScore()

	filtered, moviesCount := server.filterMoviesByRating(server.movies, sanitisedMinimumRatingsScore)

	response := &movie.GetMovieOutput{Movie: filtered, MovieCount: moviesCount}

	duration := time.Since(start)
	observability.LogSuccess("movie-request", "GetMoviesByRatings", map[string]interface{}{
		"ratings_score": sanitisedMinimumRatingsScore,
		"total_movies":  len(filtered),
		"duration":      duration,
	})

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
			observability.LogError("stream-recv", "GetMoviesByRatingsStream", err, nil)
			return err
		}

		start := time.Now()
		observability.LogSuccess("stream-request-start", "GetMoviesByRatingsStream", map[string]interface{}{
			"ratings_score": getMovieInput.GetMinimumRatingsScore(),
		})

		if err := validation.ValidateMovieRatings(getMovieInput.GetMinimumRatingsScore()); err != nil {
			observability.LogError("validation", "GetMoviesByRatingsStream", err, map[string]interface{}{
				"ratings_score": getMovieInput.GetMinimumRatingsScore(),
			})
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
			observability.LogError("stream-send", "GetMoviesByRatingsStream", err, nil)
			return err
		}

		duration := time.Since(start)
		observability.LogSuccess("stream-request", "GetMoviesByRatingsStream", map[string]interface{}{
			"ratings_score": sanitisedMinimumRatingsScore,
			"total_movies":  len(filtered),
			"duration":      duration,
		})
	}
}

func (server *server) loadMovies() ([]*movie.Movie, error) {
	reader, err := NewMoviesFileReader(server.assetsFilePath)
	if err != nil {
		observability.LogError("file-reader", "loadMovies", err, nil)
		return nil, err
	}
	defer reader.Close()

	var movies []*movie.Movie
	if err := json.NewDecoder(reader).Decode(&movies); err != nil {
		observability.LogError("json-decode", "loadMovies", err, nil)
		return nil, err
	}

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

	observability.LogSuccess("movie-filter", "filterMoviesByRating", map[string]interface{}{
		"ratings_score": minRating,
		"total_movies":  len(filtered),
	})
	return filtered, int32(len(filtered))
}
