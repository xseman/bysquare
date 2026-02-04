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
    private static final int BYSQUARE_VERSION_110 = 1 << 24;  // v1.1.0 = 0b00000001_00000000_00000000_00000000

    public static void main(String[] args) throws Throwable {
        System.loadLibrary("bysquare");

        var linker = Linker.nativeLinker();
        var lookup = SymbolLookup.loaderLookup();

        var encodeFunc = linker.downcallHandle(
            lookup.find("bysquare_encode").orElseThrow(),
            FunctionDescriptor.of(ValueLayout.ADDRESS, ValueLayout.ADDRESS, ValueLayout.JAVA_INT)
        );

        var decodeFunc = linker.downcallHandle(
            lookup.find("bysquare_decode").orElseThrow(),
            FunctionDescriptor.of(ValueLayout.ADDRESS, ValueLayout.ADDRESS)
        );

        var freeFunc = linker.downcallHandle(
            lookup.find("bysquare_free").orElseThrow(),
            FunctionDescriptor.ofVoid(ValueLayout.ADDRESS)
        );

        String json = """
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

        try (var arena = Arena.ofConfined()) {
            var jsonPtr = arena.allocateUtf8String(json);

            // Option 1: Use config=0 for automatic default (deburr + validate + v1.2.0)
            var encodeResultAuto = (MemorySegment) encodeFunc.invoke(jsonPtr, 0);
            var qrStringAuto = encodeResultAuto.reinterpret(Integer.MAX_VALUE).getUtf8String(0L);
            freeFunc.invoke(encodeResultAuto);

            if (qrStringAuto.startsWith("ERROR:")) {
                String errorMsg = qrStringAuto.substring(6); // Strip "ERROR:" prefix
                throw new RuntimeException("Encoding error: " + errorMsg);
            }

            System.out.println("Encoded (config=0, auto-default): " + qrStringAuto);

            // Option 2: Custom config - version 1.1.0, no validation
            int customConfig = BYSQUARE_DEBURR | BYSQUARE_VERSION_110;
            var encodeResult2 = (MemorySegment) encodeFunc.invoke(jsonPtr, customConfig);
            var qrStringCustom = encodeResult2.reinterpret(Integer.MAX_VALUE).getUtf8String(0L);
            freeFunc.invoke(encodeResult2);

            if (qrStringCustom.startsWith("ERROR:")) {
                String errorMsg = qrStringCustom.substring(6);
                throw new RuntimeException("Encoding error: " + errorMsg);
            }

            System.out.println("Encoded (v1.1.0, no validation): " + qrStringCustom);

            // Decode
            var qrPtr = arena.allocateUtf8String(qrStringAuto);
            var decodeResult = (MemorySegment) decodeFunc.invoke(qrPtr);
            var decodedJson = decodeResult.reinterpret(Integer.MAX_VALUE).getUtf8String(0L);
            freeFunc.invoke(decodeResult);

            if (decodedJson.startsWith("ERROR:")) {
                String errorMsg = decodedJson.substring(6);
                throw new RuntimeException("Decoding error: " + errorMsg);
            }

            System.out.println("Decoded: " + decodedJson);
        }
    }
}
