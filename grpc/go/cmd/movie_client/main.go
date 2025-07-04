package main

import (
	"context"
	"crypto/tls"
	"crypto/x509"
	"flag"
	"fmt"
	"io"
	"log/slog"
	"os"
	"path/filepath"
	"time"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials"
	"google.golang.org/grpc/metadata"

	"case-studies/grpc/cmd/movie"
	"case-studies/grpc/internal/config"
	"case-studies/grpc/internal/middleware"
	"case-studies/grpc/internal/validation"
)

func loadConfig(logger *slog.Logger) *config.ClientConfig {
	flagHost := flag.String("host", config.DefaultHost, "the server host to connect to")
	flagPort := flag.Int("port", config.DefaultPort, "the server port to connect to")
	flagName := flag.String("name", config.DefaultName, "Name to greet")
	flagMovieDataFilePath := flag.String("movie-data-file-path", config.DefaultMovieDataFilePath, "The file path for movie data")
	flagAPIKey := flag.String("api-key", "", "API key for authentication (overrides X_API_KEY env var)")

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
	if *flagAPIKey != "" {
		baseConfig.APIKey = *flagAPIKey
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

	cert, err := tls.LoadX509KeyPair("../assets/certificate.crt", "../assets/private.key")
	if err != nil {
		logger.Error("failed to load client key pair", "error", err)
		return nil, err
	}
	caCert, err := os.ReadFile("../assets/certificate.crt")
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

	// Use background context for request, with x-api-key metadata
	xApiKey := cfg.APIKey
	if xApiKey == "" {
		logger.Error("startup: X_API_KEY environment variable or --api-key flag not set", "function", "main")
		os.Exit(1)
	}
	requestCtx := metadata.AppendToOutgoingContext(context.Background(), "x-api-key", xApiKey)

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

	MakeGetterRequestChatWithAPIKey(movieClient, logger, cfg)

	logger.Info("shutdown: client completed successfully", "function", "main")
}

func MakeGetterRequestChatWithAPIKey(client movie.GetterClient, logger *slog.Logger, cfg *config.ClientConfig) {
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

	xApiKey := cfg.APIKey
	if xApiKey == "" {
		logger.Error("X_API_KEY environment variable or --api-key flag not set", "function", "MakeGetterRequestChatWithAPIKey")
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()
	ctx = metadata.AppendToOutgoingContext(ctx, "x-api-key", xApiKey)

	stream, err := client.GetMovieByRatingsChat(ctx)
	if err != nil {
		logger.Error("stream: failed to start GetMovieByRatingsChat", "function", "MakeGetterRequestChatWithAPIKey", "error", err)
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
				logger.Error("stream: receive failed", "function", "MakeGetterRequestChatWithAPIKey", "error", err)
				return
			}
			logger.Info("stream: received movies", "function", "MakeGetterRequestChatWithAPIKey", "count", in.MovieCount, "total_so_far", in.MovieCountSoFar)
		}
	}()

	// Send
	for _, note := range getMovieInputs {
		time.Sleep(3 * time.Second)
		if err := stream.Send(note); err != nil {
			logger.Error("stream: send failed", "function", "MakeGetterRequestChatWithAPIKey", "note", note, "error", err)
			return
		}
	}

	stream.CloseSend()
	<-waitc
}
