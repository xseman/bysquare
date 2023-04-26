import { DataModel } from "./index.js";
/**
 * Generating by square Code
 *
 * @see 3.14.
 */
export declare function deserialize(qr: string): DataModel;
export declare class DecodeError extends Error {
    cause: Error;
    name: string;
    constructor(cause: Error, msg?: string);
}
/**
 * Decoding client data from QR Code 2005 symbol
 *
 * @see 3.16.
 */
export declare function parse(qr: string): DataModel;
/**
 * Detect if qr string contains bysquare header.
 *
 * Bysquare header does not have too much information, therefore it is
 * not very reliable, there is room for improvement for the future.
 */
export declare function detect(qr: string): boolean;
