<?php

// Config bitflags
const BYSQUARE_DEBURR = 0b00000001;    // Bit 0: Enable diacritics removal
const BYSQUARE_VALIDATE = 0b00000010;  // Bit 1: Enable input validation

// Version values (in high byte, bits 24-31)
const BYSQUARE_VERSION_110 = 1 << 24;  // v1.1.0 = 0b00000001_00000000_00000000_00000000

$libExt = match (PHP_OS_FAMILY) {
    'Darwin' => 'dylib',
    'Windows' => 'dll',
    default => 'so',
};

$ffi = FFI::cdef("
    char* bysquare_encode(char* jsonData, int config);
    char* bysquare_decode(char* qrString);
    void bysquare_free(char* ptr);
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

// Option 1: Use config=0 for automatic default (deburr + validate + v1.2.0)
$result = $ffi->bysquare_encode(json_encode($paymentData), 0);
$qrStringAuto = FFI::string($result);
$ffi->bysquare_free($result);

if (str_starts_with($qrStringAuto, 'ERROR:')) {
    $errorMsg = substr($qrStringAuto, 6); // Strip "ERROR:" prefix
    die("Encoding error: {$errorMsg}\n");
}

echo "Encoded (config=0, auto-default): " . $qrStringAuto . "\n";

// Option 2: Custom config - version 1.1.0, no validation
$customConfig = BYSQUARE_DEBURR | BYSQUARE_VERSION_110;
$result = $ffi->bysquare_encode(json_encode($paymentData), $customConfig);
$qrStringCustom = FFI::string($result);
$ffi->bysquare_free($result);

if (str_starts_with($qrStringCustom, 'ERROR:')) {
    $errorMsg = substr($qrStringCustom, 6);
    die("Encoding error: {$errorMsg}\n");
}

echo "Encoded (v1.1.0, no validation): " . $qrStringCustom . "\n";

// Decode
$result = $ffi->bysquare_decode($qrStringAuto);
$decodedJson = FFI::string($result);
$ffi->bysquare_free($result);

if (str_starts_with($decodedJson, 'ERROR:')) {
    $errorMsg = substr($decodedJson, 6);
    die("Decoding error: {$errorMsg}\n");
}

echo "Decoded: " . $decodedJson . "\n";

