package bysquare

import "testing"

func TestCRC32Checksum(t *testing.T) {
	testCases := []struct {
		name     string
		input    string
		expected uint32
	}{
		{
			name:     "empty string",
			input:    "",
			expected: 0,
		},
		{
			name:     "single character",
			input:    "a",
			expected: 3904355907,
		},
		{
			name:     "hello world",
			input:    "hello world",
			expected: 222957957,
		},
		{
			name:     "numeric string",
			input:    "123456789",
			expected: 3421780262,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			result := CRC32(tc.input)
			if result != tc.expected {
				t.Errorf("expected %d, got %d", tc.expected, result)
			}
		})
	}
}

func TestCRC32ChecksumConsistency(t *testing.T) {
	input := "test data for consistency"
	first := CRC32(input)
	second := CRC32(input)

	if first != second {
		t.Errorf("CRC32 checksum not consistent: first=%d, second=%d", first, second)
	}
}

func TestCRC32ChecksumDifferentInputs(t *testing.T) {
	input1 := "test"
	input2 := "test2"

	checksum1 := CRC32(input1)
	checksum2 := CRC32(input2)

	if checksum1 == checksum2 {
		t.Error("different inputs should produce different checksums")
	}
}
