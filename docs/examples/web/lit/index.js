import { QRCode } from "https://esm.sh/@lostinbrittany/qr-esm@latest";
import {
	CurrencyCode,
	encode,
	PaymentOptions,
} from "https://esm.sh/bysquare@latest/";
import {
	html,
	LitElement,
} from "https://esm.sh/lit@3.1.0/";

/**
 * @extends {LitElement}
 */
class Bysquare extends LitElement {
	static properties = {
		_qrstring: { state: true },
		_ammount: { state: true },
		_variable: { state: true },
		_iban: { state: true },
	};

	constructor() {
		super();
		this._qrstring = "";
		this._ammount = 100;
		this._variable = "123";
		this._iban = "SK9611000000002918599669";
	}

	firstUpdated() {
		this.#generateQrstring();
	}

	render() {
		return html`
		<div>
			<div style="margin-right: 10px;">
				<label style="display: block; margin-bottom: 5px;">
					Ammount:
					<br />
					<input
						style="width: 210px;"
						type="number"
						name="ammount"
						value=${this._ammount}
						@input=${this.#handleChange}
					/>
				</label>
				<label style="display: block; margin-bottom: 5px;">
					IBAN:
					<br />
					<input
						style="width: 210px;"
						name="iban"
						value=${this._iban}
						@input=${this.#handleChange}
					/>
				</label>
				<label style="display: block; margin-bottom: 5px;">
					Variable:
					<br />
					<input
						style="width: 210px;"
						name="variable"
						type="number"
						value=${this._variable}
						@input=${this.#handleChange}
					/>
				</label>
				<pre>${this._qrstring}</pre>
				<div style="width: 200px" id="qrcode" @updated=${this.#updateQr}></div>
			</div>
		</div>
		`;
	}

	#handleChange(event) {
		const { name, value } = event.target;
		this[`_${name}`] = value;
		this.#generateQrstring();
	}

	#generateQrstring() {
		const qrstring = encode({
			invoiceId: new Date().toLocaleDateString("sk"),
			payments: [
				{
					type: PaymentOptions.PaymentOrder,
					amount: this._ammount,
					bankAccounts: [{ iban: this._iban }],
					currencyCode: CurrencyCode.EUR,
					variableSymbol: this._variable,
				},
			],
		});

		this._qrstring = qrstring;
		this.#updateQr();
	}

	#updateQr() {
		const container = this.shadowRoot?.querySelector("#qrcode");
		if (container) {
			container.innerHTML = "";
			container.appendChild(QRCode.generateSVG(this._qrstring));
		}
	}
}

customElements.define("app-bysquare", Bysquare);
