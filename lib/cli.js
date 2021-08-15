#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const rl = __importStar(require("readline"));
const module_1 = require("./module");
async function handleInput(input) {
    if (!input || input === "-h" || input === "--help") {
        console.log(help());
        process.exit(0);
    }
    if (input === "-v" || input === "--version") {
        const v = await version();
        console.log(v);
        process.exit(0);
    }
    if (fs_1.existsSync(process.argv[2])) {
        const file = fs_1.readFileSync(process.argv[2], "utf8");
        const qrString = await jsonStringToQrString(file).catch((e) => {
            console.error(e);
            process.exit(1);
        });
        console.log(qrString);
    }
    else {
        console.error(`File ${process.argv[2]} doesn't exists`);
        process.exit(1);
    }
}
async function jsonStringToQrString(stdin) {
    return new Promise((resolve, reject) => {
        try {
            const data = JSON.parse(stdin);
            module_1.generate(data).then((qrString) => {
                resolve(qrString);
            });
        }
        catch (e) {
            reject(e);
        }
    });
}
async function handleStdin() {
    const readline = rl.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: false,
    });
    const lines = [];
    return new Promise((resolve, reject) => {
        readline.on("line", (line) => {
            lines.push(line);
        });
        readline.on("close", () => {
            resolve(lines.join(""));
        });
        readline.on("SIGINT" /* CTRL+C */, reject);
    });
}
async function version() {
    const data = await Promise.resolve().then(() => __importStar(require("./package.json")));
    return data.version;
}
function help() {
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
}
else {
    // echo "data" | bysquare
    (async () => {
        const stdin = await handleStdin();
        const qrString = await jsonStringToQrString(stdin).catch((e) => {
            console.error(e);
            process.exit(1);
        });
        console.log(qrString);
        process.exit(0);
    })();
}
//# sourceMappingURL=cli.js.map