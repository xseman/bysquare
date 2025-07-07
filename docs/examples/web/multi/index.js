import {
	CurrencyCode,
	encode,
	PaymentOptions,
} from "https://esm.sh/bysquare@latest/";
import { qrcanvas } from "https://esm.sh/qrcanvas@3.1.2/";

function addPaymentInput(values = { amount: "", iban: "", variable: "" }) {
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
			});
		});
	}

	const deleteButton = inputContainer.querySelector(".delete-btn");
	if (deleteButton) {
		deleteButton.addEventListener("click", function() {
			inputContainer.remove();
		});
	}

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
	// Create the first input container with default values
	const firstContainer = addPaymentInput({
		amount: "100",
		iban: "SK9611000000002918599669",
		variable: "123",
	});

	const encodedTextDiv = document.querySelector("#encodedText");
	const canvasEl = document.querySelector("#canvas");

	// Function to render QR code based on the first input container's values
	function render() {
		// Always use the first input container for rendering
		const firstContainer = document.querySelector("#payment-inputs > div");
		if (!firstContainer) return;

		const amountInput = firstContainer.querySelector('input[name="amount"]');
		const ibanInput = firstContainer.querySelector('input[name="iban"]');
		const variableInput = firstContainer.querySelector('input[name="variable"]');

		if (!amountInput || !ibanInput || !variableInput) return;

		const encodedText = getEncodedText([{
			iban: ibanInput.value,
			amount: amountInput.value,
			variable: variableInput.value,
		}]);
		encodedTextDiv.innerText = encodedText;
		renderOnCanvas(canvasEl, encodedText);
	}

	// Set up a mutation observer to detect when input containers are added or removed
	const paymentInputs = document.getElementById("payment-inputs");
	if (paymentInputs) {
		const observer = new MutationObserver(function(mutations) {
			// Re-render when the DOM changes
			render();

			// Add input event listeners to all inputs in the first container
			const firstContainer = document.querySelector("#payment-inputs > div");
			if (firstContainer) {
				const inputs = firstContainer.querySelectorAll("input");
				inputs.forEach((input) => {
					// Remove existing listeners to avoid duplicates
					input.removeEventListener("input", render);
					// Add new listener
					input.addEventListener("input", render);
				});
			}
		});

		observer.observe(paymentInputs, { childList: true, subtree: true });
	}

	// Add input event listeners to all inputs in the first container
	const inputs = firstContainer.querySelectorAll("input");
	inputs.forEach((input) => {
		input.addEventListener("input", render);
	});

	// Initial render
	render();
}

window.addEventListener("load", init);
