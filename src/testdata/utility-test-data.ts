// Utility test data for shared use across multiple test files

// Invalid base32hex strings for testing decode error handling
export const invalidBase32HexStrings = [
	"", // empty string
	"Z", // invalid character
	"00Z0", // contains invalid character
	"0000!000", // contains special character
	"XXXX", // all invalid characters
];
