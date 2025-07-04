package main

import (
	"crypto/tls"
	"crypto/x509"
	"flag"
	"fmt"
	"log/slog"
	"net"
	"os"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials"
	"google.golang.org/grpc/health"
	grpc_health_v1 "google.golang.org/grpc/health/grpc_health_v1"
	"google.golang.org/grpc/reflection"

	"case-studies/grpc/cmd/movie"
	"case-studies/grpc/internal/config"
	"case-studies/grpc/internal/middleware"
	"case-studies/grpc/internal/observability"
	"case-studies/grpc/internal/validation"
)

func loadConfig(logger *slog.Logger) *config.ServerConfig {
	flagPort := flag.Int("port", config.DefaultPort, "The server port")
	flagMovieDataFilePath := flag.String("movie-data-file-path", config.DefaultMovieDataFilePath, "The file path for movie data")
	flagLogLevel := flag.String("log-level", config.DefaultLogLevel, "Log level (debug, info, warn, error)")

	flag.Parse()

	baseConfig := config.LoadServerConfig()

	if flag.CommandLine.Lookup("port").Value.String() != fmt.Sprintf("%d", config.DefaultPort) || flag.NFlag() > 0 {
		baseConfig.Port = *flagPort
	}
	if flag.CommandLine.Lookup("movie-data-file-path").Value.String() != config.DefaultMovieDataFilePath || flag.NFlag() > 0 {
		baseConfig.MovieDataFilePath = *flagMovieDataFilePath
	}
	if flag.CommandLine.Lookup("log-level").Value.String() != config.DefaultLogLevel || flag.NFlag() > 0 {
		baseConfig.LogLevel = *flagLogLevel
	}

	if err := validation.ValidatePort(baseConfig.Port); err != nil {
		logger.Error("startup: invalid port configuration", "function", "loadConfig", "error", err)
		os.Exit(1)
	}
	if err := validation.ValidateMovieDataFilePath(baseConfig.MovieDataFilePath); err != nil {
		logger.Error("startup: invalid file data path configuration", "function", "loadConfig", "error", err)
		os.Exit(1)
	}
	if err := validation.ValidateLogLevel(baseConfig.LogLevel); err != nil {
		logger.Error("startup: invalid log level configuration", "function", "loadConfig", "error", err)
		os.Exit(1)
	}

	return baseConfig
}

func setupLogger(logLevel string) *slog.Logger {
	opts := &slog.HandlerOptions{
		Level: observability.ParseLogLevel(logLevel),
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

	cert, err := tls.LoadX509KeyPair("../assets/certificate.crt", "../assets/private.key")
	if err != nil {
		logger.Error("failed to load server key pair", "error", err)
		os.Exit(1)
	}
	caCert, err := os.ReadFile("../assets/certificate.crt")
	if err != nil {
		logger.Error("failed to read CA certificate", "error", err)
		os.Exit(1)
	}
	caPool := x509.NewCertPool()
	if !caPool.AppendCertsFromPEM(caCert) {
		logger.Error("failed to append CA certificate to pool")
		os.Exit(1)
	}

	tlsConfig := &tls.Config{
		Certificates: []tls.Certificate{cert},
		ClientAuth:   tls.RequireAndVerifyClientCert,
		ClientCAs:    caPool,
	}

	creds := credentials.NewTLS(tlsConfig)

	serverOpts := []grpc.ServerOption{
		grpc.Creds(creds),
		grpc.ChainUnaryInterceptor(
			middleware.APIKeyAuthInterceptor(validAPIKeys),
			middleware.LoggingInterceptor(logger),
			middleware.ErrorInterceptor(),
			middleware.RecoveryInterceptor(logger),
		),
	}

	grpcServer := grpc.NewServer(serverOpts...)

	movieServer := &server{logger: logger, movieDataFilePath: cfg.MovieDataFilePath}

	movies, err := movieServer.loadMovies()
	if err != nil {
		logger.Error("startup: failed to load movie data", "function", "createGRPCServer", "error", err)
		os.Exit(1)
	}
	movieServer.movies = movies

	movie.RegisterGetterServer(grpcServer, movieServer)

	healthServer := health.NewServer()
	grpc_health_v1.RegisterHealthServer(grpcServer, healthServer)

	healthServer.SetServingStatus("movie.Getter", grpc_health_v1.HealthCheckResponse_SERVING)

	reflection.Register(grpcServer)

	logger.Info("gRPC server configured")

	return grpcServer
}

func main() {
	cfg := loadConfig(nil)
	logger := setupLogger(cfg.LogLevel)

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
