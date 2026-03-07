#!/usr/bin/env node

import {
	existsSync,
	readFileSync,
	statSync,
} from "node:fs";
import process from "node:process";
import { parseArgs } from "node:util";

import * as base32hex from "./base32hex.js";
import { decodeHeader } from "./header.js";
import { decode as invoiceDecode } from "./invoice/decode.js";
import {
	encode as invoiceEncode,
	type EncodeOptions as InvoiceEncodeOptions,
} from "./invoice/encode.js";
import { decode as payDecode } from "./pay/decode.js";
import {
	encode as payEncode,
	type EncodeOptions as PayEncodeOptions,
} from "./pay/encode.js";
import { Version } from "./types.js";

const version = "3.2.0";

const usage = `bysquare - Slovak BySquare QR standard

USAGE:
    bysquare pay encode [OPTIONS] <input.json>
    bysquare pay decode <qr-string>
    bysquare invoice encode [OPTIONS] <input.json>
    bysquare invoice decode <qr-string>
    bysquare decode <qr-string>
    bysquare version

COMMANDS:
    pay          PAY by square operations
    invoice      Invoice by square operations
    decode       Auto-detect and decode any BySquare QR string
    version      Print version information

PAY ENCODE OPTIONS:
    -D, --no-deburr           Keep diacritics (deburr enabled by default)
    -V, --no-validate         Skip validation (validation enabled by default)
    -s, --spec-version VER    Specification version: 1.0.0, 1.1.0, 1.2.0 (default: 1.2.0)

INVOICE ENCODE OPTIONS:
    -V, --no-validate         Skip validation (validation enabled by default)
    -s, --spec-version VER    Specification version: 1.0.0 (default: 1.0.0)

EXAMPLES:
    # PAY: Encode with defaults
    $ bysquare pay encode payment.json

    # PAY: Encode from stdin
    $ echo '{"payments":[...]}' | bysquare pay encode -

    # PAY: Decode QR string
    $ bysquare pay decode "00D80..."

    # Invoice: Encode
    $ bysquare invoice encode invoice.json

    # Auto-detect and decode any BySquare QR
    $ bysquare decode "00D80..."

For more information, visit: https://github.com/xseman/bysquare
`;

function errorMessage(error: unknown): string {
	return error instanceof Error
		? error.message
		: String(error);
}

async function readStdin(): Promise<string> {
	const chunks: Buffer[] = [];
	for await (const chunk of process.stdin) {
		chunks.push(chunk);
	}
	return Buffer.concat(chunks).toString("utf8");
}

async function readInput(path: string): Promise<string> {
	if (path === "-") {
		return readStdin();
	}
	if (!existsSync(path)) {
		throw new Error(`file ${path} doesn't exist`);
	}
	return readFileSync(path, "utf8");
}

async function readQrInput(args: string[]): Promise<string> {
	if (args.length === 0) {
		console.error("Error: missing QR string argument");
		process.exit(1);
	}

	const qrInput = args[0];

	if (qrInput === "-") {
		return (await readStdin()).trim();
	}
	if (existsSync(qrInput) && statSync(qrInput).isFile()) {
		return readFileSync(qrInput, "utf8").trim();
	}
	return qrInput;
}

async function cmdPayEncode(args: string[]): Promise<void> {
	const parsed = parseArgs({
		args: args,
		allowPositionals: true,
		options: {
			"no-deburr": {
				type: "boolean",
				short: "D",
			},
			"no-validate": {
				type: "boolean",
				short: "V",
			},
			"spec-version": {
				type: "string",
				short: "s",
				default: "1.2.0",
			},
		},
	});

	if (parsed.positionals.length === 0) {
		console.error("Error: missing input file argument");
		process.exit(1);
	}

	const versionStr = parsed.values["spec-version"] as keyof typeof Version;
	if (!(versionStr in Version)) {
		console.error("Error: unsupported spec version:", parsed.values["spec-version"]);
		process.exit(1);
	}

	const encodeOpts = {
		validate: !parsed.values["no-validate"],
		deburr: !parsed.values["no-deburr"],
		version: Version[versionStr],
	} satisfies PayEncodeOptions;

	for (const inputFile of parsed.positionals) {
		let input: string;
		try {
			input = await readInput(inputFile);
		} catch (error) {
			console.error("Error:", errorMessage(error));
			process.exit(1);
		}

		if (inputFile.endsWith(".jsonl")) {
			for (const line of input.split("\n")) {
				if (!line.trim()) continue;
				payEncodeAndPrint(line, encodeOpts);
			}
			continue;
		}

		payEncodeAndPrint(input.trim(), encodeOpts);
	}
}

function payEncodeAndPrint(jsonStr: string, opts: PayEncodeOptions): void {
	try {
		const data = JSON.parse(jsonStr);
		const result = payEncode(data, opts);
		console.log(result);
	} catch (error) {
		console.error("Error:", errorMessage(error));
		process.exit(1);
	}
}

async function cmdPayDecode(args: string[]): Promise<void> {
	try {
		const qr = await readQrInput(args);
		const model = payDecode(qr);
		console.log(JSON.stringify(model, null, 2));
	} catch (error) {
		console.error("Error:", errorMessage(error));
		process.exit(1);
	}
}

async function cmdPay(args: string[]): Promise<void> {
	if (args.length === 0) {
		console.error("Error: missing subcommand: encode or decode");
		process.exit(1);
	}

	const subcommand = args[0];

	switch (subcommand) {
		case "encode":
			await cmdPayEncode(args.slice(1));
			break;
		case "decode":
			await cmdPayDecode(args.slice(1));
			break;
		default:
			console.error("Error: unknown pay subcommand:", subcommand);
			process.exit(1);
	}
}

async function cmdInvoiceEncode(args: string[]): Promise<void> {
	const parsed = parseArgs({
		args: args,
		allowPositionals: true,
		options: {
			"no-validate": {
				type: "boolean",
				short: "V",
			},
			"spec-version": {
				type: "string",
				short: "s",
				default: "1.0.0",
			},
		},
	});

	if (parsed.positionals.length === 0) {
		console.error("Error: missing input file argument");
		process.exit(1);
	}

	const versionStr = parsed.values["spec-version"] as keyof typeof Version;
	if (!(versionStr in Version)) {
		console.error("Error: unsupported spec version:", parsed.values["spec-version"]);
		process.exit(1);
	}

	const encodeOpts = {
		validate: !parsed.values["no-validate"],
		version: Version[versionStr],
	} satisfies InvoiceEncodeOptions;

	for (const inputFile of parsed.positionals) {
		let input: string;
		try {
			input = await readInput(inputFile);
		} catch (error) {
			console.error("Error:", errorMessage(error));
			process.exit(1);
		}

		try {
			const data = JSON.parse(input.trim());
			const result = invoiceEncode(data, encodeOpts);
			console.log(result);
		} catch (error) {
			console.error("Error:", errorMessage(error));
			process.exit(1);
		}
	}
}

async function cmdInvoiceDecode(args: string[]): Promise<void> {
	try {
		const qr = await readQrInput(args);
		const model = invoiceDecode(qr);
		console.log(JSON.stringify(model, null, 2));
	} catch (error) {
		console.error("Error:", errorMessage(error));
		process.exit(1);
	}
}

async function cmdInvoice(args: string[]): Promise<void> {
	if (args.length === 0) {
		console.error("Error: missing subcommand: encode or decode");
		process.exit(1);
	}

	const subcommand = args[0];

	switch (subcommand) {
		case "encode":
			await cmdInvoiceEncode(args.slice(1));
			break;
		case "decode":
			await cmdInvoiceDecode(args.slice(1));
			break;
		default:
			console.error("Error: unknown invoice subcommand:", subcommand);
			process.exit(1);
	}
}

async function cmdDecodeAuto(args: string[]): Promise<void> {
	try {
		const qr = await readQrInput(args);
		const rawBytes = base32hex.decode(qr, true);

		if (rawBytes.length < 2) {
			throw new Error("input too short");
		}

		const header = decodeHeader(rawBytes.subarray(0, 2));

		switch (header.bysquareType) {
			case 0x00: {
				const model = payDecode(qr);
				console.log(JSON.stringify(model, null, 2));
				break;
			}
			case 0x01: {
				const model = invoiceDecode(qr);
				console.log(JSON.stringify(model, null, 2));
				break;
			}
			default:
				throw new Error(`unsupported bysquareType: ${header.bysquareType}`);
		}
	} catch (error) {
		console.error("Error:", errorMessage(error));
		process.exit(1);
	}
}

async function main(): Promise<void> {
	if (process.argv.length < 3) {
		console.error(usage);
		process.exit(1);
	}

	const command = process.argv[2];

	switch (command) {
		case "pay":
			await cmdPay(process.argv.slice(3));
			break;
		case "invoice":
			await cmdInvoice(process.argv.slice(3));
			break;
		case "decode":
			await cmdDecodeAuto(process.argv.slice(3));
			break;
		case "version":
		case "-v":
		case "--version":
			console.log(`bysquare version ${version}`);
			break;
		case "help":
		case "-h":
		case "--help":
			console.log(usage);
			break;
		default:
			console.error("Unknown command:", command);
			console.error(usage);
			process.exit(1);
	}
}

main().catch((error) => {
	console.error("Fatal error:", error);
	process.exit(1);
});
