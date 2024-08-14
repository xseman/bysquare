const base32Hex = {
	chars: "0123456789ABCDEFGHIJKLMNOPQRSTUV",
	bits: 5,
};

export function encode(
	input: Uint8Array,
	addPadding: boolean = true,
): string {
	const bitArray = Array<string>();

	for (let i = 0; i < input.length; i++) {
		// Convert byte to binary and pad with leading zeros
		const binaryString = input[i].toString(2).padStart(8, "0");

		bitArray.push(binaryString);
	}

	const hexBase32Array = Array<string>();
	const bits = bitArray.join("");

	for (let i = 0; i < bits.length; i += base32Hex.bits) {
		const segment = bits.substring(i, i + base32Hex.bits);
		const character = base32Hex.chars[parseInt(segment, 2)];

		hexBase32Array.push(character);
	}

	let base32hex = hexBase32Array.join("");

	if (addPadding) {
		return base32hex.padEnd(Math.ceil(base32hex.length / 8) * 8, "=");
	}

	return base32hex;
}

export function decode(
	input: string,
	isLoose: boolean = false,
): Uint8Array {
	// If loose mode is enabled, fix lowercase and correct padding
	if (isLoose) {
		// Convert lowercase characters to uppercase
		input = input.toUpperCase();

		// Correct missing padding characters (=)
		// Base32Hex strings should be a multiple of 8 characters
		const paddingNeeded = (8 - (input.length % 8)) % 8;
		input += "=".repeat(paddingNeeded);
	}

	// Remove padding
	input = input.replace(/=+$/, "");

	const bitsArray = Array<string>();

	for (let i = 0; i < input.length; i++) {
		const index = base32Hex.chars.indexOf(input[i]);
		if (index === -1) {
			throw new Error("Invalid base32hex string");
		}

		bitsArray.push(index.toString(2).padStart(base32Hex.bits, "0"));
	}

	const decoded = Array<number>();
	const bits = bitsArray.join("");

	for (let i = 0; i < bits.length; i += 8) {
		const byte = bits.substring(i, i + 8);
		if (byte.length === 8) {
			decoded.push(parseInt(byte, 2));
		}
	}

	return Uint8Array.from(decoded);
}
