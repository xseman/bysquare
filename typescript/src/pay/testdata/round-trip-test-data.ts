/**
 * Round-trip test data for encode/decode verification.
 *
 * Contains test cases that verify data integrity through
 * the encode -> decode transformation cycle.
 */

import { DIRECT_DEBIT_DATA } from "./direct-debits.js";
import {
	MINIMAL_PAYMENT,
	PAYMENT_ORDER_WITH_DIACRITICS_FIXTURE,
	VALID_PAYMENT_ORDER,
} from "./payment-orders.js";
import { STANDING_ORDER_DATA } from "./standing-orders.js";

/**
 * Collection of test cases for round-trip encode/decode testing.
 * Each test case ensures that encoding and then decoding produces the original data.
 */
export const ROUND_TRIP_TEST_CASES = [
	{ name: "basic payment order", data: VALID_PAYMENT_ORDER },
	{ name: "minimal payment", data: MINIMAL_PAYMENT },
	{ name: "payment with diacritics", data: PAYMENT_ORDER_WITH_DIACRITICS_FIXTURE },
	{ name: "standing order", data: STANDING_ORDER_DATA },
	{ name: "direct debit", data: DIRECT_DEBIT_DATA },
] as const;
