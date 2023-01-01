/// <reference types="node" resolution-mode="require"/>
import { Model } from "./types.js";
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
export declare function makeHeaderBysquare(header?: [
    bySquareType: number,
    version: number,
    documentType: number,
    reserved: number
]): Buffer;
/**
 * @see 3.10 Appending CRC32 checksum
 */
export declare function makeChecksum(tabbedInput: string): Buffer;
/**
 * Transfer object to a tabbed string and append a CRC32 checksum
 *
 * @see 3.10. Appending CRC32 checksum
 */
export declare function prepareForCompression(model: Model): Buffer;
/**
 * Convert object to tab-separated fields according to the sequence specification
 *
 * @see Table 15 PAY by square sequence data model
 */
export declare function makeTabbed(model: Model): string;
/**
 * Generate QR string ready for encoding into basic QR code
 */
export declare function generate(model: Model): Promise<string>;
