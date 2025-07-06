package main

import (
	"context"
	"flag"
	"fmt"
	"os"

	"case-studies/grpc/cmd/helloworld"
	"case-studies/grpc/internal/config"
	"case-studies/grpc/internal/middleware"
	"case-studies/grpc/internal/observability"
	"case-studies/grpc/internal/validation"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

const (
	AppType = "grpc-client"
	AppName = "helloworld"
)

func loadConfig() *config.HelloWorldClientConfig {
	flagHost := flag.String("host", config.DefaultHost, "the server host to connect to")
	flagPort := flag.Int("port", config.DefaultPort, "the server port to connect to")
	flagName := flag.String("name", config.DefaultName, "Name to greet")

	flag.Parse()

	baseConfig := config.LoadHelloWorldClientConfig()

	if flag.CommandLine.Lookup("host").Value.String() != config.DefaultHost || flag.NFlag() > 0 {
		baseConfig.Host = *flagHost
	}
	if flag.CommandLine.Lookup("port").Value.String() != fmt.Sprintf("%d", config.DefaultPort) || flag.NFlag() > 0 {
		baseConfig.Port = *flagPort
	}
	if flag.CommandLine.Lookup("name").Value.String() != config.DefaultName || flag.NFlag() > 0 {
		baseConfig.Name = *flagName
	}

	if err := validation.ValidateHost(baseConfig.Host); err != nil {
		observability.LogError("config-validation", "loadConfig", err, map[string]interface{}{
			"field": "host",
		})
		os.Exit(1)
	}
	if err := validation.ValidatePort(baseConfig.Port); err != nil {
		observability.LogError("config-validation", "loadConfig", err, map[string]interface{}{
			"field": "port",
		})
		os.Exit(1)
	}
	if err := validation.ValidateName(baseConfig.Name); err != nil {
		observability.LogError("config-validation", "loadConfig", err, map[string]interface{}{
			"field": "name",
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

func CreateGRPCConnection(cfg *config.HelloWorldClientConfig) (*grpc.ClientConn, error) {
	serverURL := fmt.Sprintf("%s:%d", cfg.Host, cfg.Port)

	observability.LogSuccess("grpc-connect", "CreateGRPCConnection", map[string]interface{}{
		"server": serverURL,
	})

	conn, err := grpc.NewClient(serverURL,
		grpc.WithTransportCredentials(insecure.NewCredentials()),
		grpc.WithUnaryInterceptor(middleware.ClientLoggingInterceptor()),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to %s: %w", serverURL, err)
	}

	observability.LogSuccess("grpc-connect", "CreateGRPCConnection", map[string]interface{}{
		"server": serverURL,
	})
	return conn, nil
}

func main() {
	cfg := loadConfig()
	observability.SetupLogger(cfg.LogLevel)

	observability.LogStartup(AppType, AppName, map[string]interface{}{
		"host":        cfg.Host,
		"port":        cfg.Port,
		"name":        cfg.Name,
		"environment": cfg.Environment,
	})
	observability.LogConfig(cfg.LogLevel)

	conn, err := CreateGRPCConnection(cfg)
	if err != nil {
		observability.LogError("grpc-connect", "main", err, nil)
		os.Exit(1)
	}
	defer func() {
		if err := conn.Close(); err != nil {
			observability.LogError("grpc-disconnect", "main", err, nil)
		}
	}()

	helloworldClient := helloworld.NewGreeterClient(conn)

	requestCtx := context.Background()

	if err := MakeGreeterRequest(requestCtx, helloworldClient, cfg.Name); err != nil {
		observability.LogError("greeter-request", "main", err, nil)
		os.Exit(1)
	}

	observability.LogSuccess("client-completion", "main", nil)
}
