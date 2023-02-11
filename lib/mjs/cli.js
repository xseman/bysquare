#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { createInterface } from "node:readline";
import { generate } from "./generate.js";
if (process.stdin.isTTY) {
    // bysquare "file"
    handleInput(process.argv[2]);
}
else {
    // echo "data" | bysquare
    ;
    (async () => {
        const stdin = await handleStdin();
        console.log(fromJsonString(stdin));
        process.exit(0);
    })();
}
function handleInput(input) {
    if (input === undefined || input === "-h" || input === "--help") {
        console.log(help());
        process.exit(0);
    }
    if (existsSync(process.argv[2])) {
        const file = readFileSync(process.argv[2], "utf8");
        console.log(fromJsonString(file));
    }
    else {
        console.error(`File ${process.argv[2]} doesn't exists`);
        process.exit(1);
    }
}
function fromJsonString(stdin) {
    const data = JSON.parse(stdin);
    return generate(data);
}
async function handleStdin() {
    const readline = createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: false
    });
    const lines = [];
    return new Promise((resolve, reject) => {
        readline
            .on("line", (line) => {
            lines.push(line);
        })
            .on("close", () => {
            resolve(lines.join(""));
        })
            .on("SIGINT", /* CTRL+C */ reject);
    });
}
function help() {
    const exe = path.basename(process.argv[1]);
    return [
        "Simple Node.js library to generate 'PAY by square' QR string.",
        "",
        "Usage:",
        `   ${exe} file`,
        "",
        "File:",
        "   Valid json file",
        "",
        "Flags:",
        "   -h, --help    display this help and exit",
        "",
        "If <file> is omitted, reads from stdin.",
        "",
        "Examples:",
        "	bysquare <<< \"{",
        "		\"invoiceId\": \"random-id\",",
        "		\"payments\": [",
        "			{",
        "				\"type\": 1,",
        "				\"amount\": 100.0,",
        "				\"bankAccounts\": [{ \"iban\": \"SK9611000000002918599669\" }],",
        "				\"currencyCode\": \"EUR\",",
        "				\"variableSymbol\": \"123\"",
        "			}",
        "		]",
        "	}\"",
    ].join("\n");
}
