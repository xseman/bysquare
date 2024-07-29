import {CurrencyCode, encode, PaymentOptions} from "https://esm.sh/bysquare@2.8.3/";
import {qrcanvas} from "https://esm.sh/qrcanvas@3.1.2/";

function getEncodedText(iban, amount, variable) {
	return encode({
		invoiceId: new Date().toLocaleDateString("sk"),
		payments: [
			{
				type: PaymentOptions.PaymentOrder,
				amount: amount,
				bankAccounts: [{iban: iban}],
				currencyCode: CurrencyCode.EUR,
				variableSymbol: variable
			}
		]
	});
}

function renderOnCanvas(canvasEl, encodedText) {
	if (canvasEl) {
		const ctx = canvasEl.getContext("2d");
		if (ctx) {
			ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
			qrcanvas({
				data: encodedText,
				canvas: canvasEl
			});
		}
	}
}


function initializeForm() {
	const amountInput = document.querySelector('input[name="amount"]');
	const ibanInput = document.querySelector('input[name="iban"]');
	const variableInput = document.querySelector('input[name="variable"]');
	const encodedTextDiv = document.querySelector('#encodedText');
	const canvasEl = document.querySelector('#canvas');

	amountInput.value = '100';
	ibanInput.value = 'SK9611000000002918599669';
	variableInput.value = '123';

	const encodedText = getEncodedText(ibanInput.value, amountInput.value, variableInput.value);
	encodedTextDiv.innerText = encodedText;
	renderOnCanvas(canvasEl, encodedText);

	function updateEncodedText() {
		const encodedText = getEncodedText(ibanInput.value, amountInput.value, variableInput.value);
		encodedTextDiv.innerText = encodedText;
		renderOnCanvas(canvasEl, encodedText);
	}

	amountInput.addEventListener('input', updateEncodedText);
	ibanInput.addEventListener('input', updateEncodedText);
	variableInput.addEventListener('input', updateEncodedText);
}

window.addEventListener('load', initializeForm);
