package client

import (
	"case-studies/grpc/internal/config"
	"case-studies/grpc/internal/middleware"
	"case-studies/grpc/internal/observability"
	"case-studies/grpc/internal/validation"
	"crypto/tls"
	"crypto/x509"
	"flag"
	"fmt"
	"os"
	"path/filepath"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials"
)

func LoadConfig() *config.MovieClientConfig {
	flagHost := flag.String("host", config.DefaultHost, "the server host to connect to")
	flagPort := flag.Int("port", config.DefaultPort, "the server port to connect to")
	flagAssetsFilePath := flag.String("assets-file-path", config.DefaultAssetsFilePath, "The file path for assets")
	flagAPIKey := flag.String("api-key", "", "API key for authentication (overrides X_API_KEY env var)")
	flagLogLevel := flag.String("log-level", config.DefaultLogLevel, "Log level (debug, info, warn, error)")
	flagEnvironment := flag.String("environment", "", "Environment (development, staging, production)")

	flag.Parse()

	baseConfig := config.LoadMovieClientConfig()

	if flag.CommandLine.Lookup("host").Value.String() != config.DefaultHost || flag.NFlag() > 0 {
		baseConfig.Host = *flagHost
	}
	if flag.CommandLine.Lookup("port").Value.String() != fmt.Sprintf("%d", config.DefaultPort) || flag.NFlag() > 0 {
		baseConfig.Port = *flagPort
	}
	if flag.CommandLine.Lookup("assets-file-path").Value.String() != config.DefaultAssetsFilePath || flag.NFlag() > 0 {
		baseConfig.AssetsFilePath = *flagAssetsFilePath
	}
	// Only override log level if the user explicitly set the flag
	if flag.CommandLine.Lookup("log-level") != nil && flag.CommandLine.Lookup("log-level").DefValue != flag.CommandLine.Lookup("log-level").Value.String() {
		baseConfig.LogLevel = *flagLogLevel
	}
	if *flagAPIKey != "" {
		baseConfig.APIKey = *flagAPIKey
	}
	// Add: Only override environment if the user explicitly set the flag
	if flag.CommandLine.Lookup("environment") != nil && *flagEnvironment != "" {
		baseConfig.Environment = *flagEnvironment
		// Update log level if environment changes and log-level flag is not set
		if !(flag.CommandLine.Lookup("log-level") != nil && flag.CommandLine.Lookup("log-level").DefValue != flag.CommandLine.Lookup("log-level").Value.String()) {
			baseConfig.LogLevel = config.GetDefaultLogLevel(*flagEnvironment)
		}
	}

	if err := validation.ValidateHost(baseConfig.Host); err != nil {
		observability.LogError("config-validation", "LoadConfig", err, map[string]interface{}{
			"field": "host",
		})
		os.Exit(1)
	}
	if err := validation.ValidatePort(baseConfig.Port); err != nil {
		observability.LogError("config-validation", "LoadConfig", err, map[string]interface{}{
			"field": "port",
		})
		os.Exit(1)
	}
	if flag.CommandLine.Lookup("assets-file-path") != nil && flag.CommandLine.Lookup("assets-file-path").Value.String() != "" {
		if err := validation.ValidateAssetsFilePath(baseConfig.AssetsFilePath); err != nil {
			observability.LogError("config-validation", "LoadConfig", err, map[string]interface{}{
				"field": "assets_file_path",
			})
			os.Exit(1)
		}
	}
	if err := validation.ValidateLogLevel(baseConfig.LogLevel); err != nil {
		observability.LogError("config-validation", "LoadConfig", err, map[string]interface{}{
			"field": "log_level",
		})
		os.Exit(1)
	}
	if err := validation.ValidateEnvironment(baseConfig.Environment); err != nil {
		observability.LogError("config-validation", "LoadConfig", err, map[string]interface{}{
			"field": "environment",
		})
		os.Exit(1)
	}

	return baseConfig
}

func CreateGRPCConnection(cfg *config.MovieClientConfig) (*grpc.ClientConn, error) {
	serverURL := fmt.Sprintf("%s:%d", cfg.Host, cfg.Port)

	observability.LogSuccess("grpc-connect", "CreateGRPCConnection", map[string]interface{}{
		"server": serverURL,
	})

	certFilePath := filepath.Join(cfg.AssetsFilePath, "tls", "client-public.key")
	keyFilePath := filepath.Join(cfg.AssetsFilePath, "tls", "client-private.key")

	cert, err := tls.LoadX509KeyPair(certFilePath, keyFilePath)
	if err != nil {
		observability.LogError("tls-load", "CreateGRPCConnection", err, map[string]interface{}{
			"cert_file": certFilePath,
			"key_file":  keyFilePath,
		})
		return nil, err
	}
	// Load the CA certificate for server verification
	caCertPath := filepath.Join(cfg.AssetsFilePath, "tls", "ca-public.key")
	caCert, err := os.ReadFile(caCertPath)
	if err != nil {
		observability.LogError("ca-cert-read", "CreateGRPCConnection", err, map[string]interface{}{
			"cert_file": caCertPath,
		})
		return nil, err
	}
	caPool := x509.NewCertPool()
	if !caPool.AppendCertsFromPEM(caCert) {
		observability.LogError("ca-cert-append", "CreateGRPCConnection", fmt.Errorf("failed to append CA certificate to pool"), nil)
		return nil, err
	}

	tlsConfig := &tls.Config{
		Certificates: []tls.Certificate{cert},
		RootCAs:      caPool,
		ServerName:   "localhost",
	}

	creds := credentials.NewTLS(tlsConfig)

	conn, err := grpc.NewClient(serverURL,
		grpc.WithTransportCredentials(creds),
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
