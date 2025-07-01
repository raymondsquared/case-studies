package validation

import (
	"strings"
	"testing"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func TestValidateName(t *testing.T) {
	tests := []struct {
		name    string
		input   string
		wantErr bool
	}{
		{"empty name", "", true},
		{"valid name", "Alice", false},
		{"valid name with spaces", "John Doe", false},
		{"too long", strings.Repeat("a", 101), true},
		{"contains invalid chars", "Alice<script>", true},
		{"contains quotes", "Alice'Bob", true},
		{"contains ampersand", "Alice&Bob", true},
		{"starts with space", " Alice", true},
		{"ends with space", "Alice ", true},
		{"non-printable chars", "Alice\x00Bob", true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateName(tt.input)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidateName() error = %v, wantErr %v", err, tt.wantErr)
			}

			if err != nil {
				if st, ok := status.FromError(err); ok {
					if st.Code() != codes.InvalidArgument {
						t.Errorf("ValidateName() status code = %v, want %v", st.Code(), codes.InvalidArgument)
					}
				} else {
					t.Errorf("ValidateName() returned non-gRPC error: %v", err)
				}
			}
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
		{"empty not allowed", "", "test", 10, false, true},
		{"valid string", "hello", "test", 10, false, false},
		{"too long", "hello world", "test", 5, false, true},
		{"exact length", "hello", "test", 5, false, false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateString(tt.value, tt.fieldName, tt.maxLength, tt.allowEmpty)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidateString() error = %v, wantErr %v", err, tt.wantErr)
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
		{"port 65535", 65535, false},
		{"port 0", 0, true},
		{"port negative", -1, true},
		{"port too high", 65536, true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidatePort(tt.port)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidatePort() error = %v, wantErr %v", err, tt.wantErr)
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
		{"valid domain", "example.com", false},
		{"empty host", "", true},
		{"host with spaces", "local host", true},
		{"host with tabs", "local\thost", true},
		{"host with newlines", "local\nhost", true},
		{"host too long", strings.Repeat("a", 254), true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateHost(tt.host)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidateHost() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestSanitizeString(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{"normal string", "hello world", "hello world"},
		{"with control chars", "hello\x00world", "helloworld"},
		{"with spaces", "  hello world  ", "hello world"},
		{"with tabs", "hello\tworld", "hello world"},
		{"with newlines", "hello\nworld", "hello world"},
		{"empty string", "", ""},
		{"only spaces", "   ", ""},
		{"mixed whitespace", "  \t\n  hello  \t\n  world  \t\n  ", "hello world"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := SanitizeString(tt.input)
			if result != tt.expected {
				t.Errorf("SanitizeString() = %q, want %q", result, tt.expected)
			}
		})
	}
}
