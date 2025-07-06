package config

import (
	"fmt"
	"os"
	"path/filepath"
	"strconv"

	"gopkg.in/yaml.v3"
)

// Common configuration constants
const (
	DefaultHost           = "localhost"
	DefaultPort           = 50051
	DefaultName           = "world"
	DefaultAssetsFilePath = "../assets"
	DefaultLogLevel       = "info"
)

type APIKeyConfig struct {
	Name string `yaml:"name"`
	Key  string `yaml:"key"`
}

type ServerConfig struct {
	Port           int
	AssetsFilePath string
	APIKeys        []APIKeyConfig
	LogLevel       string
}

type ClientConfig struct {
	Host string
	Port int
}

type HelloWorldClientConfig struct {
	ClientConfig
	Name string
}

type MovieClientConfig struct {
	ClientConfig
	AssetsFilePath string
	APIKey         string
	LogLevel       string
}

func validateLogLevel(level string) string {
	switch level {
	case "debug", "info", "warn", "error":
		return level
	default:
		if level != "" {
			fmt.Fprintf(os.Stderr, "Warning: invalid LOG_LEVEL '%s'. Defaulting to 'info'. Valid values: debug, info, warn, error\n", level)
		}
		return "info"
	}
}

// LoadServerConfig loads server configuration from flags and environment
func LoadServerConfig() *ServerConfig {
	config := &ServerConfig{
		Port:           DefaultPort,
		AssetsFilePath: DefaultAssetsFilePath,
		LogLevel:       "info",
	}

	if envPortStr := os.Getenv("SERVER_PORT"); envPortStr != "" {
		if p, err := strconv.Atoi(envPortStr); err == nil {
			config.Port = p
		}
	}

	if assetsFilePath := os.Getenv("ASSETS_FILE_PATH"); assetsFilePath != "" {
		config.AssetsFilePath = assetsFilePath
	}

	if logLevel := os.Getenv("LOG_LEVEL"); logLevel != "" {
		config.LogLevel = validateLogLevel(logLevel)
	}

	// Load API keys from YAML file
	apiConfigPath := filepath.Join(config.AssetsFilePath, "api-config.yaml")
	if f, err := os.Open(apiConfigPath); err == nil {
		defer f.Close()
		var data struct {
			APIKeys []APIKeyConfig `yaml:"api_keys"`
		}
		if err := yaml.NewDecoder(f).Decode(&data); err == nil {
			config.APIKeys = data.APIKeys
		}
	}

	return config
}

func LoadClientConfig() *ClientConfig {
	config := &ClientConfig{
		Host: DefaultHost,
		Port: DefaultPort,
	}

	loadClientConfigFromEnv(config)

	return config
}

func LoadHelloWorldClientConfig() *HelloWorldClientConfig {
	config := &HelloWorldClientConfig{
		ClientConfig: ClientConfig{
			Host: DefaultHost,
			Port: DefaultPort,
		},
		Name: DefaultName,
	}

	loadClientConfigFromEnv(&config.ClientConfig)

	if envName := os.Getenv("NAME"); envName != "" {
		config.Name = envName
	}

	return config
}

func LoadMovieClientConfig() *MovieClientConfig {
	config := &MovieClientConfig{
		ClientConfig: ClientConfig{
			Host: DefaultHost,
			Port: DefaultPort,
		},
		AssetsFilePath: DefaultAssetsFilePath,
		LogLevel:       "info",
	}

	loadClientConfigFromEnv(&config.ClientConfig)

	if assetsFilePath := os.Getenv("ASSETS_FILE_PATH"); assetsFilePath != "" {
		config.AssetsFilePath = assetsFilePath
	}

	if envKey := os.Getenv("X_API_KEY"); envKey != "" {
		config.APIKey = envKey
	}

	if logLevel := os.Getenv("LOG_LEVEL"); logLevel != "" {
		config.LogLevel = validateLogLevel(logLevel)
	}

	return config
}

func loadClientConfigFromEnv(config *ClientConfig) {
	if envHost := os.Getenv("SERVER_HOST"); envHost != "" {
		config.Host = envHost
	}

	if envPortStr := os.Getenv("SERVER_PORT"); envPortStr != "" {
		if p, err := strconv.Atoi(envPortStr); err == nil {
			config.Port = p
		}
	}
}
