#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { parseArgs } from "node:util";
import process from "node:process";

import { encode } from "./encode.js";
import { decode } from "./decode.js";

const args = parseArgs({
	allowPositionals: true,
	options: {
		decode: {
			type: "string",
			short: "d"
		},
		encode: {
			type: "boolean",
			short: "e",
		},
		help: {
			type: "boolean",
			short: "h"
		}
	}
});

if (process.stdin.isTTY) {
	/**
	 * Process multiple files if the encode option is used
	 */
	if (args.values.encode) {
		for (const file of args.positionals) {
			if (existsSync(file) === false) {
				console.error(`File ${file} doesn't exist`);
				process.exit(1);
			}

			const data = readFileSync(file, "utf8");
			const encoded = encode(JSON.parse(data));
			console.log(encoded);
		}

		process.exit(0);
	}

	/**
	 * Input string
	 */
	if (args.values.decode) {
		const qrstring = args.values.decode;
		console.log(JSON.stringify(decode(qrstring), null, 4));
		process.exit(0);
	}

	if (
		args.values.help ||
		Object.keys(args.values).length === 0
	) {
		console.log([
			"NAME",
			"	bysquare - Simple Node.js library to generate and parse PAY bysquare standard",
			"",
			"SYNOPSIS",
			"	bysquare [OPTIONS]",
			"",
			"DESCRIPTION",
			"	bysquare is a command-line tool that provides a simple Node.js library to generate ",
			"	and parse PAY bysquare standard. It offers functionality to encode JSON data into a ",
			"	corresponding QR code and decode a QR code string to obtain the associated JSON data.",
			"",
			"OPTIONS",
			"	-d, --decode <qrstring>",
			"		Decode the specified QR code string and print the corresponding JSON data.",
			"		The qrstring argument should be a valid QR code string.",
			"",
			"	-e, --encode <file(s)>",
			"		Encode JSON data from one or more files and print the corresponding QR code.",
			"		The file(s) argument should be a path to JSON file(s). You can specify multiple",
			"		files separated by spaces.",
			"",
			"	-h, --help",
			"		Display the help message and exit.",
			"",
			"USAGE",
			"	Encoding JSON data from one or more files",
			"",
			`	${process.argv[1]} --encode <file1> <file2> ...`,
			"	The <file1>, <file2>, ... arguments should be the paths to the JSON files you want ",
			"	to encode. The tool will read each file, generate a QR code representing the JSON ",
			"	data, and print them.",
			"",
			"	Decoding a QR code string",
			"",
			`	${process.argv[1]} --decode <qrstring>`,
			"	Replace qrstring with the QR code string you want to decode.",
			"	The program will parse the QR code string and print the resulting JSON data.",
			""
		].join("\n"));
	}
}
