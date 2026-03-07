<?php

// Config bitflags
const BYSQUARE_DEBURR = 0b00000001;  // Bit 0: Enable diacritics removal

// Version values (in high byte, bits 24-31)
const BYSQUARE_VERSION_110 = 1 << 24;  // v1.1.0

// Special config value for default
// PAY defaults:     v1.2.0 + deburr + validate
// Invoice defaults: v1.0.0 + validate (no deburr)
const BYSQUARE_CONFIG_DEFAULT = -1;

$libExt = match (PHP_OS_FAMILY) {
    'Darwin' => 'dylib',
    'Windows' => 'dll',
    default => 'so',
};

$ffi = FFI::cdef("
    char* bysquare_pay_encode(char* jsonData, int config);
    char* bysquare_pay_decode(char* qrString);
    char* bysquare_invoice_encode(char* jsonData, int config);
    char* bysquare_invoice_decode(char* qrString);
    int   bysquare_detect_type(char* qrString);
    void  bysquare_free(char* ptr);
", __DIR__ . "/../../../go/bin/libbysquare.{$libExt}");

$paymentData = [
    'payments' => [[
        'type' => 1,
        'amount' => 123.45,
        'currencyCode' => 'EUR',
        'variableSymbol' => '987654',
        'beneficiary' => ['name' => 'John Doe'],
        'bankAccounts' => [['iban' => 'SK9611000000002918599669']]
    ]]
];

$invoiceData = [
    'documentType' => 0,
    'invoiceId' => 'FV2024001',
    'issueDate' => '20240115',
    'localCurrencyCode' => 'EUR',
    'supplierParty' => [
        'partyName' => 'Supplier s.r.o.',
        'postalAddress' => [
            'streetName' => 'Hlavna 1',
            'cityName' => 'Bratislava',
            'postalZone' => '81101',
            'country' => 'SVK'
        ]
    ],
    'customerParty' => [
        'partyName' => 'Customer a.s.'
    ],
    'numberOfInvoiceLines' => 1,
    'taxCategorySummaries' => [[
        'classifiedTaxCategory' => 0.2,
        'taxExclusiveAmount' => 100,
        'taxAmount' => 20
    ]],
    'monetarySummary' => [
        'taxExclusiveAmount' => 100,
        'taxInclusiveAmount' => 120
    ]
];

$payJson = json_encode($paymentData);
$invoiceJson = json_encode($invoiceData);

// Helper function for PAY encode + error handling
$encodePay = function($config) use ($ffi, $payJson) {
    $result = $ffi->bysquare_pay_encode($payJson, $config);
    $qr = FFI::string($result);
    $ffi->bysquare_free($result);
    if (str_starts_with($qr, 'ERROR:')) {
        die("PAY encoding error: " . substr($qr, 6) . "\n");
    }
    return $qr;
};

// Helper function for invoice encode + error handling
$encodeInvoice = function($config) use ($ffi, $invoiceJson) {
    $result = $ffi->bysquare_invoice_encode($invoiceJson, $config);
    $qr = FFI::string($result);
    $ffi->bysquare_free($result);
    if (str_starts_with($qr, 'ERROR:')) {
        die("Invoice encoding error: " . substr($qr, 6) . "\n");
    }
    return $qr;
};

// PAY: Default config (v1.2.0 + deburr + validate)
$qrDefault = $encodePay(BYSQUARE_CONFIG_DEFAULT);
echo "PAY default config: {$qrDefault}\n";

// PAY: Custom config - version 1.1.0 with deburr only
$qrCustom = $encodePay(BYSQUARE_DEBURR | BYSQUARE_VERSION_110);
echo "PAY custom config:  {$qrCustom}\n";

// PAY: Decode
$result = $ffi->bysquare_pay_decode($qrDefault);
$decodedJson = FFI::string($result);
$ffi->bysquare_free($result);

if (str_starts_with($decodedJson, 'ERROR:')) {
    die("PAY decoding error: " . substr($decodedJson, 6) . "\n");
}

echo "PAY decoded: {$decodedJson}\n";

// Invoice: Encode with defaults (v1.0.0 + validate)
$qrInvoice = $encodeInvoice(BYSQUARE_CONFIG_DEFAULT);
echo "Invoice: {$qrInvoice}\n";

// Invoice: Decode
$result = $ffi->bysquare_invoice_decode($qrInvoice);
$decodedInvoice = FFI::string($result);
$ffi->bysquare_free($result);

if (str_starts_with($decodedInvoice, 'ERROR:')) {
    die("Invoice decoding error: " . substr($decodedInvoice, 6) . "\n");
}

echo "Invoice decoded: {$decodedInvoice}\n";

// Detect type (0=PAY, 1=Invoice, -1=error)
$payType = $ffi->bysquare_detect_type($qrDefault);
$invoiceType = $ffi->bysquare_detect_type($qrInvoice);
echo "QR type (PAY): {$payType}\n";
echo "QR type (Invoice): {$invoiceType}\n";

