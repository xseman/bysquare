package bysquare

import (
	"encoding/binary"
	"errors"
	"testing"
)

func TestAddChecksum(t *testing.T) {
	t.Run("returns 4 bytes plus the UTF-8 payload", func(t *testing.T) {
		payload := "test payload"

		result := AddChecksum(payload)
		if len(result) != 4+len(payload) {
			t.Fatalf("length: got %d, want %d", len(result), 4+len(payload))
		}

		if got := binary.LittleEndian.Uint32(result[:4]); got != CRC32(payload) {
			t.Errorf("first 4 bytes: got %08x, want %08x", got, CRC32(payload))
		}

		if string(result[4:]) != payload {
			t.Errorf("remaining bytes: got %q, want %q", result[4:], payload)
		}
	})

	t.Run("handles empty string", func(t *testing.T) {
		if got := AddChecksum(""); len(got) != 4 {
			t.Errorf("length: got %d, want 4", len(got))
		}
	})

	t.Run("handles unicode characters", func(t *testing.T) {
		payload := "Ján Nováček ľščťžýáíé"
		if got := AddChecksum(payload); string(got[4:]) != payload {
			t.Errorf("remaining bytes: got %q, want %q", got[4:], payload)
		}
	})

	t.Run("different payloads produce different checksums", func(t *testing.T) {
		a, b := AddChecksum("payload one"), AddChecksum("payload two")
		if binary.LittleEndian.Uint32(a[:4]) == binary.LittleEndian.Uint32(b[:4]) {
			t.Error("checksums are equal")
		}
	})
}

func TestBuildBysquareHeader(t *testing.T) {
	t.Run("defaults to all zeros", func(t *testing.T) {
		got, err := BuildBysquareHeader(0, 0, 0, 0)
		if err != nil {
			t.Fatal(err)
		}

		if got[0] != 0x00 || got[1] != 0x00 {
			t.Errorf("got %v, want [0 0]", got)
		}
	})

	t.Run("encodes nibbles from binary data", func(t *testing.T) {
		got, err := BuildBysquareHeader(0b0001, 0b0010, 0b0011, 0b0100)
		if err != nil {
			t.Fatal(err)
		}

		if got[0] != 0b0001_0010 || got[1] != 0b0011_0100 {
			t.Errorf("got %08b %08b, want 00010010 00110100", got[0], got[1])
		}
	})

	invalid := []struct {
		name    string
		input   [4]uint8
		message string
	}{
		{"invalid type", [4]uint8{0xFF, uint8(Version100), 0x00, 0x00}, EncodeErrorMessage.BySquareType},
		{"invalid version", [4]uint8{0x00, 0xFF, 0x00, 0x00}, EncodeErrorMessage.Version},
		{"invalid document type", [4]uint8{0x00, 0x00, 0xFF, 0x00}, EncodeErrorMessage.DocumentType},
		{"invalid reserved nibble", [4]uint8{0x00, 0x00, 0x00, 0xFF}, EncodeErrorMessage.Reserved},
	}

	for _, tt := range invalid {
		t.Run("errors for "+tt.name, func(t *testing.T) {
			_, err := BuildBysquareHeader(tt.input[0], tt.input[1], tt.input[2], tt.input[3])

			var encodeErr *EncodeError
			if !errors.As(err, &encodeErr) {
				t.Fatalf("got %v, want *EncodeError", err)
			}

			if encodeErr.Message != tt.message {
				t.Errorf("message: got %q, want %q", encodeErr.Message, tt.message)
			}

			if encodeErr.Extensions["invalidValue"] != uint8(0xFF) {
				t.Errorf("invalidValue: got %v, want 255", encodeErr.Extensions["invalidValue"])
			}
		})
	}
}

func TestDecodeHeader(t *testing.T) {
	tests := []struct {
		name  string
		input []byte
		want  Header
	}{
		{"decodes all-zero header", []byte{0x00, 0x00}, Header{}},
		{"decodes pay header (bysquareType=0, version=0)", []byte{0x00, 0x00}, Header{BysquareType: 0, Version: 0}},
		{"decodes invoice header (bysquareType=1)", []byte{0x10, 0x00}, Header{BysquareType: 1}},
		{"decodes all nibbles at max value", []byte{0xFF, 0xFF}, Header{15, 15, 15, 15}},
		{"decodes individual nibble values", []byte{0x12, 0x34}, Header{1, 2, 3, 4}},
		{"reads a short header as zeros", []byte{0x12}, Header{BysquareType: 1, Version: 2}},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := DecodeHeader(tt.input); got != tt.want {
				t.Errorf("got %+v, want %+v", got, tt.want)
			}
		})
	}

	t.Run("round-trips all valid nibble values", func(t *testing.T) {
		for v := range uint8(16) {
			built, err := BuildBysquareHeader(v, 15-v, v, 15-v)
			if err != nil {
				t.Fatal(err)
			}

			want := Header{BysquareType: v, Version: 15 - v, DocumentType: v, Reserved: 15 - v}
			if got := DecodeHeader(built); got != want {
				t.Errorf("nibble %d: got %+v, want %+v", v, got, want)
			}
		}
	})
}

func TestBuildPayloadLength(t *testing.T) {
	t.Run("encodes length as little-endian 16-bit", func(t *testing.T) {
		got, err := BuildPayloadLength(0x1234)
		if err != nil {
			t.Fatal(err)
		}

		if got[0] != 0x34 || got[1] != 0x12 {
			t.Errorf("got %v, want [0x34 0x12]", got)
		}
	})

	t.Run("errors for oversized payload", func(t *testing.T) {
		_, err := BuildPayloadLength(MaxCompressedSize)

		var encodeErr *EncodeError
		if !errors.As(err, &encodeErr) || encodeErr.Message != EncodeErrorMessage.HeaderDataSize {
			t.Fatalf("got %v, want EncodeError %q", err, EncodeErrorMessage.HeaderDataSize)
		}
	})

	t.Run("encodes zero length", func(t *testing.T) {
		got, err := BuildPayloadLength(0)
		if err != nil || got[0] != 0 || got[1] != 0 {
			t.Errorf("got %v, %v", got, err)
		}
	})

	t.Run("encodes small length correctly", func(t *testing.T) {
		got, err := BuildPayloadLength(256)
		if err != nil || binary.LittleEndian.Uint16(got) != 256 {
			t.Errorf("got %v, %v", got, err)
		}
	})
}
