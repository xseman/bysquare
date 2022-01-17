import { strict as assert } from 'assert';

import {
    createHeader,
    checksumFromTabbedString,
    createModelFromTabbedString,
    createTabbedString,
    generate,
    parse,
} from './main';
import { Model } from './model';

const model: Model = {
    IBAN: 'SK9611000000002918599669',
    Amount: 100.0,
    CurrencyCode: 'EUR',
    VariableSymbol: '123',
    Payments: 1,
    PaymentOptions: 1,
    BankAccounts: 1,
};

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

const expectedQrString = '0004G0005ES17OQ09C98Q7ME34TCR3V71LVKD2AE6EGHKR82DKS5NBJ3331VUFQIV0JGMR743UJCKSAKEM9QGVVVOIVH000';

export function createTabbedString_basic(): void {
    const expected: string = createTabbedString(model);
    assert.equal(tabbedString, expected);
}

export function createModelFromTabbedString_basic(): void {
    const expected = createModelFromTabbedString(tabbedString);
    assert.deepStrictEqual(model, expected);
}

export function createHeader_empty(): void {
    const created = createHeader();
    const expected = Buffer.from([0x0, 0x0]);
    assert.deepEqual(created, expected);
}

export function createHeader_arg(): void {
    const created: Buffer = createHeader([
        0b0000_0001, 0b0000_0010,
        0b0000_0011, 0b0000_0100,
    ]);
    const expected: Buffer = Buffer.from([
        0b0001_0010,
        0b0011_0100
    ]);

    assert.deepEqual(created, expected);
}

export function checksumFromTabbedString_basic(): void {
    const expected: Buffer = Buffer.from([0x57, 0xe0, 0xbf, 0x34]);
    const created: Buffer = checksumFromTabbedString(tabbedString);

    assert.deepEqual(created, expected);
}

export async function generate_basic(): Promise<void> {
    const qrString = await generate(model);

    assert.equal(qrString, expectedQrString);
}

export async function generate_parse(): Promise<void> {
    const qrString = await generate(model);
    const parsed = await parse(qrString);

    assert.deepEqual(parsed, model);
}

export function lzma_compress_decompress(): void {
    const lzma = require('lzma-native');

    const encoder = lzma.createStream('rawEncoder', {
        synchronous: true,
        filters: [{ id: lzma.FILTER_LZMA1 }],
    });

    const decoder = lzma.createStream('rawDecoder', {
        synchronous: true,
        filters: [{ id: lzma.FILTER_LZMA1 }],
    });

    const compressed: Buffer[] = [];
    encoder.on('data', (data: Buffer): void => {
        compressed.push(data);
    });

    const message = 'Hello';
    const compress = Buffer.from(message, 'utf-8');
    encoder.write(compress, null, (): void => {
        encoder.end();
    });

    encoder.on('end', (): void => {
        decoder.write(...compressed, undefined, (): void => {
            decoder.end();
        });

        decoder.on('data', (res: Buffer): void => {
            const decoded = res.toString('utf-8');
            assert.equal(decoded, message);
        });
    });
}
