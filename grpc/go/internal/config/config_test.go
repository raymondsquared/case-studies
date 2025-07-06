package config

import (
	"os"
	"path/filepath"
	"testing"
)

func withEnvVars(t *testing.T, envVars map[string]string, testFn func()) {
	originalEnv := make(map[string]string)
	for key := range envVars {
		originalEnv[key] = os.Getenv(key)
	}
	defer func() {
		for key, value := range originalEnv {
			os.Setenv(key, value)
		}
	}()

	for key := range envVars {
		os.Unsetenv(key)
	}
	for key, value := range envVars {
		os.Setenv(key, value)
	}

	testFn()
}

func TestValidateLogLevel(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{"debug level", "debug", "debug"},
		{"info level", "info", "info"},
		{"warn level", "warn", "warn"},
		{"error level", "error", "error"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Given
			input := tt.input

			// When
			result := validateLogLevel(input)

			// Then
			if result != tt.expected {
				t.Errorf("Given input %q, When validated, Then expected %q, got %q", input, tt.expected, result)
			}
		})
	}
}

func TestGetDefaultLogLevel(t *testing.T) {
	tests := []struct {
		name     string
		env      string
		expected string
	}{
		{"development environment", "development", "debug"},
		{"staging environment", "staging", "info"},
		{"production environment", "production", "info"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Given
			env := tt.env

			// When
			result := GetDefaultLogLevel(env)

			// Then
			if result != tt.expected {
				t.Errorf("Given environment %q, When getting default log level, Then expected %q, got %q", env, tt.expected, result)
			}
		})
	}
}

func TestValidateEnvironment(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{"development", "development", "development"},
		{"staging", "staging", "staging"},
		{"production", "production", "production"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Given
			input := tt.input

			// When
			result := validateEnvironment(input)

			// Then
			if result != tt.expected {
				t.Errorf("Given input %q, When validated, Then expected %q, got %q", input, tt.expected, result)
			}
		})
	}
}

func TestLoadServerConfig(t *testing.T) {
	tests := []struct {
		name           string
		envVars        map[string]string
		expectedConfig *ServerConfig
	}{
		{
			name:    "default values",
			envVars: map[string]string{},
			expectedConfig: &ServerConfig{
				Port:           DefaultPort,
				AssetsFilePath: DefaultAssetsFilePath,
				Environment:    DefaultEnvironment,
				LogLevel:       "debug",
			},
		},
		{
			name: "custom values",
			envVars: map[string]string{
				"ENVIRONMENT":      "production",
				"SERVER_PORT":      "8080",
				"ASSETS_FILE_PATH": "/custom/assets",
				"LOG_LEVEL":        "error",
			},
			expectedConfig: &ServerConfig{
				Port:           8080,
				AssetsFilePath: "/custom/assets",
				Environment:    "production",
				LogLevel:       "error",
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			withEnvVars(t, tt.envVars, func() {
				// When
				config := LoadServerConfig()

				// Then
				if config.Port != tt.expectedConfig.Port {
					t.Errorf("Given envVars %v, When loading server config, Then expected Port %d, got %d", tt.envVars, tt.expectedConfig.Port, config.Port)
				}
				if config.AssetsFilePath != tt.expectedConfig.AssetsFilePath {
					t.Errorf("Given envVars %v, When loading server config, Then expected AssetsFilePath %q, got %q", tt.envVars, tt.expectedConfig.AssetsFilePath, config.AssetsFilePath)
				}
				if config.Environment != tt.expectedConfig.Environment {
					t.Errorf("Given envVars %v, When loading server config, Then expected Environment %q, got %q", tt.envVars, tt.expectedConfig.Environment, config.Environment)
				}
				if config.LogLevel != tt.expectedConfig.LogLevel {
					t.Errorf("Given envVars %v, When loading server config, Then expected LogLevel %q, got %q", tt.envVars, tt.expectedConfig.LogLevel, config.LogLevel)
				}
			})
		})
	}
}

func TestLoadClientConfig(t *testing.T) {
	tests := []struct {
		name           string
		envVars        map[string]string
		expectedConfig *ClientConfig
	}{
		{
			name:    "default values",
			envVars: map[string]string{},
			expectedConfig: &ClientConfig{
				Host: DefaultHost,
				Port: DefaultPort,
			},
		},
		{
			name: "custom values",
			envVars: map[string]string{
				"SERVER_HOST": "example.com",
				"SERVER_PORT": "9090",
			},
			expectedConfig: &ClientConfig{
				Host: "example.com",
				Port: 9090,
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			withEnvVars(t, tt.envVars, func() {
				// When
				config := LoadClientConfig()

				// Then
				if config.Host != tt.expectedConfig.Host {
					t.Errorf("Given envVars %v, When loading client config, Then expected Host %s, got %s", tt.envVars, tt.expectedConfig.Host, config.Host)
				}
				if config.Port != tt.expectedConfig.Port {
					t.Errorf("Given envVars %v, When loading client config, Then expected Port %d, got %d", tt.envVars, tt.expectedConfig.Port, config.Port)
				}
			})
		})
	}
}

func TestLoadServerConfigWithAPIKeys(t *testing.T) {
	// Given
	tempDir := t.TempDir()
	apiConfigPath := filepath.Join(tempDir, "api-config.yaml")
	apiConfigContent := `api_keys:
  - name: "test-key-1"
    key: "key-123"
  - name: "test-key-2"
    key: "key-456"`

	err := os.WriteFile(apiConfigPath, []byte(apiConfigContent), 0644)
	if err != nil {
		t.Fatalf("Failed to create test API config file: %v", err)
	}

	withEnvVars(t, map[string]string{"ASSETS_FILE_PATH": tempDir}, func() {
		// When
		config := LoadServerConfig()

		// Then
		if len(config.APIKeys) != 2 {
			t.Errorf("Given API config file, When loading server config, Then expected 2 API keys, got %d", len(config.APIKeys))
		}
	})
}

func TestLoadMovieClientConfig(t *testing.T) {
	tests := []struct {
		name           string
		envVars        map[string]string
		expectedConfig *MovieClientConfig
	}{
		{
			name:    "default values",
			envVars: map[string]string{},
			expectedConfig: &MovieClientConfig{
				ClientConfig: ClientConfig{
					Host: DefaultHost,
					Port: DefaultPort,
				},
				AssetsFilePath: DefaultAssetsFilePath,
				Environment:    DefaultEnvironment,
				LogLevel:       "debug",
				APIKey:         "",
			},
		},
		{
			name: "custom values",
			envVars: map[string]string{
				"ENVIRONMENT":      "production",
				"ASSETS_FILE_PATH": "/custom/assets",
				"X_API_KEY":        "test-api-key",
				"LOG_LEVEL":        "debug",
				"SERVER_HOST":      "example.com",
				"SERVER_PORT":      "9090",
			},
			expectedConfig: &MovieClientConfig{
				ClientConfig: ClientConfig{
					Host: "example.com",
					Port: 9090,
				},
				AssetsFilePath: "/custom/assets",
				APIKey:         "test-api-key",
				Environment:    "production",
				LogLevel:       "debug",
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			withEnvVars(t, tt.envVars, func() {
				// When
				config := LoadMovieClientConfig()

				// Then
				if config.Host != tt.expectedConfig.Host {
					t.Errorf("Given envVars %v, When loading movie client config, Then expected Host %s, got %s", tt.envVars, tt.expectedConfig.Host, config.Host)
				}
				if config.Port != tt.expectedConfig.Port {
					t.Errorf("Given envVars %v, When loading movie client config, Then expected Port %d, got %d", tt.envVars, tt.expectedConfig.Port, config.Port)
				}
				if config.AssetsFilePath != tt.expectedConfig.AssetsFilePath {
					t.Errorf("Given envVars %v, When loading movie client config, Then expected AssetsFilePath %q, got %q", tt.envVars, tt.expectedConfig.AssetsFilePath, config.AssetsFilePath)
				}
				if config.APIKey != tt.expectedConfig.APIKey {
					t.Errorf("Given envVars %v, When loading movie client config, Then expected APIKey %s, got %s", tt.envVars, tt.expectedConfig.APIKey, config.APIKey)
				}
				if config.Environment != tt.expectedConfig.Environment {
					t.Errorf("Given envVars %v, When loading movie client config, Then expected Environment %s, got %s", tt.envVars, tt.expectedConfig.Environment, config.Environment)
				}
				if config.LogLevel != tt.expectedConfig.LogLevel {
					t.Errorf("Given envVars %v, When loading movie client config, Then expected LogLevel %s, got %s", tt.envVars, tt.expectedConfig.LogLevel, config.LogLevel)
				}
			})
		})
	}
}
