package main

import (
	"flag"
	"fmt"
	"log/slog"
	"net"
	"os"

	"case-studies/grpc/cmd/movie"

	"google.golang.org/grpc"
	"google.golang.org/grpc/health"
	grpc_health_v1 "google.golang.org/grpc/health/grpc_health_v1"
	"google.golang.org/grpc/reflection"

	"case-studies/grpc/internal/config"
	"case-studies/grpc/internal/middleware"
	"case-studies/grpc/internal/validation"
)

func loadConfig(logger *slog.Logger) *config.ServerConfig {
	flagPort := flag.Int("port", config.DefaultPort, "The server port")
	flagMovieDataFilePath := flag.String("movie-data-file-path", config.DefaultMovieDataFilePath, "The file path for movie data")

	flag.Parse()

	baseConfig := config.LoadServerConfig()

	if flag.CommandLine.Lookup("port").Value.String() != fmt.Sprintf("%d", config.DefaultPort) || flag.NFlag() > 0 {
		baseConfig.Port = *flagPort
	}
	if flag.CommandLine.Lookup("movie-data-file-path").Value.String() != config.DefaultMovieDataFilePath || flag.NFlag() > 0 {
		baseConfig.MovieDataFilePath = *flagMovieDataFilePath
	}

	if err := validation.ValidatePort(baseConfig.Port); err != nil {
		logger.Error("startup: invalid port configuration", "function", "loadConfig", "error", err)
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

func createGRPCServer(cfg *config.ServerConfig, logger *slog.Logger) *grpc.Server {
	var validAPIKeys []string
	for _, k := range cfg.APIKeys {
		validAPIKeys = append(validAPIKeys, k.Key)
	}

	serverOpts := []grpc.ServerOption{
		grpc.ChainUnaryInterceptor(
			middleware.APIKeyAuthInterceptor(validAPIKeys),
			middleware.LoggingInterceptor(logger),
			middleware.ErrorInterceptor(),
			middleware.RecoveryInterceptor(logger),
		),
	}

	grpcServer := grpc.NewServer(serverOpts...)

	// Register services
	movieServer := &server{logger: logger, movieDataFilePath: cfg.MovieDataFilePath}
	movie.RegisterGetterServer(grpcServer, movieServer)

	// Register health check service
	healthServer := health.NewServer()
	grpc_health_v1.RegisterHealthServer(grpcServer, healthServer)

	healthServer.SetServingStatus("helloworld.Greeter", grpc_health_v1.HealthCheckResponse_SERVING)
	healthServer.SetServingStatus("movie.Getter", grpc_health_v1.HealthCheckResponse_SERVING)

	reflection.Register(grpcServer)

	logger.Info("gRPC server configured")

	return grpcServer
}

func main() {
	logger := setupLogger()
	cfg := loadConfig(logger)

	logger.Info("startup: starting gRPC server", "function", "main", "port", cfg.Port)

	lis, err := net.Listen("tcp", fmt.Sprintf(":%d", cfg.Port))
	if err != nil {
		logger.Error("startup: failed to listen", "function", "main", "error", err, "port", cfg.Port)
		os.Exit(1)
	}

	// Create gRPC server
	grpcServer := createGRPCServer(cfg, logger)

	logger.Info("startup: server listening", "function", "main", "address", lis.Addr())

	if err := grpcServer.Serve(lis); err != nil {
		logger.Error("startup: failed to serve", "function", "main", "error", err)
		os.Exit(1)
	}
}
