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
} from "https://esm.sh/preact@latest";

/**
 * @typedef {Object} State
 * @property {string} qrstring
 * @property {number} amount
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
		amount: 100,
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
			h("div", {
				style:
					"display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 2rem;",
			}, [
				h("div", null, [
					h("label", { style: "display: block; margin-bottom: 1rem;" }, [
						"Amount:",
						h("input", {
							style: "width: 100%; margin-top: 0.5rem;",
							type: "number",
							name: "amount",
							value: this.state.amount,
							onInput: this.#handleChange,
						}),
					]),
					h("label", { style: "display: block; margin-bottom: 1rem;" }, [
						"IBAN:",
						h("input", {
							style: "width: 100%; margin-top: 0.5rem;",
							name: "iban",
							value: this.state.iban,
							onInput: this.#handleChange,
						}),
					]),
					h("label", { style: "display: block; margin-bottom: 1rem;" }, [
						"Variable:",
						h("input", {
							style: "width: 100%; margin-top: 0.5rem;",
							name: "variable",
							type: "number",
							value: this.state.variable,
							onInput: this.#handleChange,
						}),
					]),
				]),
				h("div", null, [
					h("div", {
						style: "width: 200px",
						ref: this.#qrRef,
					}),
				]),
			]),
			h(
				"pre",
				{ style: "word-wrap: break-word; white-space: pre-wrap;" },
				this.state.qrstring,
			),
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
					amount: this.state.amount,
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
