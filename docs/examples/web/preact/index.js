import {
	CurrencyCode,
	encode,
	PaymentOptions,
} from "https://esm.sh/bysquare@2.7.1/";
import {
	Component,
	createRef,
	h,
	render,
} from "https://esm.sh/preact@10.22.0";
import { qrcanvas } from "https://esm.sh/qrcanvas@3.1.2/";

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
	state = {
		qrstring: "",
		ammount: 100,
		variable: "123",
		iban: "SK9611000000002918599669",
	};

	#refCanvas = createRef();

	componentDidMount() {
		this.#generateQrstring();
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
						value: this.state.variable,
						onInput: this.#handleChange,
					}),
				]),
				h("pre", null, this.state.qrstring),
				h("canvas", { ref: this.#refCanvas, height: 200, width: 200 }),
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
		}, this.#setCanvas);
	};

	#setCanvas = () => {
		const context = this.#refCanvas.current.getContext("2d");
		context.reset();
		qrcanvas({
			data: this.state.qrstring,
			canvas: this.#refCanvas.current,
		});
	};
}

render(h(App, null), document.getElementById("app"));
