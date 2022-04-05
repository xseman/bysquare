import { Model, ModelOrdered } from './types';

const lzma = require('lzma-native');

export function generate(model: Model): Promise<string> {
    const dataBufferWithChecksum = tabbedStringWithChecksumBuffer(model);
    const encoder = lzma.createStream('rawEncoder', {
        synchronous: true,
        filters: [{ id: lzma.FILTER_LZMA1 }],
    });

    const data: Buffer[] = [];
    encoder.on('data', (chunk: Buffer): void => {
        data.push(chunk);
    });

    const compressPromise = new Promise<string>((resolve, reject): void => {
        encoder.write(dataBufferWithChecksum, (): void => {
            encoder.end();
        });
        encoder.on('error', reject);
        encoder.on('end', (): void => {
            /** (spec 3.5) */
            const bySquareHeader = createHeader();

            /**
             * The header of compressed data is 2 bytes long and contains only
             * one 16­bit unsigned integer (word, little­endian), which is the
             * size of the decompressed data (spec 3.11)
             */
            const decompressedSize = Buffer.alloc(2);
            decompressedSize.writeInt16LE(dataBufferWithChecksum.byteLength, 0);

            /**
             * Merged binary data (spec 3.15.)
             */
            const merged = Buffer.concat([
                bySquareHeader,
                decompressedSize,
                Buffer.concat(data),
            ]);

            let paddedBinString = merged.reduce<string>(
                (acc, byte) => (acc += byte.toString(2).padStart(8, '0')),
                ''
            );

            let paddedBinLength = paddedBinString.length;
            const remainder = paddedBinLength % 5;
            if (remainder) {
                paddedBinString += Array(5 - remainder)
                    .fill('0')
                    .join('');
                paddedBinLength += 5 - remainder;
            }

            /**
             * Map a binary number of 5 bits to a string representation 2^5
             * '0123456789ABCDEFGHIJKLMNOPQRSTUV'[0...32] represents char
             */
            const subst = '0123456789ABCDEFGHIJKLMNOPQRSTUV';
            let output = '';
            for (let i = 0; i < paddedBinLength / 5; i++) {
                const binStart = 5 * i;
                const binEnd = 5 * i + 5;
                const slice = paddedBinString.slice(binStart, binEnd);
                const key = parseInt(slice, 2);
                output += subst[key];
            }

            resolve(output);
        });
    });

    return compressPromise;
}

/**
 * ```
 * | Attribute    | Number of bits | Possible values | Note
 * --------------------------------------------------------------------------------------------
 * | BySquareType | 4              | 0-15            | by square type
 * | Version      | 4              | 0-15            | version 4 0­15 version of the by sq
 * | DocumentType | 4              | 0-15            | document type within given by square type
 * | Reserved     | 4              | 0-15            | bits reserved for future needs
 * ```
 */
export function createHeader(
    header: [
        BySquareType: number, Version: number,
        DocumentType: number, Reserved: number
    ] = [
            0b0000_0000, 0b0000_0000,
            0b0000_0000, 0b0000_0000
        ]
): Buffer {
    const isValid = header.every((nibble) => 0 <= nibble && nibble <= 15);
    if (!isValid) throw new Error();

    const [BySquareType, Version, DocumentType, Reserved] = header;
    /** Combine 4-nibbles to 2-bytes */
    const headerBuffer = Buffer.from([
        (BySquareType << 4) | (Version << 0),
        (DocumentType << 4) | (Reserved << 0),
    ]);

    return headerBuffer;
}

export function tabbedStringWithChecksumBuffer(model: Model): Buffer {
    const tabbedString = createTabbedString(model);
    const checksum = checksumFromTabbedString(tabbedString);
    const data = Buffer.concat([
        checksum,
        Buffer.from(tabbedString, 'utf-8'),
    ]);

    return data;
}

export function checksumFromTabbedString(tabbedString: string): Buffer {
    const crc32 = Buffer.alloc(4);
    crc32.writeInt32LE(lzma.crc32(tabbedString), 0);

    return crc32;
}

export function createTabbedString(model: Model): string {
    /**
     * Order keys by specification
     * Fill empty values
     * Transform to tabbed string
     */
    const tabbedModel: string = (Object.keys(model) as (keyof Model)[])
        .reduce<string[]>((acc, key) => {
            acc[ModelOrdered[key]] = String(model[key] ?? '');
            return acc;
        }, Array<string>(33).fill(''))
        .join('\t');

    return tabbedModel;
}

export function createModelFromTabbedString(tabbedModel: string): Model {
    const model: Model = tabbedModel
        .split('\t')
        .reduce((acc, value, i) => {
            const key = ModelOrdered[i] as keyof Model;

            if (value === '') {
                return acc;
            }

            const numberKeys: (keyof Model)[] = [
                'Payments',
                'PaymentOptions',
                'Amount',
                'BankAccounts',
                'StandingOrderExt',
                'Day',
                'Month',
                'DirectDebitExt',
                'DirectDebitScheme',
                'DirectDebitType',
                'MaxAmount',
            ];

            if (!!Number(value) && numberKeys.includes(key)) {
                acc[key] = Number(value);
                return acc;
            }

            acc[key] = value;
            return acc;
        }, {} as any);

    return model;
}

export function parse(qrString: string): Promise<Model> {
    const subst = '0123456789ABCDEFGHIJKLMNOPQRSTUV';
    const paddedBinString = [...qrString].reduce((acc, char) => {
        acc += subst.indexOf(char).toString(2).padStart(5, '0');
        return acc;
    }, '');

    let bytes: string[] = [];
    for (
        let count = 0, leftCount = 0;
        paddedBinString.length > leftCount;
        count++
    ) {
        const byte = parseInt(
            paddedBinString.slice(leftCount, (leftCount += 8)),
            2
        )
            .toString(16)
            .padStart(2, '0');

        bytes[count] = byte;
    }
    const binaryData = Buffer.from(bytes.join(''), 'hex');

    const _header = binaryData.slice(0, 2);
    const _decompressSize = binaryData.slice(2, 4);
    const data = binaryData.slice(4, binaryData.length);

    const decoder = lzma.createStream('rawDecoder', {
        synchronous: true,
        filters: [{ id: lzma.FILTER_LZMA1 }],
    });

    decoder.write(data, undefined, (): void => {
        decoder.end();
    });

    const paymentPromise = new Promise<Model>((resolve, reject) => {
        decoder.on('error', reject);
        decoder.on('data', (decompressed: Buffer): void => {
            const checksum = decompressed.slice(0, 4);
            const data = decompressed.slice(4, decompressed.length);

            const crc32 = Buffer.alloc(4);
            crc32.writeInt32LE(lzma.crc32(data), 0);
            if (!crc32.equals(checksum)) {
                reject('Checksum conflict');
            }

            const decoded = data.toString();
            const model = createModelFromTabbedString(decoded);
            resolve(model);
        });
    });

    return paymentPromise;
}

}
