<?php
/**
 * PHP example for using the bysquare C FFI library.
 * 
 * Requirements:
 *     - PHP 7.4+ with FFI extension enabled
 *     - libbysquare.so (or .dylib on macOS, .dll on Windows)
 * 
 * Usage:
 *     php example.php
 */

// Determine library extension based on platform
$libExt = match (PHP_OS_FAMILY) {
    'Darwin' => 'dylib',
    'Windows' => 'dll',
    default => 'so',
};

$libPath = __DIR__ . "/../../../go/bin/libbysquare.{$libExt}";

if (!file_exists($libPath)) {
    die("Error: Library not found at {$libPath}\n");
}

// Create FFI instance
$ffi = FFI::cdef("
    char* bysquare_encode(char* jsonData);
    char* bysquare_decode(char* qrString);
    void bysquare_free(char* ptr);
    char* bysquare_version();
", $libPath);

/**
 * Encode payment data to BySquare QR string.
 */
function encodePayment(FFI $ffi, array $paymentData): string {
    $json = json_encode($paymentData);
    $result = $ffi->bysquare_encode($json);
    $qrString = FFI::string($result);
    $ffi->bysquare_free($result);
    return $qrString;
}

/**
 * Decode BySquare QR string to payment data.
 */
function decodeQR(FFI $ffi, string $qrString): array {
    $result = $ffi->bysquare_decode($qrString);
    $json = FFI::string($result);
    $ffi->bysquare_free($result);
    return json_decode($json, true);
}

/**
 * Get library version.
 */
function getVersion(FFI $ffi): string {
    $result = $ffi->bysquare_version();
    $version = FFI::string($result);
    $ffi->bysquare_free($result);
    return $version;
}

// Main execution
echo "BySquare FFI Library Version: " . getVersion($ffi) . "\n\n";

// Example payment data
$paymentData = [
    'payments' => [
        [
            'type' => 1,
            'amount' => 123.45,
            'currencyCode' => 'EUR',
            'variableSymbol' => '987654',
            'bankAccounts' => [
                ['iban' => 'SK9611000000002918599669']
            ]
        ]
    ]
];

echo "Payment Data:\n";
echo json_encode($paymentData, JSON_PRETTY_PRINT) . "\n\n";

// Encode
$qrString = encodePayment($ffi, $paymentData);
echo "Encoded QR String: {$qrString}\n\n";

// Decode
$decodedData = decodeQR($ffi, $qrString);
echo "Decoded Payment Data:\n";
echo json_encode($decodedData, JSON_PRETTY_PRINT) . "\n";
