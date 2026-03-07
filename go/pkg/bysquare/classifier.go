package bysquare

import "math"

// EncodeClassifierOptions encodes multiple classifier options by summing their values.
//
// This is used for encoding bit-flag fields like months in standing orders.
//
// Example:
//
//	// Encode January + July + October months
//	encoded := EncodeClassifierOptions([]uint16{
//	    uint16(MonthJanuary),
//	    uint16(MonthJuly),
//	    uint16(MonthOctober),
//	})
//	// Result: 577 (1 + 64 + 512)
func EncodeClassifierOptions(options []uint16) uint16 {
	var sum uint16
	for _, option := range options {
		sum += option
	}
	return sum
}

// DecodeClassifierOptions decodes a summed value back to individual options.
//
// Automatically detects the range based on the highest bit set and returns
// values in descending order.
//
// Example:
//
//	// Decode 577 to get October, July, January
//	months := DecodeClassifierOptions(577)
//	// Result: [512, 64, 1] (October, July, January)
func DecodeClassifierOptions(encoded uint16) []uint16 {
	if encoded == 0 {
		return []uint16{}
	}

	var result []uint16
	sum := encoded

	totalOptions := int(math.Floor(math.Log2(float64(sum)))) + 1
	for i := 1; i <= totalOptions; i++ {
		next := uint16(math.Pow(2, float64(totalOptions-i)))
		if next <= sum {
			sum -= next
			result = append(result, next)
		}
	}

	return result
}
