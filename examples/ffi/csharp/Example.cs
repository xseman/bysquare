using System;
using System.Runtime.InteropServices;
using System.Text;

class Example
{
    // Determine library name based on platform
    private const string LibName = "bysquare";

    [DllImport(LibName, CallingConvention = CallingConvention.Cdecl)]
    private static extern IntPtr bysquare_create_config();

    [DllImport(LibName, CallingConvention = CallingConvention.Cdecl)]
    private static extern void bysquare_free_config(IntPtr ptr);

    [DllImport(LibName, CallingConvention = CallingConvention.Cdecl)]
    private static extern void bysquare_config_set_deburr(IntPtr ptr, int enabled);

    [DllImport(LibName, CallingConvention = CallingConvention.Cdecl)]
    private static extern void bysquare_config_set_validate(IntPtr ptr, int enabled);

    [DllImport(LibName, CallingConvention = CallingConvention.Cdecl)]
    private static extern void bysquare_config_set_version(IntPtr ptr, int version);

    [DllImport(LibName, CallingConvention = CallingConvention.Cdecl, CharSet = CharSet.Ansi)]
    private static extern IntPtr bysquare_encode(string jsonData, IntPtr ptr);

    [DllImport(LibName, CallingConvention = CallingConvention.Cdecl, CharSet = CharSet.Ansi)]
    private static extern IntPtr bysquare_decode(string qrString);

    [DllImport(LibName, CallingConvention = CallingConvention.Cdecl)]
    private static extern void bysquare_free(IntPtr ptr);

    [DllImport(LibName, CallingConvention = CallingConvention.Cdecl)]
    private static extern IntPtr bysquare_version();

    static void Main(string[] args)
    {
        string json = @"{
  ""payments"": [{
    ""type"": 1,
    ""amount"": 123.45,
    ""currencyCode"": ""EUR"",
    ""variableSymbol"": ""987654"",
    ""beneficiary"": {""name"": ""John Doe""},
    ""bankAccounts"": [{""iban"": ""SK9611000000002918599669""}]
  }]
}";

        // Option 1: Use defaults (pass IntPtr.Zero for config)
        // IntPtr resultPtr = bysquare_encode(json, IntPtr.Zero);

        // Option 2: Create config with default options (deburr=1, validate=1, version=2)
        IntPtr config = bysquare_create_config();

        // Encode with default options
        IntPtr resultPtr = bysquare_encode(json, config);
        string? qr = Marshal.PtrToStringAnsi(resultPtr);
        bysquare_free(resultPtr);

        Console.WriteLine($"Encoded (default options): {qr}");

        // Configure options for version 1
        bysquare_config_set_version(config, 1);
        bysquare_config_set_deburr(config, 1);
        bysquare_config_set_validate(config, 1);

        // Encode with custom options
        IntPtr resultWithOptsPtr = bysquare_encode(json, config);
        string? qrWithOpts = Marshal.PtrToStringAnsi(resultWithOptsPtr);
        bysquare_free(resultWithOptsPtr);

        Console.WriteLine($"Encoded (version 1): {qrWithOpts}");

        // Decode
        IntPtr decodedPtr = bysquare_decode(qr!);
        string? decoded = Marshal.PtrToStringAnsi(decodedPtr);
        bysquare_free(decodedPtr);

        Console.WriteLine($"Decoded: {decoded}");

        // Get library version
        IntPtr versionPtr = bysquare_version();
        string? version = Marshal.PtrToStringAnsi(versionPtr);
        bysquare_free(versionPtr);

        Console.WriteLine($"Library version: {version}");

        // Cleanup config
        bysquare_free_config(config);
    }
}
