import java.lang.annotation.Native;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.sun.jna.Library;

/**
 * Java example for using the bysquare C FFI library via JNA.
 * 
 * Requirements:
 *     - JNA (Java Native Access) library
 *     - libbysquare.so (or .dylib on macOS, .dll on Windows)
 *     - Gson for JSON handling
 * 
 * Add to pom.xml:
 *     <dependency>
 *         <groupId>net.java.dev.jna</groupId>
 *         <artifactId>jna</artifactId>
 *         <version>5.13.0</version>
 *     </dependency>
 *     <dependency>
 *         <groupId>com.google.code.gson</groupId>
 *         <artifactId>gson</artifactId>
 *         <version>2.10.1</version>
 *     </dependency>
 * 
 * Usage:
 *     javac -cp .:gson.jar:jna.jar Example.java
 *     java -cp .:gson.jar:jna.jar Example
 */
public class Example {
    
    /**
     * JNA interface for the bysquare library.
     */
    public interface BySquareLibrary extends Library {
        String bysquare_encode(String jsonData);
        String bysquare_decode(String qrString);
        void bysquare_free(String ptr);
        String bysquare_version();
    }
    
    private static final BySquareLibrary lib = Native.load("bysquare", BySquareLibrary.class);
    private static final Gson gson = new GsonBuilder().setPrettyPrinting().create();
    
    /**
     * Encode payment data to BySquare QR string.
     */
    public static String encodePayment(Map<String, Object> paymentData) {
        String json = gson.toJson(paymentData);
        return lib.bysquare_encode(json);
    }
    
    /**
     * Decode BySquare QR string to payment data.
     */
    public static Map<String, Object> decodeQR(String qrString) {
        String json = lib.bysquare_decode(qrString);
        return gson.fromJson(json, Map.class);
    }
    
    /**
     * Get library version.
     */
    public static String getVersion() {
        return lib.bysquare_version();
    }
    
    public static void main(String[] args) {
        System.out.println("BySquare FFI Library Version: " + getVersion());
        System.out.println();
        
        // Example payment data
        Map<String, Object> payment = new HashMap<>();
        payment.put("type", 1);
        payment.put("amount", 123.45);
        payment.put("currencyCode", "EUR");
        payment.put("variableSymbol", "987654");
        
        Map<String, String> bankAccount = new HashMap<>();
        bankAccount.put("iban", "SK9611000000002918599669");
        
        List<Map<String, String>> bankAccounts = new ArrayList<>();
        bankAccounts.add(bankAccount);
        payment.put("bankAccounts", bankAccounts);
        
        List<Map<String, Object>> payments = new ArrayList<>();
        payments.add(payment);
        
        Map<String, Object> paymentData = new HashMap<>();
        paymentData.put("payments", payments);
        
        System.out.println("Payment Data:");
        System.out.println(gson.toJson(paymentData));
        System.out.println();
        
        // Encode
        String qrString = encodePayment(paymentData);
        System.out.println("Encoded QR String: " + qrString);
        System.out.println();
        
        // Decode
        Map<String, Object> decodedData = decodeQR(qrString);
        System.out.println("Decoded Payment Data:");
        System.out.println(gson.toJson(decodedData));
    }
}
