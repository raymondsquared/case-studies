package observability

import (
	"fmt"
	"log/slog"
	"os"
	"strings"
)

type LogLevel int

const (
	LogLevelDebug LogLevel = iota
	LogLevelInfo
	LogLevelWarn
	LogLevelError
)

func (l LogLevel) String() string {
	switch l {
	case LogLevelDebug:
		return "debug"
	case LogLevelInfo:
		return "info"
	case LogLevelWarn:
		return "warn"
	case LogLevelError:
		return "error"
	default:
		return "info"
	}
}

func (l LogLevel) ToSlogLevel() slog.Level {
	switch l {
	case LogLevelDebug:
		return slog.LevelDebug
	case LogLevelInfo:
		return slog.LevelInfo
	case LogLevelWarn:
		return slog.LevelWarn
	case LogLevelError:
		return slog.LevelError
	default:
		return slog.LevelInfo
	}
}

func ParseLogLevel(levelStr string) LogLevel {
	switch strings.ToLower(levelStr) {
	case "debug":
		return LogLevelDebug
	case "info":
		return LogLevelInfo
	case "warn", "warning":
		return LogLevelWarn
	case "error":
		return LogLevelError
	default:
		return LogLevelInfo
	}
}

func ValidateLogLevel(levelStr string) error {
	validLevels := []string{"debug", "info", "warn", "warning", "error"}
	levelLower := strings.ToLower(levelStr)

	for _, valid := range validLevels {
		if levelLower == valid {
			return nil
		}
	}

	return fmt.Errorf("invalid log level '%s'. Valid values: %s", levelStr, strings.Join(validLevels, ", "))
}

func SetupLogger(logLevel string) *slog.Logger {
	level := ParseLogLevel(logLevel)

	opts := &slog.HandlerOptions{
		Level: level.ToSlogLevel(),
	}

	handler := slog.NewJSONHandler(os.Stdout, opts)
	logger := slog.New(handler)
	slog.SetDefault(logger)

	return logger
}

// LogConfig logs the logging configuration for consistency
func LogConfig(logLevel string) {
	level := ParseLogLevel(logLevel)
	slog.Default().Info("logging configuration", "log_level", level.String())
}

// LogStartup logs application startup with consistent fields
func LogStartup(appType, appName string, fields map[string]interface{}) {
	args := []interface{}{"app_type", appType, "app_name", appName}
	for k, v := range fields {
		args = append(args, k, v)
	}
	slog.Default().Info("application starting", args...)
}

// LogShutdown logs application shutdown
func LogShutdown(appType, appName string) {
	slog.Default().Info("application shutting down", "app_type", appType, "app_name", appName)
}

// LogError logs errors with consistent structure
func LogError(operation, function string, err error, fields map[string]interface{}) {
	args := []interface{}{"operation", operation, "function", function, "error", err}
	for k, v := range fields {
		args = append(args, k, v)
	}
	slog.Default().Error("operation failed", args...)
}

// LogSuccess logs successful operations with consistent structure
func LogSuccess(operation, function string, fields map[string]interface{}) {
	args := []interface{}{"operation", operation, "function", function}
	for k, v := range fields {
		args = append(args, k, v)
	}
	slog.Default().Info("operation completed successfully", args...)
}

// LogInfrastructureInput logs infrastructure request events
func LogInfrastructureInput(message string, fields map[string]interface{}) {
	args := []interface{}{"component", "infrastructure", "event_type", "request"}
	for k, v := range fields {
		args = append(args, k, v)
	}
	slog.Default().Debug(message, args...)
}

// LogInfrastructureOutput logs infrastructure response events (Debug level)
func LogInfrastructureOutput(message string, fields map[string]interface{}) {
	args := []interface{}{"component", "infrastructure", "event_type", "response"}
	for k, v := range fields {
		args = append(args, k, v)
	}
	slog.Default().Debug(message, args...)
}

// LogInfrastructureError logs infrastructure errors (Error level)
func LogInfrastructureError(message string, err error, fields map[string]interface{}) {
	args := []interface{}{"component", "infrastructure", "event_type", "error", "error", err}
	for k, v := range fields {
		args = append(args, k, v)
	}
	slog.Default().Error(message, args...)
}
