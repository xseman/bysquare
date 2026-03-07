package bysquare

import "testing"

// Bit flag values matching pay.Month* constants for test convenience.
const (
	monthJanuary   uint16 = 1 << 0
	monthFebruary  uint16 = 1 << 1
	monthMarch     uint16 = 1 << 2
	monthApril     uint16 = 1 << 3
	monthMay       uint16 = 1 << 4
	monthJune      uint16 = 1 << 5
	monthJuly      uint16 = 1 << 6
	monthAugust    uint16 = 1 << 7
	monthSeptember uint16 = 1 << 8
	monthOctober   uint16 = 1 << 9
	monthNovember  uint16 = 1 << 10
	monthDecember  uint16 = 1 << 11
)

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
			options:  []uint16{monthJanuary},
			expected: 1,
		},
		{
			name:     "multiple months",
			options:  []uint16{monthJanuary, monthJuly, monthOctober},
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
			result := EncodeClassifierOptions(tc.options)
			if result != tc.expected {
				t.Errorf("expected %d, got %d", tc.expected, result)
			}
		})
	}
}

func TestDecodeClassifierOptions(t *testing.T) {
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
			expected: []uint16{monthJanuary},
		},
		{
			name:     "January, July, October (descending)",
			encoded:  577,
			expected: []uint16{monthOctober, monthJuly, monthJanuary},
		},
		{
			name:     "all months (descending)",
			encoded:  4095,
			expected: []uint16{
				monthDecember, monthNovember, monthOctober,
				monthSeptember, monthAugust, monthJuly,
				monthJune, monthMay, monthApril,
				monthMarch, monthFebruary, monthJanuary,
			},
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			result := DecodeClassifierOptions(tc.encoded)
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
	testCases := [][]uint16{
		{},
		{monthJanuary},
		{
			monthJanuary, monthDecember,
		},
		{
			monthJanuary, monthJuly, monthOctober,
		},
		{
			monthJanuary, monthFebruary, monthMarch,
			monthApril, monthMay, monthJune,
			monthJuly, monthAugust, monthSeptember,
			monthOctober, monthNovember, monthDecember,
		},
	}

	for _, original := range testCases {
		encoded := EncodeClassifierOptions(original)
		decoded := DecodeClassifierOptions(encoded)

		if len(decoded) != len(original) {
			t.Errorf("round trip failed: original length=%d, decoded length=%d",
				len(original), len(decoded))
			continue
		}

		// Decoded returns descending order, so compare sets not order
		originalMap := make(map[uint16]bool)
		for _, v := range original {
			originalMap[v] = true
		}
		for _, v := range decoded {
			if !originalMap[v] {
				t.Errorf("round trip failed: decoded contains %d not in original", v)
			}
		}
	}
}
