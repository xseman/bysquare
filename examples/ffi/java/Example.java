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
    public static void main(String[] args) throws Throwable {
        System.loadLibrary("bysquare");

        var linker = Linker.nativeLinker();
        var lookup = SymbolLookup.loaderLookup();

        var createConfigFunc = linker.downcallHandle(
            lookup.find("bysquare_create_config").orElseThrow(),
            FunctionDescriptor.of(ValueLayout.ADDRESS)
        );

        var configSetDeburrFunc = linker.downcallHandle(
            lookup.find("bysquare_config_set_deburr").orElseThrow(),
            FunctionDescriptor.ofVoid(ValueLayout.ADDRESS, ValueLayout.JAVA_INT)
        );

        var configSetValidateFunc = linker.downcallHandle(
            lookup.find("bysquare_config_set_validate").orElseThrow(),
            FunctionDescriptor.ofVoid(ValueLayout.ADDRESS, ValueLayout.JAVA_INT)
        );

        var freeConfigFunc = linker.downcallHandle(
            lookup.find("bysquare_free_config").orElseThrow(),
            FunctionDescriptor.ofVoid(ValueLayout.ADDRESS)
        );

        var encodeFunc = linker.downcallHandle(
            lookup.find("bysquare_encode").orElseThrow(),
            FunctionDescriptor.of(ValueLayout.ADDRESS, ValueLayout.ADDRESS, ValueLayout.ADDRESS)
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
            // Option 1: Use defaults (pass MemorySegment.NULL for config)
            // var encodeResult = (MemorySegment) encodeFunc.invoke(jsonPtr, MemorySegment.NULL);

            // Option 2: Create config and customize options
            var config = (MemorySegment) createConfigFunc.invoke();
            configSetDeburrFunc.invoke(config, 1);      // enable deburr
            configSetValidateFunc.invoke(config, 1);    // enable validation

            // Encode
            var jsonPtr = arena.allocateUtf8String(json);
            var encodeResult = (MemorySegment) encodeFunc.invoke(jsonPtr, config);
            var qrString = encodeResult.reinterpret(Integer.MAX_VALUE).getUtf8String(0L);
            System.out.println("Encoded: " + qrString);

            // Decode
            var qrPtr = arena.allocateUtf8String(qrString);
            var decodeResult = (MemorySegment) decodeFunc.invoke(qrPtr);
            var decodedJson = decodeResult.reinterpret(Integer.MAX_VALUE).getUtf8String(0L);
            System.out.println("Decoded: " + decodedJson);

            // Cleanup - free allocated memory
            freeFunc.invoke(encodeResult);
            freeFunc.invoke(decodeResult);

            // Free config
            freeConfigFunc.invoke(config);
        }
    }
}
