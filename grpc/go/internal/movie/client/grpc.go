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
	"log/slog"
	"os"
	"path/filepath"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials"
)

func LoadConfig(logger *slog.Logger) *config.MovieClientConfig {
	flagHost := flag.String("host", config.DefaultHost, "the server host to connect to")
	flagPort := flag.Int("port", config.DefaultPort, "the server port to connect to")
	flagAssetsFilePath := flag.String("assets-file-path", config.DefaultAssetsFilePath, "The file path for assets")
	flagAPIKey := flag.String("api-key", "", "API key for authentication (overrides X_API_KEY env var)")
	flagLogLevel := flag.String("log-level", config.DefaultLogLevel, "Log level (debug, info, warn, error)")

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
	if flag.CommandLine.Lookup("log-level").Value.String() != config.DefaultLogLevel || flag.NFlag() > 0 {
		baseConfig.LogLevel = *flagLogLevel
	}
	if *flagAPIKey != "" {
		baseConfig.APIKey = *flagAPIKey
	}

	if err := validation.ValidateHost(baseConfig.Host); err != nil {
		logger.Error("startup: invalid host configuration", "function", "loadConfig", "error", err)
		os.Exit(1)
	}
	if err := validation.ValidatePort(baseConfig.Port); err != nil {
		logger.Error("startup: invalid port configuration", "function", "loadConfig", "error", err)
		os.Exit(1)
	}
	if flag.CommandLine.Lookup("assets-file-path") != nil && flag.CommandLine.Lookup("assets-file-path").Value.String() != "" {
		if err := validation.ValidateAssetsFilePath(baseConfig.AssetsFilePath); err != nil {
			logger.Error("startup: invalid file data path configuration", "function", "loadConfig", "error", err)
			os.Exit(1)
		}
	}
	if err := validation.ValidateLogLevel(baseConfig.LogLevel); err != nil {
		logger.Error("startup: invalid log level configuration", "function", "loadConfig", "error", err)
		os.Exit(1)
	}

	return baseConfig
}

func SetupLogger(logLevel string) *slog.Logger {
	opts := &slog.HandlerOptions{
		Level: observability.ParseLogLevel(logLevel),
	}
	handler := slog.NewJSONHandler(os.Stdout, opts)
	logger := slog.New(handler)
	slog.SetDefault(logger)
	return logger
}

func CreateGRPCConnection(cfg *config.MovieClientConfig, logger *slog.Logger) (*grpc.ClientConn, error) {
	serverURL := fmt.Sprintf("%s:%d", cfg.Host, cfg.Port)

	logger.Info("connecting to gRPC server",
		"server", serverURL)

	certFilePath := filepath.Join(cfg.AssetsFilePath, "certificate.crt")
	keyFilePath := filepath.Join(cfg.AssetsFilePath, "private.key")

	cert, err := tls.LoadX509KeyPair(certFilePath, keyFilePath)
	if err != nil {
		logger.Error("failed to load client key pair", "error", err)
		return nil, err
	}
	// Since we are testing with the same certificate for both client ans server
	caCert, err := os.ReadFile(certFilePath)
	if err != nil {
		logger.Error("failed to read CA certificate", "error", err)
		return nil, err
	}
	caPool := x509.NewCertPool()
	if !caPool.AppendCertsFromPEM(caCert) {
		logger.Error("failed to append CA certificate to pool")
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
		grpc.WithUnaryInterceptor(middleware.ClientLoggingInterceptor(logger)),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to %s: %w", serverURL, err)
	}
	logger.Info("successfully connected to gRPC server", "server", serverURL)
	return conn, nil
}
