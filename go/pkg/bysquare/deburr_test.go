package bysquare

import "testing"

func TestDeburr(t *testing.T) {
	testCases := []struct {
		name     string
		input    string
		expected string
	}{
		{
			name:     "Slovak diacritics",
			input:    "Pôvodná faktúra",
			expected: "Povodna faktura",
		},
		{
			name:     "Czech diacritics",
			input:    "Príliš žluťoučký kůň",
			expected: "Prilis zlutoucky kun",
		},
		{
			name:     "Polish diacritics",
			input:    "Żółć gęślą jaźń",
			expected: "Zolc gesla jazn",
		},
		{
			name:     "Hungarian diacritics",
			input:    "Öt szép szűz lány őrült író",
			expected: "Ot szep szuz lany orult iro",
		},
		{
			name:     "German diacritics",
			input:    "Größe Übung Äpfel",
			expected: "Grosse Ubung Apfel",
		},
		{
			name:     "German Eszett",
			input:    "ß",
			expected: "ss",
		},
		{
			name:     "no diacritics passthrough",
			input:    "Hello World 123",
			expected: "Hello World 123",
		},
		{
			name:     "empty string",
			input:    "",
			expected: "",
		},
		{
			name:     "mixed content with numbers and symbols",
			input:    "Číslo 123 - Ján @ test.sk",
			expected: "Cislo 123 - Jan @ test.sk",
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			result := Deburr(tc.input)
			if result != tc.expected {
				t.Errorf("expected %q, got %q", tc.expected, result)
			}
		})
	}
}
