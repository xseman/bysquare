<?php
$libExt = match (PHP_OS_FAMILY) {
    'Darwin' => 'dylib',
    'Windows' => 'dll',
    default => 'so',
};

$ffi = FFI::cdef("
    char* bysquare_encode(char* jsonData);
    char* bysquare_decode(char* qrString);
    void bysquare_free(char* ptr);
", __DIR__ . "/../../../go/bin/libbysquare.{$libExt}");

$data = [
    'payments' => [[
        'type' => 1,
        'amount' => 123.45,
        'currencyCode' => 'EUR',
        'variableSymbol' => '987654',
        'beneficiary' => ['name' => 'John Doe'],
        'bankAccounts' => [['iban' => 'SK9611000000002918599669']]
    ]]
];

$result = $ffi->bysquare_encode(json_encode($data));
$qr = FFI::string($result);
$ffi->bysquare_free($result);

echo "Encoded: {$qr}\n";

$result = $ffi->bysquare_decode($qr);
$decoded = FFI::string($result);
$ffi->bysquare_free($result);

echo "Decoded: {$decoded}\n";
