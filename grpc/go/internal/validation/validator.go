package validation

import (
	"strings"
	"unicode"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type ValidationError struct {
	Field   string
	Message string
}

func (e ValidationError) Error() string {
	return e.Message
}

func ValidateName(name string) error {
	if name == "" {
		return status.Errorf(codes.InvalidArgument, "name cannot be empty")
	}

	if len(name) > 100 {
		return status.Errorf(codes.InvalidArgument, "name too long (max 100 characters)")
	}

	// Check for potentially malicious content
	if strings.ContainsAny(name, "<>\"'&") {
		return status.Errorf(codes.InvalidArgument, "name contains invalid characters")
	}

	// Check for non-printable characters
	for _, r := range name {
		if !unicode.IsPrint(r) {
			return status.Errorf(codes.InvalidArgument, "name contains non-printable characters")
		}
	}

	// Check for excessive whitespace
	if strings.TrimSpace(name) != name {
		return status.Errorf(codes.InvalidArgument, "name cannot start or end with whitespace")
	}

	return nil
}

func ValidateString(value, fieldName string, maxLength int, allowEmpty bool) error {
	if !allowEmpty && value == "" {
		return status.Errorf(codes.InvalidArgument, "%s cannot be empty", fieldName)
	}

	if maxLength > 0 && len(value) > maxLength {
		return status.Errorf(codes.InvalidArgument, "%s too long (max %d characters)", fieldName, maxLength)
	}

	return nil
}

func ValidatePort(port int) error {
	if port < 1 || port > 65535 {
		return status.Errorf(codes.InvalidArgument, "port must be between 1 and 65535")
	}

	return nil
}

func ValidateHost(host string) error {
	if host == "" {
		return status.Errorf(codes.InvalidArgument, "host cannot be empty")
	}

	// Basic host validation
	if len(host) > 253 {
		return status.Errorf(codes.InvalidArgument, "host too long (max 253 characters)")
	}

	// Check for invalid characters
	if strings.ContainsAny(host, " \t\n\r") {
		return status.Errorf(codes.InvalidArgument, "host contains invalid characters")
	}

	return nil
}

// SanitizeString removes potentially dangerous characters from a string
func SanitizeString(input string) string {
	// Normalize all unicode whitespace to a single space, remove non-printable non-whitespace
	var result strings.Builder
	prevSpace := false

	for _, r := range input {
		if unicode.IsSpace(r) {
			if !prevSpace {
				result.WriteRune(' ')
				prevSpace = true
			}
			continue
		}
		if unicode.IsPrint(r) && r != 0 {
			result.WriteRune(r)
			prevSpace = false
		}
	}

	return strings.TrimSpace(result.String())
}

func ValidateMovieRatings(rating float32) error {
	if rating < 0.00 || rating > 10.00 {
		return status.Errorf(codes.InvalidArgument, "ratings must be between 0.00 and 10.00")
	}
	return nil
}

func ValidateMovieDataFilePath(path string) error {
	if path == "" {
		return status.Errorf(codes.InvalidArgument, "file path cannot be empty")
	}

	if len(path) > 255 {
		return status.Errorf(codes.InvalidArgument, "file path too long (max 255 characters)")
	}

	// Check for invalid characters in file paths
	if strings.ContainsAny(path, "<>:\"\\|?*") {
		return status.Errorf(codes.InvalidArgument, "file path contains invalid characters")
	}

	return nil
}

func ValidateLogLevel(level string) error {
	switch level {
	case "debug", "info", "warn", "error":
		return nil
	default:
		return status.Errorf(codes.InvalidArgument, "log level must be one of: debug, info, warn, error")
	}
}
