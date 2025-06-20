import {
	CurrencyCode,
	encode,
	PaymentOptions,
} from "https://esm.sh/bysquare@latest/";
import { qrcanvas } from "https://esm.sh/qrcanvas@3.1.2/";

function addPaymentInput() {
	const paymentInputs = document.getElementById("payment-inputs");
	if (!paymentInputs) return;

	const inputContainer = document.createElement("div");
	inputContainer.style.margin = "10px";
	inputContainer.style.padding = "10px";
	inputContainer.style.border = "1px solid";
	inputContainer.style.display = "inline-block";

	inputContainer.innerHTML = `
        <div style="display: flex; gap: 5px; justify-content: flex-end;">
            <button>Clone</button>
            <button>Delete</button>
        </div>
        <label style="display: block; margin-bottom: 5px;">
            Amount:
            <br/>
            <input
                style="width: 210px;"
                type="number"
                name="amount"
                value=""
            />
        </label>
        <label style="display: block; margin-bottom: 5px;">
            IBAN:
            <br/>
            <input
                style="width: 210px;"
                name="iban"
            />
        </label>
        <label style="display: block; margin-bottom: 5px;">
            Variable:
            <br/>
            <input
                style="width: 210px;"
                type="number"
                name="variable"
            />
        </label>
    `;

	paymentInputs.appendChild(inputContainer);
}

function getEncodedText(iban, amount, variable) {
	return encode({
		invoiceId: new Date().toLocaleDateString("sk"),
		payments: [
			{
				type: PaymentOptions.PaymentOrder,
				amount: amount,
				bankAccounts: [{ iban: iban }],
				currencyCode: CurrencyCode.EUR,
				variableSymbol: variable,
			},
		],
	});
}

function renderOnCanvas(canvasEl, encodedText) {
	if (canvasEl) {
		const ctx = canvasEl.getContext("2d");
		if (ctx) {
			ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
			qrcanvas({
				data: encodedText,
				canvas: canvasEl,
			});
		}
	}
}

function init() {
	addPaymentInput();
	const amountInput = document.querySelector('input[name="amount"]');
	const ibanInput = document.querySelector('input[name="iban"]');
	const variableInput = document.querySelector('input[name="variable"]');
	const encodedTextDiv = document.querySelector("#encodedText");
	const canvasEl = document.querySelector("#canvas");

	amountInput.value = "100";
	ibanInput.value = "SK9611000000002918599669";
	variableInput.value = "123";

	function render() {
		const encodedText = getEncodedText(ibanInput.value, amountInput.value, variableInput.value);
		encodedTextDiv.innerText = encodedText;
		renderOnCanvas(canvasEl, encodedText);
	}

	amountInput.addEventListener("input", render);
	ibanInput.addEventListener("input", render);
	variableInput.addEventListener("input", render);

	render();
}

window.addEventListener("load", init);
