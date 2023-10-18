import { html, LitElement } from "lit";
import { qrcanvas } from "qrcanvas";
import { CurrencyCode, generate, PaymentOptions } from "bysquare";

class Bysquare extends LitElement {
	static properties = {
		qrstring: "",
		ammount: 100,
		variable: "123",
		iban: "SK9611000000002918599669",
		canvas: undefined
	}

	constructor() {
		super();
	}

	get canvasElement() {
		return this.shadowRoot.querySelector('canvas');
	}

	connectedCallback() {
		super.connectedCallback();
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
					value=${this.ammount}
					@input=${this.#handleChange}
				/>
			</label>
			<label style="display: block; margin-bottom: 5px;">
				IBAN:
				<br />
				<input
				style="width: 210px;"
				name="iban"
				value=${this.iban}
				@input=${this.#handleChange}
				/>
			</label>
			<label style="display: block; margin-bottom: 5px;">
				Variable:
				<br />
				<input
				style="width: 210px;"
				name="variable"
				value=${this.variable}
				@input=${this.#handleChange}
				/>
			</label>
			<pre>${this.qrstring}</pre>
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
		this[name] = value;
		this.#generateQrstring();
	}

	#generateQrstring() {
		const qrstring = generate({
			invoiceId: new Date().toLocaleDateString("sk"),
			payments: [
				{
					type: PaymentOptions.PaymentOrder,
					amount: this.ammount,
					bankAccounts: [{ iban: this.iban }],
					currencyCode: CurrencyCode.EUR,
					variableSymbol: this.variable,
				},
			],
		});

		this.qrstring = qrstring;
		this.#setCanvas();
	}

	#setCanvas() {
		if (this.canvasElement) {
			const ctx = this.canvasElement.getContext("2d");
			if (ctx) {
				ctx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
				qrcanvas({
					data: this.qrstring,
					canvas: this.canvasElement,
				});
			}
		}
	}
}

customElements.define('app-bysquare', Bysquare);
