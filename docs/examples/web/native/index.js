import { QRCode } from "https://esm.sh/@lostinbrittany/qr-esm@latest";
import {
	CurrencyCode,
	encode,
	PaymentOptions,
} from "https://esm.sh/bysquare@latest/";

class BysquareQR {
	constructor() {
		this.amountInput = null;
		this.ibanInput = null;
		this.variableInput = null;
		this.encodedTextDiv = null;
		this.qrContainer = null;
	}

	getEncodedText(iban, amount, variable) {
		return encode({
			invoiceId: new Date().toLocaleDateString("sk"),
			payments: [{
				type: PaymentOptions.PaymentOrder,
				amount: amount,
				bankAccounts: [{ iban: iban }],
				currencyCode: CurrencyCode.EUR,
				variableSymbol: variable,
			}],
		});
	}

	renderQrCode(container, encodedText) {
		container.innerHTML = "";
		const svgQr = QRCode.generateSVG(encodedText);
		console.log(svgQr);
		container.appendChild(svgQr);
	}

	init() {
		this.amountInput = document.querySelector('input[name="amount"]');
		this.ibanInput = document.querySelector('input[name="iban"]');
		this.variableInput = document.querySelector('input[name="variable"]');
		this.encodedTextDiv = document.querySelector("#encodedText");
		this.qrContainer = document.querySelector("#qrcode");

		this.amountInput.value = "100";
		this.ibanInput.value = "SK9611000000002918599669";
		this.variableInput.value = "123";

		this.amountInput.addEventListener("input", this.render);
		this.ibanInput.addEventListener("input", this.render);
		this.variableInput.addEventListener("input", this.render);

		this.render();
	}

	render = () => {
		const encodedText = this.getEncodedText(
			this.ibanInput.value,
			this.amountInput.value,
			this.variableInput.value,
		);

		this.encodedTextDiv.innerText = encodedText;
		this.renderQrCode(this.qrContainer, encodedText);
	};
}

window.addEventListener("load", () => {
	const bysquareQR = new BysquareQR();
	bysquareQR.init();
});
