import { DataModel } from "./index.js";
/**
 * @see 3.14. Generating by square Code
 */
export declare function serialize(qr: string): DataModel;
/**
 * @see 3.16. Decoding client data from QR Code 2005 symbol
 */
export declare function parse(qr: string): DataModel;
/**
 * Detect if qr string contains bysquare header.
 *
 * Bysquare header does not have too much information, therefore it is
 * not very reliable, there is room for improvement for the future.
 */
export declare function detect(qr: string): boolean;
