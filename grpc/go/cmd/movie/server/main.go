package main

import (
	"crypto/tls"
	"crypto/x509"
	"flag"
	"fmt"
	"net"
	"os"
	"path/filepath"

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

const (
	AppType = "grpc-server"
	AppName = "movie"
)

func loadConfig() *config.ServerConfig {
	flagPort := flag.Int("port", config.DefaultPort, "The server port")
	flagAssetsFilePath := flag.String("assets-file-path", config.DefaultAssetsFilePath, "The file path for assets")
	flagLogLevel := flag.String("log-level", config.DefaultLogLevel, "Log level (debug, info, warn, error)")

	flag.Parse()

	baseConfig := config.LoadServerConfig()

	if flag.CommandLine.Lookup("port").Value.String() != fmt.Sprintf("%d", config.DefaultPort) || flag.NFlag() > 0 {
		baseConfig.Port = *flagPort
	}
	if flag.CommandLine.Lookup("assets-file-path").Value.String() != config.DefaultAssetsFilePath || flag.NFlag() > 0 {
		baseConfig.AssetsFilePath = *flagAssetsFilePath
	}

	// Only override log level if explicitly set via flag (not environment-based default)
	if flag.CommandLine.Lookup("log-level").Value.String() != config.DefaultLogLevel {
		baseConfig.LogLevel = *flagLogLevel
	}

	if err := validation.ValidatePort(baseConfig.Port); err != nil {
		observability.LogError("config-validation", "loadConfig", err, map[string]interface{}{
			"field": "port",
		})
		os.Exit(1)
	}
	if err := validation.ValidateAssetsFilePath(baseConfig.AssetsFilePath); err != nil {
		observability.LogError("config-validation", "loadConfig", err, map[string]interface{}{
			"field": "assets_file_path",
		})
		os.Exit(1)
	}
	if err := validation.ValidateLogLevel(baseConfig.LogLevel); err != nil {
		observability.LogError("config-validation", "loadConfig", err, map[string]interface{}{
			"field": "log_level",
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
	var validAPIKeys []string
	for _, k := range cfg.APIKeys {
		validAPIKeys = append(validAPIKeys, k.Key)
	}

	certFilePath := filepath.Join(cfg.AssetsFilePath, "tls", "server-public.key")
	keyFilePath := filepath.Join(cfg.AssetsFilePath, "tls", "server-private.key")

	cert, err := tls.LoadX509KeyPair(certFilePath, keyFilePath)
	if err != nil {
		observability.LogError("tls-load", "createGRPCServer", err, map[string]interface{}{
			"cert_file": certFilePath,
			"key_file":  keyFilePath,
		})
		os.Exit(1)
	}

	// Load the CA certificate for client verification
	caCertPath := filepath.Join(cfg.AssetsFilePath, "tls", "ca-public.key")
	caCert, err := os.ReadFile(caCertPath)
	if err != nil {
		observability.LogError("ca-cert-read", "createGRPCServer", err, map[string]interface{}{
			"cert_file": caCertPath,
		})
		os.Exit(1)
	}
	caPool := x509.NewCertPool()
	if !caPool.AppendCertsFromPEM(caCert) {
		observability.LogError("ca-cert-append", "createGRPCServer", fmt.Errorf("failed to append CA certificate to pool"), nil)
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
			middleware.LoggingInterceptor(),
			middleware.ErrorInterceptor(),
			middleware.RecoveryInterceptor(),
		),
	}

	grpcServer := grpc.NewServer(serverOpts...)

	movieServer := &server{assetsFilePath: cfg.AssetsFilePath}

	movies, err := movieServer.loadMovies()
	if err != nil {
		observability.LogError("movie-data-load", "createGRPCServer", err, nil)
		os.Exit(1)
	}
	movieServer.movies = movies

	movie.RegisterGetterServer(grpcServer, movieServer)

	healthServer := health.NewServer()
	grpc_health_v1.RegisterHealthServer(grpcServer, healthServer)

	healthServer.SetServingStatus("movie.Getter", grpc_health_v1.HealthCheckResponse_SERVING)

	reflection.Register(grpcServer)

	observability.LogSuccess("grpc-server-setup", "createGRPCServer", map[string]interface{}{
		"service": "movie.Getter",
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
