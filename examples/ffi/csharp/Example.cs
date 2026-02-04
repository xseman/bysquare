using System;
using System.Runtime.InteropServices;
using System.Text;

class Example
{
    // Determine library name based on platform
    private const string LibName = "bysquare";

    // Config bitflags
    private const int BYSQUARE_DEBURR = 0b00000001;    // Bit 0: Enable diacritics removal
    private const int BYSQUARE_VALIDATE = 0b00000010;  // Bit 1: Enable input validation

    // Version values (in high byte, bits 24-31)
    private const int BYSQUARE_VERSION_110 = 1 << 24;  // v1.1.0 = 0b00000001_00000000_00000000_00000000

    [DllImport(LibName, EntryPoint = "bysquare_encode", CallingConvention = CallingConvention.Cdecl, CharSet = CharSet.Ansi)]
    private static extern IntPtr bysquare_encode_raw(string jsonData, int config);

    [DllImport(LibName, EntryPoint = "bysquare_decode", CallingConvention = CallingConvention.Cdecl, CharSet = CharSet.Ansi)]
    private static extern IntPtr bysquare_decode_raw(string qrString);

    [DllImport(LibName, CallingConvention = CallingConvention.Cdecl)]
    private static extern void bysquare_free(IntPtr ptr);

    [DllImport(LibName, CallingConvention = CallingConvention.Cdecl, CharSet = CharSet.Ansi)]
    [return: MarshalAs(UnmanagedType.LPStr)]
    private static extern string bysquare_version();

    // Managed wrapper methods that handle marshaling automatically
    private static string bysquare_encode(string jsonData, int config)
    {
        IntPtr ptr = bysquare_encode_raw(jsonData, config);
        string result = Marshal.PtrToStringAnsi(ptr) ?? string.Empty;
        bysquare_free(ptr);

        if (result.StartsWith("ERROR:"))
        {
            string errorMsg = result.Substring(6); // Strip "ERROR:" prefix
            throw new Exception($"Encoding error: {errorMsg}");
        }

        return result;
    }

    private static string bysquare_decode(string qrString)
    {
        IntPtr ptr = bysquare_decode_raw(qrString);
        string result = Marshal.PtrToStringAnsi(ptr) ?? string.Empty;
        bysquare_free(ptr);

        if (result.StartsWith("ERROR:"))
        {
            string errorMsg = result.Substring(6); // Strip "ERROR:" prefix
            throw new Exception($"Decoding error: {errorMsg}");
        }

        return result;
    }

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

        // Option 1: Use config=0 for automatic default (deburr + validate + v1.2.0)
        string qrAuto = bysquare_encode(json, 0);
        Console.WriteLine($"Encoded (config=0, auto-default): {qrAuto}");

        // Option 2: Custom config - version 1.1.0, no validation
        int customConfig = BYSQUARE_DEBURR | BYSQUARE_VERSION_110;
        string qrCustom = bysquare_encode(json, customConfig);
        Console.WriteLine($"Encoded (v1.1.0, no validation): {qrCustom}");

        // Decode
        string decoded = bysquare_decode(qrAuto);
        Console.WriteLine($"Decoded: {decoded}");

        // Get library version
        string version = bysquare_version();
        Console.WriteLine($"Library version: {version}");
    }
}
