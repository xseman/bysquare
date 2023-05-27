#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs"
import { parseArgs } from "node:util"

import { generate } from "./generate.js"
import { parse } from "./parse.js"

const args = parseArgs({
	allowPositionals: true,
	options: {
		decode: {
			type: "string",
			short: "d"
		},
		encode: {
			type: "string",
			short: "e"
		},
		help: {
			type: "boolean",
			short: "h"
		}
	}
})

if (process.stdin.isTTY) {
	/** json file */
	if (args.values.encode) {
		const file = args.values.encode
		if (existsSync(file)) {
			const data = readFileSync(file, "utf8")
			console.log(generate(JSON.parse(data)))
		} else {
			console.error(`File ${file} doesn't exists`)
			process.exit(1)
		}
	}

	/** input string */
	if (args.values.decode) {
		const qrstring = args.values.decode
		console.log(JSON.stringify(parse(qrstring), null, 4))
	}

	if (args.values.help || Object.keys(args.values).length === 0) {
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
			"	-e, --encode <file>",
			"		Encode JSON data from a file and print the corresponding QR code.",
			"		The file argument should be a path to a JSON file.",
			"",
			"	-h, --help",
			"		Display the help message and exit.",
			"",
			"USAGE",
			"	Encoding JSON data from a file",
			"",
			`	${process.argv[1]} --encode <file>`,
			"	The <file> argument should be the path to the JSON file you want to encode.",
			"	The tool will read the file, generate a QR code representing the JSON data",
			"",
			"	Decoding a QR code string",
			"",
			`	${process.argv[1]} --decode <qrstring>`,
			"	Replace qrstring with the QR code string you want to decode.",
			"	The program will parse the QR code string and print the resulting JSON data.",
			""
		].join("\n"))
	}
}
