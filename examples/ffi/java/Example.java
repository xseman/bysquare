import java.lang.foreign.Arena;
import java.lang.foreign.FunctionDescriptor;
import java.lang.foreign.Linker;
import java.lang.foreign.MemorySegment;
import java.lang.foreign.SymbolLookup;
import java.lang.foreign.ValueLayout;

/**
 * Java example using Foreign Function & Memory API (JEP 454, preview in JDK 21+).
 *
 * Usage:
 *     javac --enable-preview --release 25 Example.java
 *     java --enable-preview --enable-native-access=ALL-UNNAMED Example
 */
public class Example {
    // Config bitflags
    private static final int BYSQUARE_DEBURR = 0b00000001;  // Bit 0: Enable diacritics removal

    // Version values (in high byte, bits 24-31)
    private static final int BYSQUARE_VERSION_110 = 1 << 24;  // v1.1.0

    // Special config value for default
    // PAY defaults:     v1.2.0 + deburr + validate
    // Invoice defaults: v1.0.0 + validate (no deburr)
    private static final int BYSQUARE_CONFIG_DEFAULT = -1;

    public static void main(String[] args) throws Throwable {
        System.loadLibrary("bysquare");

        var linker = Linker.nativeLinker();
        var lookup = SymbolLookup.loaderLookup();

        var encodeFunc = linker.downcallHandle(
            lookup.find("bysquare_pay_encode").orElseThrow(),
            FunctionDescriptor.of(ValueLayout.ADDRESS, ValueLayout.ADDRESS, ValueLayout.JAVA_INT)
        );

        var decodeFunc = linker.downcallHandle(
            lookup.find("bysquare_pay_decode").orElseThrow(),
            FunctionDescriptor.of(ValueLayout.ADDRESS, ValueLayout.ADDRESS)
        );

        var encodeInvoiceFunc = linker.downcallHandle(
            lookup.find("bysquare_invoice_encode").orElseThrow(),
            FunctionDescriptor.of(ValueLayout.ADDRESS, ValueLayout.ADDRESS, ValueLayout.JAVA_INT)
        );

        var decodeInvoiceFunc = linker.downcallHandle(
            lookup.find("bysquare_invoice_decode").orElseThrow(),
            FunctionDescriptor.of(ValueLayout.ADDRESS, ValueLayout.ADDRESS)
        );

        var detectTypeFunc = linker.downcallHandle(
            lookup.find("bysquare_detect_type").orElseThrow(),
            FunctionDescriptor.of(ValueLayout.JAVA_INT, ValueLayout.ADDRESS)
        );

        var freeFunc = linker.downcallHandle(
            lookup.find("bysquare_free").orElseThrow(),
            FunctionDescriptor.ofVoid(ValueLayout.ADDRESS)
        );

        String payJson = """
            {
              "payments": [{
                "type": 1,
                "amount": 123.45,
                "currencyCode": "EUR",
                "variableSymbol": "987654",
                "beneficiary": {"name": "John Doe"},
                "bankAccounts": [{"iban": "SK9611000000002918599669"}]
              }]
            }
            """;

        String invoiceJson = """
            {
              "documentType": 0,
              "invoiceId": "FV2024001",
              "issueDate": "20240115",
              "localCurrencyCode": "EUR",
              "supplierParty": {
                "partyName": "Supplier s.r.o.",
                "postalAddress": {
                  "streetName": "Hlavna 1",
                  "cityName": "Bratislava",
                  "postalZone": "81101",
                  "country": "SVK"
                }
              },
              "customerParty": {
                "partyName": "Customer a.s."
              },
              "numberOfInvoiceLines": 1,
              "taxCategorySummaries": [{
                "classifiedTaxCategory": 0.2,
                "taxExclusiveAmount": 100,
                "taxAmount": 20
              }],
              "monetarySummary": {
                "taxExclusiveAmount": 100,
                "taxInclusiveAmount": 120
              }
            }
            """;

        try (var arena = Arena.ofConfined()) {
            var payJsonPtr = arena.allocateUtf8String(payJson);

            // PAY: Default config (v1.2.0 + deburr + validate)
            var resultDefault = (MemorySegment) encodeFunc.invoke(payJsonPtr, BYSQUARE_CONFIG_DEFAULT);
            var qrDefault = resultDefault.reinterpret(Integer.MAX_VALUE).getUtf8String(0L);
            freeFunc.invoke(resultDefault);
            if (qrDefault.startsWith("ERROR:")) {
                throw new RuntimeException("Encoding error: " + qrDefault.substring(6));
            }
            System.out.println("PAY default config: " + qrDefault);

            // PAY: Custom config - version 1.1.0 with deburr only
            int custom = BYSQUARE_DEBURR | BYSQUARE_VERSION_110;
            var resultCustom = (MemorySegment) encodeFunc.invoke(payJsonPtr, custom);
            var qrCustom = resultCustom.reinterpret(Integer.MAX_VALUE).getUtf8String(0L);
            freeFunc.invoke(resultCustom);
            if (qrCustom.startsWith("ERROR:")) {
                throw new RuntimeException("Encoding error: " + qrCustom.substring(6));
            }
            System.out.println("PAY custom config:  " + qrCustom);

            // PAY: Decode
            var qrPtr = arena.allocateUtf8String(qrDefault);
            var decodeResult = (MemorySegment) decodeFunc.invoke(qrPtr);
            var decodedJson = decodeResult.reinterpret(Integer.MAX_VALUE).getUtf8String(0L);
            freeFunc.invoke(decodeResult);
            if (decodedJson.startsWith("ERROR:")) {
                throw new RuntimeException("Decoding error: " + decodedJson.substring(6));
            }
            System.out.println("PAY decoded: " + decodedJson);

            // Invoice: Encode with defaults (v1.0.0 + validate)
            var invoiceJsonPtr = arena.allocateUtf8String(invoiceJson);
            var invoiceResult = (MemorySegment) encodeInvoiceFunc.invoke(invoiceJsonPtr, BYSQUARE_CONFIG_DEFAULT);
            var qrInvoice = invoiceResult.reinterpret(Integer.MAX_VALUE).getUtf8String(0L);
            freeFunc.invoke(invoiceResult);
            if (qrInvoice.startsWith("ERROR:")) {
                throw new RuntimeException("Invoice encoding error: " + qrInvoice.substring(6));
            }
            System.out.println("Invoice: " + qrInvoice);

            // Invoice: Decode
            var qrInvoicePtr = arena.allocateUtf8String(qrInvoice);
            var invoiceDecodeResult = (MemorySegment) decodeInvoiceFunc.invoke(qrInvoicePtr);
            var decodedInvoice = invoiceDecodeResult.reinterpret(Integer.MAX_VALUE).getUtf8String(0L);
            freeFunc.invoke(invoiceDecodeResult);
            if (decodedInvoice.startsWith("ERROR:")) {
                throw new RuntimeException("Invoice decoding error: " + decodedInvoice.substring(6));
            }
            System.out.println("Invoice decoded: " + decodedInvoice);

            // Detect type (0=PAY, 1=Invoice, -1=error)
            int payType = (int) detectTypeFunc.invoke(arena.allocateUtf8String(qrDefault));
            int invoiceType = (int) detectTypeFunc.invoke(arena.allocateUtf8String(qrInvoice));
            System.out.println("QR type (PAY): " + payType);
            System.out.println("QR type (Invoice): " + invoiceType);
        }
    }
}

