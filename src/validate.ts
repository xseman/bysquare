import { z } from "zod";
import { CurrencyCode } from "./types.js";

const CurrencyCodeSchema = z.nativeEnum(CurrencyCode);

export function validateCurrencyCode(currencyCode: unknown) {
	return CurrencyCodeSchema.parse(currencyCode);
}
