/**
 * Golden wire format test data.
 *
 * Maps fixtures to the exact QR strings they encode to. The strings pin the
 * LZMA compressed output, so any change in the compression dependency that
 * alters the produced bytes breaks these tests instead of silently shipping
 * QR codes that banking apps cannot read.
 *
 * @see 3.16.
 */

import { DataModel } from "../types.js";
import { DIRECT_DEBIT_DATA } from "./direct-debits.js";
import {
	MINIMAL_PAYMENT,
	VALID_PAYMENT_ORDER,
} from "./payment-orders.js";
import { STANDING_ORDER_DATA } from "./standing-orders.js";

export const WIRE_FORMAT_TEST_CASES: Array<[string, DataModel, string]> = [
	[
		"valid payment order",
		VALID_PAYMENT_ORDER,
		"0804O0002G0L2UES834BQT9SQJQA9M5QGN1AHN4VO0KB6MVM9RPGR6APCGPRILE5PJ8VTQ52RPSLT6TCJVVC4BMR03J4998N393G7940TB936AFDVVVQCKA000",
	],
	[
		"minimal payment",
		MINIMAL_PAYMENT,
		"0803U0008MG52E0Q0RIN3U8H327ELACLQNJDCT83GUMQUUJ31MDDAGCVPL3GO6H3J73L9584MJN1MUB510LHQUOJNQ3VVVPHEO000",
	],
	[
		"standing order",
		STANDING_ORDER_DATA,
		"0804A0001OCO302A7G11HN9RBP2DAPNOO7UAQG0HJKVTEI505RED837A97NM5UPQ7UTO6ERAJV24HT0NB3BJGU863HGJ6IM5GEFAJA3NVVDTAK00",
	],
	[
		"direct debit",
		DIRECT_DEBIT_DATA,
		"0804U0003QD95ADG9CCKJPH401ABOHCJB2L4IJMLT72O5782QKC041MPADFTQMRHR2UFH3M9QCK9Q158AEVGUT42OU8ITOARTV0THCDEJ6KRVVRM0O000",
	],
];
