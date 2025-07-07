import {
	CurrencyCode,
	encode,
	PaymentOptions,
} from "https://esm.sh/bysquare@latest/";
import { qrcanvas } from "https://esm.sh/qrcanvas@3.1.2/";

function addPaymentInput(values = { amount: "", iban: "", variable: "" }, render) {
	const paymentInputs = document.getElementById("payment-inputs");
	if (!paymentInputs) return;

	const id = crypto.randomUUID();

	const inputContainer = document.createElement("div");
	inputContainer.id = `payment-input-${id}`;
	inputContainer.style.margin = "10px";
	inputContainer.style.padding = "10px";
	inputContainer.style.border = "1px solid";
	inputContainer.style.display = "inline-block";

	inputContainer.innerHTML = `
        <div style="display: flex; gap: 5px; justify-content: flex-end;">
            <button class="clone-btn">Clone</button>
            <button class="delete-btn">Delete</button>
        </div>
        <label style="display: block; margin-bottom: 5px;">
            Amount:
            <br/>
            <input
                style="width: 210px;"
                type="number"
                name="amount"
                value="${values.amount}"
            />
        </label>
        <label style="display: block; margin-bottom: 5px;">
            IBAN:
            <br/>
            <input
                style="width: 210px;"
                name="iban"
                value="${values.iban}"
            />
        </label>
        <label style="display: block; margin-bottom: 5px;">
            Variable:
            <br/>
            <input
                style="width: 210px;"
                type="number"
                name="variable"
                value="${values.variable}"
            />
        </label>
    `;

	// Add event listeners for the Clone and Delete buttons
	const cloneButton = inputContainer.querySelector(".clone-btn");
	if (cloneButton) {
		cloneButton.addEventListener("click", function() {
			// Get the current values from the inputs
			const amountInput = inputContainer.querySelector('input[name="amount"]');
			const ibanInput = inputContainer.querySelector('input[name="iban"]');
			const variableInput = inputContainer.querySelector('input[name="variable"]');

			// Clone the container with the current values
			addPaymentInput({
				amount: amountInput.value,
				iban: ibanInput.value,
				variable: variableInput.value,
			}, render);

			// Render after cloning
			if (typeof render === "function") {
				render();
			}
		});
	}

	const deleteButton = inputContainer.querySelector(".delete-btn");
	if (deleteButton) {
		deleteButton.addEventListener("click", function() {
			inputContainer.remove();

			// Render after deletion
			if (typeof render === "function") {
				render();
			}
		});
	}

	// Add input event listeners to all inputs in this container
	const inputs = inputContainer.querySelectorAll("input");
	inputs.forEach((input) => {
		input.addEventListener("input", function() {
			// Render when input changes
			if (typeof render === "function") {
				render();
			}
		});
	});

	paymentInputs.appendChild(inputContainer);
	return inputContainer;
}

function getEncodedText(paymentData) {
	return encode({
		invoiceId: new Date().toLocaleDateString("sk"),
		payments: paymentData.map(({ iban, amount, variable }) => ({
			type: PaymentOptions.PaymentOrder,
			amount: amount,
			bankAccounts: [{ iban: iban }],
			currencyCode: CurrencyCode.EUR,
			variableSymbol: variable,
		})),
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
	const encodedTextDiv = document.querySelector("#encodedText");
	const canvasEl = document.querySelector("#canvas");

	// Function to render QR code based on all input containers' values
	function render() {
		const containers = document.querySelectorAll("#payment-inputs > div");
		if (!containers.length) return;

		const paymentData = [];

		// Collect data from all input containers
		containers.forEach((container) => {
			const amountInput = container.querySelector('input[name="amount"]');
			const ibanInput = container.querySelector('input[name="iban"]');
			const variableInput = container.querySelector('input[name="variable"]');

			if (amountInput && ibanInput && variableInput) {
				paymentData.push({
					iban: ibanInput.value,
					amount: amountInput.value,
					variable: variableInput.value,
				});
			}
		});

		if (paymentData.length === 0) return;

		try {
			const encodedText = getEncodedText(paymentData);
			encodedTextDiv.innerText = encodedText;
			renderOnCanvas(canvasEl, encodedText);
		} catch (error) {
			console.error("error", error);
			encodedTextDiv.innerText = error.message;
			const ctx = canvasEl.getContext("2d");
			if (ctx) {
				ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
			}
		}
	}

	// Create the first input container with default values
	const firstContainer = addPaymentInput({
		amount: "100",
		iban: "SK9611000000002918599669",
		variable: "123",
	}, render);

	// Initial render
	render();
}

window.addEventListener("load", init);
