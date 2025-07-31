import { QRCode } from "https://esm.sh/@lostinbrittany/qr-esm@latest";
import {
	CurrencyCode,
	encode,
	PaymentOptions,
} from "https://esm.sh/bysquare@latest/";
import {
	html,
	LitElement,
} from "https://esm.sh/lit@latest";

class BysquareForm extends LitElement {
	static properties = {
		amount: { type: Number },
		iban: { type: String },
		variable: { type: String },
	};

	constructor() {
		super();
		this.amount = 100;
		this.iban = "SK9611000000002918599669";
		this.variable = "123";
	}

	render() {
		return html`
			<label style="display: block; margin-bottom: 1rem;">
				Amount:
				<input
					style="width: 100%; margin-top: 0.5rem;"
					type="number"
					.value=${this.amount}
					@input=${this._handleAmountChange}
				/>
			</label>
			<label style="display: block; margin-bottom: 1rem;">
				IBAN:
				<input
					style="width: 100%; margin-top: 0.5rem;"
					.value=${this.iban}
					@input=${this._handleIbanChange}
				/>
			</label>
			<label style="display: block; margin-bottom: 1rem;">
				Variable:
				<input
					style="width: 100%; margin-top: 0.5rem;"
					type="number"
					.value=${this.variable}
					@input=${this._handleVariableChange}
				/>
			</label>
		`;
	}

	_handleAmountChange(e) {
		this.amount = e.target.value;
		this._dispatchChange();
	}

	_handleIbanChange(e) {
		this.iban = e.target.value;
		this._dispatchChange();
	}

	_handleVariableChange(e) {
		this.variable = e.target.value;
		this._dispatchChange();
	}

	_dispatchChange() {
		this.dispatchEvent(
			new CustomEvent("form-change", {
				detail: {
					amount: this.amount,
					iban: this.iban,
					variable: this.variable,
				},
				bubbles: true,
			}),
		);
	}
}

class BysquareQr extends LitElement {
	static properties = {
		encodedText: { type: String },
	};

	constructor() {
		super();
		this.encodedText = "";
	}

	render() {
		return html`<div id="qr-container"></div>`;
	}

	updated(changedProperties) {
		if (changedProperties.has("encodedText") && this.encodedText) {
			const container = this.shadowRoot.getElementById("qr-container");
			if (container) {
				container.innerHTML = "";
				try {
					container.appendChild(QRCode.generateSVG(this.encodedText));
				} catch (error) {
					console.error("QR generation error:", error);
				}
			}
		}
	}
}

class BysquareText extends LitElement {
	static properties = {
		encodedText: { type: String },
	};

	constructor() {
		super();
		this.encodedText = "";
	}

	render() {
		return html`${this.encodedText}`;
	}
}

customElements.define("bysquare-form", BysquareForm);
customElements.define("bysquare-qr", BysquareQr);
customElements.define("bysquare-text", BysquareText);

// Connect components on page load
window.addEventListener("load", () => {
	const form = document.querySelector("bysquare-form");
	const qr = document.querySelector("bysquare-qr");
	const text = document.querySelector("bysquare-text");

	function generateQr(data) {
		try {
			const encodedText = encode({
				invoiceId: new Date().toLocaleDateString("sk"),
				payments: [
					{
						type: PaymentOptions.PaymentOrder,
						amount: data.amount,
						bankAccounts: [{ iban: data.iban }],
						currencyCode: CurrencyCode.EUR,
						variableSymbol: data.variable,
					},
				],
			});

			qr.encodedText = encodedText;
			text.encodedText = encodedText;
		} catch (error) {
			console.error("Encoding error:", error);
			text.encodedText = error.message;
		}
	}

	// Initial generation
	generateQr({ amount: 100, iban: "SK9611000000002918599669", variable: "123" });

	// Listen for form changes
	document.addEventListener("form-change", (e) => {
		generateQr(e.detail);
	});
});
