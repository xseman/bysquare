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

    // Special config value for default (v1.2.0 + deburr + validate)
    private static final int BYSQUARE_CONFIG_DEFAULT = -1;

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

            // Default config (v1.2.0 + deburr + validate)
            var resultDefault = (MemorySegment) encodeFunc.invoke(jsonPtr, BYSQUARE_CONFIG_DEFAULT);
            var qrDefault = resultDefault.reinterpret(Integer.MAX_VALUE).getUtf8String(0L);
            freeFunc.invoke(resultDefault);
            if (qrDefault.startsWith("ERROR:")) {
                throw new RuntimeException("Encoding error: " + qrDefault.substring(6));
            }
            System.out.println("Default config: " + qrDefault);

            // Custom config - version 1.1.0 with deburr only
            int custom = BYSQUARE_DEBURR | BYSQUARE_VERSION_110;
            var resultCustom = (MemorySegment) encodeFunc.invoke(jsonPtr, custom);
            var qrCustom = resultCustom.reinterpret(Integer.MAX_VALUE).getUtf8String(0L);
            freeFunc.invoke(resultCustom);
            if (qrCustom.startsWith("ERROR:")) {
                throw new RuntimeException("Encoding error: " + qrCustom.substring(6));
            }
            System.out.println("Custom config:  " + qrCustom);

            // Decode
            var qrPtr = arena.allocateUtf8String(qrDefault);
            var decodeResult = (MemorySegment) decodeFunc.invoke(qrPtr);
            var decodedJson = decodeResult.reinterpret(Integer.MAX_VALUE).getUtf8String(0L);
            freeFunc.invoke(decodeResult);
            if (decodedJson.startsWith("ERROR:")) {
                throw new RuntimeException("Decoding error: " + decodedJson.substring(6));
            }
            System.out.println("Decoded: " + decodedJson);
        }
    }
}
