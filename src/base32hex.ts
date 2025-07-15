const base32Hex = {
	chars: "0123456789ABCDEFGHIJKLMNOPQRSTUV",
	bits: 5,
	mask: 0b11111, // Mask to extract 5 bits
};

export function encode(
	input: ArrayLike<number>,
	addPadding: boolean = true,
): string {
	const output = Array<string>();
	let buffer = 0;
	let bitsLeft = 0;

	for (let i = 0; i < input.length; i++) {
		buffer = (buffer << 8) | input[i];
		bitsLeft += 8;

		while (bitsLeft >= base32Hex.bits) {
			bitsLeft -= base32Hex.bits;
			const index = (buffer >> bitsLeft) & base32Hex.mask;
			output.push(base32Hex.chars[index]);
		}
	}

	if (bitsLeft > 0) {
		const maskedValue = (buffer << (base32Hex.bits - bitsLeft)) & base32Hex.mask;
		output.push(base32Hex.chars[maskedValue]);
	}

	let base32hex = output.join("");

	if (addPadding) {
		const paddedLength = Math.ceil(base32hex.length / 8) * 8;
		base32hex = base32hex.padEnd(paddedLength, "=");
	}

	return base32hex;
}

export function decode(
	input: string,
	isLoose: boolean = false,
): Uint8Array {
	if (isLoose) {
		input = input.toUpperCase();
		const paddingNeeded = (8 - (input.length % 8)) % 8;
		input += "=".repeat(paddingNeeded);
	}

	input = input.replace(/=+$/, "");

	const output = Array<number>();
	let buffer = 0;
	let bitsLeft = 0;

	for (let i = 0; i < input.length; i++) {
		const index = base32Hex.chars.indexOf(input[i]);
		if (index === -1) {
			throw new Error("Invalid base32hex string");
		}

		buffer = (buffer << base32Hex.bits) | index;
		bitsLeft += base32Hex.bits;

		if (bitsLeft >= 8) {
			bitsLeft -= 8;
			output.push((buffer >> bitsLeft) & 0xFF);
		}
	}

	return Uint8Array.from(output);
}
