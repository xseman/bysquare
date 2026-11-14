import validator from "validator";

/**
 * Sanitize field value by replacing tab characters with space.
 *
 * @see 3.8.
 */
export function sanitize(value: string | undefined): string | undefined {
	return value?.replaceAll("\t", " ");
}

/**
 * The decimal places a number field may carry: the specification writes the
 * format as #.########.
 *
 * @see Table 8
 */
const MAX_DECIMALS = 8;

/**
 * The characters a number field may take written out.
 *
 * @see Table 15 field #4
 */
const MAX_AMOUNT_LENGTH = 15;

/**
 * Print a number field rounded to MAX_DECIMALS and without the trailing
 * zeros, so a float artifact such as 0.1 + 0.2 does not reach the payload.
 * The field is an xs:decimal, so a small value such as 0.0000001 is written
 * out in full and never as 1e-7.
 */
export function formatDecimal(value: number | undefined): string | undefined {
	if (value === undefined) {
		return undefined;
	}

	const fixed = value.toFixed(MAX_DECIMALS);

	return fixed.includes(".") && !fixed.includes("e")
		? fixed.replace(/\.?0+$/, "")
		: fixed;
}

/**
 * Checks that the amount is a finite number, not negative, and at most
 * MAX_AMOUNT_LENGTH characters written out. Zero is accepted.
 *
 * @see Table 15 field #4
 */
export function isValidAmount(amount: number): boolean {
	if (!Number.isFinite(amount) || amount < 0) {
		return false;
	}

	// toFixed switches to an exponent from 1e21 on, which xs:decimal has not.
	const printed = formatDecimal(amount)!;

	return !printed.includes("e") && printed.length <= MAX_AMOUNT_LENGTH;
}

export function decodeNumber(value: string | undefined): number | undefined {
	return value?.length ? Number(value) : undefined;
}

export function decodeString(value: string | undefined): string | undefined {
	return value?.length ? value : undefined;
}

/**
 * Checks that the date is YYYYMMDD and names a real calendar day, leap years
 * and month lengths included.
 *
 * TODO: remove after release https://github.com/validatorjs/validator.js/pull/2659
 */
export function isValidDate(date: string): boolean {
	if (!/^\d{8}$/.test(date)) {
		return false;
	}

	const isoFormat = `${date.substring(0, 4)}-${date.substring(4, 6)}-${date.substring(6, 8)}`;

	return validator.isDate(isoFormat, {
		format: "YYYY-MM-DD",
		strictMode: true,
		delimiters: ["-"],
	});
}
