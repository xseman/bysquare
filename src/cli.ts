#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import process from "node:process";
import { parseArgs } from "node:util";

import { decode } from "./decode.js";
import { encode } from "./encode.js";

const args = parseArgs({
	allowPositionals: true,
	options: {
		decode: {
			type: "string",
			short: "d",
		},
		encode: {
			type: "boolean",
			short: "e",
		},
		help: {
			type: "boolean",
			short: "h",
		},
	},
});

if (process.stdin.isTTY) {
	if (args.values.encode) {
		if (args.positionals.length === 0) {
			console.error("No files provided for encoding.");
			process.exit(1);
		}

		for (const file of args.positionals) {
			if (existsSync(file) === false) {
				console.error(`File ${file} doesn't exist`);
				process.exit(1);
			}

			if (
				file.endsWith(".json") === false
				&& file.endsWith(".jsonl") === false
			) {
				console.error(`Unsupported file format for ${file}`);
				process.exit(1);
			}

			const data = readFileSync(file, "utf8");
			if (file.endsWith(".jsonl")) {
				const lines = data.split("\n");
				for (const line of lines) {
					if (!line) continue;

					const json = JSON.parse(line);
					console.log(encode(json));
				}
			}

			if (file.endsWith(".json")) {
				console.log(encode(JSON.parse(data)));
			}

			process.exit(0);
		}
	}

	if (args.values.decode) {
		const qrstring = args.values.decode;
		console.log(JSON.stringify(decode(qrstring), null, 4));
		process.exit(0);
	}

	if (
		args.values.help
		|| Object.keys(args.values).length === 0
	) {
		console.log([
			"NAME",
			"	bysquare - Simple Node.js library to generate and parse PAY bysquare standard",
			"",
			"SYNOPSIS",
			"	bysquare [OPTIONS] [FILES...]",
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
			"	-e, --encode",
			"		Encode JSON data from one or more files and print the corresponding QR code.",
			"",
			"	-h, --help",
			"		Display the help message and exit.",
			"",
			"USAGE",
			"	Encoding JSON data from one or more files",
			"",
			`	${process.argv[1]} --encode file1.json file2.json ...`,
			"	The file1.json, file2.json, ... arguments should be the paths to the JSON or JSONL",
			"   files you want to encode. The tool will read each file, generate a QR code representing",
			"	the JSON data, and print them.",
			"",
			"	Decoding a QR code string",
			"",
			`	${process.argv[1]} --decode <qrstring>`,
			"	Replace qrstring with the QR code string you want to decode.",
			"	The program will parse the QR code string and print the resulting JSON data.",
			"",
		].join("\n"));
	}
}
