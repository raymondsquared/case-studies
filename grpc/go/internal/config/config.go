package config

import (
	"os"
	"strconv"

	"gopkg.in/yaml.v3"
)

// Common configuration constants
const (
	DefaultHost              = "localhost"
	DefaultPort              = 50051
	DefaultName              = "world"
	DefaultMovieDataFilePath = "../assets"
)

// ServerConfig holds server-specific configuration
type APIKeyConfig struct {
	Name string `yaml:"name"`
	Key  string `yaml:"key"`
}

type ServerConfig struct {
	Port              int
	MovieDataFilePath string
	APIKeys           []APIKeyConfig
}

// ClientConfig holds client-specific configuration
type ClientConfig struct {
	Host              string
	Port              int
	Name              string
	MovieDataFilePath string
	APIKey            string
}

// LoadServerConfig loads server configuration from flags and environment
func LoadServerConfig() *ServerConfig {
	config := &ServerConfig{
		Port:              DefaultPort,
		MovieDataFilePath: DefaultMovieDataFilePath,
	}

	if envPortStr := os.Getenv("SERVER_PORT"); envPortStr != "" {
		if p, err := strconv.Atoi(envPortStr); err == nil {
			config.Port = p
		}
	}

	if movieDataFilePath := os.Getenv("MOVIE_DATA_FILE_PATH"); movieDataFilePath != "" {
		config.MovieDataFilePath = movieDataFilePath
	}

	// Load API keys from YAML file
	apiConfigPath := "../assets/api-config.yaml"
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

// LoadClientConfig loads client configuration from flags and environment
func LoadClientConfig() *ClientConfig {
	config := &ClientConfig{
		Host:              DefaultHost,
		Port:              DefaultPort,
		Name:              DefaultName,
		MovieDataFilePath: DefaultMovieDataFilePath,
	}

	if envHost := os.Getenv("SERVER_HOST"); envHost != "" {
		config.Host = envHost
	}

	if envPortStr := os.Getenv("SERVER_PORT"); envPortStr != "" {
		if p, err := strconv.Atoi(envPortStr); err == nil {
			config.Port = p
		}
	}

	if envName := os.Getenv("NAME"); envName != "" {
		config.Name = envName
	}

	if movieDataFilePath := os.Getenv("MOVIE_DATA_FILE_PATH"); movieDataFilePath != "" {
		config.MovieDataFilePath = movieDataFilePath
	}

	if envKey := os.Getenv("X_API_KEY"); envKey != "" {
		config.APIKey = envKey
	}

	return config
}

func GetDebugMode() bool {
	return os.Getenv("DEBUG") == "true"
}
