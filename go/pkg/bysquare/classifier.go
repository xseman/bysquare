package bysquare

import "math"

// EncodeOptions encodes multiple classifier options by summing their values.
//
// This is used for encoding bit-flag fields like months in standing orders,
// where each option is one bit (Appendix A, Table 10):
//
//	Month      | Binary         | Decimal | Bit Position
//	-----------+----------------+---------+-------------
//	January    | 0b000000000001 | 1       | Bit 0
//	February   | 0b000000000010 | 2       | Bit 1
//	March      | 0b000000000100 | 4       | Bit 2
//	April      | 0b000000001000 | 8       | Bit 3
//	May        | 0b000000010000 | 16      | Bit 4
//	June       | 0b000000100000 | 32      | Bit 5
//	July       | 0b000001000000 | 64      | Bit 6
//	August     | 0b000010000000 | 128     | Bit 7
//	September  | 0b000100000000 | 256     | Bit 8
//	October    | 0b001000000000 | 512     | Bit 9
//	November   | 0b010000000000 | 1024    | Bit 10
//	December   | 0b100000000000 | 2048    | Bit 11
//
// Combined example:
//
//	January + July + October = 1 + 64 + 512 = 577
//	Binary: 0b001001000001
//	          ^  ^      ^
//	          |  |      └─ Bit 0 (January)
//	          |  └──────── Bit 6 (July)
//	          └─────────── Bit 9 (October)
//
// Example:
//
//	// Encode January + July + October months
//	encoded := EncodeOptions([]uint16{
//	    uint16(MonthJanuary),
//	    uint16(MonthJuly),
//	    uint16(MonthOctober),
//	})
//	// Result: 577 (1 + 64 + 512)
func EncodeOptions(options []uint16) uint16 {
	var sum uint16
	for _, option := range options {
		sum += option
	}

	return sum
}

// DecodeOptions decodes a summed value back to individual options.
//
// Automatically detects the range based on the highest bit set and returns
// values in descending order.
//
// Example:
//
//	// Decode 577 to get October, July, January
//	months := DecodeOptions(577)
//	// Result: [512, 64, 1] (October, July, January)
func DecodeOptions(encoded uint16) []uint16 {
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
