package bysquare

import "testing"

func TestEncodeClassifierOptions(t *testing.T) {
	testCases := []struct {
		name     string
		options  []uint16
		expected uint16
	}{
		{
			name:     "empty options",
			options:  []uint16{},
			expected: 0,
		},
		{
			name:     "single month",
			options:  []uint16{uint16(MonthJanuary)},
			expected: 1,
		},
		{
			name:     "multiple months",
			options:  []uint16{uint16(MonthJanuary), uint16(MonthJuly), uint16(MonthOctober)},
			expected: 577, // 1 + 64 + 512
		},
		{
			name:     "all months",
			options:  []uint16{1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048},
			expected: 4095, // All 12 bits set
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			result := encodeClassifierOptions(tc.options)
			if result != tc.expected {
				t.Errorf("expected %d, got %d", tc.expected, result)
			}
		})
	}
}

func TestDecodeClassifierOptions(t *testing.T) {
	allMonths := []uint16{
		uint16(MonthJanuary), uint16(MonthFebruary), uint16(MonthMarch),
		uint16(MonthApril), uint16(MonthMay), uint16(MonthJune),
		uint16(MonthJuly), uint16(MonthAugust), uint16(MonthSeptember),
		uint16(MonthOctober), uint16(MonthNovember), uint16(MonthDecember),
	}

	testCases := []struct {
		name     string
		encoded  uint16
		expected []uint16
	}{
		{
			name:     "no months",
			encoded:  0,
			expected: []uint16{},
		},
		{
			name:     "January only",
			encoded:  1,
			expected: []uint16{uint16(MonthJanuary)},
		},
		{
			name:     "January, July, October",
			encoded:  577,
			expected: []uint16{uint16(MonthJanuary), uint16(MonthJuly), uint16(MonthOctober)},
		},
		{
			name:     "all months",
			encoded:  4095,
			expected: allMonths,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			result := decodeClassifierOptions(tc.encoded, allMonths)
			if len(result) != len(tc.expected) {
				t.Errorf("expected %d months, got %d", len(tc.expected), len(result))
				return
			}
			for i := range result {
				if result[i] != tc.expected[i] {
					t.Errorf("at index %d: expected %d, got %d", i, tc.expected[i], result[i])
				}
			}
		})
	}
}

func TestClassifierOptionsRoundTrip(t *testing.T) {
	allMonths := []uint16{
		uint16(MonthJanuary), uint16(MonthFebruary), uint16(MonthMarch),
		uint16(MonthApril), uint16(MonthMay), uint16(MonthJune),
		uint16(MonthJuly), uint16(MonthAugust), uint16(MonthSeptember),
		uint16(MonthOctober), uint16(MonthNovember), uint16(MonthDecember),
	}

	testCases := [][]uint16{
		{},
		{uint16(MonthJanuary)},
		{uint16(MonthJanuary), uint16(MonthDecember)},
		{uint16(MonthJanuary), uint16(MonthJuly), uint16(MonthOctober)},
		allMonths,
	}

	for _, original := range testCases {
		encoded := encodeClassifierOptions(original)
		decoded := decodeClassifierOptions(encoded, allMonths)

		if len(decoded) != len(original) {
			t.Errorf("round trip failed: original length=%d, decoded length=%d",
				len(original), len(decoded))
			continue
		}

		for i := range original {
			if decoded[i] != original[i] {
				t.Errorf("round trip failed at index %d: original=%d, decoded=%d",
					i, original[i], decoded[i])
			}
		}
	}
}
