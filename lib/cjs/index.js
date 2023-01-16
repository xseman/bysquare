"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parse = exports.detect = exports.generate = void 0;
var generate_js_1 = require("./generate.js");
Object.defineProperty(exports, "generate", { enumerable: true, get: function () { return generate_js_1.generate; } });
var parse_js_1 = require("./parse.js");
Object.defineProperty(exports, "detect", { enumerable: true, get: function () { return parse_js_1.detect; } });
Object.defineProperty(exports, "parse", { enumerable: true, get: function () { return parse_js_1.parse; } });
__exportStar(require("./types.js"), exports);
