import { CurrencyCode, encode, PaymentOptions } from "https://esm.sh/bysquare@2.8.3/";

function getEncodedText(iban, amount, variable) {
	return encode({
		invoiceId: new Date().toLocaleDateString("sk"),
		payments: [
			{
				type: PaymentOptions.PaymentOrder,
				amount: amount,
				bankAccounts: [{ iban: iban }],
				currencyCode: CurrencyCode.EUR,
				variableSymbol: variable
			}
		]
	});
}


function initializeForm() {
	const amountInput = document.querySelector('input[name="amount"]');
	const ibanInput = document.querySelector('input[name="iban"]');
	const variableInput = document.querySelector('input[name="variable"]');
	const encodedTextDiv = document.querySelector('#encodedText');

	amountInput.value = '100';
	ibanInput.value = 'SK9611000000002918599669';
	variableInput.value = '123';

	encodedTextDiv.innerText = getEncodedText(ibanInput.value, amountInput.value, variableInput.value);

	function updateEncodedText() {
		encodedTextDiv.innerText = getEncodedText(ibanInput.value, amountInput.value, variableInput.value);
	}

	amountInput.addEventListener('input', updateEncodedText);
	ibanInput.addEventListener('input', updateEncodedText);
	variableInput.addEventListener('input', updateEncodedText);
}

window.addEventListener('load', initializeForm);
