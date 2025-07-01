package config

import (
	"os"
	"strconv"
)

// Common configuration constants
const (
	DefaultHost              = "localhost"
	DefaultPort              = 50051
	DefaultName              = "world"
	DefaultMovieDataFilePath = "../assets"
)

// ServerConfig holds server-specific configuration
type ServerConfig struct {
	Port              int
	MovieDataFilePath string
}

// ClientConfig holds client-specific configuration
type ClientConfig struct {
	Host              string
	Port              int
	Name              string
	MovieDataFilePath string
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

	return config
}

func GetDebugMode() bool {
	return os.Getenv("DEBUG") == "true"
}
