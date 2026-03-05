#!/usr/bin/env node

import {
	existsSync,
	readFileSync,
	statSync,
} from "node:fs";
import process from "node:process";
import { parseArgs } from "node:util";

import { decode } from "./pay/decode.js";
import {
	encode,
	type EncodeOptions,
} from "./pay/encode.js";
import { Version } from "./types.js";

const version = "3.1.0";

const usage = `bysquare - Slovak PAY by square QR payment standard

USAGE:
    bysquare encode [OPTIONS] <input.json>
    bysquare decode <qr-string>
    bysquare version

COMMANDS:
    encode    Encode JSON payment data to BySquare QR string
    decode    Decode BySquare QR string to JSON payment data
    version   Print version information

ENCODE OPTIONS:
    -D, --no-deburr           Keep diacritics (deburr enabled by default)
    -V, --no-validate         Skip validation (validation enabled by default)
    -s, --spec-version VER    Specification version: 1.0.0, 1.1.0, 1.2.0 (default: 1.2.0)

EXAMPLES:
    # Encode with defaults (deburr=true, validate=true, version=1.2.0)
    $ bysquare encode payment.json

    # Encode with specific options
    $ bysquare encode --no-deburr payment.json
    $ bysquare encode --spec-version 1.1.0 payment.json
    $ bysquare encode -s 1.0.0 --no-validate payment.json

    # Encode from stdin
    $ echo '{"payments":[...]}' | bysquare encode -

    # Encode multiple files (including JSONL)
    $ bysquare encode file1.json file2.jsonl

    # Decode QR string
    $ bysquare decode "00D80..."

    # Decode from file
    $ bysquare decode qr.txt

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

async function cmdEncode(args: string[]): Promise<void> {
	const parsed = parseArgs({
		args,
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
	} satisfies EncodeOptions;

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
				encodeAndPrint(line, encodeOpts);
			}
			continue;
		}

		encodeAndPrint(input.trim(), encodeOpts);
	}
}

function encodeAndPrint(jsonStr: string, opts: EncodeOptions): void {
	try {
		const data = JSON.parse(jsonStr);
		const result = encode(data, opts);
		console.log(result);
	} catch (error) {
		console.error("Error:", errorMessage(error));
		process.exit(1);
	}
}

async function cmdDecode(args: string[]): Promise<void> {
	if (args.length === 0) {
		console.error("Error: missing QR string argument");
		process.exit(1);
	}

	const qrInput = args[0];

	try {
		let qr: string;

		if (qrInput === "-") {
			qr = await readStdin();
		} else if (existsSync(qrInput) && statSync(qrInput).isFile()) {
			qr = readFileSync(qrInput, "utf8");
		} else {
			qr = qrInput;
		}

		const model = decode(qr.trim());
		console.log(JSON.stringify(model, null, 2));
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
		case "encode":
			await cmdEncode(process.argv.slice(3));
			break;
		case "decode":
			await cmdDecode(process.argv.slice(3));
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
