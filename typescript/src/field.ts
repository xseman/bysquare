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
 * Print a number field rounded to MAX_DECIMALS and without the trailing
 * zeros, so a float artifact such as 0.1 + 0.2 does not reach the payload.
 */
export function formatDecimal(value: number | undefined): string | undefined {
	return value === undefined ? undefined : Number(value.toFixed(MAX_DECIMALS)).toString();
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
