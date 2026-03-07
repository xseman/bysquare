using System;
using System.Runtime.InteropServices;

class Example
{
    // Determine library name based on platform
    private const string LibName = "bysquare";

    // Config bitflags
    private const int BYSQUARE_DEBURR = 0b00000001;  // Bit 0: Enable diacritics removal

    // Version values (in high byte, bits 24-31)
    private const int BYSQUARE_VERSION_110 = 1 << 24;  // v1.1.0

    // Special config value for default
    // PAY defaults:     v1.2.0 + deburr + validate
    // Invoice defaults: v1.0.0 + validate (no deburr)
    private const int BYSQUARE_CONFIG_DEFAULT = -1;

    [DllImport(LibName, EntryPoint = "bysquare_pay_encode", CallingConvention = CallingConvention.Cdecl, CharSet = CharSet.Ansi)]
    private static extern IntPtr bysquare_pay_encode_raw(string jsonData, int config);

    [DllImport(LibName, EntryPoint = "bysquare_pay_decode", CallingConvention = CallingConvention.Cdecl, CharSet = CharSet.Ansi)]
    private static extern IntPtr bysquare_pay_decode_raw(string qrString);

    [DllImport(LibName, EntryPoint = "bysquare_invoice_encode", CallingConvention = CallingConvention.Cdecl, CharSet = CharSet.Ansi)]
    private static extern IntPtr bysquare_invoice_encode_raw(string jsonData, int config);

    [DllImport(LibName, EntryPoint = "bysquare_invoice_decode", CallingConvention = CallingConvention.Cdecl, CharSet = CharSet.Ansi)]
    private static extern IntPtr bysquare_invoice_decode_raw(string qrString);

    [DllImport(LibName, EntryPoint = "bysquare_detect_type", CallingConvention = CallingConvention.Cdecl, CharSet = CharSet.Ansi)]
    private static extern int bysquare_detect_type_raw(string qrString);

    [DllImport(LibName, CallingConvention = CallingConvention.Cdecl)]
    private static extern void bysquare_free(IntPtr ptr);

    // Managed wrapper methods that handle marshaling automatically
    private static string bysquare_pay_encode(string jsonData, int config)
    {
        IntPtr ptr = bysquare_pay_encode_raw(jsonData, config);
        string result = Marshal.PtrToStringAnsi(ptr) ?? string.Empty;
        bysquare_free(ptr);

        if (result.StartsWith("ERROR:"))
        {
            string errorMsg = result.Substring(6); // Strip "ERROR:" prefix
            throw new Exception($"Encoding error: {errorMsg}");
        }

        return result;
    }

    private static string bysquare_pay_decode(string qrString)
    {
        IntPtr ptr = bysquare_pay_decode_raw(qrString);
        string result = Marshal.PtrToStringAnsi(ptr) ?? string.Empty;
        bysquare_free(ptr);

        if (result.StartsWith("ERROR:"))
        {
            string errorMsg = result.Substring(6); // Strip "ERROR:" prefix
            throw new Exception($"Decoding error: {errorMsg}");
        }

        return result;
    }

    private static string bysquare_invoice_encode(string jsonData, int config)
    {
        IntPtr ptr = bysquare_invoice_encode_raw(jsonData, config);
        string result = Marshal.PtrToStringAnsi(ptr) ?? string.Empty;
        bysquare_free(ptr);

        if (result.StartsWith("ERROR:"))
        {
            string errorMsg = result.Substring(6);
            throw new Exception($"Invoice encoding error: {errorMsg}");
        }

        return result;
    }

    private static string bysquare_invoice_decode(string qrString)
    {
        IntPtr ptr = bysquare_invoice_decode_raw(qrString);
        string result = Marshal.PtrToStringAnsi(ptr) ?? string.Empty;
        bysquare_free(ptr);

        if (result.StartsWith("ERROR:"))
        {
            string errorMsg = result.Substring(6);
            throw new Exception($"Invoice decoding error: {errorMsg}");
        }

        return result;
    }

    static void Main(string[] args)
    {
        string payJson = @"{
  ""payments"": [{
    ""type"": 1,
    ""amount"": 123.45,
    ""currencyCode"": ""EUR"",
    ""variableSymbol"": ""987654"",
    ""beneficiary"": {""name"": ""John Doe""},
    ""bankAccounts"": [{""iban"": ""SK9611000000002918599669""}]
  }]
}";

        string invoiceJson = @"{
  ""documentType"": 0,
  ""invoiceId"": ""FV2024001"",
  ""issueDate"": ""20240115"",
  ""localCurrencyCode"": ""EUR"",
  ""supplierParty"": {
    ""partyName"": ""Supplier s.r.o."",
    ""postalAddress"": {
      ""streetName"": ""Hlavna 1"",
      ""cityName"": ""Bratislava"",
      ""postalZone"": ""81101"",
      ""country"": ""SVK""
    }
  },
  ""customerParty"": {
    ""partyName"": ""Customer a.s.""
  },
  ""numberOfInvoiceLines"": 1,
  ""taxCategorySummaries"": [{
    ""classifiedTaxCategory"": 0.2,
    ""taxExclusiveAmount"": 100,
    ""taxAmount"": 20
  }],
  ""monetarySummary"": {
    ""taxExclusiveAmount"": 100,
    ""taxInclusiveAmount"": 120
  }
}";

        // PAY: Use default config (v1.2.0 + deburr + validate)
        string qrDefault = bysquare_pay_encode(payJson, BYSQUARE_CONFIG_DEFAULT);
        Console.WriteLine($"PAY default config: {qrDefault}");

        // PAY: Custom config - version 1.1.0 with deburr only
        int custom = BYSQUARE_DEBURR | BYSQUARE_VERSION_110;
        string qrCustom = bysquare_pay_encode(payJson, custom);
        Console.WriteLine($"PAY custom config:  {qrCustom}");

        // PAY: Decode
        string decoded = bysquare_pay_decode(qrDefault);
        Console.WriteLine($"PAY decoded: {decoded}");

        // Invoice: Encode with defaults (v1.0.0 + validate)
        string qrInvoice = bysquare_invoice_encode(invoiceJson, BYSQUARE_CONFIG_DEFAULT);
        Console.WriteLine($"Invoice: {qrInvoice}");

        // Invoice: Decode
        string decodedInvoice = bysquare_invoice_decode(qrInvoice);
        Console.WriteLine($"Invoice decoded: {decodedInvoice}");

        // Detect type (0=PAY, 1=Invoice, -1=error)
        int payType = bysquare_detect_type_raw(qrDefault);
        int invoiceType = bysquare_detect_type_raw(qrInvoice);
        Console.WriteLine($"QR type (PAY): {payType}");
        Console.WriteLine($"QR type (Invoice): {invoiceType}");
    }
}

