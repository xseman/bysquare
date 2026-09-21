package lzma

import (
	"bytes"
	"testing"
)

func TestRoundTrip(t *testing.T) {
	for _, payload := range [][]byte{[]byte(""), []byte("a"), []byte("random-id\t1\t1\t100\tEUR"), bytes.Repeat([]byte("x"), 5000)} {
		compressed, err := Compress(payload)
		if err != nil {
			t.Fatalf("Compress(%d bytes): %v", len(payload), err)
		}

		decompressed, err := Decompress(compressed, len(payload))
		if err != nil {
			t.Fatalf("Decompress(%d bytes): %v", len(payload), err)
		}

		if !bytes.Equal(decompressed, payload) {
			t.Errorf("round trip changed %d-byte payload", len(payload))
		}
	}
}

func TestDecompressGarbage(t *testing.T) {
	if _, err := Decompress([]byte{0xFF, 0xFF, 0xFF, 0xFF}, 10); err == nil {
		t.Error("expected an error for garbage input")
	}
}
