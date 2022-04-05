#!/usr/bin/env node

import { existsSync, readFileSync } from 'fs';
import { createInterface } from 'readline';

import { generate } from './main';
import { Model } from './types';

if (process.stdin.isTTY) {
    // bysquare "file"
    handleInput(process.argv[2]);
} else {
    // echo "data" | bysquare
    (async () => {
        const stdin: string = await handleStdin();
        const qrString = await jsonStringToQrString(stdin).catch((e) => {
            console.error(e);
            process.exit(1);
        });
        console.log(qrString);
        process.exit(0);
    })();
}

async function handleInput(input?: string): Promise<void> {
    if (input === undefined || input === "-h" || input === "--help") {
        console.log(help());
        process.exit(0);
    }

    if (existsSync(process.argv[2])) {
        const file = readFileSync(process.argv[2], "utf8");
        const qrString = await jsonStringToQrString(file).catch((e) => {
            console.error(e);
            process.exit(1);
        });
        console.log(qrString);
    } else {
        console.error(`File ${process.argv[2]} doesn't exists`);
        process.exit(1);
    }
}

async function jsonStringToQrString(stdin: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        try {
            const data = JSON.parse(stdin) as Model;
            generate(data).then((qrString) => {
                resolve(qrString);
            });
        } catch (e) {
            reject(e);
        }
    });
}

async function handleStdin(): Promise<string> {
    const readline = createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: false,
    });

    const lines: string[] = [];
    return new Promise<string>((resolve, reject) => {
        readline.on("line", (line) => {
            lines.push(line);
        });
        readline.on("close", () => {
            resolve(lines.join(""));
        });
        readline.on("SIGINT" /* CTRL+C */, reject);
    });
}

function help(): string {
    return [
        "Simple Node.js library to generate 'PAY by square' QR string.",
        "",
        "Usage:",
        "   bysquare file",
        "",
        "File:",
        "   Valid json file",
        "",
        "Flags:",
        "   -h, --help    display this help and exit",
        "   -v, --version display actual version",
        "",
        "If <file> is omitted, reads from stdin.",
        "",
        "Examples:",
        "   bysquare ./example.json",
        "",
        "   echo ",
        '       {',
        '           "IBAN": "SK9611000000002918599669"',
        '           "Amount": 100.0',
        '           "CurrencyCode": "EUR"',
        '           "VariableSymbol": "123"',
        '           "Payments": 1',
        '           "PaymentOptions": 1',
        '           "BankAccounts": 1',
        "       }'",
        "   | bysquare",
    ].join("\n");
}
