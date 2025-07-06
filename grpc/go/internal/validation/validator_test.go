package validation

import (
	"testing"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func assertValidationError(t *testing.T, err error, wantErr bool, context string) {
	if (err != nil) != wantErr {
		t.Errorf("Given %s, When validated, Then expected error = %v, got %v", context, wantErr, err)
	}

	if err != nil {
		if st, ok := status.FromError(err); ok {
			if st.Code() != codes.InvalidArgument {
				t.Errorf("Given %s, When validated, Then expected status code %v, got %v", context, codes.InvalidArgument, st.Code())
			}
		} else {
			t.Errorf("Given %s, When validated, Then expected gRPC error, got %v", context, err)
		}
	}
}

func TestValidateName(t *testing.T) {
	tests := []struct {
		name    string
		input   string
		wantErr bool
	}{
		{"empty name", "", true},
		{"valid name", "Alice", false},
		{"valid name with spaces", "John Doe", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Given
			input := tt.input

			// When
			err := ValidateName(input)

			// Then
			assertValidationError(t, err, tt.wantErr, "input "+tt.name)
		})
	}
}

func TestValidateString(t *testing.T) {
	tests := []struct {
		name       string
		value      string
		fieldName  string
		maxLength  int
		allowEmpty bool
		wantErr    bool
	}{
		{"empty allowed", "", "test", 10, true, false},
		{"valid string", "hello", "test", 10, false, false},
		{"too long", "hello world", "test", 5, false, true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Given
			value := tt.value
			fieldName := tt.fieldName
			maxLength := tt.maxLength
			allowEmpty := tt.allowEmpty

			// When
			err := ValidateString(value, fieldName, maxLength, allowEmpty)

			// Then
			if (err != nil) != tt.wantErr {
				t.Errorf("Given value %q, fieldName %q, maxLength %d, allowEmpty %v, When validated, Then expected error = %v, got %v", value, fieldName, maxLength, allowEmpty, tt.wantErr, err)
			}
		})
	}
}

func TestValidatePort(t *testing.T) {
	tests := []struct {
		name    string
		port    int
		wantErr bool
	}{
		{"valid port", 8080, false},
		{"port 1", 1, false},
		{"port 0", 0, true},
		{"port negative", -1, true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Given
			port := tt.port

			// When
			err := ValidatePort(port)

			// Then
			if (err != nil) != tt.wantErr {
				t.Errorf("Given port %d, When validated, Then expected error = %v, got %v", port, tt.wantErr, err)
			}
		})
	}
}

func TestValidateHost(t *testing.T) {
	tests := []struct {
		name    string
		host    string
		wantErr bool
	}{
		{"valid host", "localhost", false},
		{"valid IP", "127.0.0.1", false},
		{"empty host", "", true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Given
			host := tt.host

			// When
			err := ValidateHost(host)

			// Then
			if (err != nil) != tt.wantErr {
				t.Errorf("Given host %q, When validated, Then expected error = %v, got %v", host, tt.wantErr, err)
			}
		})
	}
}

func TestSanitiseString(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{"normal string", "hello world", "hello world"},
		{"with control chars", "hello\x00world", "helloworld"},
		{"with spaces", "  hello world  ", "hello world"},
		{"empty string", "", ""},
		{"only spaces", "   ", ""},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Given
			input := tt.input

			// When
			result := SanitiseString(input)

			// Then
			if result != tt.expected {
				t.Errorf("Given input %q, When sanitised, Then expected %q, got %q", input, tt.expected, result)
			}
		})
	}
}

func TestValidateMovieRatings(t *testing.T) {
	tests := []struct {
		name    string
		rating  float32
		wantErr bool
	}{
		{"below minimum", -0.01, true},
		{"at minimum", 0.00, false},
		{"mid range", 5.5, false},
		{"at maximum", 10.00, false},
		{"above maximum", 10.01, true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Given
			rating := tt.rating

			// When
			err := ValidateMovieRatings(rating)

			// Then
			assertValidationError(t, err, tt.wantErr, "rating "+tt.name)
		})
	}
}

func TestValidateAssetsFilePath(t *testing.T) {
	tests := []struct {
		name    string
		path    string
		wantErr bool
	}{
		{"empty path", "", true},
		{"valid filename", "movie-data.json", false},
		{"valid relative path", "assets/movie-data.json", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Given
			path := tt.path

			// When
			err := ValidateAssetsFilePath(path)

			// Then
			if (err != nil) != tt.wantErr {
				t.Errorf("Given path %q, When validated, Then expected error = %v, got %v", path, tt.wantErr, err)
			}
		})
	}
}

func TestValidateLogLevel(t *testing.T) {
	tests := []struct {
		name    string
		level   string
		wantErr bool
	}{
		{"valid debug", "debug", false},
		{"valid info", "info", false},
		{"valid warn", "warn", false},
		{"valid error", "error", false},
		{"invalid empty", "", true},
		{"invalid typo", "infp", true},
		{"invalid uppercase", "INFO", true},
		{"invalid random", "verbose", true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Given
			level := tt.level

			// When
			err := ValidateLogLevel(level)

			// Then
			assertValidationError(t, err, tt.wantErr, "level "+tt.name)
		})
	}
}

func TestValidateEnvironment(t *testing.T) {
	tests := []struct {
		name        string
		environment string
		wantErr     bool
	}{
		{"valid development", "development", false},
		{"valid staging", "staging", false},
		{"valid production", "production", false},
		{"invalid empty", "", true},
		{"invalid unknown", "unknown", true},
		{"invalid test", "test", true},
		{"invalid uppercase", "DEVELOPMENT", true},
		{"invalid mixed", "Development", true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Given
			environment := tt.environment

			// When
			err := ValidateEnvironment(environment)

			// Then
			assertValidationError(t, err, tt.wantErr, "environment "+tt.name)
		})
	}
}
