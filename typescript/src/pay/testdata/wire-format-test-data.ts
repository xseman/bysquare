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
		"0804O0002G0L2UES834BQT9SQJQA9M5QGN1AHN4VO0KB6MVM9RPFU06E5LQEOQUN07FTDIF96UAS90AOPDCSE86CMTRAI45IDKRHJ6BUOIG1162LVVVRAKA000",
	],
	[
		"minimal payment",
		MINIMAL_PAYMENT,
		"0803U0008MG52E0Q0RIN3U8H327ELACLMJC1081SL31ETI56TODN1C4GGCJ47SQ15FPVNSEAV0BUCRJ7AR1D9KUHUNDVVVOF20000",
	],
	[
		"standing order",
		STANDING_ORDER_DATA,
		"0804A0001OCO302A7G11HN9RBP2DAPNOO7UAQDI5DKVTEI505RED837BEV7GRH84QHMRCTLF41JKN2R24B7GPVKN9M6PDSNMTTV0LMDFVVC46000",
	],
	[
		"direct debit",
		DIRECT_DEBIT_DATA,
		"0804U0003QD95ADG9CCKJPH401ABOHCJB2L4IHK9K72O5782QKC041MQ52S4J8DS58K6PFR4ECJJ6T4F84LLVPEMABCMUV7HNT341RBC58APVVQPSO000",
	],
];
