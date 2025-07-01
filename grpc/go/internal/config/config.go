package config

import (
	"os"
	"strconv"
)

// Common configuration constants
const (
	DefaultHost = "localhost"
	DefaultPort = 50051
	DefaultName = "world"
)

// ServerConfig holds server-specific configuration
type ServerConfig struct {
	Port int
}

// ClientConfig holds client-specific configuration
type ClientConfig struct {
	Host string
	Port int
	Name string
}

// LoadServerConfig loads server configuration from flags and environment
func LoadServerConfig() *ServerConfig {
	config := &ServerConfig{
		Port: DefaultPort,
	}

	// Environment variable overrides
	if envPortStr := os.Getenv("SERVER_PORT"); envPortStr != "" {
		if p, err := strconv.Atoi(envPortStr); err == nil {
			config.Port = p
		}
	}

	return config
}

// LoadClientConfig loads client configuration from flags and environment
func LoadClientConfig() *ClientConfig {
	config := &ClientConfig{
		Host: DefaultHost,
		Port: DefaultPort,
		Name: DefaultName,
	}

	// Environment variable overrides
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

	return config
}

// GetDebugMode returns whether debug mode is enabled
func GetDebugMode() bool {
	return os.Getenv("DEBUG") == "true"
}
