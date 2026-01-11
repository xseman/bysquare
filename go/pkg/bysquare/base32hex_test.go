package bysquare

import (
	"bytes"
	"testing"
)

func TestEncodeBase32Hex(t *testing.T) {
	testCases := []struct {
		name     string
		input    []byte
		expected string
	}{
		{
			name:     "empty bytes",
			input:    []byte{},
			expected: "",
		},
		{
			name:     "single byte",
			input:    []byte{102},
			expected: "CO======",
		},
		{
			name:     "two bytes",
			input:    []byte{102, 111},
			expected: "CPNG====",
		},
		{
			name:     "three bytes",
			input:    []byte{102, 111, 111},
			expected: "CPNMU===",
		},
		{
			name:     "four bytes",
			input:    []byte{102, 111, 111, 98},
			expected: "CPNMUOG=",
		},
		{
			name:     "five bytes",
			input:    []byte{102, 111, 111, 98, 97},
			expected: "CPNMUOJ1",
		},
		{
			name:     "six bytes",
			input:    []byte{102, 111, 111, 98, 97, 114},
			expected: "CPNMUOJ1E8======",
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			result := encodeBase32Hex(tc.input, true)
			if result != tc.expected {
				t.Errorf("expected %q, got %q", tc.expected, result)
			}
		})
	}
}

func TestEncodeBase32HexNoPadding(t *testing.T) {
	testCases := []struct {
		name     string
		input    []byte
		expected string
	}{
		{
			name:     "single byte no padding",
			input:    []byte{102},
			expected: "CO",
		},
		{
			name:     "two bytes no padding",
			input:    []byte{102, 111},
			expected: "CPNG",
		},
		{
			name:     "three bytes no padding",
			input:    []byte{102, 111, 111},
			expected: "CPNMU",
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			result := encodeBase32Hex(tc.input, false)
			if result != tc.expected {
				t.Errorf("expected %q, got %q", tc.expected, result)
			}
		})
	}
}

func TestDecodeBase32Hex(t *testing.T) {
	testCases := []struct {
		name     string
		input    string
		expected []byte
		hasError bool
	}{
		{
			name:     "empty string",
			input:    "",
			expected: []byte{},
			hasError: false,
		},
		{
			name:     "single byte with padding",
			input:    "CO======",
			expected: []byte{102},
			hasError: false,
		},
		{
			name:     "two bytes with padding",
			input:    "CPNG====",
			expected: []byte{102, 111},
			hasError: false,
		},
		{
			name:     "three bytes with padding",
			input:    "CPNMU===",
			expected: []byte{102, 111, 111},
			hasError: false,
		},
		{
			name:     "four bytes with padding",
			input:    "CPNMUOG=",
			expected: []byte{102, 111, 111, 98},
			hasError: false,
		},
		{
			name:     "five bytes no padding needed",
			input:    "CPNMUOJ1",
			expected: []byte{102, 111, 111, 98, 97},
			hasError: false,
		},
		{
			name:     "six bytes with padding",
			input:    "CPNMUOJ1E8======",
			expected: []byte{102, 111, 111, 98, 97, 114},
			hasError: false,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			result, err := decodeBase32Hex(tc.input, false)
			if tc.hasError {
				if err == nil {
					t.Error("expected error, got nil")
				}
				return
			}
			if err != nil {
				t.Errorf("unexpected error: %v", err)
				return
			}
			if !bytes.Equal(result, tc.expected) {
				t.Errorf("expected %v, got %v", tc.expected, result)
			}
		})
	}
}

func TestDecodeBase32HexLooseMode(t *testing.T) {
	testCases := []struct {
		name     string
		input    string
		expected []byte
		hasError bool
	}{
		{
			name:     "no padding in loose mode",
			input:    "CO",
			expected: []byte{102},
			hasError: false,
		},
		{
			name:     "partial padding in loose mode",
			input:    "CPNG",
			expected: []byte{102, 111},
			hasError: false,
		},
		{
			name:     "lowercase letters in loose mode",
			input:    "cpng",
			expected: []byte{102, 111},
			hasError: false,
		},
		{
			name:     "mixed case in loose mode",
			input:    "CpNg",
			expected: []byte{102, 111},
			hasError: false,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			result, err := decodeBase32Hex(tc.input, true)
			if tc.hasError {
				if err == nil {
					t.Error("expected error, got nil")
				}
				return
			}
			if err != nil {
				t.Errorf("unexpected error: %v", err)
				return
			}
			if !bytes.Equal(result, tc.expected) {
				t.Errorf("expected %v, got %v", tc.expected, result)
			}
		})
	}
}

func TestBase32HexRoundTrip(t *testing.T) {
	testCases := [][]byte{
		{},
		{0},
		{255},
		{0, 1, 2, 3, 4, 5},
		{102, 111, 111, 98, 97, 114},
		[]byte("Hello, World!"),
		[]byte("The quick brown fox jumps over the lazy dog"),
	}

	for _, original := range testCases {
		encoded := encodeBase32Hex(original, true)
		decoded, err := decodeBase32Hex(encoded, false)
		if err != nil {
			t.Errorf("decode error for %v: %v", original, err)
			continue
		}
		if !bytes.Equal(decoded, original) {
			t.Errorf("round trip failed: original=%v, encoded=%q, decoded=%v",
				original, encoded, decoded)
		}
	}
}

func TestDecodeBase32HexInvalidInput(t *testing.T) {
	testCases := []struct {
		name  string
		input string
	}{
		{
			name:  "invalid character",
			input: "ABC@",
		},
		{
			name:  "invalid character in middle",
			input: "AB$C",
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			_, err := decodeBase32Hex(tc.input, false)
			if err == nil {
				t.Error("expected error for invalid input, got nil")
			}
		})
	}
}
