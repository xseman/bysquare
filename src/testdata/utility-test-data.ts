// Base32hex test data
export const base32hexTestCases = [
	{
		name: "empty input",
		input: new Uint8Array([]),
		expectedEncoded: "",
		expectedDecoded: new Uint8Array([]),
	},
	{
		name: "'f' (0x66)",
		input: new Uint8Array([0x66]),
		expectedEncoded: "CO======",
		expectedDecoded: new Uint8Array([0x66]),
	},
	{
		name: "'foobar' string",
		input: new Uint8Array([0x66, 0x6f, 0x6f, 0x62, 0x61, 0x72]),
		expectedEncoded: "CPNMUOJ1E8======",
		expectedDecoded: new Uint8Array([0x66, 0x6f, 0x6f, 0x62, 0x61, 0x72]),
	},
	{
		name: "longer input",
		input: new Uint8Array([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06]),
		expectedEncoded: "000G40O40K30====",
		expectedDecoded: new Uint8Array([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06]),
	},
];

export const base32hexNoPaddingTestCases = [
	{
		name: "with no padding",
		input: new Uint8Array([0x66, 0x6f]),
		expectedEncoded: "CPNG",
		expectedDecoded: new Uint8Array([0x66, 0x6f]),
	},
];

export const base32hexDecodeTestCases = [
	{
		name: "empty string",
		input: "",
		expected: new Uint8Array([]),
	},
	{
		name: "'CO======'",
		input: "CO======",
		expected: new Uint8Array([0x66]),
	},
	{
		name: "'foobar' string",
		input: "CPNMUOJ1E8======",
		expected: new Uint8Array([0x66, 0x6f, 0x6f, 0x62, 0x61, 0x72]),
	},
	{
		name: "with no padding",
		input: "CPNM",
		expected: new Uint8Array([0x66, 0x6f]),
	},
];

export const base32hexLooseModeTestCases = [
	{
		name: "with loose mode (lowercase and no padding)",
		input: "cpnm",
		expected: new Uint8Array([0x66, 0x6f]),
	},
];

// CRC32 test data
export const crc32TestCases = [
	{
		name: "empty string",
		input: "",
		expected: 0,
	},
	{
		name: '"123456789"',
		input: "123456789",
		expected: 0xCBF43926,
	},
	{
		name: '"Hello, World!"',
		input: "Hello, World!",
		expected: 0xEC4AC3D0,
	},
	{
		name: "a long string",
		input: "a".repeat(1000),
		expected: 0x9A38DA03,
	},
];
