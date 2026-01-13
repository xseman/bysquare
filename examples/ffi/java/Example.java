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
        
        var encodeFunc = linker.downcallHandle(
            lookup.find("bysquare_encode").orElseThrow(),
            FunctionDescriptor.of(ValueLayout.ADDRESS, ValueLayout.ADDRESS)
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
                "bankAccounts": [{"iban": "SK9611000000002918599669"}]
              }]
            }
            """;
        
        try (var arena = Arena.ofConfined()) {
            var jsonPtr = arena.allocateUtf8String(json);
            var resultPtr = (MemorySegment) encodeFunc.invoke(jsonPtr);
            var qrString = resultPtr.reinterpret(Integer.MAX_VALUE).getUtf8String(0L);
            
            System.out.println("Encoded: " + qrString);
            
            var qrPtr = arena.allocateUtf8String(qrString);
            var decodedPtr = (MemorySegment) decodeFunc.invoke(qrPtr);
            var decoded = decodedPtr.reinterpret(Integer.MAX_VALUE).getUtf8String(0L);
            
            System.out.println("Decoded: " + decoded);
            
            freeFunc.invoke(resultPtr);
            freeFunc.invoke(decodedPtr);
        }
    }
}
