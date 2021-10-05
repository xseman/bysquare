import { strict as assert } from 'assert';

import { createBysquareHeader, createChecksumString, generate, Model } from './main';

// const lzma = require("lzma-native");

export function createBysquareHeader_empty(): void {
    const created = createBysquareHeader();
    const expected = Buffer.from([0x0, 0x0, 0x0, 0x0]);

    assert.deepEqual(created, expected);
}

export function createBysquareHeader_arg(): void {
    const created = createBysquareHeader([0x1, 0x2, 0x3, 0x4]);
    const expected = Buffer.from([0x1, 0x2, 0x3, 0x4]);

    assert.deepEqual(created, expected);
}

export function createChecksum_test(): void {
    const tabbedString = [
        '\t', '1',
        '\t', '1',
        '\t', '1', '0', '0',
        '\t', 'E', 'U', 'R',
        '\t',
        '\t', '1', '2', '3',
        '\t', '\t', '\t', '\t',
        '\t', '1',
        '\t', 'S', 'K', '9', '6', '1', '1', '0', '0', '0', '0', '0', '0', '0', '0', '2', '9', '1', '8', '5', '9', '9', '6', '6', '9',
        '\t', '\t', '\t', '\t', '\t', '\t', '\t', '\t', '\t', '\t', '\t', '\t', '\t', '\t', '\t', '\t', '\t', '\t', '\t', '\t'
    ].join('');
    const expected = "34bfe057";
    const created = createChecksumString(tabbedString);

    assert.equal(created, expected);
}

export function generate_cb(): void {
    const expected = '0004G0005ES17OQ09C98Q7ME34TCR3V71LVKD2AE6EGHKR82DKS5NBJ3331VUFQIV0JGMR743UJCKSAKEM9QGVVVOIVH000';
    const model: Model = {
        IBAN: "SK9611000000002918599669",
        Amount: 100.0,
        CurrencyCode: "EUR",
        VariableSymbol: "123",
        Payments: 1,
        PaymentOptions: 1,
        BankAccounts: 1
    };

    generate(model).then(qrString => {
        assert(qrString, expected);
    });
}

export function generate_promise(): void {
    const expected = '0004G0005ES17OQ09C98Q7ME34TCR3V71LVKD2AE6EGHKR82DKS5NBJ3331VUFQIV0JGMR743UJCKSAKEM9QGVVVOIVH000';
    const model: Model = {
        IBAN: "SK9611000000002918599669",
        Amount: 100.0,
        CurrencyCode: "EUR",
        VariableSymbol: "123",
        Payments: 1,
        PaymentOptions: 1,
        BankAccounts: 1
    };

    (async () => {
        const qrString = await generate(model);
        assert(qrString, expected);
    })();
}

// export function compress(): void {
//     const stream = lzma.createStream("rawEncoder", {
//         synchronous: true,
//         filters: [{ id: lzma.FILTER_LZMA1 }],
//     });

//     const compressed: Buffer[] = [];
//     stream.on("data", (data: Buffer): void => {
//         compressed.push(data);
//     });

//     stream.on("end", (): void => {
//         console.log("compressed\t", ...compressed);
//     });

//     stream.write(Buffer.from("hello", "utf-8"), null, (): void => {
//         stream.end();
//     });
// }
