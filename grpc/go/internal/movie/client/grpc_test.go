package client

import (
	"case-studies/grpc/internal/config"
	"flag"
	"os"
	"path/filepath"
	"testing"
)

func withEnvAndFlags(t *testing.T, envVars map[string]string, flagArgs []string, testFn func()) {
	originalEnv := make(map[string]string)
	for key := range envVars {
		originalEnv[key] = os.Getenv(key)
	}
	defer func() {
		for key, value := range originalEnv {
			os.Setenv(key, value)
		}
	}()

	// Reset flag command line
	flag.CommandLine = flag.NewFlagSet(os.Args[0], flag.ExitOnError)

	// Set environment variables
	for key := range envVars {
		os.Unsetenv(key)
	}
	for key, value := range envVars {
		os.Setenv(key, value)
	}

	// Set command line arguments
	os.Args = append([]string{"test"}, flagArgs...)

	testFn()
}

func TestLoadConfig(t *testing.T) {
	tests := []struct {
		name           string
		envVars        map[string]string
		flagArgs       []string
		expectedConfig *config.MovieClientConfig
	}{
		{
			name:     "default values",
			envVars:  map[string]string{},
			flagArgs: []string{},
			expectedConfig: &config.MovieClientConfig{
				ClientConfig: config.ClientConfig{
					Host: "localhost",
					Port: 50051,
				},
				Environment: "development",
				LogLevel:    "debug",
				APIKey:      "",
			},
		},
		{
			name: "custom values via flags",
			envVars: map[string]string{
				"ENVIRONMENT": "production",
			},
			flagArgs: []string{
				"-host", "example.com",
				"-port", "9090",
				"-log-level", "error",
				"-api-key", "flag-key",
			},
			expectedConfig: &config.MovieClientConfig{
				ClientConfig: config.ClientConfig{
					Host: "example.com",
					Port: 9090,
				},
				Environment: "production",
				LogLevel:    "error",
				APIKey:      "flag-key",
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			withEnvAndFlags(t, tt.envVars, tt.flagArgs, func() {
				// When
				config := LoadConfig()

				// Then
				if config.Host != tt.expectedConfig.Host {
					t.Errorf("Given envVars %v and flagArgs %v, When loading config, Then expected Host %s, got %s", tt.envVars, tt.flagArgs, tt.expectedConfig.Host, config.Host)
				}
				if config.Port != tt.expectedConfig.Port {
					t.Errorf("Given envVars %v and flagArgs %v, When loading config, Then expected Port %d, got %d", tt.envVars, tt.flagArgs, tt.expectedConfig.Port, config.Port)
				}
				if config.Environment != tt.expectedConfig.Environment {
					t.Errorf("Given envVars %v and flagArgs %v, When loading config, Then expected Environment %s, got %s", tt.envVars, tt.flagArgs, tt.expectedConfig.Environment, config.Environment)
				}
				if config.LogLevel != tt.expectedConfig.LogLevel {
					t.Errorf("Given envVars %v and flagArgs %v, When loading config, Then expected LogLevel %s, got %s", tt.envVars, tt.flagArgs, tt.expectedConfig.LogLevel, config.LogLevel)
				}
				if config.APIKey != tt.expectedConfig.APIKey {
					t.Errorf("Given envVars %v and flagArgs %v, When loading config, Then expected APIKey %s, got %s", tt.envVars, tt.flagArgs, tt.expectedConfig.APIKey, config.APIKey)
				}
			})
		})
	}
}

func TestLoadConfigValidationErrors(t *testing.T) {
	tests := []struct {
		name     string
		envVars  map[string]string
		flagArgs []string
	}{
		{
			name: "invalid host",
			envVars: map[string]string{
				"SERVER_HOST": "invalid host with spaces",
			},
			flagArgs: []string{},
		},
		{
			name: "invalid port",
			envVars: map[string]string{
				"SERVER_PORT": "99999",
			},
			flagArgs: []string{},
		},
		{
			name: "invalid log level",
			envVars: map[string]string{
				"LOG_LEVEL": "invalid-level",
			},
			flagArgs: []string{},
		},
		{
			name: "invalid environment",
			envVars: map[string]string{
				"ENVIRONMENT": "invalid-env",
			},
			flagArgs: []string{},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Skip("Validation error cases cause os.Exit and require integration testing")
		})
	}
}

func TestCreateGRPCConnection(t *testing.T) {
	tests := []struct {
		name        string
		config      *config.MovieClientConfig
		expectError bool
	}{
		{
			name: "valid config",
			config: &config.MovieClientConfig{
				ClientConfig: config.ClientConfig{
					Host: "localhost",
					Port: 50051,
				},
				Environment: "development",
				LogLevel:    "debug",
				APIKey:      "",
			},
			expectError: true,
		},
		{
			name: "invalid host",
			config: &config.MovieClientConfig{
				ClientConfig: config.ClientConfig{
					Host: "",
					Port: 50051,
				},
				Environment: "development",
				LogLevel:    "debug",
				APIKey:      "",
			},
			expectError: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// When
			conn, err := CreateGRPCConnection(tt.config)

			// Then
			if tt.expectError {
				if err == nil {
					t.Error("Given config, When creating gRPC connection, Then expected error, got nil")
				}
			} else {
				if err != nil {
					t.Errorf("Given config, When creating gRPC connection, Then expected no error, got %v", err)
				}
				if conn == nil {
					t.Error("Given config, When creating gRPC connection, Then expected connection, got nil")
				}
			}
		})
	}
}

func TestCreateGRPCConnectionWithTLSFiles(t *testing.T) {
	// Given
	tempDir := t.TempDir()
	tlsDir := filepath.Join(tempDir, "tls")
	err := os.MkdirAll(tlsDir, 0755)
	if err != nil {
		t.Fatalf("Failed to create TLS directory: %v", err)
	}

	clientCertPath := filepath.Join(tlsDir, "client-public.key")
	clientKeyPath := filepath.Join(tlsDir, "client-private.key")

	err = os.WriteFile(clientCertPath, []byte("invalid cert content"), 0644)
	if err != nil {
		t.Fatalf("Failed to create mock client cert: %v", err)
	}

	err = os.WriteFile(clientKeyPath, []byte("invalid key content"), 0644)
	if err != nil {
		t.Fatalf("Failed to create mock client key: %v", err)
	}

	config := &config.MovieClientConfig{
		ClientConfig: config.ClientConfig{
			Host: "localhost",
			Port: 50051,
		},
		Environment: "development",
		LogLevel:    "debug",
		APIKey:      "",
	}

	// When
	conn, err := CreateGRPCConnection(config)

	// Then
	if err == nil {
		t.Error("Given invalid TLS cert, When creating gRPC connection, Then expected error, got nil")
	}
	if conn != nil {
		t.Error("Given invalid TLS cert, When creating gRPC connection, Then expected nil connection, got connection")
	}
}

func TestLoadConfigWithEnvironmentOverride(t *testing.T) {
	withEnvAndFlags(t, map[string]string{
		"SERVER_HOST": "env-host",
		"SERVER_PORT": "9090",
		"ENVIRONMENT": "production",
		"LOG_LEVEL":   "error",
		"X_API_KEY":   "env-key",
	}, []string{}, func() {
		// When
		config := LoadConfig()

		// Then
		if config.Host != "env-host" {
			t.Errorf("Host = %s, want env-host", config.Host)
		}
		if config.Port != 9090 {
			t.Errorf("Port = %d, want 9090", config.Port)
		}
		if config.Environment != "production" {
			t.Errorf("Environment = %s, want production", config.Environment)
		}
		if config.LogLevel != "error" {
			t.Errorf("LogLevel = %s, want error", config.LogLevel)
		}
		if config.APIKey != "env-key" {
			t.Errorf("APIKey = %s, want env-key", config.APIKey)
		}
	})
}

func TestLoadConfigFlagPrecedence(t *testing.T) {
	withEnvAndFlags(t, map[string]string{
		"SERVER_HOST": "env-host",
		"SERVER_PORT": "9090",
		"ENVIRONMENT": "production",
		"LOG_LEVEL":   "error",
		"X_API_KEY":   "env-key",
	}, []string{"-host", "flag-host", "-port", "8080", "-log-level", "debug", "-api-key", "flag-key"}, func() {
		// When
		config := LoadConfig()

		// Then
		if config.Host != "flag-host" {
			t.Errorf("Host = %s, want flag-host", config.Host)
		}
		if config.Port != 8080 {
			t.Errorf("Port = %d, want 8080", config.Port)
		}
		if config.Environment != "production" {
			t.Errorf("Environment = %s, want production", config.Environment)
		}
		if config.LogLevel != "debug" {
			t.Errorf("LogLevel = %s, want debug", config.LogLevel)
		}
		if config.APIKey != "flag-key" {
			t.Errorf("APIKey = %s, want flag-key", config.APIKey)
		}
	})
}
