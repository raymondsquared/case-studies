package main

import (
	"flag"
	"fmt"
	"log/slog"
	"net"
	"os"

	helloworldLocal "case-studies/grpc/cmd/helloworld"

	"google.golang.org/grpc"
	"google.golang.org/grpc/health"
	grpc_health_v1 "google.golang.org/grpc/health/grpc_health_v1"
	"google.golang.org/grpc/reflection"

	"case-studies/grpc/internal/config"
	"case-studies/grpc/internal/middleware"
	"case-studies/grpc/internal/validation"
)

func loadConfig() *config.ServerConfig {
	flagPort := flag.Int("port", config.DefaultPort, "The server port")

	flag.Parse()

	// Load base config from environment
	baseConfig := config.LoadServerConfig()

	// Override with command line flags
	baseConfig.Port = *flagPort

	// Validate configuration
	if err := validation.ValidatePort(baseConfig.Port); err != nil {
		slog.Error("invalid port configuration", "error", err)
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
	// Configure server options
	serverOpts := []grpc.ServerOption{
		grpc.ChainUnaryInterceptor(
			middleware.LoggingInterceptor(logger),
			middleware.ErrorInterceptor(),
			middleware.RecoveryInterceptor(logger),
		),
	}

	grpcServer := grpc.NewServer(serverOpts...)

	// Register services
	greeterServer := &server{logger: logger}
	helloworldLocal.RegisterGreeterServer(grpcServer, greeterServer)

	// Register health check service
	healthServer := health.NewServer()
	grpc_health_v1.RegisterHealthServer(grpcServer, healthServer)

	// Set health status
	healthServer.SetServingStatus("helloworld.Greeter", grpc_health_v1.HealthCheckResponse_SERVING)

	// Register reflection service for debugging
	reflection.Register(grpcServer)

	logger.Info("gRPC server configured")

	return grpcServer
}

func main() {
	logger := setupLogger()
	cfg := loadConfig()

	logger.Info("starting gRPC server", "port", cfg.Port)

	// Create listener
	lis, err := net.Listen("tcp", fmt.Sprintf(":%d", cfg.Port))
	if err != nil {
		logger.Error("failed to listen", "error", err, "port", cfg.Port)
		os.Exit(1)
	}

	// Create gRPC server
	grpcServer := createGRPCServer(cfg, logger)

	logger.Info("server listening", "address", lis.Addr())

	// Start serving
	if err := grpcServer.Serve(lis); err != nil {
		logger.Error("failed to serve", "error", err)
		os.Exit(1)
	}
}
