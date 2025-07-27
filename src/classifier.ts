/**
 * Utility functions for handling multiple classifier value options using summed
 * classifiers as specified in the PAY by Square specification.
 *
 * Supports Month Classifier (Table 10) and other classifiers that use summed
 * values.
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
