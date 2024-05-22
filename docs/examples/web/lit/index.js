import { CurrencyCode, encode, PaymentOptions } from "https://esm.sh/bysquare@2.7.1/";
import { html, LitElement } from "https://esm.sh/lit@3.0.0/";
import { qrcanvas } from "https://esm.sh/qrcanvas@3.1.2/";

/**
 * @extends {LitElement}
 */
class Bysquare extends LitElement {
	static properties = {
		_qrstring: { state: true },
		_ammount: { state: true },
		_variable: { state: true },
		_iban: { state: true }
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

	get #canvas() {
		return this.shadowRoot?.querySelector("canvas");
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
						value=${this._variable}
						@input=${this.#handleChange}
					/>
				</label>
				<pre>${this._qrstring}</pre>
				<canvas
					@click=${this.#setCanvas}
					height="200"
					width="200"
				></canvas>
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
					variableSymbol: this._variable
				}
			]
		});

		this._qrstring = qrstring;
		this.#setCanvas();
	}

	#setCanvas() {
		if (this.#canvas) {
			const ctx = this.#canvas.getContext("2d");
			if (ctx) {
				ctx.clearRect(0, 0, this.#canvas.width, this.#canvas.height);
				qrcanvas({
					data: this._qrstring,
					canvas: this.#canvas
				});
			}
		}
	}
}

customElements.define("app-bysquare", Bysquare);
