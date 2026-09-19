package pay

import (
	"encoding/binary"
	"errors"
	"reflect"
	"testing"

	"github.com/xseman/bysquare/go/pkg/bysquare"
	"github.com/xseman/bysquare/go/pkg/bysquare/internal/lzma"
)

// The golden strings are the TypeScript implementation's
// (typescript/src/pay/testdata/wire-format-test-data.ts). Both serializers
// must produce the same payload and either side must decode the other's
// output; the LZMA bytes themselves differ, because the two encoders make
// different match choices for the same input.
func TestWireFormat(t *testing.T) {
	account := []BankAccount{{IBAN: "SK9611000000002918599669"}}

	tests := []struct {
		name  string
		model DataModel
		qr    string
	}{
		{
			name: "valid payment order",
			model: DataModel{
				InvoiceID: "test-001",
				Payments: []Payment{{
					Type: PaymentOptionsPaymentOrder,
					SimplePayment: SimplePayment{
						Amount: 100, CurrencyCode: CurrencyEUR, BankAccounts: account,
						VariableSymbol: "123", Beneficiary: Beneficiary{Name: "John Doe"},
					},
				}},
			},
			qr: "0804O0002G0L2UES834BQT9SQJQA9M5QGN1AHN4VO0KB6MVM9RPFU06E5LQEOQUN07FTDIF96UAS90AOPDCSE86CMTRAI45IDKRHJ6BUOIG1162LVVVRAKA000",
		},
		{
			name: "minimal payment",
			model: DataModel{
				Payments: []Payment{{
					Type: PaymentOptionsPaymentOrder,
					SimplePayment: SimplePayment{
						CurrencyCode: CurrencyEUR, BankAccounts: account, Beneficiary: Beneficiary{Name: "John Doe"},
					},
				}},
			},
			qr: "0803U0008MG52E0Q0RIN3U8H327ELACLMJC1081SL31ETI56TODN1C4GGCJ47SQ15FPVNSEAV0BUCRJ7AR1D9KUHUNDVVVOF20000",
		},
		{
			name: "standing order",
			model: DataModel{
				Payments: []Payment{{
					Type: PaymentOptionsStandingOrder,
					SimplePayment: SimplePayment{
						Amount: 50, CurrencyCode: CurrencyEUR, BankAccounts: account, Beneficiary: Beneficiary{Name: "John Doe"},
					},
					Periodicity: PeriodicityMonthly,
				}},
			},
			qr: "0804A0001OCO302A7G11HN9RBP2DAPNOO7UAQDI5DKVTEI505RED837BEV7GRH84QHMRCTLF41JKN2R24B7GPVKN9M6PDSNMTTV0LMDFVVC46000",
		},
		{
			name: "direct debit",
			model: DataModel{
				Payments: []Payment{{
					Type: PaymentOptionsDirectDebit,
					SimplePayment: SimplePayment{
						Amount: 75, CurrencyCode: CurrencyEUR, BankAccounts: account, Beneficiary: Beneficiary{Name: "Test Creditor"},
					},
				}},
			},
			qr: "0804U0003QD95ADG9CCKJPH401ABOHCJB2L4IHK9K72O5782QKC041MQ52S4J8DS58K6PFR4ECJJ6T4F84LLVPEMABCMUV7HNT341RBC58APVVQPSO000",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := Encode(tt.model)
			if err != nil {
				t.Fatalf("Encode() error: %v", err)
			}

			if got[:6] != tt.qr[:6] {
				t.Errorf("header and payload length\n got %s\nwant %s", got[:6], tt.qr[:6])
			}

			raw, err := bysquare.DecodeBase32Hex(tt.qr, true)
			if err != nil {
				t.Fatal(err)
			}

			payload, err := lzma.Decompress(raw[4:], int(binary.LittleEndian.Uint16(raw[2:4])))
			if err != nil {
				t.Fatal(err)
			}

			if want := serialize(tt.model); string(payload[4:]) != want {
				t.Errorf("payload\n got %q\nwant %q", payload[4:], want)
			}

			decoded, err := Decode(tt.qr)
			if err != nil {
				t.Fatalf("Decode() error: %v", err)
			}

			if len(decoded.Payments) != 1 || decoded.Payments[0].Type != tt.model.Payments[0].Type ||
				decoded.Payments[0].Amount != tt.model.Payments[0].Amount ||
				decoded.Payments[0].Beneficiary != tt.model.Payments[0].Beneficiary {
				t.Errorf("Decode() = %+v", decoded)
			}
		})
	}
}

// The strings come from typescript/src/pay/testdata/decode-test-data.ts.
func TestDecodeTypeScriptFixtures(t *testing.T) {
	tests := []struct {
		qr   string
		want Payment
	}{
		{
			qr: "0004I0006UC5LT8E21H3IC1K9R40P82GJL22NTU0586BBEOEKDMQSVUUBAOP1C0FFE14UJA1F1LJMV0FONE35J05TRC77FTIMV87NKNANNOFJB684000",
			want: Payment{Type: PaymentOptionsPaymentOrder, SimplePayment: SimplePayment{
				Amount: 25.30, CurrencyCode: CurrencyEUR,
				BankAccounts: []BankAccount{{IBAN: "SK4523585719461382368397"}},
				Beneficiary:  Beneficiary{Name: "John Doe"},
			}},
		},
		{
			qr: "00054000DG4GL2L1JL66N01P4GCBG05KQEPULNMP9EB7MEE935VG4P4B1BDBN7MV4GU13R7DMGU9O93QEI2KQJLPTFFU7GJNP6QL0UADVHOQ3B0OP0OO5P4L58M918PG00",
			want: Payment{Type: PaymentOptionsPaymentOrder, SimplePayment: SimplePayment{
				Amount: 45.55, CurrencyCode: CurrencyEUR, PaymentNote: "bendzín",
				BankAccounts: []BankAccount{{IBAN: "SK2738545237537948273958"}},
				Beneficiary:  Beneficiary{Name: "Jane Doe"},
			}},
		},
	}

	for _, tt := range tests {
		decoded, err := Decode(tt.qr)
		if err != nil {
			t.Fatalf("Decode() error: %v", err)
		}

		if decoded.InvoiceID != "2015001" || len(decoded.Payments) != 1 {
			t.Fatalf("Decode() = %+v", decoded)
		}

		if got := decoded.Payments[0]; !reflect.DeepEqual(got, tt.want) {
			t.Errorf("payment\n got %+v\nwant %+v", got, tt.want)
		}
	}
}

func TestDecodeErrors(t *testing.T) {
	t.Run("missing IBAN", func(t *testing.T) {
		serialized := "random-id\t1\t1\t100\tEUR\t\t123\t\t\t\t\t1\t\t\t0\t0\t\t\t"

		_, err := deserialize(serialized)

		var decodeErr *bysquare.DecodeError
		if !errors.As(err, &decodeErr) || decodeErr.Message != bysquare.DecodeErrorMessage.MissingIBAN {
			t.Fatalf("got %v, want DecodeError %q", err, bysquare.DecodeErrorMessage.MissingIBAN)
		}
	})

	t.Run("unsupported version", func(t *testing.T) {
		// Header nibbles 0,3,0,0: version 3 is past 1.2.0.
		qr := bysquare.EncodeBase32Hex([]byte{0x03, 0x00, 0x00, 0x00}, false)

		_, err := Decode(qr)

		var decodeErr *bysquare.DecodeError
		if !errors.As(err, &decodeErr) || decodeErr.Message != bysquare.DecodeErrorMessage.UnsupportedVersion {
			t.Fatalf("got %v, want DecodeError %q", err, bysquare.DecodeErrorMessage.UnsupportedVersion)
		}

		if decodeErr.Extensions["version"] != uint8(3) {
			t.Errorf("version extension: got %v, want 3", decodeErr.Extensions["version"])
		}
	})

	t.Run("garbage body", func(t *testing.T) {
		qr := bysquare.EncodeBase32Hex([]byte{0x00, 0x00, 0x10, 0x00, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF}, false)

		_, err := Decode(qr)

		var decodeErr *bysquare.DecodeError
		if !errors.As(err, &decodeErr) || decodeErr.Message != bysquare.DecodeErrorMessage.LZMADecompressionFailed {
			t.Fatalf("got %v, want DecodeError %q", err, bysquare.DecodeErrorMessage.LZMADecompressionFailed)
		}
	})
}
