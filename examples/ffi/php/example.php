<?php

// Config bitflags
const BYSQUARE_DEBURR = 0b00000001;  // Bit 0: Enable diacritics removal

// Version values (in high byte, bits 24-31)
const BYSQUARE_VERSION_110 = 1 << 24;  // v1.1.0

// Special config value for default (v1.2.0 + deburr + validate)
const BYSQUARE_CONFIG_DEFAULT = -1;

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

$json = json_encode($paymentData);

// Helper function for encode + error handling
$encode = function($config) use ($ffi, $json) {
    $result = $ffi->bysquare_encode($json, $config);
    $qr = FFI::string($result);
    $ffi->bysquare_free($result);
    if (str_starts_with($qr, 'ERROR:')) {
        die("Encoding error: " . substr($qr, 6) . "\n");
    }
    return $qr;
};

// Default config (v1.2.0 + deburr + validate)
$qrDefault = $encode(BYSQUARE_CONFIG_DEFAULT);
echo "Default config: {$qrDefault}\n";

// Custom config - version 1.1.0 with deburr only
$qrCustom = $encode(BYSQUARE_DEBURR | BYSQUARE_VERSION_110);
echo "Custom config:  {$qrCustom}\n";

// Decode
$result = $ffi->bysquare_decode($qrDefault);
$decodedJson = FFI::string($result);
$ffi->bysquare_free($result);

if (str_starts_with($decodedJson, 'ERROR:')) {
    die("Decoding error: " . substr($decodedJson, 6) . "\n");
}

echo "Decoded: {$decodedJson}\n";

