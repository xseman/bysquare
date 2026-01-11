const base32Hex = {
	chars: "0123456789ABCDEFGHIJKLMNOPQRSTUV",
	bits: 5,
	mask: 0b11111, // Mask to extract 5 bits
};

/**
 * Encodes bytes to base32hex by converting 8-bit bytes to 5-bit groups.
 *
 * ```
 * Bit packing process (40 bits = 5 bytes → 8 base32hex chars):
 *
 * Input bytes:     [   B0   ][   B1   ][   B2   ][   B3   ][   B4   ]
 * Bit positions:   76543210  76543210  76543210  76543210  76543210
 *
 * Output groups:   [C0 ][C1 ][C2 ][C3 ][C4 ][C5 ][C6 ][C7 ]
 * Bit positions:   43210 43210 43210 43210 43210 43210 43210 43210
 *
 * C0 = B0[7:3]   (top 5 bits of B0)
 * C1 = B0[2:0] + B1[7:6]   (bottom 3 bits of B0 + top 2 bits of B1)
 * C2 = B1[5:1]   (middle 5 bits of B1)
 * C3 = B1[0] + B2[7:4]   (bottom 1 bit of B1 + top 4 bits of B2)
 * ... and so on
 * ```
 */
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

/**
 * Decodes base32hex string back to bytes by converting 5-bit groups to 8-bit bytes.
 *
 * ```
 * Bit unpacking process (8 base32hex chars → 5 bytes):
 *
 * Input groups:    [C0 ][C1 ][C2 ][C3 ][C4 ][C5 ][C6 ][C7 ]
 * Bit positions:   43210 43210 43210 43210 43210 43210 43210 43210
 *
 * Output bytes:    [   B0   ][   B1   ][   B2   ][   B3   ][   B4   ]
 * Bit positions:   76543210  76543210  76543210  76543210  76543210
 *
 * B0 = C0[4:0] + C1[4:3]   (all of C0 + top 2 bits of C1)
 * B1 = C1[2:0] + C2[4:0]   (bottom 3 bits of C1 + all of C2)
 * B2 = C3[4:0] + C4[4:2]   (all of C3 + top 3 bits of C4)
 * ... and so on
 * ```
 */
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
