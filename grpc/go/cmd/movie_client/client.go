package main

import (
	"context"
	"fmt"
	"io"
	"log/slog"
	"time"

	"case-studies/grpc/cmd/movie"
)

func MakeGetterRequest(ctx context.Context, client movie.GetterClient, ratings float32, logger *slog.Logger) (*movie.GetMovieOutput, error) {
	logger.Info("request: sending get movies by rating", "function", "MakeGetterRequest", "ratings", ratings)

	sanitisedRatingsScore := ratings
	request := &movie.GetMovieInput{MinimumRatingsScore: sanitisedRatingsScore}

	response, err := client.GetMovieByRatings(ctx, request)
	if err != nil {
		logger.Error("request: failed to get movies", "function", "MakeGetterRequest", "error", err)
		return nil, fmt.Errorf("could not get movies: %w", err)
	}

	logger.Info("request: received get movies by rating response", "function", "MakeGetterRequest", "total_movies", len(response.GetMovie()))
	return response, nil
}

func MakeGetterRequestChat(client movie.GetterClient, logger *slog.Logger) {
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

	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()

	stream, err := client.GetMovieByRatingsChat(ctx)
	if err != nil {
		logger.Error("stream: failed to start GetMovieByRatingsChat", "function", "MakeGetterRequestChat", "error", err)
		return
	}

	waitc := make(chan struct{})

	// Receive
	go func() {
		for {
			in, err := stream.Recv()
			if err == io.EOF {
				// read done.
				close(waitc)
				return
			}
			if err != nil {
				logger.Error("stream: receive failed", "function", "MakeGetterRequestChat", "error", err)
				return
			}
			logger.Info("stream: received movies", "function", "MakeGetterRequestChat", "count", in.MovieCount, "total_so_far", in.MovieCountSoFar)
		}
	}()

	// Send
	for _, note := range getMovieInputs {
		time.Sleep(3 * time.Second)
		if err := stream.Send(note); err != nil {
			logger.Error("stream: send failed", "function", "MakeGetterRequestChat", "note", note, "error", err)
			return
		}
	}

	stream.CloseSend()
	<-waitc
}
