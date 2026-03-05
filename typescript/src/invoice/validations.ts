import validator from "validator";

import { ValidationError } from "../errors.js";
import type { DataModel } from "./types.js";

const ErrorMessages = {
	Required: "Field is required.",
	CurrencyCode: "Invalid currency code. Must be 3 uppercase letters (ISO 4217).",
	CountryCode: "Invalid country code. Must be 3 uppercase letters.",
	ForeignCurrencyGroup: "When any of foreignCurrencyCode, currRate, or referenceCurrRate is set, all three are required.",
	InvoiceLineChoice: "Exactly one of numberOfInvoiceLines or singleInvoiceLine must be set.",
	ItemChoice: "Exactly one of itemName or itemEanCode must be set.",
	TaxCategorySummariesEmpty: "At least one tax category summary is required.",
	ClassifiedTaxCategory: "classifiedTaxCategory must be a number in range [0, 1].",
	Date: "Invalid date. Make sure YYYYMMDD format is used.",
	PeriodDateConsistency: "Both periodFromDate and periodToDate must be set together, and periodFromDate must not be after periodToDate.",
	NumberOfInvoiceLinesPositive: "numberOfInvoiceLines must be a positive integer.",
} as const;

const CURRENCY_CODE_REGEX = /^[A-Z]{3}$/;

function isValidYyyymmdd(date: string): boolean {
	if (!/^\d{8}$/.test(date)) {
		return false;
	}

	const year = date.substring(0, 4);
	const month = date.substring(4, 6);
	const day = date.substring(6, 8);
	const isoFormat = `${year}-${month}-${day}`;

	return validator.isDate(isoFormat, {
		format: "YYYY-MM-DD",
		strictMode: true,
		delimiters: ["-"],
	});
}

function validateRequired(value: unknown, path: string): void {
	if (value === undefined || value === null || value === "") {
		throw new ValidationError(ErrorMessages.Required, path);
	}
}

function validateDate(value: string | undefined, path: string): void {
	if (value !== undefined && !isValidYyyymmdd(value)) {
		throw new ValidationError(ErrorMessages.Date, path);
	}
}

export function validateDataModel(model: DataModel): void {
	validateRequired(model.invoiceId, "invoiceId");
	validateRequired(model.issueDate, "issueDate");
	validateDate(model.issueDate, "issueDate");
	validateDate(model.taxPointDate, "taxPointDate");
	validateRequired(model.localCurrencyCode, "localCurrencyCode");

	if (!CURRENCY_CODE_REGEX.test(model.localCurrencyCode)) {
		throw new ValidationError(ErrorMessages.CurrencyCode, "localCurrencyCode");
	}

	const hasForeign = model.foreignCurrencyCode !== undefined;
	const hasCurrRate = model.currRate !== undefined;
	const hasRefRate = model.referenceCurrRate !== undefined;

	if (hasForeign !== hasCurrRate || hasForeign !== hasRefRate) {
		throw new ValidationError(ErrorMessages.ForeignCurrencyGroup, "foreignCurrencyCode");
	}

	if (hasForeign && !CURRENCY_CODE_REGEX.test(model.foreignCurrencyCode!)) {
		throw new ValidationError(ErrorMessages.CurrencyCode, "foreignCurrencyCode");
	}

	// Supplier party
	validateRequired(model.supplierParty.partyName, "supplierParty.partyName");

	validateRequired(
		model.supplierParty.postalAddress.streetName,
		"supplierParty.postalAddress.streetName",
	);

	validateRequired(
		model.supplierParty.postalAddress.cityName,
		"supplierParty.postalAddress.cityName",
	);

	validateRequired(
		model.supplierParty.postalAddress.postalZone,
		"supplierParty.postalAddress.postalZone",
	);

	validateRequired(
		model.supplierParty.postalAddress.country,
		"supplierParty.postalAddress.country",
	);

	if (
		model.supplierParty.postalAddress.country
		&& !CURRENCY_CODE_REGEX.test(model.supplierParty.postalAddress.country)
	) {
		throw new ValidationError(ErrorMessages.CountryCode, "supplierParty.postalAddress.country");
	}

	// Customer party
	validateRequired(model.customerParty.partyName, "customerParty.partyName");

	// Invoice line choice
	const hasLineCount = model.numberOfInvoiceLines !== undefined;
	const hasSingleLine = model.singleInvoiceLine !== undefined;
	if (hasLineCount === hasSingleLine) {
		throw new ValidationError(ErrorMessages.InvoiceLineChoice, "numberOfInvoiceLines");
	}

	if (hasLineCount && model.numberOfInvoiceLines! <= 0) {
		throw new ValidationError(
			ErrorMessages.NumberOfInvoiceLinesPositive,
			"numberOfInvoiceLines",
		);
	}

	// Single invoice line validation
	if (model.singleInvoiceLine) {
		const line = model.singleInvoiceLine;
		const hasName = line.itemName !== undefined;
		const hasEan = line.itemEanCode !== undefined;
		if (hasName === hasEan) {
			throw new ValidationError(ErrorMessages.ItemChoice, "singleInvoiceLine.itemName");
		}

		const hasFrom = line.periodFromDate !== undefined;
		const hasTo = line.periodToDate !== undefined;
		if (hasFrom !== hasTo) {
			throw new ValidationError(
				ErrorMessages.PeriodDateConsistency,
				"singleInvoiceLine.periodFromDate",
			);
		}
		if (hasFrom && hasTo) {
			validateDate(line.periodFromDate, "singleInvoiceLine.periodFromDate");
			validateDate(line.periodToDate, "singleInvoiceLine.periodToDate");
			if (line.periodFromDate! > line.periodToDate!) {
				throw new ValidationError(
					ErrorMessages.PeriodDateConsistency,
					"singleInvoiceLine.periodFromDate",
				);
			}
		}
	}

	// Tax category summaries
	if (!model.taxCategorySummaries || model.taxCategorySummaries.length === 0) {
		throw new ValidationError(
			ErrorMessages.TaxCategorySummariesEmpty,
			"taxCategorySummaries",
		);
	}

	for (const [index, summary] of model.taxCategorySummaries.entries()) {
		const path = `taxCategorySummaries[${index}]`;
		if (
			summary.classifiedTaxCategory === undefined
			|| summary.classifiedTaxCategory < 0
			|| summary.classifiedTaxCategory > 1
		) {
			throw new ValidationError(
				ErrorMessages.ClassifiedTaxCategory,
				`${path}.classifiedTaxCategory`,
			);
		}
	}
}
