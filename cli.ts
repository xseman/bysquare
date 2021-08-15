#!/usr/bin/env node

import { existsSync, readFileSync } from 'fs';
import * as rl from 'readline';

import { generate, Model } from './module';

async function handleInput(input: string): Promise<void> {
    if (!input || input === "-h" || input === "--help") {
        console.log(help());
        process.exit(0);
    }

    if (input === "-v" || input === "--version") {
        const v = await version();
        console.log(v);
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
    const readline = rl.createInterface({
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

async function version(): Promise<string> {
    const data = await import("./package.json");
    return data.version;
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
    ].join("\n");
}

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
