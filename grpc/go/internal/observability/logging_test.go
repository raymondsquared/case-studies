package observability

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log/slog"
	"os"
	"strings"
	"testing"
)

func captureOutput(t *testing.T, testFn func()) string {
	originalStdout := os.Stdout
	r, w, _ := os.Pipe()
	os.Stdout = w
	defer func() {
		os.Stdout = originalStdout
	}()

	testFn()

	w.Close()
	var buf bytes.Buffer
	buf.ReadFrom(r)
	return buf.String()
}

func TestLogLevelString(t *testing.T) {
	tests := []struct {
		name     string
		level    LogLevel
		expected string
	}{
		{"debug", LogLevelDebug, "debug"},
		{"info", LogLevelInfo, "info"},
		{"warn", LogLevelWarn, "warn"},
		{"error", LogLevelError, "error"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Given
			level := tt.level

			// When
			result := level.String()

			// Then
			if result != tt.expected {
				t.Errorf("Given level %v, When converted to string, Then expected %q, got %q", level, tt.expected, result)
			}
		})
	}
}

func TestLogLevelToSlogLevel(t *testing.T) {
	tests := []struct {
		name     string
		level    LogLevel
		expected slog.Level
	}{
		{"debug", LogLevelDebug, slog.LevelDebug},
		{"info", LogLevelInfo, slog.LevelInfo},
		{"warn", LogLevelWarn, slog.LevelWarn},
		{"error", LogLevelError, slog.LevelError},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Given
			level := tt.level

			// When
			result := level.ToSlogLevel()

			// Then
			if result != tt.expected {
				t.Errorf("Given level %v, When converted to slog level, Then expected %v, got %v", level, tt.expected, result)
			}
		})
	}
}

func TestParseLogLevel(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected LogLevel
	}{
		{"debug", "debug", LogLevelDebug},
		{"info", "info", LogLevelInfo},
		{"warn", "warn", LogLevelWarn},
		{"error", "error", LogLevelError},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Given
			input := tt.input

			// When
			result := ParseLogLevel(input)

			// Then
			if result != tt.expected {
				t.Errorf("Given input %q, When parsed, Then expected %v, got %v", input, tt.expected, result)
			}
		})
	}
}

func TestValidateLogLevel(t *testing.T) {
	tests := []struct {
		name        string
		input       string
		expectError bool
	}{
		{"debug", "debug", false},
		{"info", "info", false},
		{"warn", "warn", false},
		{"error", "error", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Given
			input := tt.input

			// When
			err := ValidateLogLevel(input)

			// Then
			if tt.expectError && err == nil {
				t.Errorf("Given input %q, When validated, Then expected error, got nil", input)
			}
			if !tt.expectError && err != nil {
				t.Errorf("Given input %q, When validated, Then unexpected error: %v", input, err)
			}
		})
	}
}

func TestSetupLogger(t *testing.T) {
	tests := []struct {
		name             string
		logLevel         string
		shouldSeeMessage bool
	}{
		{"debug level", "debug", true},
		{"info level", "info", true},
		{"warn level", "warn", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			output := captureOutput(t, func() {
				logger := SetupLogger(tt.logLevel)
				if logger == nil {
					t.Error("Given log level, When setting up logger, Then expected non-nil logger")
				}
				logger.Info("test message")
			})

			if tt.shouldSeeMessage {
				if !strings.Contains(output, "test message") {
					t.Logf("Raw output: %q", output)
					t.Errorf("Given log level %q, When logging, Then expected output to contain 'test message', got: %s", tt.logLevel, output)
				}

				var logEntry map[string]interface{}
				if err := json.Unmarshal([]byte(strings.TrimSpace(output)), &logEntry); err != nil {
					t.Logf("Raw output: %q", output)
					t.Errorf("Given log level %q, When logging, Then expected valid JSON, got error: %v", tt.logLevel, err)
				}
			} else {
				if output != "" {
					t.Errorf("Given log level %q, When logging, Then expected no output, got: %s", tt.logLevel, output)
				}
			}
		})
	}
}

func TestLogConfig(t *testing.T) {
	tests := []struct {
		name             string
		logLevel         string
		shouldSeeMessage bool
	}{
		{"debug level", "debug", true},
		{"info level", "info", true},
		{"warn level", "warn", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			output := captureOutput(t, func() {
				SetupLogger(tt.logLevel)
				LogConfig(tt.logLevel)
			})

			if tt.shouldSeeMessage {
				if !strings.Contains(output, "log_level") {
					t.Errorf("Given log level %q, When logging config, Then expected output to contain 'log_level', got: %s", tt.logLevel, output)
				}
			} else {
				if output != "" {
					t.Errorf("Given log level %q, When logging config, Then expected no output, got: %s", tt.logLevel, output)
				}
			}
		})
	}
}

func TestLogError(t *testing.T) {
	output := captureOutput(t, func() {
		SetupLogger("info")
		LogError("test operation", "test function", fmt.Errorf("test error message"), map[string]interface{}{})
	})

	if !strings.Contains(output, "operation failed") {
		t.Errorf("Given error log, When logged, Then expected output to contain 'operation failed', got: %s", output)
	}
}

func TestLogSuccess(t *testing.T) {
	output := captureOutput(t, func() {
		SetupLogger("info")
		LogSuccess("test operation", "test function", map[string]interface{}{})
	})

	if !strings.Contains(output, "operation completed successfully") {
		t.Errorf("Given success log, When logged, Then expected output to contain 'operation completed successfully', got: %s", output)
	}
}
