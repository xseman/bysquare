/**
 * Utility functions for handling multiple classifier value options using summed
 * classifiers as specified in the PAY by Square specification.
 *
 * Supports Month Classifier (Table 10) and other classifiers that use summed
 * values.
 *
 * Bit-flag encoding example (Month Classifier):
 * ```
 * Month      | Binary         | Decimal | Bit Position
 * -----------+----------------+---------+-------------
 * January    | 0b000000000001 | 1       | Bit 0
 * February   | 0b000000000010 | 2       | Bit 1
 * March      | 0b000000000100 | 4       | Bit 2
 * April      | 0b000000001000 | 8       | Bit 3
 * May        | 0b000000010000 | 16      | Bit 4
 * June       | 0b000000100000 | 32      | Bit 5
 * July       | 0b000001000000 | 64      | Bit 6
 * August     | 0b000010000000 | 128     | Bit 7
 * September  | 0b000100000000 | 256     | Bit 8
 * October    | 0b001000000000 | 512     | Bit 9
 * November   | 0b010000000000 | 1024    | Bit 10
 * December   | 0b100000000000 | 2048    | Bit 11
 *
 * Combined example:
 *   January + July + October = 1 + 64 + 512 = 577
 *   Binary: 0b001001000001
 *           ^^^  ^      ^
 *           |    |      └─ Bit 0 (January)
 *           |    └──────── Bit 6 (July)
 *           └───────────── Bit 9 (October)
 * ```
 */

/**
 * Encodes multiple classifier options into a single number by summing their
 * values.
 *
 * @example
 * // Encode January + July + October months
 * const encoded = encodeOptions([Month.January, Month.July, Month.October]);
 * // Result: 577 (1 + 64 + 512)
 *
 * @param options Array of classifier values to sum
 * @returns Sum of classifier values
 */
export function encodeOptions(options: number[]): number {
	return options.reduce((sum, option) => sum + option, 0);
}

/**
 * Decodes a summed classifier value back into individual options.
 * Uses the classifier decomposition algorithm from the specification.
 * Automatically detects the range based on the highest bit set.
 *
 * @example
 * // Decode months: January=1, July=64, October=512 sum to 577
 * const decoded = decodeOptions(577);
 * // Result: [512, 64, 1] (October, July, January)
 *
 * @param sum The summed classifier value to decode
 * @returns Array of individual classifier values in descending order
 */
export function decodeOptions(sum: number): number[] {
	const classifiers: number[] = [];

	if (sum === 0) return [];

	// Find the position of the highest bit set
	const totalOptions = Math.floor(Math.log2(sum)) + 1;

	for (let i = 1; i <= totalOptions; i++) {
		const next = Math.pow(2, totalOptions - i);
		if (next <= sum) {
			sum = sum - next;
			classifiers.push(next);
		}
	}

	return classifiers;
}
