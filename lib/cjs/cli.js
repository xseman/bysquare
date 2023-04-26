#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_fs_1 = require("node:fs");
const node_path_1 = __importDefault(require("node:path"));
const node_readline_1 = require("node:readline");
const generate_js_1 = require("./generate.js");
if /** bysquare "file" */ (process.stdin.isTTY) {
    handleInput(process.argv[2]);
} /** bysquare <<< "data" */
else {
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
    if ((0, node_fs_1.existsSync)(process.argv[2])) {
        const file = (0, node_fs_1.readFileSync)(process.argv[2], "utf8");
        console.log(fromJsonString(file));
    }
    else {
        console.error(`File ${process.argv[2]} doesn't exists`);
        process.exit(1);
    }
}
function fromJsonString(stdin) {
    const data = JSON.parse(stdin);
    return (0, generate_js_1.generate)(data);
}
async function handleStdin() {
    const readline = (0, node_readline_1.createInterface)({
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
    const exe = node_path_1.default.basename(process.argv[1]);
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
        "	}\""
    ].join("\n");
}
