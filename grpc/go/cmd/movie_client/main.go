package main

import (
	"context"
	"flag"
	"fmt"
	"log/slog"
	"os"
	"path/filepath"
	"time"

	"case-studies/grpc/cmd/movie"
	"case-studies/grpc/internal/config"
	"case-studies/grpc/internal/middleware"
	"case-studies/grpc/internal/validation"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

func loadConfig(logger *slog.Logger) *config.ClientConfig {
	flagHost := flag.String("host", config.DefaultHost, "the server host to connect to")
	flagPort := flag.Int("port", config.DefaultPort, "the server port to connect to")
	flagName := flag.String("name", config.DefaultName, "Name to greet")
	flagMovieDataFilePath := flag.String("movie-data-file-path", config.DefaultMovieDataFilePath, "The file path for movie data")

	flag.Parse()

	// Load base config from environment
	baseConfig := config.LoadClientConfig()

	// Only override with command line flags if they were set by the user
	if flag.CommandLine.Lookup("host").Value.String() != config.DefaultHost || flag.NFlag() > 0 {
		baseConfig.Host = *flagHost
	}
	if flag.CommandLine.Lookup("port").Value.String() != fmt.Sprintf("%d", config.DefaultPort) || flag.NFlag() > 0 {
		baseConfig.Port = *flagPort
	}
	if flag.CommandLine.Lookup("name").Value.String() != config.DefaultName || flag.NFlag() > 0 {
		baseConfig.Name = *flagName
	}
	if flag.CommandLine.Lookup("movie-data-file-path").Value.String() != config.DefaultMovieDataFilePath || flag.NFlag() > 0 {
		baseConfig.MovieDataFilePath = *flagMovieDataFilePath
	}

	// Validate configuration
	if err := validation.ValidateHost(baseConfig.Host); err != nil {
		logger.Error("startup: invalid host configuration", "function", "loadConfig", "error", err)
		os.Exit(1)
	}
	if err := validation.ValidatePort(baseConfig.Port); err != nil {
		logger.Error("startup: invalid port configuration", "function", "loadConfig", "error", err)
		os.Exit(1)
	}
	if err := validation.ValidateName(baseConfig.Name); err != nil {
		logger.Error("startup: invalid name configuration", "function", "loadConfig", "error", err)
		os.Exit(1)
	}
	if err := validation.ValidateMovieDataFilePath(baseConfig.MovieDataFilePath); err != nil {
		logger.Error("startup: invalid file data path configuration", "function", "loadConfig", "error", err)
		os.Exit(1)
	}

	return baseConfig
}

func setupLogger() *slog.Logger {
	opts := &slog.HandlerOptions{
		Level: slog.LevelInfo,
	}

	if config.GetDebugMode() {
		opts.Level = slog.LevelDebug
	}

	handler := slog.NewJSONHandler(os.Stdout, opts)
	logger := slog.New(handler)
	slog.SetDefault(logger)

	return logger
}

func CreateGRPCConnection(cfg *config.ClientConfig, logger *slog.Logger) (*grpc.ClientConn, error) {
	serverURL := fmt.Sprintf("%s:%d", cfg.Host, cfg.Port)

	logger.Info("connecting to gRPC server",
		"server", serverURL)

	conn, err := grpc.NewClient(serverURL,
		grpc.WithTransportCredentials(insecure.NewCredentials()),
		grpc.WithUnaryInterceptor(middleware.ClientLoggingInterceptor(logger)),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to %s: %w", serverURL, err)
	}

	logger.Info("successfully connected to gRPC server", "server", serverURL)
	return conn, nil
}

func WriteMoviesToFile(response *movie.GetMovieOutput, filePath string, logger *slog.Logger) error {
	w, err := NewMovieFileWriter(filepath.Join(filePath, "movie-data.textpb"))
	if err != nil {
		return fmt.Errorf("could not create file writer: %w", err)
	}
	defer w.Close()

	if err := WriteMovieResponse(w, response); err != nil {
		return err
	}

	logger.Info("movie data written to file", "path", filepath.Join(filePath, "movie-data.pb"))
	return nil
}

func main() {
	logger := setupLogger()
	cfg := loadConfig(logger)

	logger.Info("startup: starting gRPC client", "function", "main", "host", cfg.Host, "port", cfg.Port, "name", cfg.Name)

	// Create gRPC connection
	conn, err := CreateGRPCConnection(cfg, logger)
	if err != nil {
		logger.Error("startup: failed to create connection", "function", "main", "error", err)
		os.Exit(1)
	}
	defer func() {
		if err := conn.Close(); err != nil {
			logger.Error("shutdown: failed to close connection", "function", "main", "error", err)
		}
	}()

	// Create clients
	movieClient := movie.NewGetterClient(conn)

	// Use background context for request
	requestCtx := context.Background()

	// Make the requests
	logger.Info("request: making the first request", "function", "main")

	response, err := MakeGetterRequest(requestCtx, movieClient, 0.1, logger)
	if err != nil {
		logger.Error("request: failed", "function", "main", "error", err)
		os.Exit(1)
	}

	if err := WriteMoviesToFile(response, cfg.MovieDataFilePath, logger); err != nil {
		logger.Error("request: failed to write movies to file", "function", "main", "error", err)
		os.Exit(1)
	}

	logger.Info("request: first request completed successfully", "function", "main")

	time.Sleep(time.Second * 3)

	// Streaming
	MakeGetterRequestChat(movieClient, logger)

	logger.Info("shutdown: client completed successfully", "function", "main")
}
