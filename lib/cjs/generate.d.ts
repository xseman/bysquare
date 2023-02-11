/// <reference types="node" />
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
 * @see 3.5. by square header
 */
export declare function bysquareHeader(header?: [
    bySquareType: number,
    version: number,
    documentType: number,
    reserved: number
]): Uint8Array;
/**
 * @see 3.10 Appending CRC32 checksum
 */
export declare function checksum(intermediate: string): Buffer;
/**
 * Transfer object to a tabbed string and append a CRC32 checksum
 *
 * @see 3.10. Appending CRC32 checksum
 */
export declare function addChecksum(model: DataModel): Uint8Array;
/**
 * Transform data to ordered tab-separated intermediate representation ready for
 * encoding
 *
 * @see Table 15 PAY by square sequence data model
 */
export declare function deserialize(data: DataModel): string;
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
