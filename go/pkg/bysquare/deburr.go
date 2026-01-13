package bysquare

import (
	"strings"
)

// deburredLettersMap maps Unicode characters with diacritics to basic Latin letters.
var deburredLettersMap = map[rune]string{
	// Latin-1 Supplement block
	'\u00c0': "A", '\u00c1': "A", '\u00c2': "A", '\u00c3': "A", '\u00c4': "A", '\u00c5': "A",
	'\u00e0': "a", '\u00e1': "a", '\u00e2': "a", '\u00e3': "a", '\u00e4': "a", '\u00e5': "a",
	'\u00c7': "C", '\u00e7': "c",
	'\u00d0': "D", '\u00f0': "d",
	'\u00c8': "E", '\u00c9': "E", '\u00ca': "E", '\u00cb': "E",
	'\u00e8': "e", '\u00e9': "e", '\u00ea': "e", '\u00eb': "e",
	'\u00cc': "I", '\u00cd': "I", '\u00ce': "I", '\u00cf': "I",
	'\u00ec': "i", '\u00ed': "i", '\u00ee': "i", '\u00ef': "i",
	'\u00d1': "N", '\u00f1': "n",
	'\u00d2': "O", '\u00d3': "O", '\u00d4': "O", '\u00d5': "O", '\u00d6': "O", '\u00d8': "O",
	'\u00f2': "o", '\u00f3': "o", '\u00f4': "o", '\u00f5': "o", '\u00f6': "o", '\u00f8': "o",
	'\u00d9': "U", '\u00da': "U", '\u00db': "U", '\u00dc': "U",
	'\u00f9': "u", '\u00fa': "u", '\u00fb': "u", '\u00fc': "u",
	'\u00dd': "Y", '\u00fd': "y", '\u00ff': "y",
	'\u00c6': "Ae", '\u00e6': "ae",
	'\u00de': "Th", '\u00fe': "th",
	'\u00df': "ss",

	// Latin Extended-A block
	'\u0100': "A", '\u0102': "A", '\u0104': "A",
	'\u0101': "a", '\u0103': "a", '\u0105': "a",
	'\u0106': "C", '\u0108': "C", '\u010a': "C", '\u010c': "C",
	'\u0107': "c", '\u0109': "c", '\u010b': "c", '\u010d': "c",
	'\u010e': "D", '\u0110': "D", '\u010f': "d", '\u0111': "d",
	'\u0112': "E", '\u0114': "E", '\u0116': "E", '\u0118': "E", '\u011a': "E",
	'\u0113': "e", '\u0115': "e", '\u0117': "e", '\u0119': "e", '\u011b': "e",
	'\u011c': "G", '\u011e': "G", '\u0120': "G", '\u0122': "G",
	'\u011d': "g", '\u011f': "g", '\u0121': "g", '\u0123': "g",
	'\u0124': "H", '\u0126': "H", '\u0125': "h", '\u0127': "h",
	'\u0128': "I", '\u012a': "I", '\u012c': "I", '\u012e': "I", '\u0130': "I",
	'\u0129': "i", '\u012b': "i", '\u012d': "i", '\u012f': "i", '\u0131': "i",
	'\u0134': "J", '\u0135': "j",
	'\u0136': "K", '\u0137': "k", '\u0138': "k",
	'\u0139': "L", '\u013b': "L", '\u013d': "L", '\u013f': "L", '\u0141': "L",
	'\u013a': "l", '\u013c': "l", '\u013e': "l", '\u0140': "l", '\u0142': "l",
	'\u0143': "N", '\u0145': "N", '\u0147': "N", '\u014a': "N",
	'\u0144': "n", '\u0146': "n", '\u0148': "n", '\u014b': "n",
	'\u014c': "O", '\u014e': "O", '\u0150': "O",
	'\u014d': "o", '\u014f': "o", '\u0151': "o",
	'\u0154': "R", '\u0156': "R", '\u0158': "R",
	'\u0155': "r", '\u0157': "r", '\u0159': "r",
	'\u015a': "S", '\u015c': "S", '\u015e': "S", '\u0160': "S",
	'\u015b': "s", '\u015d': "s", '\u015f': "s", '\u0161': "s",
	'\u0162': "T", '\u0164': "T", '\u0166': "T",
	'\u0163': "t", '\u0165': "t", '\u0167': "t",
	'\u0168': "U", '\u016a': "U", '\u016c': "U", '\u016e': "U", '\u0170': "U", '\u0172': "U",
	'\u0169': "u", '\u016b': "u", '\u016d': "u", '\u016f': "u", '\u0171': "u", '\u0173': "u",
	'\u0174': "W", '\u0175': "w",
	'\u0176': "Y", '\u0177': "y", '\u0178': "Y",
	'\u0179': "Z", '\u017b': "Z", '\u017d': "Z",
	'\u017a': "z", '\u017c': "z", '\u017e': "z",
	'\u0132': "IJ", '\u0133': "ij",
	'\u0152': "Oe", '\u0153': "oe",
	'\u0149': "'n", '\u017f': "ss",
}

// deburr removes diacritics from a string.
func deburr(s string) string {
	var result strings.Builder
	result.Grow(len(s))

	for _, r := range s {
		if replacement, ok := deburredLettersMap[r]; ok {
			result.WriteString(replacement)
		} else {
			result.WriteRune(r)
		}
	}

	return result.String()
}

// removeDiacritics removes diacritics from text fields in DataModel.
//
// Only specific fields are deburred to match TypeScript implementation:
// - paymentNote
// - beneficiary.name
// - beneficiary.street
// - beneficiary.city
func removeDiacritics(model *DataModel) {
	for i := range model.Payments {
		payment := &model.Payments[i]

		if payment.PaymentNote != "" {
			payment.PaymentNote = deburr(payment.PaymentNote)
		}

		if payment.Beneficiary != nil {
			if payment.Beneficiary.Name != "" {
				payment.Beneficiary.Name = deburr(payment.Beneficiary.Name)
			}
			if payment.Beneficiary.Street != "" {
				payment.Beneficiary.Street = deburr(payment.Beneficiary.Street)
			}
			if payment.Beneficiary.City != "" {
				payment.Beneficiary.City = deburr(payment.Beneficiary.City)
			}
		}
	}
}
