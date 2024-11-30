import { QRCode } from "https://esm.sh/@lostinbrittany/qr-esm@latest";
import {
	CurrencyCode,
	encode,
	PaymentOptions,
} from "https://esm.sh/bysquare@latest/";
import {
	Component,
	createRef,
	h,
	render,
} from "https://esm.sh/preact@10.22.0";

/**
 * @typedef {Object} State
 * @property {string} qrstring
 * @property {number} ammount
 * @property {string} variable
 * @property {string} iban
 */

/**
 * @extends {Component<{}, State>}
 */
class App extends Component {
	#qrRef = createRef();

	state = {
		qrstring: "",
		ammount: 100,
		variable: "123",
		iban: "SK9611000000002918599669",
	};

	componentDidMount() {
		this.#generateQrstring();
	}

	componentDidUpdate() {
		if (this.#qrRef.current) {
			this.#qrRef.current.innerHTML = "";
			this.#qrRef.current.appendChild(QRCode.generateSVG(this.state.qrstring));
		}
	}

	render() {
		return h("div", null, [
			h("div", { style: "margin-right: 10px;" }, [
				h("label", { style: "display: block; margin-bottom: 5px;" }, [
					"Ammount: ",
					h("br", null),
					h("input", {
						style: "width: 210px;",
						type: "number",
						name: "ammount",
						value: this.state.ammount,
						onInput: this.#handleChange,
					}),
				]),
				h("label", { style: "display: block; margin-bottom: 5px;" }, [
					"IBAN: ",
					h("br", null),
					h("input", {
						style: "width: 210px;",
						name: "iban",
						value: this.state.iban,
						onInput: this.#handleChange,
					}),
				]),
				h("label", { style: "display: block; margin-bottom: 5px;" }, [
					"Variable: ",
					h("br", null),
					h("input", {
						style: "width: 210px;",
						name: "variable",
						type: "number",
						value: this.state.variable,
						onInput: this.#handleChange,
					}),
				]),
				h("pre", null, this.state.qrstring),
				h("div", {
					style: "width: 200px",
					ref: this.#qrRef,
				}),
			]),
		]);
	}

	#handleChange = (event) => {
		const { name, value } = event.target;
		this.setState({
			[name]: value,
		}, this.#generateQrstring);
	};

	#generateQrstring = () => {
		const qrstring = encode({
			invoiceId: new Date().toLocaleDateString("sk"),
			payments: [
				{
					type: PaymentOptions.PaymentOrder,
					amount: this.state.ammount,
					bankAccounts: [{
						iban: this.state.iban,
					}],
					currencyCode: CurrencyCode.EUR,
					variableSymbol: this.state.variable,
				},
			],
		});

		this.setState({
			qrstring: qrstring,
		});
	};
}

render(h(App, null), document.getElementById("app"));
