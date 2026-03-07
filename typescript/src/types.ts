/**
 * Mapping semantic version to encoded version number, header 4-bit.
 * @see 3.3.
 * @see Table 1
 */
export const Version = {
	/**
	 * Created this document from original by square specifications.
	 *
	 * **Released Date:** 2013-02-22
	 */
	"1.0.0": 0x00,

	/**
	 * Added fields for beneficiary name and address
	 *
	 * **Released Date:** 2015-06-24
	 */
	"1.1.0": 0x01,

	/**
	 * Beneficiary name is now a required field
	 *
	 * **Released Date:** 2025-04-01
	 */
	"1.2.0": 0x02,
} as const;

// Add type for enum-like usage
export type Version = typeof Version[keyof typeof Version];
