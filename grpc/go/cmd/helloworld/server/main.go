package main

import (
	"flag"
	"fmt"
	"net"
	"os"

	"google.golang.org/grpc"
	"google.golang.org/grpc/health"
	grpc_health_v1 "google.golang.org/grpc/health/grpc_health_v1"
	"google.golang.org/grpc/reflection"

	"case-studies/grpc/cmd/helloworld"
	"case-studies/grpc/internal/config"
	"case-studies/grpc/internal/middleware"
	"case-studies/grpc/internal/observability"
	"case-studies/grpc/internal/validation"
)

const (
	AppType = "grpc-server"
	AppName = "helloworld"
)

func loadConfig() *config.ServerConfig {
	flagPort := flag.Int("port", config.DefaultPort, "The server port")

	flag.Parse()

	baseConfig := config.LoadServerConfig()

	if flag.CommandLine.Lookup("port").Value.String() != fmt.Sprintf("%d", config.DefaultPort) || flag.NFlag() > 0 {
		baseConfig.Port = *flagPort
	}

	if err := validation.ValidatePort(baseConfig.Port); err != nil {
		observability.LogError("config-validation", "loadConfig", err, map[string]interface{}{
			"field": "port",
		})
		os.Exit(1)
	}
	if err := validation.ValidateEnvironment(baseConfig.Environment); err != nil {
		observability.LogError("config-validation", "loadConfig", err, map[string]interface{}{
			"field": "environment",
		})
		os.Exit(1)
	}

	return baseConfig
}

func createGRPCServer(cfg *config.ServerConfig) *grpc.Server {
	serverOpts := []grpc.ServerOption{
		grpc.ChainUnaryInterceptor(
			middleware.LoggingInterceptor(),
			middleware.ErrorInterceptor(),
			middleware.RecoveryInterceptor(),
		),
	}

	grpcServer := grpc.NewServer(serverOpts...)

	greeterServer := &server{}
	helloworld.RegisterGreeterServer(grpcServer, greeterServer)

	healthServer := health.NewServer()
	grpc_health_v1.RegisterHealthServer(grpcServer, healthServer)

	healthServer.SetServingStatus("helloworld.Greeter", grpc_health_v1.HealthCheckResponse_SERVING)

	reflection.Register(grpcServer)

	observability.LogSuccess("grpc-server-setup", "createGRPCServer", map[string]interface{}{
		"service": "helloworld.Greeter",
	})

	return grpcServer
}

func main() {
	cfg := loadConfig()
	observability.SetupLogger(cfg.LogLevel)

	observability.LogStartup(AppType, AppName, map[string]interface{}{
		"port":        cfg.Port,
		"environment": cfg.Environment,
	})
	observability.LogConfig(cfg.LogLevel)

	lis, err := net.Listen("tcp", fmt.Sprintf(":%d", cfg.Port))
	if err != nil {
		observability.LogError("server-listen", "main", err, map[string]interface{}{
			"port": cfg.Port,
		})
		os.Exit(1)
	}

	grpcServer := createGRPCServer(cfg)

	observability.LogSuccess("server-listen", "main", map[string]interface{}{
		"address": lis.Addr(),
	})

	if err := grpcServer.Serve(lis); err != nil {
		observability.LogError("server-serve", "main", err, nil)
		os.Exit(1)
	}
}
