<?php
$libExt = match (PHP_OS_FAMILY) {
    'Darwin' => 'dylib',
    'Windows' => 'dll',
    default => 'so',
};

$ffi = FFI::cdef("
    uintptr_t bysquare_create_config();
    void bysquare_config_set_deburr(uintptr_t handle, int enabled);
    void bysquare_config_set_validate(uintptr_t handle, int enabled);
    void bysquare_config_set_version(uintptr_t handle, int version);
    void bysquare_free_config(uintptr_t handle);
    char* bysquare_encode(char* jsonData, uintptr_t configHandle);
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

// Create config and set options
$config = $ffi->bysquare_create_config();
$ffi->bysquare_config_set_deburr($config, 1);      // enable deburr
$ffi->bysquare_config_set_validate($config, 1);    // enable validation

// Encode
$result = $ffi->bysquare_encode(json_encode($paymentData), $config);
$qrString = FFI::string($result);
$ffi->bysquare_free($result);
echo "Encoded: " . $qrString . "\n";

// Decode
$result = $ffi->bysquare_decode($qrString);
$decodedJson = FFI::string($result);
$ffi->bysquare_free($result);
echo "Decoded: " . $decodedJson . "\n";

// Cleanup
$ffi->bysquare_free_config($config);
