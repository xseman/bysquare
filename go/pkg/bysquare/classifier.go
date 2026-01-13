package bysquare

// encodeClassifierOptions encodes multiple classifier options by summing their values.
//
// This is used for encoding bit-flag fields like months in standing orders.
//
// Example:
//
//	// Encode January + July + October months
//	encoded := encodeClassifierOptions([]uint16{
//	    uint16(MonthJanuary),
//	    uint16(MonthJuly),
//	    uint16(MonthOctober),
//	})
//	// Result: 577 (1 + 64 + 512)
func encodeClassifierOptions(options []uint16) uint16 {
	var sum uint16
	for _, option := range options {
		sum += option
	}
	return sum
}

// decodeClassifierOptions decodes a summed value back to individual options.
//
// Example:
//
//	// Decode 577 to get January, July, October
//	months := decodeClassifierOptions(577, []uint16{
//	    uint16(MonthJanuary),
//	    uint16(MonthFebruary),
//	    // ... all months
//	})
func decodeClassifierOptions(encoded uint16, allOptions []uint16) []uint16 {
	var result []uint16

	for _, option := range allOptions {
		if encoded&option == option {
			result = append(result, option)
		}
	}

	return result
}
