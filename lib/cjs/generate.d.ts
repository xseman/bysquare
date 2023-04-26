import { DataModel } from "./types.js";
/**
 * Returns a 2 byte buffer that represents the header of the bysquare
 * specification
 *
 * ```
 * | Attribute    | Number of bits | Possible values | Note
 * --------------------------------------------------------------------------------------------
 * | BySquareType | 4              | 0-15            | by square type
 * | Version      | 4              | 0-15            | version of the by square type
 * | DocumentType | 4              | 0-15            | document type within given by square type
 * | Reserved     | 4              | 0-15            | bits reserved for future needs
 * ```
 *
 * @see 3.5.
 */
export declare function headerBysquare(
/** dprint-ignore */
header?: [
    bySquareType: number,
    version: number,
    documentType: number,
    reserved: number
]): Uint8Array;
/**
 * Creates a one-byte array that represents the length of compressed data in
 * combination with CRC32 in bytes.
 */
export declare function headerDataLength(length: number): Uint8Array;
/**
 * Transfer object to a tabbed string and append a CRC32 checksum
 *
 * @see 3.10.
 */
export declare function addChecksum(serialized: string): Uint8Array;
/**
 * Transform data to ordered tab-separated intermediate representation ready for
 * encoding
 *
 * @see Table 15.
 */
export declare function serialize(data: DataModel): string;
type Options = {
    /**
     * Many banking apps do not support diacritics, which results in errors when
     * serializing data from QR codes.
     *
     * @default true
     */
    deburr: boolean;
};
/**
 * Generate QR string ready for encoding into text QR code
 */
export declare function generate(model: DataModel, options?: Options): string;
export {};
